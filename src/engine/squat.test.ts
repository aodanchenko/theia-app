import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRepDetector, formMiss, MEDIAPIPE_NOISE, repFeatures, repsCsv, scoreRep, withNoise, type RepFeatures, type Skeleton, type Vec3 } from './squat.ts'
import { REHAB_MODEL } from './squatModel.ts'

const UP: Vec3 = [0, 0, 1]

// Front-facing person (x = left/right, z = up). `bend` 0..1 lowers the hips; `kneesIn` moves the knees towards each other.
function pose(bend: number, kneesIn = 0): Skeleton {
  const hipZ = 90 - 40 * bend, kneeY = 25 * bend
  return {
    lShoulder: [-20, 0, hipZ + 50], rShoulder: [20, 0, hipZ + 50],
    lHip: [-15, -kneeY, hipZ], rHip: [15, -kneeY, hipZ],
    lKnee: [-15 + kneesIn, kneeY, 45], rKnee: [15 - kneesIn, kneeY, 45],
    lAnkle: [-15, 0, 0], rAnkle: [15, 0, 0],
  }
}

test('repFeatures: deep, even squat has wide-enough knees and no asymmetry', () => {
  const f = repFeatures([pose(0), pose(1), pose(0)], UP)
  assert.ok(f.depth > 60, `depth ${f.depth}`)
  assert.equal(Math.round(f.kneeWidth * 100) / 100, 1)
  assert.ok(f.asymmetry < 1)
})

test('scoreRep: knees caving in against a personal baseline is flagged as knee width', () => {
  const good = repFeatures([pose(0), pose(1), pose(0)], UP)
  const bad = repFeatures([pose(0), pose(1, 8), pose(0)], UP)
  const s = scoreRep(bad, REHAB_MODEL, good)
  assert.equal(s.worst, 'kneeWidth')
  assert.ok(s.score > 2, `score ${s.score}`)
  assert.ok(scoreRep(good, REHAB_MODEL, good).score <= 0)
  assert.equal(scoreRep(bad, withNoise(REHAB_MODEL, MEDIAPIPE_NOISE), good).worst, 'kneeWidth') // still caught with camera noise
})

test('createRepDetector: counts two squats, ignores a shallow dip', () => {
  const reps: RepFeatures[] = []
  const push = createRepDetector(UP, (f) => reps.push(f))
  const ramp = (to: number) => [0, 0.25, 0.5, 0.75, 1].map((t) => pose(to * t))
  // 0.22 ≈ 23° of knee bend: starts a rep but is too shallow to count
  for (const depth of [1, 0.22, 1]) for (const s of [...ramp(depth), ...ramp(depth).reverse()]) push(s)
  assert.equal(reps.length, 2)
})

test('repsCsv: baseline reps have no z, a knees-in rep is flagged by knee width', () => {
  const good = repFeatures([pose(0), pose(1), pose(0)], UP)
  const bad = repFeatures([pose(0), pose(1, 8), pose(0)], UP)
  const lines = repsCsv([good, good, good, bad], 3, REHAB_MODEL, 2).trim().split('\n')
  assert.equal(lines.length, 5)
  assert.equal(lines[0].split(',').length, lines[4].split(',').length)
  assert.match(lines[1], /^1,baseline,/)
  assert.match(lines[1], /,,$/)
  assert.match(lines[4], /^4,scored,.*,kneeWidth$/)
})

test('formMiss: names the measure past its correct-form limit, null for a correct rep', () => {
  const correct = { depth: 105, kneeWidth: 1.2, trunkLean: 34, asymmetry: 3 }
  assert.equal(formMiss(correct), null)
  assert.equal(formMiss({ ...correct, depth: 63 }), 'depth')
  assert.equal(formMiss({ ...correct, kneeWidth: 0.8, trunkLean: 46 }), 'kneeWidth') // 20% past beats 2% past
})
