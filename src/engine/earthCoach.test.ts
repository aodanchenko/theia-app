import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { EarthProfile } from '../types.ts'
import { cueFor, judgeLastRep, startHint } from './earthCoach.ts'
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
})
