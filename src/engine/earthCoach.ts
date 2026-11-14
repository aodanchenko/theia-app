// Earth coaching: turns rep scores into one plain-language instruction, using the person's "About you" answers.
// Plain TS, runs in Node.
import { TEXT, type Lang } from '../earthText.ts'
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
export function cueFor(v: Verdict, p: EarthProfile, lang: Lang = 'en'): { title: string; hint: string } {
  const t = TEXT[lang], side = sideWord(p)
  if (v.kind === 'learning') return { title: t.keepGoing, hint: t.learning(v.done, CALIBRATION) }
  if (v.kind === 'good') return { title: t.goodRep, hint: t.likeNormal }
  return {
    depth: { title: p.position === 'seated' ? t.slower : t.deeper, hint: t.steady },
    kneeWidth: { title: t.kneeOut(side), hint: t.kneesOverToes },
    trunkLean: { title: t.chestUp, hint: t.lookAhead },
    asymmetry: { title: t.useLeg(side), hint: t.shareWeight },
  }[v.feature]
}

// The first instruction on the camera screen, before any movement.
export function startHint(p: EarthProfile, lang: Lang = 'en'): string {
  const t = TEXT[lang]
  const move = p.position === 'seated' ? t.startSeated : t.startStanding
  const support = p.aid ? t.keepSupport : p.prosthesis ? t.onlySteady : ''
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
export function noteFor(v: Verdict, rep: number, p: EarthProfile, lang: Lang = 'en'): { kind: NoteKind; title: string; line: string } {
  const t = TEXT[lang]
  if (v.kind === 'learning') return { kind: 'learn', title: `${t.rep(rep)} · ${t.learningNormal}`, line: t.learningLine(v.done, CALIBRATION) }
  if (v.kind === 'good') return { kind: 'good', title: `${t.rep(rep)} · ${t.onTarget}`, line: t.sameAsNormal }
  const c = cueFor(v, p, lang)
  return { kind: 'fix', title: c.title, line: `${t.rep(rep)} · ${c.hint}.` }
}

// Where a mark goes on the body (MediaPipe landmark indices, averaged) and what it says.
// Arrows are for the mirrored selfie view: the person's right is on the screen's right.
export function markFor(v: Verdict, p: EarthProfile, lang: Lang = 'en'): { joints: number[]; label: string; arrow: 'left' | 'right' | 'up' | 'down' | null }[] {
  const t = TEXT[lang]
  if (v.kind === 'good') return [{ joints: [23, 24], label: t.onTarget, arrow: null }]
  if (v.kind !== 'fix') return []
  const knee = (side: 'left' | 'right') => ({ joints: [side === 'left' ? 25 : 26], label: t.markKnee, arrow: side === 'left' ? 'left' as const : 'right' as const })
  const sides = p.side === 'left' || p.side === 'right' ? [p.side] : (['left', 'right'] as const)
  return {
    kneeWidth: sides.map(knee),
    trunkLean: [{ joints: [11, 12], label: t.markChest, arrow: 'up' as const }],
    depth: [{ joints: [23, 24], label: p.position === 'seated' ? t.markSlower : t.markLower, arrow: 'down' as const }],
    asymmetry: sides.map((side) => ({ joints: [side === 'left' ? 25 : 26], label: t.markLeg, arrow: null })),
  }[v.feature]
}
