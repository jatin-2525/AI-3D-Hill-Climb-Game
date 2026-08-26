import { Terrain } from './terrain'

/* ------------------------------------------------------------------ *
 * Tuning
 * ------------------------------------------------------------------ */
export const G = 18
const MASS = 260
const INERTIA = 175

export const WHEEL_R = 0.5
const SUSP_REST = 0.44
const SUSP_K = 26000
const SUSP_C = 2100
const SUSP_MAX = 42000

const MU = 1.6
const ROLL = 52
const ENGINE = 4700
const MAX_SPEED = 28
const AIR_DRAG = 0.85

const AIR_TORQUE = 2400
const REACT_TORQUE = 430
const ANG_DAMP = 0.55
const MAX_AV = 11

const BODY_K = 30000
const BODY_C = 900

export interface Wheel {
  lx: number
  ly: number
  drive: number
  /** world position of the wheel hub */
  x: number
  y: number
  spin: number
  spinVel: number
  contact: boolean
  compression: number
  skid: number
}

/** chassis collision probes, local space */
const BODY_POINTS: [number, number, boolean][] = [
  [-1.45, -0.36, false],
  [-1.45, 0.62, false],
  [1.5, -0.36, false],
  [1.5, 0.62, false],
  [0, -0.42, false],
  [0.2, 0.66, false],
  [-0.25, 1.16, true], // driver head → fatal
  [0.15, 1.16, true],
]

const n = { x: 0, y: 1 }

export class Vehicle {
  x = 0
  y = 0
  angle = 0
  vx = 0
  vy = 0
  av = 0

  wheels: Wheel[] = [
    { lx: -1.08, ly: -0.3, drive: 0.62, x: 0, y: 0, spin: 0, spinVel: 0, contact: false, compression: 0, skid: 0 },
    { lx: 1.14, ly: -0.3, drive: 0.38, x: 0, y: 0, spin: 0, spinVel: 0, contact: false, compression: 0, skid: 0 },
  ]

  grounded = false
  crashed = false
  crashReason: 'flip' | 'fuel' | '' = ''
  airTime = 0
  flipAccum = 0
  lastFlips = 0
  lastAirTime = 0
  landedEvent = 0
  engineLoad = 0
  impact = 0

  private fx = 0
  private fy = 0
  private tq = 0

  constructor(public terrain: Terrain) {
    this.reset()
  }

  reset() {
    this.x = 0
    this.y = this.terrain.height(0) + 1.05
    this.angle = 0
    this.vx = 0
    this.vy = 0
    this.av = 0
    this.crashed = false
    this.crashReason = ''
    this.airTime = 0
    this.flipAccum = 0
    this.lastFlips = 0
    this.impact = 0
    for (const w of this.wheels) {
      w.spin = 0
      w.spinVel = 0
      w.contact = false
      w.compression = 0
      w.skid = 0
    }
  }

  get speed() {
    return Math.hypot(this.vx, this.vy)
  }

  private addForceAt(fx: number, fy: number, rx: number, ry: number) {
    this.fx += fx
    this.fy += fy
    this.tq += rx * fy - ry * fx
  }

  step(dt: number, throttle: number) {
    if (this.crashed) throttle = 0
    const SUB = 6
    const h = dt / SUB
    for (let i = 0; i < SUB; i++) this.substep(h, throttle)
    for (const w of this.wheels) w.spin += w.spinVel * dt
    this.engineLoad += (Math.abs(throttle) - this.engineLoad) * Math.min(1, dt * 6)
  }

