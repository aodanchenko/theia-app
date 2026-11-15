// Earth coaching: turns rep scores into one plain-language instruction, using the person's "About you" answers.
// Plain TS, runs in Node.
import { TEXT, type Lang } from '../earthText.ts'
import type { EarthProfile } from '../types.ts'
import { FEATURES, meanFeatures, scoreRep, type FeatureKey, type RepFeatures, type SquatModel } from './squat.ts'

export type Verdict = { kind: 'good' } | { kind: 'fix'; feature: FeatureKey }

// Each rep against the common normal (`model` = the textbook squat; no personal baseline, so a compensation the person
// already has is still caught). Depth is not judged with a prosthesis or seated / lying: their range is their own, and
// About you promises not to push them deeper.
export function judgeRep(f: RepFeatures, p: EarthProfile, model: SquatModel, threshold: number): Verdict {
  const { z } = scoreRep(f, model)
  const judged = FEATURES.filter((k) => k !== 'depth' || (p.position === 'standing' && !p.prosthesis))
  const worst = judged.reduce((a, b) => (z[b] > z[a] ? b : a))
  return z[worst] > threshold ? { kind: 'fix', feature: worst } : { kind: 'good' }
}

const sideWord = (p: EarthProfile) => (p.side === 'left' || p.side === 'right' ? p.side : null)

// One short instruction + a hint, spoken as-is when voice is on.
export function cueFor(v: Verdict, p: EarthProfile, lang: Lang = 'en'): { title: string; hint: string } {
  const t = TEXT[lang], side = sideWord(p)
  if (v.kind === 'good') return { title: t.goodRep, hint: t.likeNormal }
  return {
    depth: { title: p.position === 'standing' ? t.deeper : t.slower, hint: t.steady },
    kneeWidth: { title: t.kneeOut(side), hint: t.kneesOverToes },
    trunkLean: { title: t.chestUp, hint: t.lookAhead },
    asymmetry: { title: t.useLeg(side), hint: t.shareWeight },
  }[v.feature]
}

// The first instruction on the camera screen, before any movement.
export function startHint(p: EarthProfile, lang: Lang = 'en'): string {
  const t = TEXT[lang]
  const move = { seated: t.startSeated, standing: t.startStanding, lying: t.startLying }[p.position]
  const support = p.aid ? t.keepSupport : p.prosthesis ? t.onlySteady : ''
  return move + support
}

export const SET_REPS = 10
export const STREAK = 5 // on-target reps in a row that earn the streak sound

// Which feedback sound a just-finished rep gets, from all results so far.
export function soundFor(results: NoteKind[]): 'good' | 'fix' | 'streak' | 'done' | null {
  const n = results.length
  if (n === 0) return null
  if (n >= SET_REPS) return 'done'
  const last = results[n - 1]
  if (last === 'fix') return 'fix'
  let run = 0
  for (let k = n - 1; k >= 0 && results[k] === 'good'; k--) run++
  return run > 0 && run % STREAK === 0 ? 'streak' : 'good'
}

export type NoteKind = 'idle' | 'good' | 'fix' | 'done'

// The result of each rep so far, for the segmented bar and the summary.
export function repResults(reps: RepFeatures[], p: EarthProfile, model: SquatModel, threshold: number): NoteKind[] {
  return reps.map((f) => judgeRep(f, p, model, threshold).kind)
}

// The note under the camera after a rep, in an instructor's plain words.
export function noteFor(v: Verdict, rep: number, p: EarthProfile, lang: Lang = 'en'): { kind: NoteKind; title: string; line: string } {
  const t = TEXT[lang]
  if (v.kind === 'good') return { kind: 'good', title: `${t.rep(rep)} · ${t.onTarget}`, line: t.sameAsNormal }
  const c = cueFor(v, p, lang)
  return { kind: 'fix', title: c.title, line: `${t.rep(rep)} · ${c.hint}.` }
}

// Where a mark goes on the body (MediaPipe landmark indices, averaged) and what it says.
// Arrows are for the mirrored selfie view: the person's right is on the screen's right.
export function markFor(v: Verdict, p: EarthProfile, lang: Lang = 'en'): { joints: number[]; label: string; arrow: 'left' | 'right' | 'up' | 'down' | null }[] {
  const t = TEXT[lang]
  if (v.kind === 'good') return [{ joints: [23, 24], label: t.onTarget, arrow: null }]
  const knee = (side: 'left' | 'right') => ({ joints: [side === 'left' ? 25 : 26], label: t.markKnee, arrow: side === 'left' ? 'left' as const : 'right' as const })
  const sides = p.side === 'left' || p.side === 'right' ? [p.side] : (['left', 'right'] as const)
  return {
    kneeWidth: sides.map(knee),
    trunkLean: [{ joints: [11, 12], label: t.markChest, arrow: 'up' as const }],
    depth: [{ joints: [23, 24], label: p.position === 'standing' ? t.markLower : t.markSlower, arrow: 'down' as const }],
    asymmetry: sides.map((side) => ({ joints: [side === 'left' ? 25 : 26], label: t.markLeg, arrow: null })),
  }[v.feature]
}

// Feedback on the set so far, shown while paused and when the set is done: how many reps were on target, the best run,
// the fix that came up most (with the reps it came up on), and knee bend against the common normal.
export function setReport(reps: RepFeatures[], model: SquatModel, threshold: number, p: EarthProfile, lang: Lang = 'en') {
  const results = repResults(reps, p, model, threshold)
  const scored = results.length
  const good = results.filter((r) => r === 'good').length
  let best = 0, run = 0
  for (const r of results) { run = r === 'good' ? run + 1 : 0; best = Math.max(best, run) }
  const fixes = reps.flatMap((f, i) => { const v = judgeRep(f, p, model, threshold); return v.kind === 'fix' ? [{ v, rep: i + 1 }] : [] })
  const repsOf = (f: FeatureKey) => fixes.filter((x) => x.v.feature === f).map((x) => x.rep)
  const top = fixes.reduce<(typeof fixes)[number] | null>((a, x) => (!a || repsOf(x.v.feature).length >= repsOf(a.v.feature).length ? x : a), null) // ties: the latest
  const fix = top ? { verdict: top.v, title: cueFor(top.v, p, lang).title, reps: repsOf(top.v.feature) } : null
  const depth = reps.length ? { now: Math.round(meanFeatures(reps).depth), normal: Math.round(model.depth.mean) } : null
  return { scored, good, best, fix, depth }
}
