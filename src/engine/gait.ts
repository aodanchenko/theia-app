// Walking: port of the Theia MediaPipe standalone package (scripts/export-gait.py brings its frozen models in).
// MediaPipe 33 landmarks → the H36M-style 17-joint image-plane pose → 1 s windows of 30 samples at 30 Hz, every 0.5 s →
// (a) the regional density model: 4 angle features per body region, ranked against a reference walking population;
// (b) the TCN: automatic pose-derived criteria (e.g. knee range high/low, knee asymmetry), with its own evaluability gate.
// Both were developed on Sapiens2 poses: with MediaPipe they are EXPERIMENTAL (no validated accuracy). Plain TS, runs in Node.
import MODELS from './gaitModels.json' with { type: 'json' }

export type View = 'side' | 'front_rear'
export type Pose17 = [x: number, y: number, conf: number][] // 17 joints, (pixel − centre) / (min(W, H) / 2); conf 0 = missing
export const H17 = ['pelvis', 'right_hip', 'right_knee', 'right_ankle', 'left_hip', 'left_knee', 'left_ankle', 'spine', 'thorax', 'nose', 'head', 'left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'] as const
const MAP = [[23, 24], [24], [26], [28], [23], [25], [27], [23, 24, 11, 12], [11, 12], [0], [2, 5], [11], [13], [15], [12], [14], [16]]
export const FRAMES = 30
export const WINDOW_S = 1
export const STRIDE_S = 0.5

// ---------- MediaPipe → 17 joints ----------
// JS landmarks carry visibility only (Python used min(visibility, presence)).
export function toPose17(lm: { x: number; y: number; visibility?: number }[], width: number, height: number, minimum = 0.5): Pose17 {
  const half = Math.min(width, height) / 2
  const ok = (i: number) => { const l = lm[i]; return !!l && Number.isFinite(l.x) && Number.isFinite(l.y) && (l.visibility ?? 0) >= minimum && l.x >= 0 && l.x <= 1 && l.y >= 0 && l.y <= 1 }
  return MAP.map((src) => {
    if (!src.every(ok)) return [0, 0, 0]
    const x = src.reduce((a, i) => a + lm[i].x * width, 0) / src.length, y = src.reduce((a, i) => a + lm[i].y * height, 0) / src.length
    return [(x - width / 2) / half, (y - height / 2) / half, Math.min(...src.map((i) => lm[i].visibility ?? 0))]
  })
}

// Camera view from the pose, since the phone does not know it: shoulders wide relative to the torso = facing the camera.
// shortcut: a fixed ratio rule, not the package's user-supplied view; ambiguous angles return null (assessments unavailable).
export function guessView(p: Pose17[]): View | null {
  const r = p.filter((f) => f[11][2] && f[14][2] && f[0][2] && f[8][2]).map((f) => Math.abs(f[11][0] - f[14][0]) / Math.max(Math.hypot(f[0][0] - f[8][0], f[0][1] - f[8][1]), 1e-6))
  if (r.length < FRAMES / 2) return null
  const m = median(r)
  return m < 0.35 ? 'side' : m > 0.55 ? 'front_rear' : null
}

// ---------- windows ----------
// 30 nearest samples at 30 Hz inside [start, start + 1 s); never borrows across the window edge or a gap.
export function sampleWindow(times: number[], poses: Pose17[], start: number): Pose17[] {
  const dt = times.length > 1 ? median(times.slice(1).map((t, i) => t - times[i])) : 1 / 30
  const tolerance = Math.min(0.1, Math.max(0.51 * dt, 0.001))
  return Array.from({ length: FRAMES }, (_, k) => {
    const target = start + k / 30
    let right = times.findIndex((t) => t >= target)
    if (right < 0) right = times.length - 1
    const left = Math.max(right - 1, 0)
    const i = Math.abs(times[left] - target) <= Math.abs(times[right] - target) ? left : right
    const valid = Math.abs(times[i] - target) <= tolerance && times[i] >= start - 1e-8 && times[i] < start + WINDOW_S - 1e-8
    return valid ? poses[i] : H17.map(() => [0, 0, 0] as [number, number, number])
  })
}

