// Throwaway: a scripted 10-rep session shared by the /proto/earth variants. Nothing in production imports this.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { speak, stopSpeaking } from '../../capture/speak.ts'
import SimulatedCamera from '../../components/SimulatedCamera.tsx'
import { activityLabel, type Activity } from '../../engine/activity.ts'
import { cueFor, startHint, type Verdict } from '../../engine/earthCoach.ts'
import type { EarthProfile } from '../../types.ts'

export const PROFILE: EarthProfile = { side: 'right', prosthesis: false, aid: true, position: 'standing', voice: false, bigText: false }
export const TOTAL = 10

const VERDICTS: Verdict[] = [
  { kind: 'learning', done: 1 }, { kind: 'learning', done: 2 }, { kind: 'learning', done: 3 },
  { kind: 'good' }, { kind: 'good' }, { kind: 'fix', feature: 'kneeWidth' }, { kind: 'good' },
  { kind: 'fix', feature: 'trunkLean' }, { kind: 'good' }, { kind: 'good' },
]
type Phase = 'away' | 'ready' | 'moving' | 'result' | 'done'
interface Step { phase: Phase; ms: number; activity: Activity; rep: number }
const STEPS: Step[] = [
  { phase: 'away', ms: 2600, activity: 'away', rep: 0 },
  { phase: 'ready', ms: 2600, activity: 'standing', rep: 0 },
  ...VERDICTS.flatMap((_, i): Step[] => [
    { phase: 'moving', ms: 900, activity: 'goingDown', rep: i },
    { phase: 'moving', ms: 600, activity: 'holding', rep: i },
    { phase: 'moving', ms: 900, activity: 'comingUp', rep: i },
    { phase: 'result', ms: 2000, activity: 'standing', rep: i + 1 },
  ]),
  { phase: 'done', ms: Infinity, activity: 'standing', rep: TOTAL },
]

export interface DemoState {
  phase: Phase
  paused: boolean
  activity: Activity
  label: string // what Theia sees you doing
  rep: number // reps done
  verdict: Verdict | null // last rep's result
  cue: { title: string; hint: string }
  history: Verdict['kind'][]
  streak: number // good reps in a row
  good: number
  fixes: number
  seq: number // bumps on each new rep result (for one-shot animations)
}

export function useEarthDemo() {
  const q = new URLSearchParams(location.search) // review shortcut: ?step=N jumps there, &hold=1 freezes it
  const [i, setI] = useState(() => Math.min(STEPS.length - 1, Number(q.get('step')) || 0))
  const [paused, setPaused] = useState(() => q.get('hold') === '1')
  const [voice, setVoice] = useState(false)
  const [big, setBig] = useState(false)
  const step = STEPS[i]

  useEffect(() => {
    if (paused || step.ms === Infinity) return
    const id = setTimeout(() => setI((n) => n + 1), step.ms)
    return () => clearTimeout(id)
  }, [i, paused, step.ms])
  useEffect(() => { document.documentElement.toggleAttribute('data-big-text', big); return () => document.documentElement.removeAttribute('data-big-text') }, [big])

  const verdict = step.rep > 0 ? VERDICTS[step.rep - 1] : null
  const history = VERDICTS.slice(0, step.rep).map((v) => v.kind)
  let streak = 0
  for (let k = history.length - 1; k >= 0 && history[k] === 'good'; k--) streak++

  const cue = step.phase === 'away' ? { title: 'Step into view', hint: 'Your whole body should fit on the screen.' }
    : step.phase === 'done' ? { title: 'Set complete', hint: `${history.filter((h) => h === 'good').length} reps just like your normal.` }
    : step.phase === 'ready' || !verdict ? { title: 'Start moving', hint: startHint(PROFILE) }
    : cueFor(verdict, PROFILE)

  const spokenFor = useRef(-1)
  useEffect(() => {
    if (!voice || paused) return
    if ((step.phase === 'result' || step.phase === 'done' || step.phase === 'ready') && spokenFor.current !== i) { spokenFor.current = i; speak(cue.title) }
  }, [i, voice, paused, step.phase, cue.title])

  const state: DemoState = {
    phase: step.phase, paused, activity: step.activity, label: activityLabel(step.activity, 'standing'), rep: step.rep, verdict, cue, history, streak,
    good: history.filter((h) => h === 'good').length, fixes: history.filter((h) => h === 'fix').length, seq: step.rep,
  }
  return {
    s: state,
    toggle: () => { if (step.phase === 'done') { setI(0); setPaused(false) } else { setPaused((p) => !p); stopSpeaking() } },
    restart: () => { setI(0); setPaused(false) },
    voice, setVoice, big, setBig,
  }
}

export type Demo = ReturnType<typeof useEarthDemo>

// Camera stand-in: the drawn person; `arrow` shows the knee-out arrow on the body.
export function Backdrop({ arrow = false }: { arrow?: boolean }) {
  return <SimulatedCamera theme="earth" height={470} figureHeight={430} arrow={arrow} /> // sized for the framed camera, so the whole body fits
}

