// One Euro filter (Casiez et al., CHI 2012) for pose landmarks: heavy smoothing when a joint is still (kills jitter),
// light smoothing when it moves fast (no lag). Plain TS, runs in Node.
export interface Landmark3 { x: number; y: number; z: number; visibility?: number }

export interface OneEuroOptions {
  minCutoff: number // Hz at rest: lower = smoother, laggier
  beta: number // how fast the cutoff opens with speed (Hz per unit/s)
  dCutoff: number // Hz for smoothing the speed estimate
  resetAfterMs: number // a gap this long (person lost) restarts the filter
}

// Tuned for normalized image coords and metres alike: a squat (~0.5 Hz) passes, frame jitter (~10 Hz) is damped.
export const POSE_SMOOTHING: OneEuroOptions = { minCutoff: 1.5, beta: 10, dCutoff: 1, resetAfterMs: 500 }

const alpha = (cutoff: number, dt: number) => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt))

export function createLandmarkSmoother(o: OneEuroOptions = POSE_SMOOTHING) {
  let prev: { x: number[]; dx: number[]; t: number } | null = null
  return <T extends Landmark3>(points: T[], tMs: number): T[] => {
    const raw = points.flatMap((p) => [p.x, p.y, p.z])
    if (!prev || prev.x.length !== raw.length || tMs - prev.t > o.resetAfterMs || tMs <= prev.t) {
      prev = { x: raw, dx: raw.map(() => 0), t: tMs }
      return points
    }
    const last = prev
    const dt = (tMs - last.t) / 1000
    const ad = alpha(o.dCutoff, dt)
    const dx = raw.map((v, i) => ad * ((v - last.x[i]) / dt) + (1 - ad) * last.dx[i])
    const x = raw.map((v, i) => { const a = alpha(o.minCutoff + o.beta * Math.abs(dx[i]), dt); return a * v + (1 - a) * last.x[i] })
    prev = { x, dx, t: tMs }
    return points.map((p, i) => ({ ...p, x: x[3 * i], y: x[3 * i + 1], z: x[3 * i + 2] }))
  }
}
