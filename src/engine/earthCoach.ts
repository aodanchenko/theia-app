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

export const SET_REPS = 10
export const STREAK = 5 // on-target reps in a row that earn the streak sound

// Which feedback sound a just-finished rep gets, from all results so far.
export function soundFor(results: NoteKind[]): 'good' | 'fix' | 'baseline' | 'streak' | 'done' | null {
  const n = results.length
  if (n === 0) return null
  if (n >= SET_REPS) return 'done'
  const last = results[n - 1]
  if (last === 'learn') return n === CALIBRATION ? 'baseline' : null
  if (last === 'fix') return 'fix'
  let run = 0
  for (let k = n - 1; k >= 0 && results[k] === 'good'; k--) run++
  return run > 0 && run % STREAK === 0 ? 'streak' : 'good'
}

export type NoteKind = 'idle' | 'learn' | 'good' | 'fix' | 'done'

// The result of each rep so far, for the segmented bar and the summary.
export function repResults(reps: RepFeatures[], model: SquatModel, threshold: number): NoteKind[] {
  return reps.map((_, i) => {
    const v = judgeLastRep(reps.slice(0, i + 1), model, threshold)
    return v.kind === 'learning' ? 'learn' : v.kind
  })
}

// The note under the camera after a rep, in an instructor's plain words.
export function noteFor(v: Verdict, rep: number, p: EarthProfile): { kind: NoteKind; title: string; line: string } {
  if (v.kind === 'learning') return { kind: 'learn', title: `Rep ${rep} · Learning your normal`, line: `${v.done} of ${CALIBRATION}. Move the way you usually do.` }
  if (v.kind === 'good') return { kind: 'good', title: `Rep ${rep} · On target`, line: 'Same as your normal.' }
  const c = cueFor(v, p)
  return { kind: 'fix', title: c.title, line: `Rep ${rep} · ${c.hint}.` }
}

// Where a mark goes on the body (MediaPipe landmark indices, averaged) and what it says.
// Arrows are for the mirrored selfie view: the person's right is on the screen's right.
export function markFor(v: Verdict, p: EarthProfile): { joints: number[]; label: string; arrow: 'left' | 'right' | 'up' | 'down' | null }[] {
  if (v.kind === 'good') return [{ joints: [23, 24], label: 'On target', arrow: null }]
  if (v.kind !== 'fix') return []
  const knee = (side: 'left' | 'right') => ({ joints: [side === 'left' ? 25 : 26], label: 'Knee out', arrow: side === 'left' ? 'left' as const : 'right' as const })
  const sides = p.side === 'left' || p.side === 'right' ? [p.side] : (['left', 'right'] as const)
  return {
    kneeWidth: sides.map(knee),
    trunkLean: [{ joints: [11, 12], label: 'Chest up', arrow: 'up' as const }],
    depth: [{ joints: [23, 24], label: p.position === 'seated' ? 'Slower' : 'Lower', arrow: 'down' as const }],
    asymmetry: sides.map((side) => ({ joints: [side === 'left' ? 25 : 26], label: `Use this leg`, arrow: null })),
  }[v.feature]
}
