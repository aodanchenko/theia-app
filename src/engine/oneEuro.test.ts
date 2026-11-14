import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLandmarkSmoother } from './oneEuro.ts'

const FPS = 30
const sd = (xs: number[]) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) }
let seed = 1
const noise = () => { seed = (seed * 16807) % 2147483647; return (seed / 2147483647 - 0.5) * 0.02 } // ±1% of the frame

test('oneEuro: a still joint with frame jitter comes out much steadier', () => {
  const smooth = createLandmarkSmoother()
  const raw: number[] = [], out: number[] = []
  for (let f = 0; f < 120; f++) {
    const x = 0.5 + noise()
    raw.push(x)
    out.push(smooth([{ x, y: 0.5, z: 0 }], (f * 1000) / FPS)[0].x)
  }
  assert.ok(sd(out.slice(30)) < sd(raw.slice(30)) / 2, `raw ${sd(raw)} out ${sd(out)}`)
})

test('oneEuro: a squat-speed movement is followed with little lag', () => {
  const smooth = createLandmarkSmoother()
  let worst = 0
  for (let f = 0; f < 90; f++) {
    const t = f / FPS
    const y = 0.5 + 0.15 * Math.sin(2 * Math.PI * 0.5 * t) // hips going down and up every 2 s
    const got = smooth([{ x: 0.5, y, z: 0 }], t * 1000)[0].y
    if (f > 10) worst = Math.max(worst, Math.abs(got - y))
  }
  assert.ok(worst < 0.03, `max error ${worst}`)
})

test('oneEuro: restarts after the person is lost for a while', () => {
  const smooth = createLandmarkSmoother()
  smooth([{ x: 0.2, y: 0.2, z: 0 }], 0)
  smooth([{ x: 0.2, y: 0.2, z: 0 }], 33)
  const after = smooth([{ x: 0.8, y: 0.8, z: 0, visibility: 0.9 }], 2000)[0]
  assert.equal(after.x, 0.8)
  assert.equal(after.visibility, 0.9)
})