// One icon set, one stroke. No emoji.
const PATHS = {
  check: 'M5 12.5 10 17.5 19 7.5',
  alert: 'M12 6.5v7M12 17.5v.5',
  pause: 'M9 6v12M15 6v12',
  play: 'M8 5.5v13l11-6.5Z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  speaker: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4ZM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11',
  replay: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v3.7h3.7',
  up: 'M12 19V5M6 11l6-6 6 6',
  right: 'M5 12h14M13 6l6 6-6 6',
  person: 'M12 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 7.5v7M8 10.5h8M12 14.5l-3 6M12 14.5l3 6',
} as const
export function Icon({ name, size = 24 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg className="pe-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} fill={name === 'play' ? 'currentColor' : 'none'} />
    </svg>
  )
}

// What the screen says, in an instructor's plain words. kind drives the colour of the result band.
export type Kind = 'idle' | 'learn' | 'good' | 'fix' | 'done'
export function say(s: DemoState): { kind: Kind; title: string; line: string } {
  if (s.phase === 'away') return { kind: 'idle', title: 'Step into the frame', line: 'Whole body visible, 2–3 steps back.' }
  if (s.phase === 'done') return { kind: 'done', title: 'Set complete', line: `${s.good} of ${TOTAL} reps on target.` }
  if (s.phase !== 'result' || !s.verdict) return { kind: 'idle', title: s.rep ? 'Next rep' : 'Start when ready', line: s.rep ? 'Same as before, nice and slow.' : 'Stand tall, bend your knees, come up slowly.' }
  if (s.verdict.kind === 'learning') return { kind: 'learn', title: `Rep ${s.rep} · Learning your normal`, line: `${s.rep} of 3. Move the way you usually do.` }
  if (s.verdict.kind === 'good') return { kind: 'good', title: `Rep ${s.rep} · On target`, line: 'Same as your normal.' }
  return { kind: 'fix', title: s.cue.title, line: `Rep ${s.rep} · ${s.cue.hint}.` }
}

// Top bar: pause/resume, one segment per rep (coloured by result), rep count, settings.
export function TopBar({ d, onSettings }: { d: Demo; onSettings: () => void }) {
  const { s } = d
  return (
    <header className="pe-top">
      <button type="button" className="pe-icon-btn" aria-label={s.paused ? 'Resume' : 'Pause'} onClick={d.toggle}><Icon name={s.paused ? 'play' : 'pause'} /></button>
      <div className="pe-segs" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={s.rep} aria-label="Reps">
        {Array.from({ length: TOTAL }, (_, k) => <i key={k} data-r={s.history[k]} />)}
      </div>
      <span className="pe-count"><b className="tabular">{s.rep}</b>/{TOTAL}</span>
      <button type="button" className="pe-icon-btn" aria-label="Settings" onClick={onSettings}><Icon name="gear" /></button>
    </header>
  )
}

// The camera, framed inside the page. Children are drawn on top of it (marks, labels).
export function Frame({ arrow, children, label }: { arrow?: boolean; children?: ReactNode; label?: string }) {
  return (
    <div className="pe-frame">
      <Backdrop arrow={arrow} />
      {label && <span className="pe-frame-label">{label}</span>}
      {children}
    </div>
  )
}

// Shared settings sheet: voice and bigger text really work; replay restarts the set.
export function SettingsSheet({ d, open, onClose }: { d: Demo; open: boolean; onClose: () => void }) {
  return (
    <div className="pe-sheet" data-open={open || undefined} inert={!open} role="dialog" aria-modal="true" aria-label="Settings">
      <button type="button" className="pe-scrim" aria-label="Close settings" onClick={onClose} />
      <div className="pe-sheet-body">
        <h2>Settings</h2>
        <button type="button" role="switch" aria-checked={d.voice} className="pe-row" onClick={() => d.setVoice(!d.voice)}>Speak the tips<span className="pe-switch" data-on={d.voice || undefined} /></button>
        <button type="button" role="switch" aria-checked={d.big} className="pe-row" onClick={() => d.setBig(!d.big)}>Bigger text<span className="pe-switch" data-on={d.big || undefined} /></button>
        <button type="button" className="pe-row" onClick={() => { d.restart(); onClose() }}>Start the set again<Icon name="replay" /></button>
        <button type="button" className="pe-btn" onClick={onClose}>Done</button>
      </div>
    </div>
  )
}

// The one full-width action at the bottom.
export function MainButton({ d, tone }: { d: Demo; tone?: Kind }) {
  const { s } = d
  return (
    <button type="button" className="pe-btn" data-tone={tone} onClick={d.toggle}>
      {s.phase === 'done' ? 'Start another set' : s.paused ? 'Resume' : 'Pause'}
    </button>
  )
}
