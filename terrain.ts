import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Deterministic PRNG
 * ------------------------------------------------------------------ */
export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

/* ------------------------------------------------------------------ *
 * World constants
 * ------------------------------------------------------------------ */
export const X_START = -60
export const X_END = 1600
export const DX = 0.8
export const Z_COLS = [-36, -27, -20, -14, -9, -5.4, -3.3, 0, 3.0, 3.7]
export const TRACK_EDGE = 3.3
export const WALL_Z = 3.7

/* ------------------------------------------------------------------ *
 * Terrain height field  (analytic — shared by physics + mesh)
 * ------------------------------------------------------------------ */
export class Terrain {
  octaves: { f: number; a: number; p: number }[]

  constructor(public seed = 20260119) {
    const rnd = mulberry32(seed)
    const base = [
      { f: 0.0072, a: 10.5 },
      { f: 0.0173, a: 5.4 },
      { f: 0.0402, a: 2.35 },
      { f: 0.0891, a: 0.98 },
      { f: 0.1907, a: 0.34 },
      { f: 0.4103, a: 0.1 },
    ]
    this.octaves = base.map((o) => ({
      f: o.f * (0.86 + rnd() * 0.28),
      a: o.a * (0.82 + rnd() * 0.36),
      p: rnd() * Math.PI * 2,
    }))
  }

  /** ground height of the drivable track centreline */
  height(x: number): number {
    let h = 0
    const diff = clamp((x - 40) / 620, 0, 1)
    const scale = 0.4 + 0.85 * diff
    const oc = this.octaves
    for (let i = 0; i < oc.length; i++) h += oc[i].a * Math.sin(oc[i].f * x + oc[i].p)
    h *= scale
    return h * smoothstep(8, 52, x)
  }

  slope(x: number): number {
    const e = 0.06
    return (this.height(x + e) - this.height(x - e)) / (2 * e)
  }

  /** unit normal of the track surface at x (2D, +y up) */
  normal(x: number, out: { x: number; y: number }) {
    const s = this.slope(x)
    const inv = 1 / Math.sqrt(1 + s * s)
    out.x = -s * inv
    out.y = inv
    return out
  }

  /** 3D surface used by the mesh — flat across the track, banks up behind it */
  surface(x: number, z: number): number {
    const base = this.height(x)
    if (z >= -TRACK_EDGE) return base
    const d = -z - TRACK_EDGE
    const rise = Math.min(9, 0.0045 * d * d)
    const rough =
      Math.sin(x * 0.081 + z * 0.29) * Math.min(2.6, d * 0.28) +
      Math.sin(x * 0.031 - z * 0.13 + 1.7) * Math.min(4.2, d * 0.24) +
      Math.sin(x * 0.21 + z * 0.11) * Math.min(0.7, d * 0.1)
    return base + rise + rough
  }

  /**
   * Ray-cast downward-ish against the height field.
   * Returns distance along (dx,dy) to the surface, or -1.
   */
  rayCast(px: number, py: number, dx: number, dy: number, maxLen: number): number {
    const STEPS = 14
    let prevS = 0
    let prevF = py - this.height(px)
    if (prevF < 0) return 0
    for (let i = 1; i <= STEPS; i++) {
      const s = (i / STEPS) * maxLen
      const f = py + dy * s - this.height(px + dx * s)
      if (f <= 0) {
        let lo = prevS
        let hi = s
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) * 0.5
          const fm = py + dy * mid - this.height(px + dx * mid)
          if (fm <= 0) hi = mid
          else lo = mid
        }
        return (lo + hi) * 0.5
      }
      prevS = s
      prevF = f
    }
    return -1
  }
}

/* ------------------------------------------------------------------ *
 * Vertex colouring
 * ------------------------------------------------------------------ */
const DIRT_A = new THREE.Color('#c39a63')
const DIRT_B = new THREE.Color('#8c6538')
const GRASS_A = new THREE.Color('#6fb245')
const GRASS_B = new THREE.Color('#3f7f31')
const ROCK = new THREE.Color('#8d8577')
const SNOW = new THREE.Color('#f2f6fb')

const tmpC = new THREE.Color()
const tmpC2 = new THREE.Color()

function colorAt(z: number, y: number, slope: number, n: number) {
  const steep = clamp(Math.abs(slope) * 0.85, 0, 1)
  if (z > -TRACK_EDGE - 0.4) {
    tmpC.copy(DIRT_A).lerp(DIRT_B, steep * 0.7 + n * 0.35)
  } else {
    tmpC.copy(GRASS_A).lerp(GRASS_B, clamp(n * 0.8 + 0.15, 0, 1))
    tmpC2.copy(ROCK)
    tmpC.lerp(tmpC2, clamp((steep - 0.35) * 1.4, 0, 1))
    if (y > 22) tmpC.lerp(SNOW, clamp((y - 22) / 14, 0, 1))
  }
  return tmpC
}

/* ------------------------------------------------------------------ *
 * Terrain mesh
 * ------------------------------------------------------------------ */