// Live: feed every frame; emits a window every 0.5 s once 1 s of walking is buffered.
export function createGaitTracker(onWindow: (window: Pose17[], elapsed: number, start: number) => void) {
  let times: number[] = [], poses: Pose17[] = [], first = -1, next = 0
  return (t: number, pose: Pose17) => {
    if (first < 0) { first = t; next = t }
    times.push(t); poses.push(pose)
    while (times.length && times[0] < t - 2) { times.shift(); poses.shift() } // 2 s is plenty for a 1 s window
    if (t - next >= WINDOW_S) {
      onWindow(sampleWindow(times, poses, next), t - first, next - first)
      next += STRIDE_S
      if (t - next >= WINDOW_S) next = t - WINDOW_S // fell behind (tab hidden): jump to the latest full window
    }
  }
}

// ---------- regional density model ----------
export const REGIONS = ['trunk', 'hips', 'shoulders', 'left_knee', 'right_knee', 'left_arm', 'right_arm'] as const
export type Region = (typeof REGIONS)[number]
export const FEATURES = ['Median angle', 'Range (P95–P05)', 'Variability (SD)', 'Median speed'] as const
export const UNITS = ['°', '°', '°', '°/s'] as const
const JOINTS = [[0, 8], [1, 4], [11, 14], [4, 5, 6], [1, 2, 3], [4, 11, 12], [1, 14, 15]]
const deg = (r: number) => (r * 180) / Math.PI
const angleAt = (a: number[], b: number[], c: number[]) => {
  const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]]
  return deg(Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / Math.max(Math.hypot(...u) * Math.hypot(...v), 1e-8)))))
}

// One region's 4 features over a window, or the reasons it cannot be measured.
export function regionFeatures(p: Pose17[], view: View): { values: (number[] | null)[]; coverage: number[]; reasons: string[][] } {
  const valid = (f: Pose17, j: number) => f[j][2] >= 0.4
  const torso = p.filter((f) => valid(f, 8) && valid(f, 0)).map((f) => Math.hypot(f[8][0] - f[0][0], f[8][1] - f[0][1]))
  const scale = torso.length ? median(torso) : 0
  const values: (number[] | null)[] = [], coverage: number[] = [], reasons: string[][] = []
  JOINTS.forEach((joints, r) => {
    const why = new Set<string>()
    const ok = p.map((f) => joints.every((j) => valid(f, j)))
    coverage.push(ok.filter(Boolean).length / p.length)
    if (scale < 0.08) why.add('torso too small or not visible')
    if (coverage[r] < 0.8) why.add('fewer than 80% reliable frames')
    if ((r === 1 || r === 2) && view !== 'front_rear') why.add('line tilt needs a front or back view')
    let curve: number[], edges: [number, number][]
    if (r === 0) { curve = p.map((f) => deg(Math.atan2(f[8][0] - f[0][0], -(f[8][1] - f[0][1])))); edges = [[0, 8]] }
    else if (r <= 2) {
      const [a, b] = joints
      curve = p.map((f) => deg(Math.atan2(f[b][1] - f[a][1], Math.abs(f[b][0] - f[a][0])))); edges = [[a, b]]
      const dx = p.filter((_, i) => ok[i]).map((f) => Math.abs(f[b][0] - f[a][0]))
      if (dx.length && median(dx) < scale * 0.15) why.add('line too foreshortened')
    } else if (r <= 4) { const [a, b, c] = joints; curve = p.map((f) => 180 - angleAt(f[a], f[b], f[c])); edges = [[a, b], [b, c]] }
    else { const [h, s, e] = joints; curve = p.map((f) => angleAt(f[h], f[s], f[e])); edges = [[h, s], [s, e]] }
    for (const [a, b] of edges) {
      const len = p.filter((_, i) => ok[i]).map((f) => Math.hypot(f[a][0] - f[b][0], f[a][1] - f[b][1]))
      if (len.length && (percentile(len, 5) < scale * 0.05 || percentile(len, 95) > Math.max(percentile(len, 5), 1e-6) * 2.5)) why.add('unstable or collapsed segment')
    }
    if (why.size) { values.push(null); reasons.push([...why].sort()); return }
    const smooth = smoothRuns(curve, ok)
    const pairs = ok.slice(1).map((v, i) => v && ok[i])
    if (pairs.filter(Boolean).length < 20) { values.push(null); reasons.push(['too few adjacent reliable frames']); return }
    const q = smooth.filter((_, i) => ok[i])
    const speed = median(pairs.flatMap((v, i) => (v ? [Math.abs(smooth[i + 1] - smooth[i]) * 30] : [])))
    values.push([r < 3 ? Math.abs(median(q)) : median(q), percentile(q, 95) - percentile(q, 5), std(q), speed])
    reasons.push([])
  })
  return { values, coverage, reasons }
}

