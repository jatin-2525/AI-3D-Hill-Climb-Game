import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import type {} from '@react-three/fiber'
import * as THREE from 'three'
import {
  Terrain,
  buildRidgeGeometry,
  buildTerrainGeometry,
  makeClouds,
  scatterRocks,
  scatterTrees,
  type Scatter,
} from '../game/terrain'

const dummy = new THREE.Object3D()

export function TerrainMesh({ terrain }: { terrain: Terrain }) {
  const geo = useMemo(() => buildTerrainGeometry(terrain), [terrain])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.96} metalness={0} />
    </mesh>
  )
}

export function Ridges({ groupRef }: { groupRef: RefObject<THREE.Group | null> }) {
  const far = useMemo(() => buildRidgeGeometry(11, -230, 24, 0.0031, 40), [])
  const mid = useMemo(() => buildRidgeGeometry(77, -150, 16, 0.0055, 26), [])
  const near = useMemo(() => buildRidgeGeometry(303, -95, 10, 0.0092, 14), [])
  return (
    <group ref={groupRef}>
      <mesh geometry={far} frustumCulled={false}>
        <meshBasicMaterial color="#9fc0dd" fog={false} />
      </mesh>
      <mesh geometry={mid} frustumCulled={false}>
        <meshBasicMaterial color="#7ea9cd" fog={false} />
      </mesh>
      <mesh geometry={near} frustumCulled={false}>
        <meshBasicMaterial color="#5f8fae" fog={false} />
      </mesh>
    </group>
  )
}

function Instanced({
  items,
  geometry,
  color,
  yOffset = 0,
  cast = true,
}: {
  items: Scatter[]
  geometry: THREE.BufferGeometry
  color: string
  yOffset?: number
  cast?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y + yOffset * it.s, it.z)
      dummy.rotation.set(0, it.r, 0)
      dummy.scale.setScalar(it.s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }, [items, yOffset])
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, items.length]} castShadow={cast} receiveShadow>
      <meshStandardMaterial color={color} flatShading roughness={0.9} />
    </instancedMesh>
  )
}

export function Scenery({ terrain }: { terrain: Terrain }) {
  const trees = useMemo(() => scatterTrees(terrain), [terrain])
  const rocks = useMemo(() => scatterRocks(terrain), [terrain])

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.26, 1.5, 5), [])
  const leafGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(1.05, 2.5, 6)
    g.translate(0, 1.25, 0)
    return g
  }, [])
  const leafGeo2 = useMemo(() => {
    const g = new THREE.ConeGeometry(0.8, 1.9, 6)
    g.translate(0, 2.5, 0)
    return g
  }, [])
  const rockGeo = useMemo(() => new THREE.DodecahedronGeometry(0.55, 0), [])

  const upper = useMemo(() => trees.map((t) => ({ ...t, y: t.y + 1.15 * t.s })), [trees])

  return (
    <group>
      <Instanced items={trees} geometry={trunkGeo} color="#6b4a30" yOffset={0.75} />
      <Instanced items={upper} geometry={leafGeo} color="#3d8a3f" />
      <Instanced items={upper} geometry={leafGeo2} color="#4ea24c" />
      <Instanced items={rocks} geometry={rockGeo} color="#8a8578" />
    </group>
  )
}

export function Clouds({ groupRef }: { groupRef: RefObject<THREE.Group | null> }) {
  const clouds = useMemo(() => makeClouds(), [])
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const spec: [number, number, number, number][] = [
      [0, 0, 0, 1],
      [1.1, -0.15, 0.3, 0.72],
      [-1.15, -0.2, -0.2, 0.66],
      [0.4, 0.45, -0.3, 0.6],
      [-0.5, 0.35, 0.25, 0.55],
    ]
    for (const [x, y, z, s] of spec) {
      const g = new THREE.IcosahedronGeometry(s, 1)
      g.translate(x, y, z)
      parts.push(g)
    }
    // merge manually
    let count = 0
    for (const g of parts) count += g.attributes.position.count
    const pos = new Float32Array(count * 3)
    const nor = new Float32Array(count * 3)
    let o = 0
    for (const g of parts) {
      const p = g.attributes.position.array as ArrayLike<number>
      const nn = g.attributes.normal.array as ArrayLike<number>
      for (let i = 0; i < p.length; i++) {
        pos[o + i] = p[i]
        nor[o + i] = nn[i]
      }
      o += p.length
      g.dispose()
    }
    const merged = new THREE.BufferGeometry()
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3))
    return merged
  }, [])

  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    clouds.forEach((c, i) => {
      dummy.position.set(c.x, c.y, c.z)
      dummy.rotation.set(0, c.r, 0)
      dummy.scale.set(c.s * 1.7, c.s * 0.85, c.s)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [clouds])

  return (
    <group ref={groupRef}>
      <instancedMesh ref={ref} args={[geo, undefined, clouds.length]} frustumCulled={false}>
        <meshBasicMaterial color="#ffffff" fog={false} transparent opacity={0.92} />
      </instancedMesh>
    </group>
  )
}

export function Sun({ meshRef }: { meshRef: RefObject<THREE.Group | null> }) {
  return (
    <group ref={meshRef}>
      <mesh>
        <circleGeometry args={[16, 32]} />
        <meshBasicMaterial color="#fff6cf" fog={false} />
      </mesh>
      <mesh position={[0, 0, -1]}>
        <circleGeometry args={[26, 32]} />
        <meshBasicMaterial color="#ffe9a8" fog={false} transparent opacity={0.35} />
      </mesh>
    </group>
  )
}
