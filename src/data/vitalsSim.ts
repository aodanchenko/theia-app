// Simulated vitals that react to exercise. Plain TS (runs in Node for tests). Everything it makes is labelled SIMULATED.
// Effort rises with each squat rep and decays at rest; heart rate, breathing and HRV follow it, each on its own
// random update period like real sensors. SpO2 blips now and then; core temp drifts slowly; BP is a pre-set cuff reading.
// Rarely (about one every 2 minutes) an episode starts: an SpO2 dip (watch, sometimes a flag) or a heart-rate rise
// that effort doesn't explain (watch). Episodes last 6–15 s, then values recover.
import type { Vital, VitalStatus } from '../types.ts'

type Key = 'hr' | 'hrv' | 'rr' | 'spo2' | 'temp'
export interface SimState {
  t: number // ms
  reps: number
  effort: number // 0 rest … 1 hard
  value: Record<Key, number>
  history: Record<Key, number[]>
  next: Record<Key, number> // ms of the next update per vital
  episode: Episode | null
}

export interface Episode { kind: 'desat' | 'tachy'; until: number; depth: number }
const EPISODE_EVERY = 120000 // mean ms between episodes

const HISTORY = 24
// Update period range per vital, ms (sensors don't all tick together).
const PERIOD: Record<Key, [number, number]> = { hr: [900, 1600], rr: [2500, 5000], hrv: [4000, 8000], spo2: [9000, 20000], temp: [15000, 30000] }
const REST: Record<Key, number> = { hr: 68, hrv: 58, rr: 14, spo2: 98, temp: 36.9 }
const target = (k: Key, e: number) => ({ hr: 68 + 82 * e, hrv: 58 - 34 * e, rr: 14 + 14 * e, spo2: 98, temp: 36.9 + 0.5 * e })[k]
const NOISE: Record<Key, number> = { hr: 2, hrv: 2.5, rr: 0.8, spo2: 0, temp: 0.02 }
const KEYS = Object.keys(PERIOD) as Key[]

export function startSim(t = 0, rand = Math.random): SimState {
  const value = { ...REST }
  const history = Object.fromEntries(KEYS.map((k) => [k, Array.from({ length: HISTORY }, () => REST[k] + (rand() - 0.5) * NOISE[k])])) as Record<Key, number[]>
  const next = Object.fromEntries(KEYS.map((k) => [k, t + period(k, rand)])) as Record<Key, number>
  return { t, reps: 0, effort: 0, value, history, next, episode: null }
}

const period = (k: Key, rand: () => number) => PERIOD[k][0] + rand() * (PERIOD[k][1] - PERIOD[k][0])

// Advance to time `t` with `reps` squats done so far. `episodes: false` keeps it calm (demo picture, tests).
export function tick(s: SimState, t: number, reps: number, rand = Math.random, episodes = true): SimState {
  const dt = Math.max(0, t - s.t)
  const effort = Math.min(1, s.effort * Math.exp(-dt / 40000) + 0.11 * Math.max(0, reps - s.reps))
  const value = { ...s.value }, history = { ...s.history }, next = { ...s.next }
  let episode = s.episode && t < s.episode.until ? s.episode : null
  if (!episode && episodes && rand() < dt / EPISODE_EVERY) {
    const desat = rand() < 0.5
    episode = { kind: desat ? 'desat' : 'tachy', until: t + 6000 + rand() * 9000, depth: desat ? (rand() < 0.3 ? 92 : 95) : 30 }
    if (desat) next.spo2 = t // a dip shows at once, not at the next slow SpO2 reading
  }
  for (const k of KEYS) {
    if (t < next[k]) continue
    if (k === 'spo2') value.spo2 = episode?.kind === 'desat' ? episode.depth : rand() < 0.25 ? 97 : 98 // occasional 1-point blip
    else value[k] += (target(k, effort) + (k === 'hr' && episode?.kind === 'tachy' ? episode.depth : 0) - value[k]) * 0.35 + (rand() - 0.5) * NOISE[k]
    history[k] = [...history[k].slice(1 - HISTORY), value[k]]
    next[k] = t + period(k, rand)
  }
  return { t, reps, effort, value, history, next, episode }
}

// Personal baseline ranges (simulated) and the known-cause rule: above-baseline during exercise is expected, not a flag.
const BASE: Record<Key, [number, number]> = { hr: [58, 72], hrv: [45, 65], rr: [12, 18], spo2: [96, 99], temp: [36.6, 37.2] }
function status(k: Key, v: number, effort: number): { status: VitalStatus; cause?: string } {
  const [lo, hi] = BASE[k]
  if (k === 'spo2') return v < 94 ? { status: 'flag' } : v < lo ? { status: 'watch' } : { status: 'normal' }
  if ((k === 'hr' || k === 'rr') && v > target(k, effort) + (k === 'hr' ? 20 : 6)) return { status: 'watch' } // more than effort explains
  if (v >= lo && v <= hi) return { status: 'normal' }
  return effort > 0.15 ? { status: 'expected', cause: 'exercise' } : { status: 'watch' }
}

const fmt = (k: Key, v: number) => (k === 'temp' ? v.toFixed(1) : String(Math.round(v)))

export function toVitals(s: SimState): Vital[] {
  const v = (k: Key, name: string, unit: string, domain: [number, number]): Vital => ({
    name, unit, value: fmt(k, s.value[k]), base: BASE[k], trend: s.history[k], domain, ...status(k, s.value[k], s.effort),
  })
  return [
    v('hr', 'Heart rate', 'bpm', [50, 160]),
    v('hrv', 'HRV rMSSD', 'ms', [15, 80]),
    v('rr', 'Resp rate', '/min', [8, 32]),
    v('spo2', 'SpO₂', '%', [90, 100]),
    v('temp', 'Core temp', '°C', [36.2, 37.8]),
    { name: 'BP', unit: 'mmHg', value: '131/84', status: 'normal', source: 'cuff · pre-set' },
  ]
}

// Deterministic PRNG so the demo (camera off) always shows the same mid-set picture.
export function seeded(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296 }
}

// Demo: 7 reps over a minute from rest, as in the simulated set.
export function demoVitals(): Vital[] {
  const rand = seeded(7)
  let s = startSim(0, rand)
  for (let t = 500; t <= 60000; t += 500) s = tick(s, t, Math.min(7, Math.floor(t / 8000)), rand, false)
  return toVitals(s)
}
