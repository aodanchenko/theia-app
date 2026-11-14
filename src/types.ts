// Shared data shapes. Engine output and src/data/demo.ts must match these.

export type Theme = 'space' | 'earth'

export interface Session {
  file: string
  missionDay: number
  loadKg: number
  baselineSessions: number
  knownCause: string
}

export interface Parameter {
  name: string
  now: string
  correct: string // the correct-form limit, e.g. "≥ 90°"
  base: string
  flag?: string // what to do, e.g. "go deeper"
  tone?: 'alert' | 'caution' // alert = off the personal baseline; caution = within it but short of correct form
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

// Earth: answers from "About you" (tap only). Stored on the device.
export interface EarthProfile {
  side: 'left' | 'right' | 'both' | 'unsure' // affected side
  prosthesis: boolean
  aid: boolean // cane, crutch or walker
  position: 'standing' | 'seated' // how they exercise
  voice: boolean // speak the cues
  sounds?: boolean // feedback sounds; missing (older saved answers) means on
  bigText: boolean
}