type Density = { center: number[]; scale: number[]; means: number[][]; covariances: number[][][]; mixture_weights: number[]; feature_bands: number[][]; calibration: number[][] }
const DENSITY = MODELS.density as Record<View, Partial<Record<Region, Density>>>
export const DEVIATION_PERCENTILE = 95

export interface RegionResult {
  region: Region
  state: 'deviation' | 'within' | 'unavailable'
  percentile: number | null // rank of this window's motion against the reference windows (≥ 95 = deviation)
  top: { feature: number; value: number; p05: number; median: number; p95: number } | null // the feature furthest from the reference middle
  reasons: string[]
}

export function assessRegions(p: Pose17[], view: View): RegionResult[] {
  const { values, reasons } = regionFeatures(p, view)
  return REGIONS.map((region, r) => {
    const m = DENSITY[view][region], v = values[r], why = [...reasons[r]]
    if (!m) why.push('no reference model for this view')
    if (!m || !v || why.length) return { region, state: 'unavailable', percentile: null, top: null, reasons: why }
    const score = nll(v, m)
    const pct = 100 * m.calibration.reduce((a, [s, w]) => a + (s <= score ? w : 0), 0)
    const marginal = v.map((x, k) => marginalCdf(x, k, m))
    const k = marginal.reduce((best, q, i) => (Math.abs(q - 0.5) > Math.abs(marginal[best] - 0.5) ? i : best), 0)
    const [p05, med, p95] = m.feature_bands[k]
    return { region, state: pct >= DEVIATION_PERCENTILE ? 'deviation' : 'within', percentile: pct, top: { feature: k, value: v[k], p05, median: med, p95 }, reasons: [] }
  })
}

function nll(x: number[], m: Density) {
  const z = x.map((v, j) => (Math.log1p(Math.max(v, 0)) - m.center[j]) / m.scale[j])
  const logs = m.means.map((mu, k) => {
    const { inv, logDet } = invert(m.covariances[k])
    const d = z.map((v, i) => v - mu[i])
    const quad = d.reduce((a, di, i) => a + di * d.reduce((b, dj, j) => b + inv[i][j] * dj, 0), 0)
    return Math.log(Math.max(m.mixture_weights[k], 1e-12)) - 0.5 * (z.length * Math.log(2 * Math.PI) + logDet + quad)
  })
  const top = Math.max(...logs)
  return -(top + Math.log(logs.reduce((a, l) => a + Math.exp(l - top), 0)))
}

function marginalCdf(value: number, j: number, m: Density) {
  const z = (Math.log1p(Math.max(value, 0)) - m.center[j]) / m.scale[j]
  return m.mixture_weights.reduce((a, w, k) => a + w * ndtr((z - m.means[k][j]) / Math.sqrt(m.covariances[k][j][j])), 0)
}

// ---------- TCN ----------
export type TcnWeights = Record<string, Float32Array>
export const TCN = MODELS.tcn

export function loadTcn(buffer: ArrayBuffer): TcnWeights {
  const all = new Float32Array(buffer)
  return Object.fromEntries(TCN.tensors.map(([name, shape, offset]) => [name as string, all.subarray(offset as number, (offset as number) + (shape as number[]).reduce((a, b) => a * b, 1))]))
}

const W = 96, DILATIONS = [1, 2, 4, 8]
const VIEWS = ['front_rear', 'side', 'oblique', 'mixed', 'unknown'], ENVIRONMENTS = ['overground', 'treadmill', 'other']
export const context = (view: View, environment: 'overground' | 'treadmill' = 'overground') => Array.from({ length: 8 }, (_, i) => (i === VIEWS.indexOf(view) || i === 5 + ENVIRONMENTS.indexOf(environment) ? 1 : 0))

