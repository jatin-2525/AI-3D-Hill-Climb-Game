# 🏔️ PROMPT — "Summit Rush: 3D Hill Climb"

> Use this prompt to (re)generate the app in this repo.

## The Prompt

Build **Summit Rush**, a polished 3D hill-climb driving game that runs in the browser
(React + Vite + TypeScript + Tailwind + Three.js via react-three-fiber). No external
assets, no network calls — everything is procedurally generated code, geometry and colour.

### Core loop
The player drives a chunky low-poly monster-truck across an endlessly rolling,
procedurally generated mountain range, seen from a cinematic 3/4 side camera.
Two inputs only — **GAS** and **BRAKE/REVERSE** — exactly like the classic mobile
hill-climb games. Balance throttle against the truck's pitch: too much gas on a steep
climb flips you onto your roof, too little and you roll back down.

### Simulation requirements
* Hand-rolled 2D rigid-body vehicle physics running at a fixed sub-stepped timestep
  (chassis = mass + inertia; two ray-cast suspension wheels with spring/damper,
  tyre friction cones, engine torque reaction, air drag, rolling resistance).
* The terrain is an analytic sum-of-sines height field — the exact same function feeds
  both the physics ray-casts and the rendered mesh, so the wheels never lie.
* Difficulty ramps with distance: hills grow taller and steeper the further you get.
* Airborne control: throttle rotates the truck mid-flight so the player can style out
  backflips and land wheels-down. Award bonus points for completed flips and airtime.
* The driver's head touching the ground ends the run.

### Content
* Fuel is the timer — it constantly drains, faster under throttle. Collect jerrycans.
* Spinning gold coins scattered along the track, in arcs over jumps.
* Distance (m), coins, speed (km/h), fuel gauge, live best-distance record in `localStorage`.

### Look & feel
* Stylised low-poly world: vertex-coloured flat-shaded terrain, dirt track band cut
  through grassy banks, layered parallax ridges, drifting clouds, warm sun, soft fog.
* Chunky readable HUD, a title screen with animated gradient, a run-summary card on
  crash / out of fuel, and touch-friendly on-screen pedals for mobile.
* Everything must be legible at a glance while driving: big numbers, high contrast.

### Constraints
* 60 fps target: static terrain geometry built once, instanced scenery, imperative
  per-frame updates (no React re-render in the render loop — HUD updates are throttled).
* Fully keyboard **and** touch playable. Works as a single self-contained bundle.
