import { useEffect, useState } from 'react'
import { useGame } from '../game/store'
import type { Pedal } from './controls'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={
        'rounded-2xl border border-white/25 bg-slate-900/45 px-3 py-2 text-white shadow-[0_8px_28px_rgba(6,20,40,0.35)] backdrop-blur-md ' +
        className
      }
    >
      {children}
    </div>
  )
}

function Toast() {
  const { toast } = useGame()
  const [shown, setShown] = useState<typeof toast>(null)
  useEffect(() => {
    if (!toast) return setShown(null)
    setShown(toast)
    const t = setTimeout(() => setShown(null), 1900)
    return () => clearTimeout(t)
  }, [toast])
  if (!shown) return null
  return (
    <div key={shown.id} className="animate-toast absolute left-1/2 top-[26%] -translate-x-1/2 text-center">
      <div className="stroke-text bg-gradient-to-b from-amber-200 to-orange-500 bg-clip-text text-4xl font-black tracking-tight text-transparent drop-shadow md:text-6xl">
        {shown.text}
      </div>
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/80 md:text-sm">{shown.sub}</div>
    </div>
  )
}

function PedalButton({
  label,
  icon,
  active,
  accent,
  onPress,
}: {
  label: string
  icon: string
  active: boolean
  accent: string
  onPress: (down: boolean) => void
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        onPress(true)
      }}
      onPointerUp={() => onPress(false)}
      onPointerCancel={() => onPress(false)}
      onPointerLeave={() => onPress(false)}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto flex h-24 w-24 select-none flex-col items-center justify-center rounded-3xl border-2 text-white transition-all duration-75 md:h-28 md:w-28 ${accent} ${
        active ? 'scale-95 brightness-125' : 'brightness-100'
      }`}
      aria-label={label}
    >
      <span className="text-3xl leading-none md:text-4xl">{icon}</span>
      <span className="mt-1 text-[11px] font-black uppercase tracking-widest">{label}</span>
    </button>
  )
}

export function HUD({
  pressed,
  press,
}: {
  pressed: { gas: boolean; brake: boolean }
  press: (p: Pedal, down: boolean) => void
}) {
  const g = useGame()
  const fuelPct = Math.max(0, Math.min(100, g.fuel))
  const low = fuelPct < 25
  const kmh = Math.round(g.speed * 3.6)

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 transition-opacity duration-300 md:p-5 ${
        g.phase === 'playing' ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* ---------- top ---------- */}
      <div className="flex items-start justify-between gap-2">
        <Card className="min-w-[5.5rem] px-2.5 md:min-w-[8rem]">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-200/80 md:text-[10px]">Distance</div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tabular-nums leading-none md:text-4xl">
              {Math.max(0, Math.round(g.distance))}
            </span>
            <span className="text-sm font-bold text-white/70">m</span>
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            best {Math.round(g.best)} m
          </div>
        </Card>

        <div className="flex flex-col items-center gap-2">
          <Card className="flex items-center gap-2 px-3 md:gap-3 md:px-4">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-3.5 w-3.5 rounded-full bg-gradient-to-br from-amber-200 to-yellow-500 ring-2 ring-yellow-600/60" />
              <span className="text-lg font-black tabular-nums leading-none md:text-xl">{g.coins}</span>
            </div>
            <div className="h-5 w-px bg-white/20" />
            <div className="flex items-baseline gap-1">
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-sky-200/80 sm:inline">
                score
              </span>
              <span className="text-lg font-black tabular-nums leading-none md:text-xl">{g.score}</span>
            </div>
          </Card>
          {g.airborne && g.phase === 'playing' && (
            <div className="rounded-full bg-sky-400/90 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-slate-900 shadow-lg">
              airborne
            </div>
          )}
        </div>

        <Card className="w-24 px-2.5 md:w-44">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200/80">Fuel</span>
            <span className={`text-xs font-black tabular-nums ${low ? 'text-red-300' : 'text-white/80'}`}>
              {Math.round(fuelPct)}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-950/60 ring-1 ring-inset ring-white/15">
            <div
              className={`h-full rounded-full transition-[width] duration-150 ${
                low
                  ? 'animate-pulse bg-gradient-to-r from-red-500 to-orange-400'
                  : 'bg-gradient-to-r from-emerald-400 to-lime-300'
              }`}
              style={{ width: `${fuelPct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-white/45">
            <span>E</span>
            <span>{low ? 'find a jerrycan!' : 'ok'}</span>
            <span>F</span>
          </div>
        </Card>
      </div>

      <Toast />

      {/* ---------- bottom ---------- */}
      <div className="flex items-end justify-between gap-3">
        <PedalButton
          label="Brake"
          icon="◀"
          active={pressed.brake}
          accent="border-rose-200/40 bg-gradient-to-b from-rose-500/85 to-rose-700/85 shadow-[0_10px_24px_rgba(190,18,60,0.4)]"
          onPress={(d) => press('brake', d)}
        />

        <Card className="mb-1 flex flex-col items-center px-5 py-2">
          <span className="text-4xl font-black tabular-nums leading-none md:text-5xl">{kmh}</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-200/80">km/h</span>
          <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-slate-950/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-white transition-[width] duration-100"
              style={{ width: `${Math.min(100, (kmh / 110) * 100)}%` }}
            />
          </div>
        </Card>

        <PedalButton
          label="Gas"
          icon="▶"
          active={pressed.gas}
          accent="border-emerald-200/40 bg-gradient-to-b from-emerald-500/85 to-emerald-700/85 shadow-[0_10px_24px_rgba(5,150,105,0.4)]"
          onPress={(d) => press('gas', d)}
        />
      </div>
    </div>
  )
}
