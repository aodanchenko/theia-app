// Learns "normal squat" from UI-PRMD and checks it on held-out people. Writes src/engine/squatModel.ts.
// Usage: node scripts/train-squat.ts <UI-PRMD dir with "Segmented Movements" and "Incorrect Segmented Movements">
// Data: UI-PRMD (Vakanski et al. 2018, Data 3(1):2), PDDL 1.0, https://doi.org/10.5281/zenodo.23104965
// Uses movement m01 (deep squat), Vicon positions: 39 Plug-in-Gait markers × xyz in mm, z up.

import fs from 'node:fs'
import path from 'node:path'
import { BASE_MODEL, FEATURES, meanFeatures, repFeatures, scoreRep, type RepFeatures, type Skeleton, type SquatModel, type Vec3 } from '../src/engine/squat.ts'

const root = process.argv[2]
if (!root) throw new Error('usage: node scripts/train-squat.ts <UI-PRMD dir>')

// Plug-in-Gait markers: hip = mean of front (ASI) and back (PSI) pelvis markers; knee and ankle are lateral markers.
const M = { LSHO: 9, RSHO: 16, LASI: 23, RASI: 24, LPSI: 25, RPSI: 26, LKNE: 28, LANK: 30, RKNE: 34, RANK: 36 }
const UP: Vec3 = [0, 0, 1]
const FALSE_ALERTS = 0.1
const FIXED_Z = 2

interface Rep { subject: string; correct: boolean; f: RepFeatures }

function readReps(dir: string, correct: boolean): Rep[] {
  const folder = path.join(root, dir, 'Vicon', 'Positions')
  return fs.readdirSync(folder).filter((n) => n.startsWith('m01_')).map((name) => {
    const frames = fs.readFileSync(path.join(folder, name), 'utf8').trim().split('\n').map((line) => {
      const v = line.split(',').map(Number)
      const p = (i: number): Vec3 => [v[3 * i], v[3 * i + 1], v[3 * i + 2]]
      const hip = (a: number, b: number): Vec3 => { const x = p(a), y = p(b); return [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2, (x[2] + y[2]) / 2] }
      const s: Skeleton = {
        lShoulder: p(M.LSHO), rShoulder: p(M.RSHO),
        lHip: hip(M.LASI, M.LPSI), rHip: hip(M.RASI, M.RPSI),
        lKnee: p(M.LKNE), rKnee: p(M.RKNE),
        lAnkle: p(M.LANK), rAnkle: p(M.RANK),
      }
      return s
    })
    return { subject: name.split('_')[1], correct, f: repFeatures(frames, UP) }
  })
}

function fit(reps: RepFeatures[]): SquatModel {
  const m = meanFeatures(reps)
  const model = {} as SquatModel
  for (const k of FEATURES) {
    const sd = Math.sqrt(reps.reduce((s, r) => s + (r[k] - m[k]) ** 2, 0) / (reps.length - 1))
    model[k] = { mean: +m[k].toFixed(3), sd: +sd.toFixed(3) }
  }
  return model
}

// Rehab data as "how much one person's squat varies from rep to rep": spread of correct reps around each person's own mean.
function fitWithin(list: Rep[]): SquatModel {
  const model = fit(list.map((r) => r.f))
  const byPerson = new Map<string, Rep[]>()
  for (const r of list) byPerson.set(r.subject, [...(byPerson.get(r.subject) ?? []), r])
  for (const k of FEATURES) {
    let ss = 0, n = 0
    for (const own of byPerson.values()) {
      const m = meanFeatures(own.map((r) => r.f))
      for (const r of own) ss += (r.f[k] - m[k]) ** 2
      n += own.length - 1
    }
    model[k].sd = +Math.sqrt(ss / n).toFixed(3)
  }
  return model
}

const reps = [...readReps('Segmented Movements', true), ...readReps('Incorrect Segmented Movements', false)]
const subjects = [...new Set(reps.map((r) => r.subject))].sort()

