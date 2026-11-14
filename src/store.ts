// All saving and loading goes through this file, so a backend can replace browser storage here only.
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
