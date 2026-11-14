// Speaks a cue with the browser's built-in voice (on the device, offline on most phones). Drops a cue that is
// already being said, and cuts off an older one so feedback stays about the current rep.
let last = ''
export function speak(text: string, lang?: string) {
  if (!('speechSynthesis' in window) || text === last && speechSynthesis.speaking) return
  last = text
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  if (lang) u.lang = lang // e.g. 'uk-UA': the phone picks its voice for that language
  speechSynthesis.speak(u)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  last = ''
}
