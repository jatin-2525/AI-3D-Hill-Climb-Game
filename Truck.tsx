import { type RefObject } from 'react'
import type {} from '@react-three/fiber'
import * as THREE from 'three'
import { WHEEL_R } from '../game/vehicle'

export interface TruckRefs {
  body: RefObject<THREE.Group | null>
  wheels: [RefObject<THREE.Group | null>, RefObject<THREE.Group | null>]
}

const ORANGE = '#ef5f2c'
const ORANGE_D = '#c94519'
const DARK = '#272c33'
const STEEL = '#8e98a4'

function HalfWheel({ side }: { side: number }) {
  return (
    <group position={[0, 0, side * 0.86]}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[WHEEL_R, WHEEL_R, 0.5, 14]} />
          <meshStandardMaterial color="#1b1e23" flatShading roughness={0.95} />
        </mesh>
        <mesh position={[0, side * 0.06, 0]}>
          <cylinderGeometry args={[WHEEL_R * 0.58, WHEEL_R * 0.58, 0.42, 10]} />
          <meshStandardMaterial color={STEEL} flatShading roughness={0.45} metalness={0.4} />
        </mesh>
        <mesh position={[0, side * 0.12, 0]}>
          <cylinderGeometry args={[WHEEL_R * 0.2, WHEEL_R * 0.2, 0.24, 8]} />
          <meshStandardMaterial color="#f2b134" flatShading />
        </mesh>
      </group>
      {/* spokes keep the spin readable */}
      <mesh position={[0, 0, side * 0.24]}>
        <boxGeometry args={[WHEEL_R * 1.06, 0.09, 0.05]} />
        <meshStandardMaterial color="#dfe6ee" />
      </mesh>
      <mesh position={[0, 0, side * 0.24]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[WHEEL_R * 1.06, 0.09, 0.05]} />
        <meshStandardMaterial color="#dfe6ee" />
      </mesh>
    </group>
  )
}

function Wheel({ groupRef }: { groupRef: RefObject<THREE.Group | null> }) {
  return (
    <group ref={groupRef}>
      <HalfWheel side={1} />
      <HalfWheel side={-1} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 1.7, 6]} />
        <meshStandardMaterial color="#3a4048" flatShading />
      </mesh>
    </group>
  )
}

export function Truck({ refs }: { refs: TruckRefs }) {
  return (
    <>
      <group ref={refs.body}>
        {/* skid plate */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[2.95, 0.24, 1.5]} />
          <meshStandardMaterial color={DARK} flatShading roughness={0.8} />
        </mesh>
        {/* hull */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[2.7, 0.72, 1.5]} />
          <meshStandardMaterial color={ORANGE} flatShading roughness={0.55} metalness={0.15} />
        </mesh>
        {/* fenders */}
        <mesh position={[-1.08, 0.4, 0]} castShadow>
          <boxGeometry args={[1.0, 0.3, 2.3]} />
          <meshStandardMaterial color={ORANGE_D} flatShading />
        </mesh>
        <mesh position={[1.14, 0.4, 0]} castShadow>
          <boxGeometry args={[1.0, 0.3, 2.3]} />
          <meshStandardMaterial color={ORANGE_D} flatShading />
        </mesh>
        {/* side stripe */}
        <mesh position={[0, 0.02, 0.76]}>
          <boxGeometry args={[2.62, 0.16, 0.04]} />
          <meshStandardMaterial color="#ffd23f" />
        </mesh>
        <mesh position={[0, 0.02, -0.76]}>
          <boxGeometry args={[2.62, 0.16, 0.04]} />
          <meshStandardMaterial color="#ffd23f" />
        </mesh>
        {/* cabin */}
        <mesh position={[-0.3, 0.85, 0]} castShadow>
          <boxGeometry args={[1.15, 0.68, 1.36]} />
          <meshStandardMaterial color="#eef2f7" flatShading roughness={0.6} />
        </mesh>
        {/* windscreen */}
        <mesh position={[0.32, 0.82, 0]} rotation={[0, 0, -0.42]} castShadow>
          <boxGeometry args={[0.14, 0.72, 1.32]} />
          <meshStandardMaterial color="#3d6c8f" flatShading metalness={0.4} roughness={0.25} />
        </mesh>
        {/* roof + light bar */}
        <mesh position={[-0.3, 1.22, 0]}>
          <boxGeometry args={[1.2, 0.1, 1.42]} />
          <meshStandardMaterial color={ORANGE_D} flatShading />
        </mesh>
        <mesh position={[0.05, 1.34, 0]}>
          <boxGeometry args={[0.26, 0.16, 1.3]} />
          <meshStandardMaterial color="#ffe066" emissive="#ffb703" emissiveIntensity={0.6} flatShading />
        </mesh>
        {/* driver */}
        <mesh position={[-0.32, 1.06, 0]} castShadow>
          <sphereGeometry args={[0.17, 10, 8]} />
          <meshStandardMaterial color="#e8b58c" flatShading />
        </mesh>
        <mesh position={[-0.32, 1.14, 0]} castShadow>
          <sphereGeometry args={[0.2, 10, 8]} />
          <meshStandardMaterial color="#d92b2b" flatShading />
        </mesh>
        {/* front bumper + winch */}
        <mesh position={[1.5, 0.02, 0]} castShadow>
          <boxGeometry args={[0.36, 0.34, 1.9]} />
          <meshStandardMaterial color={STEEL} flatShading metalness={0.5} roughness={0.4} />
        </mesh>
        {/* headlight */}
        <mesh position={[1.42, 0.36, 0.6]}>
          <boxGeometry args={[0.16, 0.2, 0.28]} />
          <meshStandardMaterial color="#fff8d6" emissive="#ffeaa0" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[1.42, 0.36, -0.6]}>
          <boxGeometry args={[0.16, 0.2, 0.28]} />
          <meshStandardMaterial color="#fff8d6" emissive="#ffeaa0" emissiveIntensity={0.8} />
        </mesh>
        {/* rear + exhaust */}
        <mesh position={[-1.48, 0.05, 0]} castShadow>
          <boxGeometry args={[0.3, 0.4, 1.7]} />
          <meshStandardMaterial color={DARK} flatShading />
        </mesh>
        <mesh position={[-1.2, 0.72, 0.68]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.09, 0.7, 8]} />
          <meshStandardMaterial color="#59606b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* jerrycan on the back */}
        <mesh position={[-1.15, 0.62, -0.62]} castShadow>
          <boxGeometry args={[0.34, 0.42, 0.2]} />
          <meshStandardMaterial color="#c62828" flatShading />
        </mesh>
      </group>
      <Wheel groupRef={refs.wheels[0]} />
      <Wheel groupRef={refs.wheels[1]} />
    </>
  )
}