// Leave one subject out: the scored person never contributes to the population model.
type Method = 'base' | 'rehab' | 'personalBase' | 'personal'
const scores: Record<Method, { correct: boolean; score: number }[]> = { base: [], rehab: [], personalBase: [], personal: [] }
const flaggedBy: Record<string, number> = {}
for (const s of subjects) {
  const others = reps.filter((r) => r.correct && r.subject !== s)
  const model = fit(others.map((r) => r.f))
  const within = fitWithin(others)
  const own = reps.filter((r) => r.subject === s)
  const ownCorrect = own.filter((r) => r.correct)
  for (const r of own) {
    // Personal baseline = this person's other correct reps (never the rep being scored).
    const center = meanFeatures(ownCorrect.filter((c) => c !== r).map((c) => c.f))
    scores.base.push({ correct: r.correct, score: scoreRep(r.f, BASE_MODEL).score })
    scores.rehab.push({ correct: r.correct, score: scoreRep(r.f, model).score })
    scores.personalBase.push({ correct: r.correct, score: scoreRep(r.f, BASE_MODEL, center).score })
    const p = scoreRep(r.f, within, center)
    scores.personal.push({ correct: r.correct, score: p.score })
    if (!r.correct) flaggedBy[p.worst] = (flaggedBy[p.worst] ?? 0) + 1
  }
}

function summary(list: { correct: boolean; score: number }[]) {
  const ok = list.filter((x) => x.correct).map((x) => x.score).sort((a, b) => a - b)
  const bad = list.filter((x) => !x.correct).map((x) => x.score)
  const threshold = ok[Math.ceil(ok.length * (1 - FALSE_ALERTS)) - 1]
  let wins = 0
  for (const b of bad) for (const o of ok) wins += b > o ? 1 : b === o ? 0.5 : 0
  return {
    threshold: +threshold.toFixed(3),
    caught: +(bad.filter((b) => b > threshold).length / bad.length).toFixed(3),
    falseAlerts: +(ok.filter((o) => o > threshold).length / ok.length).toFixed(3),
    auroc: +(wins / (bad.length * ok.length)).toFixed(3),
    // Untuned: a fixed 2-sd threshold, as it would run for a new person with no labelled bad reps.
    at2sd: {
      caught: +(bad.filter((b) => b > FIXED_Z).length / bad.length).toFixed(3),
      falseAlerts: +(ok.filter((o) => o > FIXED_Z).length / ok.length).toFixed(3),
    },
  }
}

const result = {
  dataset: 'UI-PRMD deep squat (Vicon), PDDL 1.0',
  subjects: subjects.length,
  correctReps: reps.filter((r) => r.correct).length,
  incorrectReps: reps.filter((r) => !r.correct).length,
  falseAlertRate: FALSE_ALERTS,
  base: summary(scores.base),
  rehab: summary(scores.rehab),
  personalBase: summary(scores.personalBase),
  personal: summary(scores.personal),
}
const model = fitWithin(reps.filter((r) => r.correct))

// The ideal squat: the median of every correct rep (the cue's "aim for").
const median = (xs: number[]) => { const v = [...xs].sort((a, b) => a - b); return (v[(v.length - 1) >> 1] + v[v.length >> 1]) / 2 }
const ideal = Object.fromEntries(FEATURES.map((k) => [k, +median(reps.filter((r) => r.correct).map((r) => r.f[k])).toFixed(2)]))

const out = `// Generated by scripts/train-squat.ts from UI-PRMD (Vakanski et al. 2018, PDDL 1.0). Do not edit by hand.
import type { RepFeatures, SquatModel } from './squat.ts'

// Learned from all ${result.correctReps} correct reps of ${result.subjects} people. mean = population normal (used until the
// person has a baseline); sd = how much one person's own correct reps vary (the scale for the personal baseline).
export const REHAB_MODEL: SquatModel = ${JSON.stringify(model, null, 2)}

// Leave-one-person-out check on ${result.correctReps} correct + ${result.incorrectReps} incorrect reps.
// Each method's threshold is set so it raises ${FALSE_ALERTS * 100}% false alerts on correct reps; "caught" = share of incorrect reps flagged.
export const EVAL = ${JSON.stringify(result, null, 2)}

// Median of all ${result.correctReps} correct reps: what a correct deep squat looks like (Vicon markers).
export const IDEAL: RepFeatures = ${JSON.stringify(ideal, null, 2)}
`
fs.writeFileSync(new URL('../src/engine/squatModel.ts', import.meta.url), out)
console.log(JSON.stringify(result, null, 2))
console.log('incorrect reps by worst feature (rehab + personal):', flaggedBy)
