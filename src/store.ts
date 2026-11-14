// All saving and loading goes through this file, so a backend can replace browser storage here only.
import type { EarthProfile } from './types.ts'
const KEY = 'theia.sessions'

export function loadSessions(): unknown[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? []
  } catch {
    return []
  }
}

export function saveSession(session: unknown): unknown[] {
  const sessions = [...loadSessions(), session]
  localStorage.setItem(KEY, JSON.stringify(sessions)) // throws when storage is blocked or full: let the UI show it
  return sessions
}

// Earth "About you". Read/write fail soft: private mode or blocked storage just means asking again next time.
const PROFILE = 'theia.earth.profile'

export function loadProfile(): EarthProfile | null {
  try {
    return JSON.parse(localStorage.getItem(PROFILE) ?? 'null')
  } catch {
    return null
  }
}

export function saveProfile(p: EarthProfile) {
  try { localStorage.setItem(PROFILE, JSON.stringify(p)) } catch { /* not saved: asked again next visit */ }
}

export function clearProfile() {
  try { localStorage.removeItem(PROFILE) } catch { /* nothing stored */ }
}
