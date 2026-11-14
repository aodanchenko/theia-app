// Shared data shapes. Engine output and src/data/demo.ts must match these.

export type Theme = 'space' | 'earth'

export interface Session {
  file: string
  missionDay: number
  set: number
  rep: number
  reps: number
  loadKg: number
  nextLoadKg: number
  baselineSessions: number
  model: string
  knownCause: string
  cue: string
}

export interface Parameter {
  name: string
  now: string
  base: string
  delta: string
  flag?: string
}

export interface Limits {
  baseline: [lo: number, hi: number]
  rehab: number
  base?: number
}

// normal = within personal baseline; expected = outside it but a known cause explains it (e.g. exercise);
// watch = outside it, no known cause; flag = past a safety limit.
export type VitalStatus = 'normal' | 'expected' | 'watch' | 'flag'

export interface Vital {
  name: string
  value: string
  unit: string
  status: VitalStatus
  cause?: string // the known cause when status is 'expected'
  base?: [lo: number, hi: number] // personal baseline range
  trend?: number[] // recent values, oldest first
  domain?: [min: number, max: number] // sparkline y range
  source?: string // shown instead of a trend for one-off readings (e.g. a cuff)
}

export type Joint = 'head' | 'neck' | 'ls' | 'rs' | 'le' | 're' | 'lw' | 'rw' | 'lh' | 'rh' | 'lk' | 'rk' | 'la' | 'ra'

export interface OverlayTag {
  joint: Joint
  dx: number
  dy: number
  label: string
  alert?: boolean
}