  private substep(h: number, throttle: number) {
    const t = this.terrain
    this.fx = 0
    this.fy = -MASS * G
    this.tq = 0

    const c = Math.cos(this.angle)
    const s = Math.sin(this.angle)
    // chassis up / down in world space
    const ux = -s
    const uy = c
    const dxr = s
    const dyr = -c

    let anyContact = false
    const maxLen = SUSP_REST + WHEEL_R

    for (const w of this.wheels) {
      const rx = c * w.lx - s * w.ly
      const ry = s * w.lx + c * w.ly
      const ax = this.x + rx
      const ay = this.y + ry

      const hit = t.rayCast(ax, ay, dxr, dyr, maxLen)
      if (hit >= 0) {
        anyContact = true
        w.contact = true
        const comp = maxLen - hit
        w.compression = comp

        const vax = this.vx - this.av * ry
        const vay = this.vy + this.av * rx
        const vUp = vax * ux + vay * uy

        let fs = SUSP_K * comp - SUSP_C * vUp
        if (fs < 0) fs = 0
        if (fs > SUSP_MAX) fs = SUSP_MAX
        this.addForceAt(ux * fs, uy * fs, rx, ry)

        // contact point
        const cx = ax + dxr * hit
        const cy = ay + dyr * hit
        t.normal(cx, n)
        const tx = n.y
        const ty = -n.x
        const nf = Math.max(0, fs * (ux * n.x + uy * n.y))

        const rcx = cx - this.x
        const rcy = cy - this.y
        const vcx = this.vx - this.av * rcy
        const vcy = this.vy + this.av * rcx
        const vt = vcx * tx + vcy * ty

        let curve = 1
        if (throttle * vt > 0) curve = Math.max(0.04, 1 - Math.abs(vt) / MAX_SPEED)
        const drive = throttle * ENGINE * w.drive * curve
        let ft = drive - ROLL * vt
        const grip = MU * nf
        let slipping = false
        if (ft > grip) {
          ft = grip
          slipping = true
        } else if (ft < -grip) {
          ft = -grip
          slipping = true
        }
        this.addForceAt(tx * ft, ty * ft, rcx, rcy)

        // visual wheel spin (adds slip when tyres break traction)
        const target = vt / WHEEL_R + (slipping ? Math.sign(drive) * 9 : 0)
        w.spinVel += (target - w.spinVel) * Math.min(1, h * 22)
        w.skid += ((slipping ? 1 : 0) - w.skid) * Math.min(1, h * 8)

        const hubDist = Math.max(0, hit - WHEEL_R)
        w.x = ax + dxr * hubDist
        w.y = ay + dyr * hubDist
      } else {
        w.contact = false
        w.compression = 0
        w.x = ax + dxr * SUSP_REST
        w.y = ay + dyr * SUSP_REST
        w.spinVel += (throttle * 26 - w.spinVel) * Math.min(1, h * 3)
        w.skid *= 0.9
      }
    }

    // chassis / ground collision probes
    for (const bp of BODY_POINTS) {
      const rx = c * bp[0] - s * bp[1]
      const ry = s * bp[0] + c * bp[1]
      const px = this.x + rx
      const py = this.y + ry
      const gh = t.height(px)
      if (py < gh) {
        const pen = gh - py
        t.normal(px, n)
        const vpx = this.vx - this.av * ry
        const vpy = this.vy + this.av * rx
        const vn = vpx * n.x + vpy * n.y
        let f = BODY_K * pen - BODY_C * vn
        if (f < 0) f = 0
        if (f > 60000) f = 60000
        this.addForceAt(n.x * f, n.y * f, rx, ry)
        // scrape friction
        const tx = n.y
        const ty = -n.x
        const vt = vpx * tx + vpy * ty
        this.addForceAt(-tx * vt * 120, -ty * vt * 120, rx, ry)
        this.impact = Math.max(this.impact, -vn)
        if (bp[2] && pen > 0.02 && !this.crashed) {
          this.crashed = true
          this.crashReason = 'flip'
        }
        anyContact = true
      }
    }

    // aero
    const sp = Math.hypot(this.vx, this.vy)
    if (sp > 0.01) {
      this.fx -= AIR_DRAG * this.vx * sp * 0.06
      this.fy -= AIR_DRAG * this.vy * sp * 0.06
    }

    if (!anyContact) {
      this.tq += throttle * AIR_TORQUE
      this.airTime += h
      this.flipAccum += this.av * h
    } else {
      this.tq += throttle * REACT_TORQUE
      if (this.airTime > 0.45) {
        this.lastAirTime = this.airTime
        this.lastFlips = Math.floor(Math.abs(this.flipAccum) / (Math.PI * 2))
        this.landedEventFlag()
      }
      this.airTime = 0
      this.flipAccum = 0
    }
    this.grounded = anyContact

    // integrate
    this.vx += (this.fx / MASS) * h
    this.vy += (this.fy / MASS) * h
    this.av += (this.tq / INERTIA) * h
    this.av *= 1 - ANG_DAMP * h
    if (this.av > MAX_AV) this.av = MAX_AV
    if (this.av < -MAX_AV) this.av = -MAX_AV

    this.x += this.vx * h
    this.y += this.vy * h
    this.angle += this.av * h

    if (this.y < t.height(this.x) - 60 && !this.crashed) {
      this.crashed = true
      this.crashReason = 'flip'
    }
  }

  private landedEventFlag() {
    this.landedEvent++
  }
}
