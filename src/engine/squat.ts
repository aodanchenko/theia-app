// Squat rep features and scoring. Plain TS, no React or DOM: runs in Node (training script, tests) and the browser.
// Works on any 3D skeleton (Vicon markers, MediaPipe world landmarks): only angles and ratios, so units don't matter.

export type Vec3 = [number, number, number]

export interface Skeleton {
  lShoulder: Vec3; rShoulder: Vec3
  lHip: Vec3; rHip: Vec3
  lKnee: Vec3; rKnee: Vec3
  lAnkle: Vec3; rAnkle: Vec3
}

export interface RepFeatures {
  depth: number // knee flexion at the bottom, degrees (mean of both legs)
  kneeWidth: number // knee distance / ankle distance at the bottom; below normal = knees caving in
  trunkLean: number // trunk angle from vertical at the bottom, degrees
  asymmetry: number // |left − right| knee flexion at the bottom, degrees
}

export type FeatureKey = keyof RepFeatures
export type SquatModel = Record<FeatureKey, { mean: number; sd: number }>

export const FEATURES: FeatureKey[] = ['depth', 'kneeWidth', 'trunkLean', 'asymmetry']

// Which way is bad: +1 = too high is bad, −1 = too low is bad.
const BAD: Record<FeatureKey, 1 | -1> = { depth: -1, kneeWidth: -1, trunkLean: 1, asymmetry: 1 }

export const LABELS: Record<FeatureKey, string> = {
  depth: 'Depth (knee flexion)',
  kneeWidth: 'Knee/ankle width',
  trunkLean: 'Trunk lean',
  asymmetry: 'L/R asymmetry',
}

export const CUES: Record<FeatureKey, string> = {
  depth: 'Go deeper',
  kneeWidth: 'Knees out',
  trunkLean: 'Chest up',
  asymmetry: 'Even left and right',
}

// "Without rehab data": textbook guesses for a deep squat, no dataset behind them.
export const BASE_MODEL: SquatModel = {
  depth: { mean: 100, sd: 15 },
  kneeWidth: { mean: 1, sd: 0.1 },
  trunkLean: { mean: 30, sd: 10 },
  asymmetry: { mean: 0, sd: 5 },
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = (a: Vec3) => Math.sqrt(dot(a, a))
const mid = (a: Vec3, b: Vec3): Vec3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
const deg = (rad: number) => rad * 180 / Math.PI
const angleBetween = (u: Vec3, v: Vec3) => deg(Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (len(u) * len(v))))))

// Distance between a and b ignoring the vertical component.
function horizontal(a: Vec3, b: Vec3, up: Vec3): number {
  const d = sub(a, b)
  const h = dot(d, up) / dot(up, up)
  return len([d[0] - h * up[0], d[1] - h * up[1], d[2] - h * up[2]])
}

export function kneeFlexion(s: Skeleton): { left: number; right: number } {
  return {
    left: 180 - angleBetween(sub(s.lHip, s.lKnee), sub(s.lAnkle, s.lKnee)),
    right: 180 - angleBetween(sub(s.rHip, s.rKnee), sub(s.rAnkle, s.rKnee)),
  }
}

const meanFlexion = (s: Skeleton) => { const f = kneeFlexion(s); return (f.left + f.right) / 2 }

// Features of one rep, averaged over its bottom (frames within 10° of the deepest) to damp per-frame pose jitter.
// `up` is the vertical direction of the skeleton's coordinates.
export function repFeatures(frames: Skeleton[], up: Vec3): RepFeatures {
  if (frames.length === 0) throw new Error('repFeatures: empty rep')
  const deepest = Math.max(...frames.map(meanFlexion))
  return meanFeatures(frames.filter((s) => meanFlexion(s) >= deepest - 10).map((s) => frameFeatures(s, up)))
}

function frameFeatures(s: Skeleton, up: Vec3): RepFeatures {
  const f = kneeFlexion(s)
  return {
    depth: (f.left + f.right) / 2,
    kneeWidth: horizontal(s.lKnee, s.rKnee, up) / horizontal(s.lAnkle, s.rAnkle, up),
    trunkLean: angleBetween(sub(mid(s.lShoulder, s.rShoulder), mid(s.lHip, s.rHip)), up),
    asymmetry: Math.abs(f.left - f.right),
  }
}

export interface RepScore {
  score: number // worst one-sided z
  worst: FeatureKey
  z: Record<FeatureKey, number>
}

