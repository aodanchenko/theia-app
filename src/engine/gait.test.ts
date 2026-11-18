import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { loadTcn, regionFeatures, wholeBody, scoredSeconds, type WalkWindow, sampleWindow, tcnForward, toPose17, type Pose17 } from './gait.ts'
import FIXTURE from './gait.fixture.json' with { type: 'json' }

const weights = loadTcn(readFileSync(new URL('./gait-tcn.bin', import.meta.url)).buffer as ArrayBuffer)
const at = (a: { shape: number[]; data: number[] }, ...ix: number[]) => a.data[ix.reduce((o, i, k) => o * a.shape[k] + i, 0)]

test('gait: the TS TCN reproduces the package replay fixture', () => {
  const [B, T, J] = FIXTURE.pose.shape
  for (let b = 0; b < B; b++) {
    const pose = Array.from({ length: T }, (_, t) => Array.from({ length: J }, (_, j) => [0, 1, 2, 3].map((c) => at(FIXTURE.pose, b, t, j, c))))
    const out = tcnForward(weights, pose, [0, 1, 2, 3, 4, 5, 6, 7].map((c) => at(FIXTURE.context, b, c)))
    out.classLogits.forEach((v, i) => assert.ok(Math.abs(v - at(FIXTURE.class_logits, b, i)) < 2e-4, `class ${b},${i}: ${v} vs ${at(FIXTURE.class_logits, b, i)}`))
    out.numeric.forEach((v, i) => assert.ok(Math.abs(v - at(FIXTURE.numeric, b, 0, i)) < 2e-4, `numeric ${b},${i}`))
    out.evaluabilityLogits.forEach((v, i) => assert.ok(Math.abs(v - at(FIXTURE.evaluability_logits, b, i)) < 2e-4, `evaluability ${b},${i}`))
  }
})

test('gait: the adapter keeps named sides, masks low-visibility joints (package checks)', () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }))
  lm[25] = { x: 0.25, y: 0.75, visibility: 1 }; lm[26] = { x: 0.75, y: 0.25, visibility: 1 }
  let p = toPose17(lm, 1280, 720)
  assert.deepEqual(p[5].slice(0, 2).map((v) => +v.toFixed(6)), [+(-320 / 360).toFixed(6), 0.5])
  assert.deepEqual(p[2].slice(0, 2).map((v) => +v.toFixed(6)), [+(320 / 360).toFixed(6), -0.5])
  lm[25] = { ...lm[25], visibility: 0.1 }
  p = toPose17(lm, 1280, 720)
  assert.deepEqual(p[5], [0, 0, 0])
})

test('gait: windows never borrow across a gap; a still person has zero knee range', () => {
  const times = Array.from({ length: 60 }, (_, i) => i / 30).filter((t) => t < 0.4 || t >= 0.6)
  const still: Pose17 = Array.from({ length: 17 }, (_, j) => [0, -0.5 + j * 0.05, 1])
  const w = sampleWindow(times, times.map(() => still), 0)
  assert.equal(w.length, 30)
  assert.ok(w.slice(12, 18).every((f) => f[0][2] === 0))
  const { values } = regionFeatures(w, 'side')
  assert.equal(values[3]?.[1], 0) // left knee: range (P95–P05)
})

test('gait: scored seconds never overlap and are not undercounted around unscored windows', () => {
  const scored = (start: number): WalkWindow => ({ start, view: 'side', criteria: [], regions: [{ region: 'trunk', state: 'within', percentile: 50, top: null, reasons: [] }] })
  const unscored = (start: number): WalkWindow => ({ start, view: null, criteria: [], regions: [] })
  const starts = scoredSeconds([scored(0), scored(0.5), unscored(1), scored(1.5), scored(2), scored(2.5)]).map((w) => w.start)
  assert.deepEqual(starts, [0, 1.5, 2.5])
})

test('gait: deviations become named compensations; the prosthetic knee and aid users are not flagged', async () => {
  const { compensationFor } = await import('./gait.ts')
  const region = (r: string, value: number, median: number, percentile = 99) => ({ region: r, state: 'deviation', percentile, top: { feature: 1, value, p05: 0, median, p95: median * 2 }, reasons: [] }) as never
  const who = { prosthesis: false, side: null, aid: false }
  const win = (view: 'side' | 'front_rear', ...regions: never[]): WalkWindow => ({ start: 0, view, regions, criteria: [] })
  assert.equal(compensationFor(win('front_rear', region('hips', 8, 3)), who)?.kind, 'hipHike')
  assert.equal(compensationFor(win('side', region('trunk', 12, 4)), who)?.kind, 'forwardLean')
  assert.equal(compensationFor(win('front_rear', region('trunk', 12, 4)), who)?.kind, 'sideLean')
  assert.deepEqual(compensationFor(win('side', region('left_knee', 12, 35)), who), { kind: 'stiffKnee', side: 'left', region: region('left_knee', 12, 35), strength: 0.99 })
  assert.equal(compensationFor(win('side', region('left_knee', 12, 35)), { prosthesis: true, side: 'left', aid: false }), null) // the prosthetic knee
  assert.equal(compensationFor(win('side', region('right_knee', 12, 35)), { prosthesis: true, side: 'left', aid: false })?.kind, 'stiffKnee') // the other knee still counts
  assert.equal(compensationFor(win('side', region('left_arm', 5, 20)), { ...who, aid: true }), null)
  assert.equal(compensationFor(win('side', region('right_knee', 60, 35)), who), null) // more knee bend: not a compensation we name
})

test('gait: walking is judged only with the whole body in view', () => {
  const body: Pose17 = Array.from({ length: 17 }, (_, j) => [0, -0.5 + j * 0.05, 1])
  const noLegs: Pose17 = body.map((j, i) => ([2, 3, 5, 6].includes(i) ? [0, 0, 0] : j)) // knees and ankles out of frame
  assert.equal(wholeBody(Array(30).fill(body)), 1)
  assert.equal(wholeBody(Array(30).fill(noLegs)), 0)
  const prosthesis: Pose17 = body.map((j, i) => ([5, 6].includes(i) ? [0, 0, 0] : j)) // left knee and ankle read poorly
  assert.equal(wholeBody(Array(30).fill(prosthesis)), 1)
})
