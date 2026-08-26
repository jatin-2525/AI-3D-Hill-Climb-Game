import { useCallback, useEffect, useState } from 'react'
import { getState, input, startRun } from '../game/store'

export type Pedal = 'gas' | 'brake'

const GAS_KEYS = ['arrowright', 'd', 'w', ' ']
const BRAKE_KEYS = ['arrowleft', 'a', 's', 'arrowdown']

export function useControls() {
  const [pressed, setPressed] = useState({ gas: false, brake: false })

  const press = useCallback((which: Pedal, down: boolean) => {
    input[which] = down ? 1 : 0
    setPressed((p) => (p[which] === down ? p : { ...p, [which]: down }))
  }, [])

  useEffect(() => {
    const handle = (e: KeyboardEvent, down: boolean) => {
      if (e.repeat) return
      const k = e.key.toLowerCase()
      if (GAS_KEYS.includes(k)) {
        press('gas', down)
        e.preventDefault()
      } else if (BRAKE_KEYS.includes(k)) {
        press('brake', down)
        e.preventDefault()
      }
      if (down && (k === 'enter' || k === ' ' || k === 'r')) {
        if (getState().phase !== 'playing') startRun()
      }
    }
    const kd = (e: KeyboardEvent) => handle(e, true)
    const ku = (e: KeyboardEvent) => handle(e, false)
    const blur = () => {
      press('gas', false)
      press('brake', false)
    }
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      window.removeEventListener('blur', blur)
    }
  }, [press])

  return { pressed, press }
}