// One-sided z per feature against the model; `center` (a personal baseline) replaces the model means when given.
export function scoreRep(f: RepFeatures, model: SquatModel, center?: RepFeatures): RepScore {
  const z = {} as Record<FeatureKey, number>
  for (const k of FEATURES) z[k] = BAD[k] * (f[k] - (center ? center[k] : model[k].mean)) / model[k].sd
  const worst = FEATURES.reduce((a, b) => (z[b] > z[a] ? b : a))
  return { score: z[worst], worst, z }
}

export function meanFeatures(reps: RepFeatures[]): RepFeatures {
  const m = { depth: 0, kneeWidth: 0, trunkLean: 0, asymmetry: 0 }
  for (const r of reps) for (const k of FEATURES) m[k] += r[k] / reps.length
  return m
}

// MediaPipe's own jitter per feature: sd over 16 identical reps (same two NASA photos looped as a fake camera),
// doubled because a still photo is the best case for a live camera.
// shortcut: measured with the lite pose model; the app now runs full (less jitter), so this is conservative. Re-measure before tuning.
export const MEDIAPIPE_NOISE: RepFeatures = { depth: 2 * 2.7, kneeWidth: 2 * 0.061, trunkLean: 2 * 0.44, asymmetry: 2 * 1.5 }

// The rehab scale (lab markers) widened by camera noise: sd = √(sd_rehab² + noise²).
export function withNoise(model: SquatModel, noise: RepFeatures): SquatModel {
  const out = {} as SquatModel
  for (const k of FEATURES) out[k] = { mean: model[k].mean, sd: Math.hypot(model[k].sd, noise[k]) }
  return out
}

// MediaPipe Pose world landmarks: metres, origin between the hips, y points down.
export const MEDIAPIPE_UP: Vec3 = [0, -1, 0]
const MP = { lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28 } as const

// null when a hip or knee is not clearly visible. Ankles are not gated: in a deep squat MediaPipe reports ankle
// visibility ~0.1 even with the feet in view, so we take its estimate.
const GATED = new Set<keyof Skeleton>(['lHip', 'rHip', 'lKnee', 'rKnee'])
export function fromMediaPipe(lm: { x: number; y: number; z: number; visibility?: number }[]): Skeleton | null {
  const s = {} as Skeleton
  for (const [joint, i] of Object.entries(MP) as [keyof Skeleton, number][]) {
    const p = lm[i]
    if (!p || (GATED.has(joint) && (p.visibility ?? 1) < 0.5)) return null
    s[joint] = [p.x, p.y, p.z]
  }
  return s
}

// Splits a live stream of skeletons into squat reps by knee flexion, relative to the person's own standing angle
// (MediaPipe reads straight legs as ~25–30° in a front view, so fixed angles never see the rep end).
export function createRepDetector(up: Vec3, onRep: (f: RepFeatures, frames: Skeleton[]) => void) {
  const START = 20, END = 10, MIN_DEPTH = 30 // degrees above standing
  let standing = Infinity
  let frames: Skeleton[] = []
  return (s: Skeleton) => {
    const flex = meanFlexion(s)
    if (frames.length === 0) {
      standing = Math.min(flex, standing + 0.5) // follows the lowest recent angle, drifts up slowly if it was an outlier
      if (flex < standing + START) return
    }
    frames.push(s)
    if (flex >= standing + END) return
    const rep = frames
    frames = []
    if (Math.max(...rep.map(meanFlexion)) >= standing + MIN_DEPTH) onRep(repFeatures(rep, up), rep)
  }
}

// Rep log as CSV: the first `calibration` reps are the baseline, later reps carry their z per feature.
export function repsCsv(reps: RepFeatures[], calibration: number, model: SquatModel, threshold: number): string {
  const baseline = reps.length >= calibration ? meanFeatures(reps.slice(0, calibration)) : null
  const head = ['rep', 'phase', ...FEATURES, ...FEATURES.map((k) => `z_${k}`), 'worst_z', 'flagged']
  const rows = reps.map((f, i) => {
    const values = FEATURES.map((k) => f[k].toFixed(3))
    if (i < calibration || !baseline) return [i + 1, 'baseline', ...values, ...FEATURES.map(() => ''), '', '']
    const r = scoreRep(f, model, baseline)
    return [i + 1, 'scored', ...values, ...FEATURES.map((k) => r.z[k].toFixed(2)), r.score.toFixed(2), r.score > threshold ? r.worst : '']
  })
  return [head, ...rows].map((r) => r.join(',')).join('\n') + '\n'
}
