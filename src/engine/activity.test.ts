import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createActivityTracker } from './activity.ts'
import type { Skeleton, Vec3 } from './squat.ts'

// Front view, y up. `bend` 0..1 lowers the hips and bends the knees.
function pose(bend: number): Skeleton {
  const hipY = 90 - 40 * bend, kneeZ = 25 * bend
  const p = (x: number, y: number, z = 0): Vec3 => [x, y, z]
  return { lShoulder: p(-20, hipY + 50), rShoulder: p(20, hipY + 50), lHip: p(-15, hipY, -kneeZ), rHip: p(15, hipY, -kneeZ), lKnee: p(-15, 45, kneeZ), rKnee: p(15, 45, kneeZ), lAnkle: p(-15, 0), rAnkle: p(15, 0) }
}

test('activity: standing → going down → holding → coming up → standing → away', () => {
  const track = createActivityTracker()
  const seen: string[] = []
  const bendAt = (t: number) => (t < 1000 ? 0 : t < 2000 ? (t - 1000) / 1000 : t < 3000 ? 1 : t < 4000 ? 1 - (t - 3000) / 1000 : 0)
  for (let t = 0; t <= 5000; t += 33) {
    const a = track(pose(bendAt(t)), t)
    if (seen.at(-1) !== a) seen.push(a)
  }
  for (let t = 5033; t <= 6000; t += 33) { const a = track(null, t); if (seen.at(-1) !== a) seen.push(a) }
  assert.deepEqual(seen, ['standing', 'goingDown', 'holding', 'comingUp', 'standing', 'away'])
})
