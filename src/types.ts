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
  formula?: string
}

export interface Limits {
  baseline: [lo: number, hi: number]
  rehab: number
  base: number
}

export interface Vital {
  name: string
  value: string
  unit: string
  alert?: boolean
  trend: number[]
}

export type Joint = 'head' | 'neck' | 'ls' | 'rs' | 'le' | 're' | 'lw' | 'rw' | 'lh' | 'rh' | 'lk' | 'rk' | 'la' | 'ra'

export interface OverlayTag {
  joint: Joint
  dx: number
  dy: number
  label: string
  alert?: boolean
}
