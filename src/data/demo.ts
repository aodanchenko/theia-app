// Simulated demo session (ARED squat, set 2). Shown in the UI as SIMULATED.
// Replace with engine output once engine/decide.ts exists.

import type { OverlayTag, Parameter, Session, Vital } from '../types.ts'
import { demoVitals } from './vitalsSim.ts'

export const SESSION: Session = {
  file: 'ARED_MD112_SET2.thx',
  missionDay: 112,
  set: 2,
  rep: 7,
  reps: 10,
  loadKg: 68,
  nextLoadKg: 63,
  baselineSessions: 14,
  model: 'rehab priors v0.3',
  knownCause: 'EVA −1 d',
  cue: 'Knees out',
}

export const PARAMETERS: Parameter[] = [
  { name: 'R knee valgus', now: '9°', base: '3°', delta: '+6', flag: 'rehab' },
  { name: 'L knee valgus', now: '2°', base: '2°', delta: '0' },
  { name: 'Trunk lean', now: '4°', base: '3°', delta: '+1' },
  { name: 'Depth (hip ÷ knee height)', now: '0.92', base: '1.00', delta: '−0.08' },
  { name: 'L/R load', now: '46/54', base: '50/50', delta: '+4' },
]

export const OVERLAY_TAGS: OverlayTag[] = [
  // measured by MediaPipe on the photo in SimulatedCamera (2D angles; knee width = knee distance / ankle distance)
  { joint: 'rk', dx: 22, dy: 34, label: 'KNEE 100°' },
  { joint: 'lk', dx: 22, dy: 24, label: 'KNEES/ANKLES 0.95' },
  { joint: 'ls', dx: 22, dy: -14, label: 'TRUNK 16°' },
]

// Vitals mid-set (7 reps), from the simulator so the demo matches what the live view produces.
export const VITALS: Vital[] = demoVitals()
