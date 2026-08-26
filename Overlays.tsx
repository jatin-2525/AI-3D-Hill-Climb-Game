import { startRun, toMenu, useGame } from '../game/store'

function Btn({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'ghost'
}) {
  const base =
    'pointer-events-auto rounded-2xl px-7 py-3 text-base font-black uppercase tracking-widest transition-transform active:scale-95'
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-b from-amber-300 to-orange-500 text-slate-900 shadow-[0_10px_0_rgb(154,52,18),0_18px_30px_rgba(0,0,0,0.35)] hover:brightness-105'
      : 'border-2 border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20'
  return (
    <button className={`${base} ${styles}`} onClick={onClick}>
      {children}
    </button>
  )
}

function Stat({ label, value, accent = 'text-white' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-950/40 px-4 py-3 text-center">
      <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-sky-200/70">{label}</div>
      <div className={`text-2xl font-black tabular-nums ${accent}`}>{value}</div>
    </div>
  )
}

export function Overlays() {
  const g = useGame()
  if (g.phase === 'playing') return null

  const record = g.phase === 'over' && Math.round(g.distance) >= Math.round(g.best) && g.distance > 5

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]">
      {g.phase === 'menu' ? (
        <div className="animate-pop w-full max-w-lg rounded-[2rem] border border-white/20 bg-slate-900/70 p-7 text-center text-white shadow-2xl">
          <div className="animate-bob mx-auto mb-1 text-5xl">🏔️</div>
          <h1 className="animate-drift bg-gradient-to-r from-amber-200 via-orange-400 to-amber-200 bg-clip-text text-5xl font-black uppercase tracking-tight text-transparent md:text-6xl">
            Summit Rush
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.42em] text-sky-200/80">3D Hill Climb</p>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            Feather the throttle over procedurally-generated peaks. Too much gas and you loop out — too little and
            gravity wins. Grab jerrycans before the tank runs dry.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-white/85">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-2xl">⛽</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">Fuel is the clock</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-2xl">🪙</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">Coins &amp; combos</div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
              <div className="text-2xl">🤸</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest">Flip for bonus</div>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Btn onClick={startRun}>Start Engine</Btn>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
              <kbd className="rounded bg-white/15 px-1.5 py-0.5">→</kbd> gas ·{' '}
              <kbd className="rounded bg-white/15 px-1.5 py-0.5">←</kbd> brake · tap the pedals on mobile
            </div>
            {g.best > 0 && (
              <div className="rounded-full bg-amber-400/20 px-4 py-1 text-xs font-black uppercase tracking-widest text-amber-200 ring-1 ring-amber-300/40">
                Best {Math.round(g.best)} m
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-pop w-full max-w-md rounded-[2rem] border border-white/20 bg-slate-900/75 p-7 text-center text-white shadow-2xl">
          <div className="text-5xl">{g.reason === 'summit' ? '🏁' : g.reason === 'fuel' ? '⛽' : '💥'}</div>
          <h2
            className={`mt-2 text-3xl font-black uppercase tracking-tight ${
              g.reason === 'summit' ? 'text-emerald-300' : 'text-orange-300'
            }`}
          >
            {g.reason === 'summit' ? 'Summit reached!' : g.reason === 'fuel' ? 'Out of fuel' : 'Wrecked!'}
          </h2>
          <p className="mt-1 text-sm text-white/65">
            {g.reason === 'summit'
              ? 'You drove the whole range. Legendary.'
              : g.reason === 'fuel'
                ? 'The tank ran dry on the mountainside.'
                : 'The driver kissed the dirt. Ouch.'}
          </p>

          {record && (
            <div className="mx-auto mt-3 w-fit animate-pulse rounded-full bg-amber-400 px-4 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-900">
              ★ New record ★
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Stat label="Distance" value={`${Math.round(g.distance)} m`} accent="text-sky-200" />
            <Stat label="Coins" value={`${g.coins}`} accent="text-amber-200" />
            <Stat label="Score" value={`${g.score}`} accent="text-emerald-200" />
            <Stat label="Best" value={`${Math.round(g.best)} m`} />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Btn onClick={startRun}>Drive again</Btn>
            <Btn variant="ghost" onClick={toMenu}>
              Menu
            </Btn>
          </div>
          <div className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-white/45">
            press <kbd className="rounded bg-white/15 px-1.5 py-0.5">space</kbd> to retry
          </div>
        </div>
      )}
    </div>
  )
}
