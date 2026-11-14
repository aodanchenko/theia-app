// Simulated demo session (ARED squat, set 2). Shown in the UI as SIMULATED.
// Replace with engine output once engine/decide.ts exists.

import type { Limits, OverlayTag, Parameter, Session, Vital } from '../types.ts'

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

// R knee valgus per completed rep, degrees.
export const VALGUS_BY_REP: number[] = [2, 3, 3, 4, 5, 7, 9]
export const VALGUS_LIMITS: Limits = { baseline: [2, 4], rehab: 6, base: 10 }

export const OVERLAY_TAGS: OverlayTag[] = [
  { joint: 'rk', dx: 20, dy: 4, label: 'KNEE 9°', alert: true },
  { joint: 'rh', dx: 16, dy: -6, label: 'HIP 94°' },
  { joint: 'rs', dx: 16, dy: 30, label: 'TRUNK 4°' },
]

// Smooth fake trend for sparklines: 12 points in 2..14, rising when `up`.
function trend(seed: number, up: boolean): number[] {
  let y = 8
  return Array.from({ length: 12 }, (_, i) => {
    y = Math.max(2, Math.min(14, y + (Math.sin(seed * 7 + i * 1.9) + (up ? 0.35 : -0.15)) * 2.2))
    return y
  })
}

export const VITALS: Vital[] = [
  { name: 'Heart rate', value: '128', unit: 'bpm', expected: 'exercise', trend: trend(1, true) },
  { name: 'HRV rMSSD', value: '38', unit: 'ms', expected: 'exercise', trend: trend(2, true) },
  { name: 'SpO2', value: '97', unit: '%', trend: trend(3, false) },
  { name: 'Resp rate', value: '24', unit: '/min', trend: trend(4, false) },
  { name: 'Core temp', value: '37.1', unit: '°C', trend: trend(5, false) },
  { name: 'BP (cuff, pre-set)', value: '131/84', unit: '', trend: trend(6, false) },
]
