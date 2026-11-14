import { test } from 'node:test'
import assert from 'node:assert/strict'
import { demoVitals, seeded, startSim, tick, toVitals } from './vitalsSim.ts'

const run = (reps: (t: number) => number, ms: number, episodes = false) => {
  const rand = seeded(1)
  let s = startSim(0, rand)
  for (let t = 500; t <= ms; t += 500) s = tick(s, t, reps(t), rand, episodes)
  return s
}

test('vitalsSim: heart rate rises with reps and falls back at rest', () => {
  const working = run((t) => Math.floor(t / 6000), 60000) // 10 reps in a minute
  assert.ok(working.value.hr > 110, `hr ${working.value.hr}`)
  const rested = run((t) => Math.min(10, Math.floor(t / 6000)), 240000) // then 3 minutes of rest
  assert.ok(rested.value.hr < working.value.hr - 25, `rested ${rested.value.hr} vs ${working.value.hr}`)
})

test('vitalsSim: high heart rate during exercise is expected, not flagged (known cause)', () => {
  const hr = toVitals(run((t) => Math.floor(t / 6000), 60000))[0]
  assert.equal(hr.status, 'expected')
  assert.equal(hr.cause, 'exercise')
})

test('vitalsSim: vitals update on their own periods, not all at once', () => {
  const s = startSim(0, seeded(3))
  const next = Object.values(s.next)
  assert.ok(new Set(next).size === next.length)
})

test('vitalsSim: demo is deterministic', () => {
  assert.deepEqual(demoVitals(), demoVitals())
})

test('vitalsSim: watch and flag happen, but rarely', () => {
  const rand = seeded(5)
  let s = startSim(0, rand)
  let samples = 0, off = 0, flags = 0
  for (let t = 500; t <= 30 * 60000; t += 500) { // 30 minutes, a rep every 6 s
    s = tick(s, t, Math.floor(t / 6000), rand)
    const statuses = toVitals(s).map((v) => v.status)
    samples++
    if (statuses.some((x) => x === 'watch' || x === 'flag')) off++
    if (statuses.includes('flag')) flags++
  }
  assert.ok(off > 0, 'expected at least one watch')
  assert.ok(off / samples < 0.15, `off-baseline ${Math.round((off / samples) * 100)}% of the time`)
  assert.ok(flags < off, 'flags rarer than watches')
})
