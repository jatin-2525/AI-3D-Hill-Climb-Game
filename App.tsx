import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Terrain } from './game/terrain'
import { Game } from './three/Game'
import { HUD } from './ui/HUD'
import { Overlays } from './ui/Overlays'
import { useControls } from './ui/controls'

export default function App() {
  const terrain = useMemo(() => new Terrain(20260119), [])
  const { pressed, press } = useControls()

  return (
    <div className="sky relative h-full w-full overflow-hidden">
      {/* sun sits behind the transparent canvas */}
      <div className="pointer-events-none absolute right-[16%] top-[7%] h-20 w-20 rounded-full bg-[#fff8da] shadow-[0_0_70px_34px_rgba(255,246,207,0.65)] md:h-28 md:w-28" />
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 46, near: 0.5, far: 1200, position: [8, 8, 26] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          gl.shadowMap.type = THREE.PCFSoftShadowMap
        }}
      >
        <Game terrain={terrain} />
      </Canvas>

      <HUD pressed={pressed} press={press} />
      <Overlays />

      <div className="pointer-events-none absolute bottom-1 left-1/2 z-10 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.3em] text-white/35">
        summit rush · procedural 3d hill climb
      </div>
    </div>
  )
}
