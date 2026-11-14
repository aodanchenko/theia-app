import { test } from 'node:test'
import assert from 'node:assert/strict'
import { angle, kneeAngles, LM } from './features.js'

test('angle: straight line is 180, right angle is 90', () => {
  assert.equal(angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }), 180)
  assert.equal(Math.round(angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 })), 90)
})

test('kneeAngles: standing legs are straight', () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0, y: 0 }))
  lm[LM.L_HIP] = { x: 0.4, y: 0.5 }; lm[LM.L_KNEE] = { x: 0.4, y: 0.7 }; lm[LM.L_ANKLE] = { x: 0.4, y: 0.9 }
  lm[LM.R_HIP] = { x: 0.6, y: 0.5 }; lm[LM.R_KNEE] = { x: 0.6, y: 0.7 }; lm[LM.R_ANKLE] = { x: 0.6, y: 0.9 }
  assert.deepEqual(kneeAngles(lm), { left: 180, right: 180 })
})
