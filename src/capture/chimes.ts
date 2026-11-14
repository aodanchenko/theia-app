// Theia chimes: short, musical feedback sounds made in the browser (Web Audio). Our own original content, so no
// third-party licence; nothing to download, works offline.
// 'juicy' (default) = a struck, marimba-like note with a mallet click, warm sub-octave body, bell sparkle, a slight
// pluck in pitch, stereo spread and a short room. 'soft' = plain sine notes.
export type Chime = 'good' | 'fix' | 'baseline' | 'streak' | 'done'
export type ChimeStyle = 'juicy' | 'soft'

// Notes as [frequency Hz, start s, length s]. Major-key intervals feel resolved; "fix" falls a minor third, rounder.
const NOTES: Record<Chime, [number, number, number][]> = {
  good: [[659.25, 0, 0.32], [880, 0.085, 0.5]], // E5 → A5
  fix: [[440, 0, 0.32], [369.99, 0.13, 0.45]], // A4 → F#4
  baseline: [[523.25, 0, 0.3], [659.25, 0.075, 0.3], [783.99, 0.15, 0.55]], // C5 E5 G5
  streak: [[523.25, 0, 0.26], [659.25, 0.065, 0.26], [783.99, 0.13, 0.26], [1046.5, 0.2, 0.7]], // C5 E5 G5 C6
  done: [[130.81, 0, 1.6], [523.25, 0, 1.3], [659.25, 0.05, 1.3], [783.99, 0.1, 1.3], [1046.5, 0.3, 1.1], [1318.5, 0.4, 1], [1567.98, 0.5, 0.9]], // C3 + C major, then up
}

let ctx: AudioContext | null = null
let bus: AudioNode | null = null

// Output chain, built once: notes → (dry + short synthetic room) → gentle compressor → speakers.
function output(c: AudioContext): AudioNode {
  if (bus) return bus
  const comp = c.createDynamicsCompressor()
  comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = 0.003; comp.release.value = 0.15
  comp.connect(c.destination)
  const input = c.createGain()
  input.connect(comp)
  const room = c.createConvolver()
  const len = Math.floor(c.sampleRate * 0.9), ir = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3 }
  room.buffer = ir
  const wet = c.createGain(); wet.gain.value = 0.16
  input.connect(room).connect(wet).connect(comp)
  bus = input
  return bus
}

function env(c: AudioContext, at: number, peak: number, attack: number, decay: number) {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.linearRampToValueAtTime(peak, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  return g
}

function tone(c: AudioContext, out: AudioNode, type: OscillatorType, hz: number, at: number, peak: number, decay: number, scoop = 0) {
  const osc = c.createOscillator(), g = env(c, at, peak, 0.006, decay)
  osc.type = type
  osc.frequency.setValueAtTime(hz * (1 - scoop), at)
  if (scoop) osc.frequency.exponentialRampToValueAtTime(hz, at + 0.03) // tiny pluck into pitch
  osc.connect(g).connect(out)
  osc.start(at); osc.stop(at + decay + 0.05)
}

function click(c: AudioContext, out: AudioNode, at: number, peak: number) {
  const len = Math.floor(c.sampleRate * 0.012), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2
  const src = c.createBufferSource(), hp = c.createBiquadFilter(), g = c.createGain()
  src.buffer = buf; hp.type = 'highpass'; hp.frequency.value = 2500; g.gain.value = peak
  src.connect(hp).connect(g).connect(out)
  src.start(at)
}

function juicyNote(c: AudioContext, out: AudioNode, hz: number, at: number, len: number, level: number, pan: number) {
  const p = c.createStereoPanner(); p.pan.value = pan; p.connect(out)
  const low = hz < 300
  tone(c, p, 'sine', hz, at, level, len, 0.02) // fundamental with pluck
  if (!low) {
    tone(c, p, 'triangle', hz * 2, at, level * 0.18, len * 0.45) // wood
    tone(c, p, 'sine', hz * 4.01, at, level * 0.1, len * 0.18) // bell sparkle, slightly sharp so it shimmers
    tone(c, p, 'sine', hz / 2, at, level * 0.35, Math.min(0.18, len)) // warm body
    click(c, p, at, level * 0.35) // mallet
  }
}

export function playChime(name: Chime, volume = 0.5, style: ChimeStyle = 'juicy') {
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  const c = ctx, t = c.currentTime + 0.01
  if (style === 'soft') {
    for (const [hz, start, len] of NOTES[name]) tone(c, c.destination, 'sine', hz, t + start, 0.22 * volume, len)
    return
  }
  const out = output(c), level = (name === 'fix' ? 0.26 : 0.32) * volume
  NOTES[name].forEach(([hz, start, len], i) => juicyNote(c, out, hz, t + start, len, level, (i % 2 ? 0.18 : -0.18) * (hz < 300 ? 0 : 1)))
}
