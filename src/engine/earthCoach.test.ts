import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { EarthProfile } from '../types.ts'
import { cueFor, judgeRep, markFor, noteFor, repResults, soundFor, startHint } from './earthCoach.ts'
import { BASE_MODEL } from './squat.ts'
import { EVAL } from './squatModel.ts'

const T = EVAL.base.threshold

const P: EarthProfile = { side: 'right', prosthesis: false, aid: true, position: 'standing', voice: true, bigText: false }
const rep = (kneeWidth: number) => ({ depth: 100, kneeWidth, trunkLean: 30, asymmetry: 3 })

test('earthCoach: every rep is judged against the common normal, so a compensation from rep 1 on is still caught', () => {
  assert.deepEqual(judgeRep(rep(1.2), P, BASE_MODEL, T), { kind: 'good' })
  const v = judgeRep(rep(0.8), P, BASE_MODEL, T)
  assert.deepEqual(v, { kind: 'fix', feature: 'kneeWidth' })
  assert.deepEqual(repResults([rep(0.8), rep(0.8), rep(0.8), rep(0.8)], P, BASE_MODEL, T), ['fix', 'fix', 'fix', 'fix']) // no baseline to absorb it
  assert.equal(cueFor(v, P).title, 'Push your right knee out')
  assert.equal(cueFor(v, { ...P, side: 'unsure' }).title, 'Push your knees out')
})

test('earthCoach: depth is not judged with a prosthesis or seated', () => {
  const shallow = { depth: 60, kneeWidth: 1.2, trunkLean: 30, asymmetry: 3 }
  assert.deepEqual(judgeRep(shallow, P, BASE_MODEL, T), { kind: 'fix', feature: 'depth' })
  assert.deepEqual(judgeRep(shallow, { ...P, prosthesis: true }, BASE_MODEL, T), { kind: 'good' })
  assert.deepEqual(judgeRep(shallow, { ...P, position: 'seated' }, BASE_MODEL, T), { kind: 'good' })
})

test('earthCoach: the start hint follows seated/standing and the walking aid', () => {
  assert.match(startHint(P), /bend your knees.*support within reach/)
  assert.match(startHint({ ...P, position: 'seated', aid: false }), /^Sit tall/)
  assert.match(startHint({ ...P, position: 'lying', aid: false }), /^Lie on your back/)
})

test('earthCoach: notes read like an instructor, marks sit on the affected joint', () => {
  assert.equal(noteFor({ kind: 'good' }, 4, P).title, 'Rep 4 · On target')
  assert.deepEqual(markFor({ kind: 'fix', feature: 'kneeWidth' }, P), [{ joints: [26], label: 'Knee out', arrow: 'right' }])
  assert.equal(markFor({ kind: 'fix', feature: 'kneeWidth' }, { ...P, side: 'both' }).length, 2)
})

test('earthCoach: sounds — good / fix from rep 1, streak every 5 on target, done at 10', () => {
  assert.equal(soundFor(['good']), 'good')
  assert.equal(soundFor(['good', 'fix']), 'fix')
  assert.equal(soundFor(['fix', 'good', 'good', 'good', 'good', 'good']), 'streak')
  assert.equal(soundFor(Array(10).fill('good')), 'done')
})

test('Ukrainian: same logic, Ukrainian words and the right grammatical side', () => {
  const v = { kind: 'fix', feature: 'kneeWidth' } as const
  assert.equal(cueFor(v, P, 'uk').title, 'Відведіть праве коліно назовні')
  assert.equal(cueFor({ kind: 'fix', feature: 'asymmetry' }, { ...P, side: 'left' }, 'uk').title, 'Навантажуйте й ліву ногу')
  assert.equal(noteFor({ kind: 'good' }, 4, P, 'uk').title, 'Повтор 4 · Правильно')
  assert.deepEqual(markFor(v, P, 'uk'), [{ joints: [26], label: 'Коліно назовні', arrow: 'right' }])
  assert.match(startHint(P, 'uk'), /^Станьте рівно.*опору під рукою/)
})

test('earthCoach: the set report counts on-target reps, the best run and the most common fix with its reps', async () => {
  const { setReport } = await import('./earthCoach.ts')
  const r = setReport([rep(1.2), rep(1.2), rep(1.2), rep(0.8), rep(1.2), rep(1.2), rep(0.8)], BASE_MODEL, T, P)
  assert.equal(r.scored, 7)
  assert.equal(r.good, 5)
  assert.equal(r.best, 3)
  assert.deepEqual(r.fix?.reps, [4, 7])
  assert.equal(r.fix?.title, 'Push your right knee out')
  assert.deepEqual(r.depth, { now: 100, normal: 100 })
  assert.equal(setReport([rep(1.2)], BASE_MODEL, T, P).fix, null)
})