// Forward pass of the frozen GaitTCN (tcn_model.py) for one window: pose 30 × 17 × [x, y, conf, valid].
export function tcnForward(w: TcnWeights, pose: number[][][], ctx: number[]) {
  const frameMask = pose.map((f) => f.some((j) => j[3] === 1))
  if (!frameMask.some(Boolean)) throw new Error('all-invalid window')
  const flat = pose.map((f) => f.flatMap((j) => (j[3] === 1 ? j : [0, 0, 0, 0])))
  let x = flat.map((v, t) => linear(w['frame_embedding.weight'], w['frame_embedding.bias'], v).map((h) => (frameMask[t] ? gelu(h) : 0)))
  DILATIONS.forEach((d, b) => {
    const residual = x
    for (let c = 0; c < 2; c++) {
      const y = conv(w[`blocks.${b}.convs.${c}.weight`], w[`blocks.${b}.convs.${c}.bias`], x, d)
      x = y.map((h, t) => layerNorm(h, w[`blocks.${b}.norms.${c}.weight`], w[`blocks.${b}.norms.${c}.bias`]).map((v) => (frameMask[t] ? gelu(v) : 0)))
    }
    x = x.map((h, t) => h.map((v, i) => (frameMask[t] ? residual[t][i] + v : 0)))
  })
  const n = frameMask.filter(Boolean).length
  const mean = Array.from({ length: W }, (_, i) => x.reduce((a, h) => a + h[i], 0) / n)
  const max = Array.from({ length: W }, (_, i) => Math.max(...x.filter((_, t) => frameMask[t]).map((h) => h[i])))
  const z = linear(w['readout.0.weight'], w['readout.0.bias'], [...mean, ...max, ...ctx]).map(gelu)
  return {
    classLogits: linear(w['classifier.weight'], w['classifier.bias'], z),
    numeric: linear(w['numeric_heads.0.weight'], w['numeric_heads.0.bias'], z),
    evaluabilityLogits: linear(w['evaluability.weight'], w['evaluability.bias'], z),
  }
}

export interface Criterion { id: string; region: string; label: string; unit: string; state: 'deviation' | 'within' | 'unavailable'; score: number | null; value: number | null; reasons: string[] }

