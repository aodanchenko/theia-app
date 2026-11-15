import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { EarthProfile } from '../types.ts'
import { cueFor, judgeLastRep, markFor, noteFor, repResults, soundFor, startHint } from './earthCoach.ts'
import { REHAB_MODEL } from './squatModel.ts'

const P: EarthProfile = { side: 'right', prosthesis: false, aid: true, position: 'standing', voice: true, bigText: false }
const rep = (kneeWidth: number) => ({ depth: 100, kneeWidth, trunkLean: 30, asymmetry: 3 })

test('earthCoach: first reps learn the normal, then a knees-in rep asks for the affected knee', () => {
  assert.deepEqual(judgeLastRep([rep(1.2), rep(1.2)], REHAB_MODEL, 2), { kind: 'learning', done: 2 })
  assert.deepEqual(judgeLastRep([rep(1.2), rep(1.2), rep(1.2), rep(1.2)], REHAB_MODEL, 2), { kind: 'good' })
  const v = judgeLastRep([rep(1.2), rep(1.2), rep(1.2), rep(1.0)], REHAB_MODEL, 2)
  assert.deepEqual(v, { kind: 'fix', feature: 'kneeWidth' })
  assert.equal(cueFor(v, P).title, 'Push your right knee out')
  assert.equal(cueFor(v, { ...P, side: 'unsure' }).title, 'Push your knees out')
})

test('earthCoach: the start hint follows seated/standing and the walking aid', () => {
  assert.match(startHint(P), /bend your knees.*support within reach/)
  assert.match(startHint({ ...P, position: 'seated', aid: false }), /^Sit tall/)
  assert.match(startHint({ ...P, position: 'lying', aid: false }), /^Lie on your back/)
})

test('earthCoach: notes read like an instructor, marks sit on the affected joint', () => {
  assert.equal(noteFor({ kind: 'good' }, 4, P).title, 'Rep 4 · On target')
  assert.equal(noteFor({ kind: 'learning', done: 2 }, 2, P).line, '2 of 3. Move the way you usually do.')
  assert.deepEqual(markFor({ kind: 'fix', feature: 'kneeWidth' }, P), [{ joints: [26], label: 'Knee out', arrow: 'right' }])
  assert.equal(markFor({ kind: 'fix', feature: 'kneeWidth' }, { ...P, side: 'both' }).length, 2)
  assert.deepEqual(repResults([rep(1.2), rep(1.2), rep(1.2), rep(1.2), rep(1.0)], REHAB_MODEL, 2), ['learn', 'learn', 'learn', 'good', 'fix'])
})

test('earthCoach: sounds — quiet while learning, baseline at rep 3, streak every 5 on target, done at 10', () => {
  assert.equal(soundFor(['learn']), null)
  assert.equal(soundFor(['learn', 'learn', 'learn']), 'baseline')
  assert.equal(soundFor(['learn', 'learn', 'learn', 'good']), 'good')
  assert.equal(soundFor(['learn', 'learn', 'learn', 'fix']), 'fix')
  assert.equal(soundFor(['learn', 'learn', 'learn', 'good', 'good', 'good', 'good', 'good']), 'streak')
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
  const r = setReport([rep(1.2), rep(1.2), rep(1.2), rep(1.0), rep(1.2), rep(1.2), rep(1.0)], REHAB_MODEL, 2, P)
  assert.equal(r.scored, 4)
  assert.equal(r.good, 2)
  assert.equal(r.best, 2)
  assert.deepEqual(r.fix?.reps, [4, 7])
  assert.equal(r.fix?.title, 'Push your right knee out')
  assert.deepEqual(r.depth, { now: 100, normal: 100 })
  assert.equal(setReport([rep(1.2)], REHAB_MODEL, 2, P).fix, null)
})
