// Throwaway: compare per-rep sound sets at /proto/sounds (dev only). Files stream from their sources on click;
// nothing is stored in the repo until one set is chosen.
import { useRef, useState } from 'react'
import { playChime } from '../../capture/chimes.ts'
import './sounds.css'

type Event = 'good' | 'flag' | 'baseline' | 'combo' | 'done'
const EVENTS: [Event, string, string][] = [
  ['good', '✓ Good rep', 'every clean rep'],
  ['flag', '▲ Flagged rep', 'technique off your baseline'],
  ['baseline', 'Baseline set', 'after the 3rd rep'],
  ['combo', 'Clean combo', 'every 5 clean in a row'],
  ['done', 'Set complete', 'last rep of the set'],
]

// --- 1 · Quindar, generated: sine tones, no files ---
let ctx: AudioContext | null = null
function tones(seq: [hz: number, ms: number, gapMs: number, type?: OscillatorType][], volume: number) {
  ctx ??= new AudioContext()
  let t = ctx.currentTime + 0.02
  for (const [hz, ms, gap, type = 'sine'] of seq) {
    const osc = ctx.createOscillator(), gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = hz
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume * 0.25, t + 0.005) // 5 ms ramps: no clicks
    gain.gain.setValueAtTime(volume * 0.25, t + ms / 1000 - 0.005)
    gain.gain.linearRampToValueAtTime(0, t + ms / 1000)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + ms / 1000)
    t += (ms + gap) / 1000
  }
}
const QUINDAR: Record<Event, [number, number, number, OscillatorType?][]> = {
  good: [[2525, 250, 0]],
  flag: [[420, 120, 70, 'triangle'], [420, 120, 0, 'triangle']],
  baseline: [[1975, 110, 40], [2250, 110, 40], [2525, 160, 0]],
  combo: [[2525, 250, 120], [2475, 250, 0]],
  done: [[2525, 250, 120], [2475, 250, 220], [1263, 180, 0], [1894, 180, 0], [2525, 400, 0]],
}

// --- 2 · Kenney Interface Sounds (CC0) ---
const KENNEY = 'https://raw.githubusercontent.com/Calinou/kenney-interface-sounds/master/addons/kenney_interface_sounds/'

// --- 3 · NASA historical sounds (NASA media usage guidelines) ---
const NASA = 'https://www.nasa.gov/wp-content/uploads/2015/01/'
const NASA_FILES: Record<Event, [file: string, maxMs: number]> = {
  good: ['578628main_hskquindar.mp3', 1500],
  flag: ['578626main_sputnik-beep.mp3', 1500],
  baseline: ['578629main_hawquindar.mp3', 1500],
  combo: ['578628main_hskquindar.mp3', 3000],
  done: ['569462main_eagle_has_landed.mp3', 8000],
}

// --- 4 · Google Material sound resources (CC-BY 4.0; mirror of the official pack) ---
const MATERIAL = 'https://raw.githubusercontent.com/guilhermebvdm/claude-code-sounds-gbvdm/HEAD/sounds/'
const MATERIAL_FILES: Record<Event, string> = { good: 'state-change_confirm-up.wav', flag: 'navigation_unavailable-selection.wav', baseline: 'navigation_forward-selection-minimal.wav', combo: 'navigation_selection-complete-celebration.wav', done: 'hero_simple-celebration-01.wav' }

interface SoundSet { name: string; note: string; license: string; play: (e: Event, volume: number) => void; label: (e: Event) => string }

let current: HTMLAudioElement | null = null
let cut = 0
function file(url: string, volume: number, maxMs = 0) {
  current?.pause()
  clearTimeout(cut)
  current = new Audio(url)
  current.volume = volume
  void current.play()
  if (maxMs) { const a = current; cut = window.setTimeout(() => a.pause(), maxMs) }
}

// Kenney Interface Sounds (CC0): closest in character to the Material set.
const KENNEY_CC0: Record<Event, string> = { good: 'confirmation_001.wav', flag: 'glass_002.wav', baseline: 'select_003.wav', combo: 'confirmation_002.wav', done: 'confirmation_004.wav' }
const CHIME: Record<Event, 'good' | 'fix' | 'baseline' | 'streak' | 'done'> = { good: 'good', flag: 'fix', baseline: 'baseline', combo: 'streak', done: 'done' }