// TCN criteria for one window with the package's gates (enabled head, body coverage, view, torso size, evaluability).
export function assessCriteria(w: TcnWeights, p: Pose17[], view: View, opts: { minSide: number; elapsed: number; freeArms?: boolean; environment?: 'overground' | 'treadmill' }): Criterion[] {
  const valid = p.map((f) => f.map((j) => j[2] > 0))
  const any = valid.some((f) => f.some(Boolean))
  const out = any ? tcnForward(w, p.map((f, t) => f.map((j, k) => [j[0], j[1], j[2], valid[t][k] ? 1 : 0])), context(view, opts.environment)) : null
  const share = (js: number[]) => valid.filter((f) => js.every((j) => f[j])).length / p.length
  const torsoOk = valid.map((f) => f[0] && f[8])
  const torsoPx = p.filter((_, t) => torsoOk[t]).map((f) => Math.hypot(f[0][0] - f[8][0], f[0][1] - f[8][1]) * opts.minSide / 2)
  const eligible = share([0, 8]) >= 0.8 && valid.reduce((a, f) => a + [0, 1, 2, 3, 4, 5, 6, 8, 11, 14].filter((j) => f[j]).length, 0) / (p.length * 10) >= 0.6
  const regionJoints = [[1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [0, 8], [0, 8], [1, 4], [11, 14], [11, 13, 14, 16], [11, 13, 14, 16]]
  const { center, scale } = TCN.normalization
  return TCN.labels.map((label, j) => {
    const o = label.outcome, outcome = TCN.outcomes[o], why: string[] = []
    if (!out) why.push('no usable input poses')
    if (!label.classification_enabled) why.push('classification head disabled in training')
    if (!eligible) why.push('insufficient body coverage')
    if (view !== outcome.view) why.push('needs a different camera view')
    if (share(regionJoints[o]) < 0.8) why.push('insufficient landmark coverage')
    if (!torsoPx.length || median(torsoPx) < 80) why.push('person too small in the frame')
    if (opts.elapsed < 2) why.push('less than two seconds of walking')
    if (outcome.free_arm_only && !opts.freeArms) why.push('free arms not confirmed')
    const score = out ? sigmoid(out.classLogits[j]) : null
    const ev = out ? sigmoid(out.evaluabilityLogits[o]) : null
    const value = out ? out.numeric[o] * scale[o] + center[o] : null
    if (ev !== null && ev < 0.5) why.push('model evaluability below 0.5')
    if (value !== null && value < 0) why.push('negative numeric prediction')
    return { id: label.id, region: label.region, label: outcome.label ?? label.id, unit: outcome.unit ?? '', state: why.length ? 'unavailable' : (score ?? 0) >= 0.5 ? 'deviation' : 'within', score, value, reasons: why }
  })
}

// ---------- small numerics ----------
function linear(weight: Float32Array, bias: Float32Array, x: number[]) {
  const n = x.length
  return Array.from(bias, (b, o) => { let s = b; for (let i = 0; i < n; i++) s += weight[o * n + i] * x[i]; return s })
}
function conv(weight: Float32Array, bias: Float32Array, x: number[][], d: number) { // Conv1d(96, 96, k=3, padding=d, dilation=d)
  return x.map((_, t) => Array.from(bias, (b, o) => {
    let s = b
    for (let k = 0; k < 3; k++) {
      const h = x[t + (k - 1) * d]
      if (h) for (let i = 0; i < W; i++) s += weight[(o * W + i) * 3 + k] * h[i]
    }
    return s
  }))
}
function layerNorm(h: number[], g: Float32Array, b: Float32Array) {
  const m = h.reduce((a, v) => a + v, 0) / h.length
  const v = h.reduce((a, x) => a + (x - m) ** 2, 0) / h.length
  return h.map((x, i) => ((x - m) / Math.sqrt(v + 1e-5)) * g[i] + b[i])
}
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const gelu = (x: number) => 0.5 * x * (1 + erf(x / Math.SQRT2))
// erf to ~1e-7 (Numerical Recipes erfc, Chebyshev fit)
function erf(x: number) {
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z)
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))))
  return x >= 0 ? 1 - r : r - 1
}
const ndtr = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))
function invert(a: number[][]) { // Gauss–Jordan on a small SPD matrix; also returns log|a|
  const n = a.length, m = a.map((r, i) => [...r, ...r.map((_, j) => (i === j ? 1 : 0))])
  let logDet = 0
  for (let c = 0; c < n; c++) {
    const pivot = m[c][c]
    logDet += Math.log(Math.abs(pivot))
    for (let j = 0; j < 2 * n; j++) m[c][j] /= pivot
    for (let r = 0; r < n; r++) if (r !== c) { const f = m[r][c]; for (let j = 0; j < 2 * n; j++) m[r][j] -= f * m[c][j] }
  }
  return { inv: m.map((r) => r.slice(n)), logDet }
}
function median(v: number[]) { const s = [...v].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2 }
function percentile(v: number[], q: number) { // numpy linear interpolation
  const s = [...v].sort((a, b) => a - b), pos = (q / 100) * (s.length - 1), lo = Math.floor(pos)
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo)
}
function std(v: number[]) { const m = v.reduce((a, x) => a + x, 0) / v.length; return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length) }
// scipy savgol_filter(window 5, order 2, mode 'interp') on each contiguous run of ≥ 5 valid frames; never bridges gaps.
function smoothRuns(curve: number[], ok: boolean[]) {
  const out = [...curve], C = [-3, 12, 17, 12, -3], E0 = [31, 9, -3, -5, 3], E1 = [9, 13, 12, 6, -5]
  const dot = (c: number[], s: number[]) => c.reduce((a, w, i) => a + w * s[i], 0) / 35
  for (let i = 0; i < curve.length;) {
    if (!ok[i]) { i++; continue }
    let j = i
    while (j < curve.length && ok[j]) j++
    const run = curve.slice(i, j)
    if (run.length >= 5) {
      const n = run.length, head = run.slice(0, 5), tail = run.slice(n - 5).reverse()
      run.forEach((_, k) => { out[i + k] = k === 0 ? dot(E0, head) : k === 1 ? dot(E1, head) : k === n - 1 ? dot(E0, tail) : k === n - 2 ? dot(E1, tail) : dot(C, run.slice(k - 2, k + 3)) })
    }
    i = j
  }
  return out
}

