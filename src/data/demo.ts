// The camera-off demo: session metadata, the astronaut's set, and the tags on the photo.

import type { RepFeatures } from '../engine/squat.ts'
import type { OverlayTag, Session, Vital } from '../types.ts'
import { demoVitals } from './vitalsSim.ts'

export const SESSION: Session = {
  file: 'ARED_MD112_SET2.thx',
  missionDay: 112,
  loadKg: 68,
  baselineSessions: 14,
  knownCause: 'EVA −1 d',
}

// The astronaut in the camera photo (NASA S133-E-008323), measured like a live rep: MediaPipe Pose heavy world
// landmarks → fromMediaPipe → repFeatures. Knee bend, knee width and trunk are kept (his left knee is visibly inside
// his foot). The left–right gap is not: from a three-quarter view one camera misjudges the far leg (it read 22° on
// legs that look even), so it is set to his baseline. Same limit applies live: asymmetry needs a front-on camera.
export const PHOTO_REP: RepFeatures = { depth: 91, kneeWidth: 0.74, trunkLean: 28, asymmetry: 5 }

// SIMULATED reps 1–9 of the same set, so the photo rep has a baseline: reps 1–3 good, then the knees drift in as he
// tires. Rep 10 is the photo.
const sim = (depth: number, kneeWidth: number, trunkLean: number, asymmetry: number): RepFeatures => ({ depth, kneeWidth, trunkLean, asymmetry })
export const DEMO_REPS: RepFeatures[] = [
  sim(101, 1.05, 27, 5), sim(100, 1.03, 28, 6), sim(102, 1.06, 26, 4),
  sim(100, 1.03, 27, 5), sim(99, 1.0, 28, 6), sim(98, 0.96, 27, 5), sim(97, 0.92, 28, 6), sim(95, 0.86, 28, 5), sim(93, 0.8, 29, 6),
  PHOTO_REP,
]

// Tags on the photo, from the same measurement.
export const OVERLAY_TAGS: OverlayTag[] = [
  { joint: 'lk', dx: 22, dy: 24, label: 'KNEES/FEET 0.74', alert: true },
  { joint: 'rk', dx: 22, dy: 34, label: 'KNEE BEND 91°' },
  { joint: 'ls', dx: 22, dy: -14, label: 'TRUNK 28°' },
]

// Vitals mid-set (7 reps), from the simulator so the demo matches what the live view produces.
export const VITALS: Vital[] = demoVitals()
