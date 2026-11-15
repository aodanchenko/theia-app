// Speaks a cue with the browser's built-in voice (on the device, offline on most phones). Drops a cue that is
// already being said, and cuts off an older one so feedback stays about the current rep.
let last = ''
export function speak(text: string, lang?: string) {
  if (!('speechSynthesis' in window) || text === last && speechSynthesis.speaking) return
  last = text
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 0.95
  if (lang) {
    u.lang = lang
    // Some Android browsers ignore lang alone and read Ukrainian with the English voice (or not at all).
    const voice = bestVoice(lang)
    if (voice) u.voice = voice
  }
  speechSynthesis.speak(u)
}

// iPhones only speak after a first speak() inside a tap; the About-you taps come first, so the first one unlocks it.
if ('speechSynthesis' in window) addEventListener('click', () => speechSynthesis.speak(new SpeechSynthesisUtterance('')), { once: true, capture: true })

// The nicest installed voice for the language: neural / premium / enhanced ones first (Apple, Google, Microsoft name
// them so), then the system default. Robotic novelty voices last.
const NICE = /premium|enhanced|natural|neural|online|google/i, ODD = /compact|eloquence|bad news|good news|bahh|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|jester|superstar|wobble|albert|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|sandy|flo|reed|eddy/i
function bestVoice(lang: string) {
  const want = lang.slice(0, 2).toLowerCase(), region = lang.toLowerCase()
  const score = (v: SpeechSynthesisVoice) => (NICE.test(v.name) ? 4 : 0) + (v.lang.replace('_', '-').toLowerCase() === region ? 2 : 0) + (v.default ? 1 : 0) - (ODD.test(v.name) ? 8 : 0)
  return speechSynthesis.getVoices().filter((v) => v.lang.slice(0, 2).toLowerCase() === want).sort((a, b) => score(b) - score(a))[0]
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) speechSynthesis.cancel()
  last = ''
}
