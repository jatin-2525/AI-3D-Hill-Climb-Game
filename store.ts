import { useSyncExternalStore } from 'react'

export type Phase = 'menu' | 'playing' | 'over'

export interface GameState {
  phase: Phase
  distance: number
  best: number
  coins: number
  fuel: number
  speed: number
  score: number
  airborne: boolean
  reason: 'flip' | 'fuel' | 'summit' | ''
  toast: { id: number; text: string; sub: string } | null
  runs: number
}

const BEST_KEY = 'summit-rush-best'

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || '0') || 0
  } catch {
    return 0
  }
}

let state: GameState = {
  phase: 'menu',
  distance: 0,
  best: loadBest(),
  coins: 0,
  fuel: 100,
  speed: 0,
  score: 0,
  airborne: false,
  reason: '',
  toast: null,
  runs: 0,
}

const listeners = new Set<() => void>()

export function getState() {
  return state
}

export function setState(patch: Partial<GameState>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function saveBest(d: number) {
  if (d > state.best) {
    setState({ best: d })
    try {
      localStorage.setItem(BEST_KEY, String(Math.round(d)))
    } catch {
      /* ignore */
    }
  }
}

/** imperative input shared with the render loop (no re-renders) */
export const input = {
  gas: 0,
  brake: 0,
  get throttle() {
    return this.gas - this.brake
  },
}

export function startRun() {
  setState({
    phase: 'playing',
    distance: 0,
    coins: 0,
    fuel: 100,
    speed: 0,
    score: 0,
    reason: '',
    toast: null,
    runs: state.runs + 1,
  })
}

export function endRun(reason: 'flip' | 'fuel' | 'summit') {
  if (state.phase !== 'playing') return
  saveBest(state.distance)
  setState({ phase: 'over', reason })
}

export function toMenu() {
  setState({ phase: 'menu', toast: null })
}