export function buildTerrainGeometry(t: Terrain): THREE.BufferGeometry {
  const nx = Math.floor((X_END - X_START) / DX) + 1
  const nz = Z_COLS.length
  const rnd = mulberry32(9911)

  const wallRows = 3
  const total = nx * nz + nx * wallRows
  const pos = new Float32Array(total * 3)
  const col = new Float32Array(total * 3)
  const idx: number[] = []

  let p = 0
  // --- main surface -------------------------------------------------
  for (let i = 0; i < nx; i++) {
    const x = X_START + i * DX
    const slope = t.slope(x)
    for (let j = 0; j < nz; j++) {
      const z = Z_COLS[j]
      const y = t.surface(x, z)
      pos[p] = x
      pos[p + 1] = y
      pos[p + 2] = z
      const c = colorAt(z, y, slope, rnd())
      col[p] = c.r
      col[p + 1] = c.g
      col[p + 2] = c.b
      p += 3
    }
  }
  for (let i = 0; i < nx - 1; i++) {
    for (let j = 0; j < nz - 1; j++) {
      const a = i * nz + j
      const b = a + nz
      idx.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }

  // --- front cliff face --------------------------------------------
  const wallBase = nx * nz
  const bandCols = [new THREE.Color('#7a5636'), new THREE.Color('#5a4530'), new THREE.Color('#2f2620')]
  for (let i = 0; i < nx; i++) {
    const x = X_START + i * DX
    const top = t.surface(x, WALL_Z)
    const ys = [top, top - 1.6 - rnd() * 0.7, -60]
    for (let r = 0; r < wallRows; r++) {
      const o = (wallBase + i * wallRows + r) * 3
      pos[o] = x
      pos[o + 1] = ys[r]
      pos[o + 2] = WALL_Z
      const c = bandCols[r]
      const n = 0.9 + rnd() * 0.2
      col[o] = c.r * n
      col[o + 1] = c.g * n
      col[o + 2] = c.b * n
    }
  }
  for (let i = 0; i < nx - 1; i++) {
    for (let r = 0; r < wallRows - 1; r++) {
      const a = wallBase + i * wallRows + r
      const b = a + wallRows
      idx.push(a, b, a + 1, a + 1, b, b + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ *
 * Distant parallax ridges
 * ------------------------------------------------------------------ */
export function buildRidgeGeometry(seed: number, zPos: number, amp: number, freq: number, base: number) {
  const rnd = mulberry32(seed)
  const ph = [rnd() * 10, rnd() * 10, rnd() * 10]
  const nx = 260
  const step = (X_END - X_START + 600) / (nx - 1)
  const pos = new Float32Array(nx * 2 * 3)
  const idx: number[] = []
  for (let i = 0; i < nx; i++) {
    const x = X_START - 300 + i * step
    const h =
      base +
      amp * (Math.sin(x * freq + ph[0]) * 0.6 + Math.sin(x * freq * 2.3 + ph[1]) * 0.28 + Math.sin(x * freq * 4.7 + ph[2]) * 0.12)
    const o = i * 6
    pos[o] = x
    pos[o + 1] = h
    pos[o + 2] = zPos
    pos[o + 3] = x
    pos[o + 4] = -120
    pos[o + 5] = zPos
  }
  for (let i = 0; i < nx - 1; i++) {
    const a = i * 2
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/* ------------------------------------------------------------------ *
 * Scenery + pickups
 * ------------------------------------------------------------------ */
export interface Scatter {
  x: number
  y: number
  z: number
  s: number
  r: number
}

export function scatterTrees(t: Terrain, count = 260): Scatter[] {
  const rnd = mulberry32(4242)
  const out: Scatter[] = []
  for (let i = 0; i < count; i++) {
    const x = X_START + 40 + rnd() * (X_END - X_START - 80)
    const z = -5.5 - rnd() * rnd() * 30
    out.push({ x, y: t.surface(x, z), z, s: 0.7 + rnd() * 0.9, r: rnd() * Math.PI })
  }
  return out
}

export function scatterRocks(t: Terrain, count = 90): Scatter[] {
  const rnd = mulberry32(777)
  const out: Scatter[] = []
  for (let i = 0; i < count; i++) {
    const x = X_START + 40 + rnd() * (X_END - X_START - 80)
    const z = -4.6 - rnd() * 26
    out.push({ x, y: t.surface(x, z) - 0.2, z, s: 0.5 + rnd() * 1.5, r: rnd() * Math.PI })
  }
  return out
}

export function makeClouds(count = 22) {
  const rnd = mulberry32(31337)
  const out: Scatter[] = []
  for (let i = 0; i < count; i++) {
    out.push({
      x: X_START + rnd() * (X_END - X_START),
      y: 24 + rnd() * 26,
      z: -60 - rnd() * 75,
      s: 4 + rnd() * 7,
      r: rnd() * Math.PI,
    })
  }
  return out
}

export interface Pickup {
  x: number
  y: number
  taken: boolean
}

export function makeCoins(t: Terrain): Pickup[] {
  const rnd = mulberry32(5150)
  const out: Pickup[] = []
  let x = 45
  while (x < X_END - 40) {
    const cluster = 3 + Math.floor(rnd() * 5)
    const gap = 2.4 + rnd() * 1.2
    const arc = rnd() > 0.55
    for (let i = 0; i < cluster; i++) {
      const cx = x + i * gap
      const lift = arc ? 1.4 + Math.sin((i / (cluster - 1 || 1)) * Math.PI) * 3.4 : 1.5
      out.push({ x: cx, y: t.height(cx) + lift, taken: false })
    }
    x += cluster * gap + 18 + rnd() * 34
  }
  return out
}

export function makeFuel(t: Terrain): Pickup[] {
  const out: Pickup[] = []
  const rnd = mulberry32(60606)
  let x = 70
  while (x < X_END - 40) {
    out.push({ x, y: t.height(x) + 1.1, taken: false })
    x += 62 + rnd() * 46
  }
  return out
}
