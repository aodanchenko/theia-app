// Earth coaching: turns rep scores into one plain-language instruction, using the person's "About you" answers.
// Plain TS, runs in Node.
import type { EarthProfile } from '../types.ts'
import { meanFeatures, scoreRep, type FeatureKey, type RepFeatures, type SquatModel } from './squat.ts'

export const CALIBRATION = 3 // first reps of a session = the person's normal

export type Verdict = { kind: 'learning'; done: number } | { kind: 'good' } | { kind: 'fix'; feature: FeatureKey }

export function judgeLastRep(reps: RepFeatures[], model: SquatModel, threshold: number): Verdict {
  if (reps.length <= CALIBRATION) return { kind: 'learning', done: reps.length }
  const r = scoreRep(reps[reps.length - 1], model, meanFeatures(reps.slice(0, CALIBRATION)))
  return r.score > threshold ? { kind: 'fix', feature: r.worst } : { kind: 'good' }
}

const sideWord = (p: EarthProfile) => (p.side === 'left' || p.side === 'right' ? p.side : null)

// One short instruction + a hint, spoken as-is when voice is on.
export function cueFor(v: Verdict, p: EarthProfile): { title: string; hint: string } {
  const side = sideWord(p)
  if (v.kind === 'learning') return { title: 'Keep going', hint: `Learning your normal · ${v.done} of ${CALIBRATION}` }
  if (v.kind === 'good') return { title: 'Good rep', hint: 'Just like your normal' }
  return {
    depth: { title: p.position === 'seated' ? 'Lower more slowly' : 'Bend a little deeper', hint: 'Only as far as feels steady' },
    kneeWidth: { title: side ? `Push your ${side} knee out` : 'Push your knees out', hint: 'Knees over your toes' },
    trunkLean: { title: 'Keep your chest up', hint: 'Look straight ahead' },
    asymmetry: { title: side ? `Use your ${side} leg too` : 'Use both legs evenly', hint: 'Share the weight' },
  }[v.feature]
}

// The first instruction on the camera screen, before any movement.
export function startHint(p: EarthProfile): string {
  const move = p.position === 'seated' ? 'Sit tall, then stand up and sit down slowly.' : 'Stand tall, then bend your knees and come up slowly.'
  const support = p.aid ? ' Keep your support within reach.' : p.prosthesis ? ' Go only as deep as feels steady.' : ''
  return move + support
}
