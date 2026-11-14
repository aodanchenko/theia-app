import { useEffect, useRef, useState } from 'react'
import type { Vital } from '../types.ts'
import { demoVitals, startSim, tick, toVitals } from './vitalsSim.ts'

const DEMO = demoVitals()

// Simulated vitals: a fixed mid-set picture while the camera is off; while `live`, they move with the person's reps.
// Each camera start begins a fresh simulation from rest.
export default function useSimVitals(live: boolean, reps: number): Vital[] {
  const [vitals, setVitals] = useState<Vital[] | null>(null)
  const repsNow = useRef(reps)
  useEffect(() => { repsNow.current = reps }, [reps])
  useEffect(() => {
    if (!live) return
    let s = startSim(performance.now())
    s = { ...s, reps: repsNow.current } // reps done before this start don't count as new effort
    const step = () => { s = tick(s, performance.now(), repsNow.current); setVitals(toVitals(s)) }
    const first = setTimeout(step, 0)
    const id = setInterval(step, 500)
    return () => { clearTimeout(first); clearInterval(id); setVitals(null) }
  }, [live])
  return live && vitals ? vitals : DEMO
}
