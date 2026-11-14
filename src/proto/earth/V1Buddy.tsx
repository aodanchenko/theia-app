// Variant 1 · Buddy: an original sun-shaped coach character says each cue in a speech bubble and reacts to it.
import { useState } from 'react'
import { Backdrop, Gear, SettingsSheet, TOTAL, useEarthDemo, type DemoState } from './demo.tsx'

type Mood = 'look' | 'calm' | 'happy' | 'think' | 'cheer'
const mood = (s: DemoState): Mood => s.phase === 'away' ? 'look' : s.phase === 'done' ? 'cheer' : s.phase === 'result' && s.verdict?.kind === 'good' ? 'happy' : s.phase === 'result' && s.verdict?.kind === 'fix' ? 'think' : 'calm'

function Sol({ m }: { m: Mood }) {
  const eyes = m === 'happy' || m === 'cheer'
    ? <><path d="M30 44q5-6 10 0" /><path d="M54 44q5-6 10 0" /></>
    : m === 'look' ? <><circle cx="31" cy="44" r="4" /><circle cx="55" cy="44" r="4" /></>
    : <><circle cx="35" cy="44" r="4" /><circle cx="59" cy="44" r="4" /></>
  return (
    <svg className="b1-sol" data-mood={m} viewBox="0 0 94 94" role="img" aria-label={`Coach Sol looks ${m === 'think' ? 'thoughtful' : m === 'look' ? 'like it is looking for you' : 'happy'}`}>
      <g className="b1-rays">{Array.from({ length: 10 }, (_, k) => <rect key={k} x="44" y="0" width="6" height="14" rx="3" transform={`rotate(${k * 36} 47 47)`} />)}</g>
      <circle cx="47" cy="47" r="32" className="b1-face" />
      <g className="b1-eyes">{eyes}</g>
      {m === 'think' ? <circle className="b1-mouth" cx="47" cy="61" r="4" /> : <path className="b1-mouth" d={m === 'cheer' ? 'M34 58q13 14 26 0Z' : 'M36 59q11 9 22 0'} />}
      {m === 'think' && <><path className="b1-brow" d="M29 35q5-5 11-3" /><path className="b1-brow" d="M65 35q-5-5-11-3" /></>}
    </svg>
  )
}

export default function V1Buddy() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const m = mood(s)
  return (
    <div className="b1">
      <div className="b1-cam"><Backdrop /></div>
      <header className="b1-top">
        <div className="b1-progress" aria-label={`${s.rep} of ${TOTAL} reps`}>
          {Array.from({ length: TOTAL }, (_, k) => <i key={k} data-state={k < s.history.length ? s.history[k] : undefined} />)}
        </div>
        <Gear onClick={() => setSettings(true)} />
      </header>
      {s.activity !== 'away' && s.phase !== 'done' && <p className="b1-label" role="status">{s.label}</p>}

      <section className="b1-card" data-mood={m}>
        <div key={`${s.seq}-${s.phase}`} className={m === 'happy' || m === 'cheer' ? 'b1-bounce' : undefined}><Sol m={m} /></div>
        <div className="b1-bubble" role="status" aria-live="polite">
          <p key={s.cue.title} className="b1-title">{s.cue.title}</p>
          <p className="b1-hint">{s.cue.hint}</p>
        </div>
        {s.phase === 'done'
          ? <div className="b1-stats"><span><b>{s.good}</b> good</span><span><b>{s.fixes}</b> tips</span><span><b>{TOTAL}</b> reps</span></div>
          : null}
        <button type="button" className="pe-chunky b1-go" data-primary={s.paused || s.phase === 'done' || undefined} onClick={d.toggle}>
          {s.phase === 'done' ? 'Do another set' : s.paused ? 'Keep going' : 'Pause'}
        </button>
      </section>
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