// ---------- one window, for the coaching screens ----------
export interface WalkWindow { start: number; view: View | null; regions: RegionResult[]; criteria: Criterion[] } // start: seconds since walking began

export function assessWindow(w: TcnWeights | null, p: Pose17[], opts: { minSide: number; elapsed: number; start: number }): WalkWindow {
  const view = guessView(p)
  if (!view) return { start: opts.start, view, regions: [], criteria: [] }
  return { start: opts.start, view, regions: assessRegions(p, view), criteria: w ? assessCriteria(w, p, view, opts) : [] }
}

// A window counts once the view is known and at least one region could be measured.
export const assessed = (win: WalkWindow) => win.regions.some((r) => r.state !== 'unavailable')

// Scored seconds that do not overlap (windows start every 0.5 s and last 1 s): each counted window starts ≥ 1 s after the last.
export function scoredSeconds(windows: WalkWindow[]): WalkWindow[] {
  let last = -Infinity
  return windows.filter((w) => assessed(w) && w.start >= last + WINDOW_S - 1e-6 && ((last = w.start), true))
}

// ---------- named compensations ----------
// The deviations the models see, named as the compensation they usually are, so feedback can say what to do.
// shortcut: generic gait cues pending a physiotherapist's review; leg swing-out (circumduction) is not measured.
export type Compensation = 'hipHike' | 'sideLean' | 'forwardLean' | 'stiffKnee' | 'unevenSteps' | 'stiffArm'
export interface WalkPerson { prosthesis: boolean; side: 'left' | 'right' | null; aid: boolean } // side: the affected / prosthesis side, if known
export interface Found { kind: Compensation; side: 'left' | 'right' | null; region: RegionResult | null; criterion?: Criterion; strength: number } // strength 0..1

// The TCN criteria that stand for a named compensation.
export const CRITERION_COMPENSATION: Record<string, Compensation> = { knee_rom95_asymmetry_high: 'unevenSteps', hip_line_rom95_proxy_high: 'hipHike', trunk_frontal_rom95_high: 'sideLean', trunk_side_rom95_high: 'forwardLean', knee_rom95_mean_low: 'stiffKnee' }

export function compensationFor(win: WalkWindow, who: WalkPerson): Found | null {
  const kneeFlagOk = (side: 'left' | 'right') => !who.prosthesis || (who.side !== null && who.side !== side) // never flag the prosthetic knee for being one
  const found: Found[] = []
  for (const r of win.regions) {
    if (r.state !== 'deviation' || !r.top) continue
    const more = r.top.value > r.top.median, front = win.view === 'front_rear', strength = (r.percentile ?? 0) / 100
    const side = r.region.startsWith('left') ? 'left' : r.region.startsWith('right') ? 'right' : null
    const kind: Compensation | null =
      r.region === 'hips' && front && more ? 'hipHike'
      : (r.region === 'trunk' || r.region === 'shoulders') && front && more ? 'sideLean'
      : r.region === 'trunk' && !front && more ? 'forwardLean'
      : r.region.endsWith('knee') && !more && side && kneeFlagOk(side) ? 'stiffKnee'
      : r.region.endsWith('arm') && !more && !who.aid ? 'stiffArm'
      : null
    if (kind) found.push({ kind, side, region: r, strength })
  }
  for (const c of win.criteria) {
    const kind = CRITERION_COMPENSATION[c.id]
    if (c.state !== 'deviation' || !kind || (kind === 'stiffKnee' && who.prosthesis)) continue // the model's knee range has no side
    found.push({ kind, side: null, region: null, criterion: c, strength: c.score ?? 0 })
  }
  return found.sort((a, b) => b.strength - a.strength)[0] ?? null
}

// MediaPipe landmarks where the mark for a compensation goes (mirrored selfie: the person's left is landmark 23/25/13).
export function compensationJoints(f: Found): number[] {
  const knee = f.side === 'left' ? [25] : f.side === 'right' ? [26] : [25, 26]
  return { hipHike: [23, 24], sideLean: [11, 12], forwardLean: [11, 12], stiffKnee: knee, unevenSteps: [25, 26], stiffArm: f.side === 'left' ? [13] : [14] }[f.kind]
}
