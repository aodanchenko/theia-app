// All saving and loading goes through this file, so a backend can replace browser storage here only.
const KEY = 'theia.sessions'

export function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function saveSession(session) {
  const sessions = [...loadSessions(), session]
  localStorage.setItem(KEY, JSON.stringify(sessions)) // throws when storage is blocked or full: let the UI show it
  return sessions
}
