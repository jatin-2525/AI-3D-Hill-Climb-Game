import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Terrain, X_END, makeCoins, makeFuel } from '../game/terrain'
import { Vehicle } from '../game/vehicle'
import { endRun, getState, input, setState } from '../game/store'
import { Truck, type TruckRefs } from './Truck'
import { Clouds, Ridges, Scenery, TerrainMesh } from './World'

const dummy = new THREE.Object3D()
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)

const DUST_MAX = 70
interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  size: number
}

export function Game({ terrain }: { terrain: Terrain }) {
  const vehicle = useMemo(() => new Vehicle(terrain), [terrain])
  const coins = useMemo(() => makeCoins(terrain), [terrain])
  const cans = useMemo(() => makeFuel(terrain), [terrain])

  const truckRefs: TruckRefs = {
    body: useRef<THREE.Group>(null),
    wheels: [useRef<THREE.Group>(null), useRef<THREE.Group>(null)],
  }
  const coinRef = useRef<THREE.InstancedMesh>(null)
  const canRef = useRef<THREE.InstancedMesh>(null)
  const capRef = useRef<THREE.InstancedMesh>(null)
  const dustRef = useRef<THREE.InstancedMesh>(null)
  const ridgeRef = useRef<THREE.Group>(null)
  const cloudRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.DirectionalLight>(null)

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: DUST_MAX }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 0.3 })),
    [],
  )

  const run = useRef({ distance: 0, coins: 0, fuel: 100, score: 0, coinIdx: 0, canIdx: 0 })
  const lastRuns = useRef(-1)
  const lastLanded = useRef(0)
  const hudT = useRef(0)
  const emit = useRef(0)
  const overDelay = useRef(-1)
  const camPos = useRef(new THREE.Vector3(8, 8, 26))
  const camLook = useRef(new THREE.Vector3(0, 2, 0))
  const shake = useRef(0)

  const spawnDust = (x: number, y: number, strength: number) => {
    for (const p of particles) {
      if (p.life > 0) continue
      p.x = x + (Math.random() - 0.5) * 0.5
      p.y = y + Math.random() * 0.2
      p.z = (Math.random() - 0.5) * 1.6
      p.vx = -vehicle.vx * 0.15 + (Math.random() - 0.5) * 2.4
      p.vy = 1 + Math.random() * 2.2 * strength
      p.vz = (Math.random() - 0.5) * 1.4
      p.max = 0.5 + Math.random() * 0.6
      p.life = p.max
      p.size = 0.18 + Math.random() * 0.3 * (0.6 + strength)
      return
    }
  }

  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const s = getState()

    /* ---- new run ---- */
    if (s.runs !== lastRuns.current) {
      lastRuns.current = s.runs
      vehicle.reset()
      for (const c of coins) c.taken = false
      for (const c of cans) c.taken = false
      run.current = { distance: 0, coins: 0, fuel: 100, score: 0, coinIdx: 0, canIdx: 0 }
      lastLanded.current = vehicle.landedEvent
      overDelay.current = -1
      camPos.current.set(vehicle.x + 6, vehicle.y + 5, 24)
      for (const p of particles) p.life = 0
    }

    const playing = s.phase === 'playing'
    let throttle = 0
    if (playing) throttle = clamp(input.gas - input.brake, -1, 1)

    vehicle.step(dt, throttle)
    const r = run.current

    if (playing) {
      r.fuel -= (1.7 + 4.3 * Math.abs(throttle)) * dt
      if (vehicle.x > r.distance) r.distance = vehicle.x

      /* coins */
      while (r.coinIdx < coins.length && coins[r.coinIdx].x < vehicle.x - 4) r.coinIdx++
      for (let i = r.coinIdx; i < Math.min(coins.length, r.coinIdx + 26); i++) {
        const c = coins[i]
        if (c.taken) continue
        if (Math.abs(c.x - vehicle.x) < 1.5 && Math.abs(c.y - vehicle.y) < 1.7) {
          c.taken = true
          r.coins++
          r.score += 25
        }
      }
      /* fuel cans */
      while (r.canIdx < cans.length && cans[r.canIdx].x < vehicle.x - 4) r.canIdx++
      for (let i = r.canIdx; i < Math.min(cans.length, r.canIdx + 4); i++) {
        const c = cans[i]
        if (c.taken) continue
        if (Math.abs(c.x - vehicle.x) < 1.8 && Math.abs(c.y - vehicle.y) < 2) {
          c.taken = true
          r.fuel = Math.min(100, r.fuel + 46)
          setState({ toast: { id: Date.now(), text: '+46 FUEL', sub: 'jerrycan' } })
        }
      }

      /* stunt rewards */
      if (vehicle.landedEvent !== lastLanded.current) {
        lastLanded.current = vehicle.landedEvent
        const flips = vehicle.lastFlips
        const air = vehicle.lastAirTime
        if (flips > 0) {
          const bonus = flips * 250
          r.score += bonus
          setState({
            toast: { id: Date.now(), text: `${flips > 1 ? flips + 'x ' : ''}FLIP! +${bonus}`, sub: 'nailed it' },
          })
        } else if (air > 1.0) {
          const bonus = Math.round(air * 60)
          r.score += bonus
          setState({ toast: { id: Date.now(), text: `AIR TIME +${bonus}`, sub: air.toFixed(1) + 's hangtime' } })
        }
        if (air > 0.7) shake.current = Math.min(1, air * 0.5)
      }

      if (vehicle.crashed) {
        if (overDelay.current < 0) overDelay.current = 1.1
        overDelay.current -= dt
        if (overDelay.current <= 0) endRun('flip')
      } else if (r.fuel <= 0) {
        r.fuel = 0
        endRun('fuel')
      } else if (r.distance > X_END - 160) endRun('summit')
    }

    /* ---- HUD throttle ---- */
    hudT.current += dt
    if (hudT.current > 0.06) {
      hudT.current = 0
      setState({
        distance: r.distance,
        coins: r.coins,
        fuel: Math.max(0, r.fuel),
        speed: vehicle.speed,
        score: Math.round(r.score + r.distance * 3),
        airborne: !vehicle.grounded,
      })
    }

    /* ---- truck transforms ---- */
    if (truckRefs.body.current) {
      truckRefs.body.current.position.set(vehicle.x, vehicle.y, 0)
      truckRefs.body.current.rotation.z = vehicle.angle
    }
    for (let i = 0; i < 2; i++) {
      const g = truckRefs.wheels[i].current
      const w = vehicle.wheels[i]
      if (g) {
        g.position.set(w.x, w.y, 0)
        g.rotation.z = -w.spin
      }
    }

    /* ---- dust ---- */
    emit.current += dt
    const rear = vehicle.wheels[0]
    if (playing && rear.contact && emit.current > 0.03) {
      emit.current = 0
      const sp = vehicle.speed
      const power = rear.skid * 0.8 + clamp(sp / 18, 0, 1) * 0.5
      if (power > 0.18) spawnDust(rear.x, rear.y - 0.35, power)
    }
    if (vehicle.impact > 6) {
      for (let i = 0; i < 6; i++) spawnDust(vehicle.x, vehicle.y - 0.6, 1.4)
      shake.current = Math.min(1, vehicle.impact / 22)
      vehicle.impact = 0
    } else vehicle.impact *= 0.9

    if (dustRef.current) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        if (p.life > 0) {
          p.life -= dt
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.z += p.vz * dt
          p.vy -= 5 * dt
          p.vx *= 0.96
          const k = Math.max(0, p.life / p.max)
          dummy.position.set(p.x, p.y, p.z)
          dummy.scale.setScalar(p.size * (1.4 - k * 0.55))
          dummy.rotation.set(p.x, p.y, 0)
        } else {
          dummy.position.set(0, -9999, 0)
          dummy.scale.setScalar(0.001)
        }
        dummy.updateMatrix()
        dustRef.current.setMatrixAt(i, dummy.matrix)
      }
      dustRef.current.instanceMatrix.needsUpdate = true
    }

    /* ---- pickups ---- */
    const t = st.clock.elapsedTime
    if (coinRef.current) {
      for (let i = 0; i < coins.length; i++) {
        const c = coins[i]
        const visible = !c.taken && Math.abs(c.x - vehicle.x) < 70
        if (visible) {
          dummy.position.set(c.x, c.y + Math.sin(t * 2 + i) * 0.12, 0)
          dummy.rotation.set(0, t * 3 + i * 0.5, 0)
          dummy.scale.setScalar(1)
        } else {
          dummy.position.set(0, -9999, 0)
          dummy.scale.setScalar(0.001)
          dummy.rotation.set(0, 0, 0)
        }
        dummy.updateMatrix()
        coinRef.current.setMatrixAt(i, dummy.matrix)
      }
      coinRef.current.instanceMatrix.needsUpdate = true
    }
    if (canRef.current && capRef.current) {
      for (let i = 0; i < cans.length; i++) {
        const c = cans[i]
        const visible = !c.taken && Math.abs(c.x - vehicle.x) < 70
        if (visible) {
          dummy.position.set(c.x, c.y + Math.sin(t * 2.2 + i) * 0.12, 0)
          dummy.rotation.set(0, t * 1.2, 0)
          dummy.scale.setScalar(1)
        } else {
          dummy.position.set(0, -9999, 0)
          dummy.scale.setScalar(0.001)
        }
        dummy.updateMatrix()
        canRef.current.setMatrixAt(i, dummy.matrix)
        capRef.current.setMatrixAt(i, dummy.matrix)
      }
      canRef.current.instanceMatrix.needsUpdate = true
      capRef.current.instanceMatrix.needsUpdate = true
    }

    /* ---- camera (framing adapts to the viewport aspect) ---- */
    const cam = st.camera as THREE.PerspectiveCamera
    const sp = clamp(vehicle.speed / 26, 0, 1)
    const tanV = Math.tan(((cam.fov * Math.PI) / 180) * 0.5)
    const wantHalfW = 11.5 + sp * 3.6
    const wantHalfH = 7.2 + sp * 2.2
    const dist = Math.min(wantHalfW / (tanV * cam.aspect), wantHalfH / tanV)
    const tx = vehicle.x + 2.6 + sp * 1.8
    const ty = vehicle.y + 2.7
    const tz = clamp(dist, 11, 46)
    const k = 1 - Math.exp(-dt * 3.4)
    camPos.current.x += (tx - camPos.current.x) * k
    camPos.current.y += (ty - camPos.current.y) * k
    camPos.current.z += (tz - camPos.current.z) * k
    const minY = terrain.height(camPos.current.x) + 3
    const cy = Math.max(camPos.current.y, minY)
    shake.current *= Math.max(0, 1 - dt * 3)
    const sh = shake.current * 0.35
    st.camera.position.set(
      camPos.current.x + (Math.random() - 0.5) * sh,
      cy + (Math.random() - 0.5) * sh,
      camPos.current.z,
    )
    camLook.current.x += (vehicle.x + 2.2 - camLook.current.x) * k
    camLook.current.y += (vehicle.y + 1.2 - camLook.current.y) * k
    st.camera.lookAt(camLook.current)

    /* ---- parallax + light ---- */
    if (ridgeRef.current) ridgeRef.current.position.x = camPos.current.x * 0.42
    if (cloudRef.current) cloudRef.current.position.x = camPos.current.x * 0.62 + t * 0.6
    const li = lightRef.current
    if (li) {
      li.position.set(vehicle.x + 22, vehicle.y + 40, 26)
      li.target.position.set(vehicle.x, vehicle.y, 0)
      li.target.updateMatrixWorld()
    }
  })

  const coinGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12)
    g.rotateX(Math.PI / 2)
    return g
  }, [])
  const canGeo = useMemo(() => new THREE.BoxGeometry(0.5, 0.62, 0.3), [])
  const capGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.16, 0.14, 0.16)
    g.translate(0.12, 0.36, 0)
    return g
  }, [])
  const dustGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])

  return (
    <>
      <fog attach="fog" args={['#c8def0', 110, 460]} />
      <hemisphereLight args={['#dbeeff', '#6c7a4e', 1.05]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        ref={lightRef}
        color="#fff3d6"
        intensity={2.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-bias={-0.0012}
        shadow-normalBias={0.04}
      />

      <Clouds groupRef={cloudRef} />
      <Ridges groupRef={ridgeRef} />
      <TerrainMesh terrain={terrain} />
      <Scenery terrain={terrain} />

      <instancedMesh ref={coinRef} args={[coinGeo, undefined, coins.length]} frustumCulled={false} castShadow>
        <meshStandardMaterial color="#ffc73c" emissive="#c98f00" emissiveIntensity={0.35} metalness={0.65} roughness={0.28} flatShading />
      </instancedMesh>
      <instancedMesh ref={canRef} args={[canGeo, undefined, cans.length]} frustumCulled={false} castShadow>
        <meshStandardMaterial color="#e03b2f" flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[capGeo, undefined, cans.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2f3640" flatShading />
      </instancedMesh>
      <instancedMesh ref={dustRef} args={[dustGeo, undefined, DUST_MAX]} frustumCulled={false}>
        <meshStandardMaterial color="#d9c39c" transparent opacity={0.55} flatShading />
      </instancedMesh>

      <Truck refs={truckRefs} />
    </>
  )
}