const SETS: SoundSet[] = [
  { name: 'Theia chimes · juicy', note: 'Struck marimba: mallet click, warm body, bell sparkle, a little room', license: 'Ours · OK for Space Apps', play: (e, v) => playChime(CHIME[e], v, 'juicy'), label: (e) => ({ good: 'E5 → A5', flag: 'A4 → F#4', baseline: 'C E G', combo: 'C E G C', done: 'C3 + C major, rising' })[e] },
  { name: 'Theia chimes · soft', note: 'The first version: plain soft sine notes', license: 'Ours · OK for Space Apps', play: (e, v) => playChime(CHIME[e], v, 'soft'), label: (e) => ({ good: 'E5 → A5', flag: 'A4 → F#4', baseline: 'C E G', combo: 'C E G C', done: 'C major' })[e] },
  { name: 'Kenney (CC0)', note: 'Closest Kenney files to the Material set', license: 'CC0 · OK for Space Apps', play: (e, v) => file(KENNEY + KENNEY_CC0[e], v), label: (e) => KENNEY_CC0[e] },
  { name: 'Quindar, generated', note: 'Apollo radio beeps made in the browser: 2525 / 2475 Hz', license: 'Ours · OK for Space Apps', play: (e, v) => tones(QUINDAR[e], v), label: (e) => QUINDAR[e].map(([hz]) => `${hz} Hz`).join(' · ') },
  { name: 'NASA archive', note: 'Real mission audio, cut to the first seconds', license: 'NASA · OK for Space Apps', play: (e, v) => file(NASA + NASA_FILES[e][0], v, NASA_FILES[e][1]), label: (e) => NASA_FILES[e][0].replace(/^\d+main_/, '') },
  { name: 'Google Material', note: 'Reference only: CC-BY is not allowed in a Space Apps submission', license: 'CC-BY 4.0 · not OK for Space Apps', play: (e, v) => file(MATERIAL + MATERIAL_FILES[e], v), label: (e) => MATERIAL_FILES[e] },
]

// A demo set: 3 calibration reps, 5 clean (combo), a flag, a clean last rep.
const SET_SEQUENCE: { rep: number; state: 'cal' | 'good' | 'flag'; events: Event[] }[] = [
  { rep: 1, state: 'cal', events: [] }, { rep: 2, state: 'cal', events: [] }, { rep: 3, state: 'cal', events: ['baseline'] },
  { rep: 4, state: 'good', events: ['good'] }, { rep: 5, state: 'good', events: ['good'] }, { rep: 6, state: 'good', events: ['good'] },
  { rep: 7, state: 'good', events: ['good'] }, { rep: 8, state: 'good', events: ['combo'] }, { rep: 9, state: 'flag', events: ['flag'] },
  { rep: 10, state: 'good', events: ['done'] },
]

export default function SoundsLab() {
  const [volume, setVolume] = useState(0.6)
  const [playing, setPlaying] = useState<{ set: number; step: number } | null>(null)
  const timers = useRef<number[]>([])

  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; current?.pause(); setPlaying(null) }
  const playSet = (i: number) => {
    stop()
    SET_SEQUENCE.forEach((step, k) => {
      timers.current.push(window.setTimeout(() => {
        setPlaying({ set: i, step: k })
        step.events.forEach((e) => SETS[i].play(e, volume))
      }, k * 1400))
    })
    timers.current.push(window.setTimeout(() => setPlaying(null), SET_SEQUENCE.length * 1400 + 1500))
  }

  return (
    <div className="snd">
      <header className="snd-top">
        <b>THEIA · Rep sounds</b>
        <label className="snd-vol">Volume <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(+e.target.value)} /> <span>{Math.round(volume * 100)}%</span></label>
        <button type="button" className="snd-btn" onClick={stop}>■ Stop</button>
      </header>

      <table className="snd-grid">
        <thead>
          <tr>
            <th />
            {SETS.map((s, i) => (
              <th key={s.name} scope="col">
                <span className="snd-n">{i + 1}</span>{s.name}
                <small>{s.note}</small>
                <em>{s.license}</em>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {EVENTS.map(([e, label, hint]) => (
            <tr key={e}>
              <th scope="row">{label}<small>{hint}</small></th>
              {SETS.map((s) => (
                <td key={s.name}>
                  <button type="button" className="snd-play" data-event={e} onClick={() => s.play(e, volume)}>▶<span>{s.label(e)}</span></button>
                </td>
              ))}
            </tr>
          ))}
          <tr className="snd-setrow">
            <th scope="row">Hear a whole set<small>10 reps, 1.4 s apart</small></th>
            {SETS.map((s, i) => (
              <td key={s.name}>
                <button type="button" className="snd-btn" onClick={() => playSet(i)}>▶ Play set</button>
                <div className="snd-strip" aria-hidden="true">
                  {SET_SEQUENCE.map((step, k) => <i key={k} data-state={step.state} data-on={(playing?.set === i && playing.step >= k) || undefined} data-now={(playing?.set === i && playing.step === k) || undefined} />)}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="snd-foot">Calibration reps 1–3 are silent; the 3rd plays "Baseline set". Files stream from GitHub and nasa.gov when you press play; the chosen set gets copied into the app so it works offline.</p>
    </div>
  )
}
