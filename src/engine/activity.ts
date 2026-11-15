// What the person is doing right now, from the knee angle over time: standing, going down, holding the bottom
// (squatting / sitting), coming up, or out of view. Plain TS, runs in Node.
import { TEXT, type Lang } from '../earthText.ts'
import type { EarthProfile } from '../types.ts'
import { kneeFlexion, type Skeleton } from './squat.ts'

export type Activity = 'away' | 'standing' | 'goingDown' | 'holding' | 'comingUp'

const BENT = 15 // degrees above the person's standing angle that count as bent
const SPEED = 25 // deg/s of knee change that counts as moving
const AWAY_MS = 600

export function createActivityTracker() {
  let standing = 35 // MediaPipe reads straight legs as ~25–35°; refined by the lowest angle seen
  let last: { flex: number; t: number } | null = null
  let speed = 0
  let seenAt = -Infinity
  return (s: Skeleton | null, t: number): Activity => {
    if (!s) return t - seenAt > AWAY_MS ? 'away' : last ? classify(last.flex) : 'away'
    seenAt = t
    const f = kneeFlexion(s)
    const flex = (f.left + f.right) / 2
    standing = Math.min(flex, standing + 0.05) // follows the straightest legs, drifts back slowly after an outlier
    if (last && t > last.t) speed = 0.7 * speed + 0.3 * ((flex - last.flex) / ((t - last.t) / 1000))
    last = { flex, t }
    return classify(flex)
  }
  function classify(flex: number): Activity {
    if (flex - standing < BENT) return 'standing'
    if (speed > SPEED) return 'goingDown'
    if (speed < -SPEED) return 'comingUp'
    return 'holding'
  }
}

export function activityLabel(a: Activity, position: EarthProfile['position'], lang: Lang = 'en'): string {
  const t = TEXT[lang]
  const own: Partial<Record<Activity, string>> = position === 'seated' ? t.activitySeated : position === 'lying' ? t.activityLying : {}
  return own[a] ?? t.activity[a]
}
