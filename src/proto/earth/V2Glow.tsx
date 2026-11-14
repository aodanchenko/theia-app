// Variant 2 · Glow: read from across the room. The screen edge glows by state; one huge symbol and word.
import { useState } from 'react'
import { Backdrop, Gear, SettingsSheet, TOTAL, useEarthDemo, type DemoState } from './demo.tsx'

const tone = (s: DemoState) => s.phase === 'away' ? 'idle' : s.phase === 'done' ? 'good' : s.phase === 'result' && s.verdict?.kind === 'good' ? 'good' : s.phase === 'result' && s.verdict?.kind === 'fix' ? 'fix' : 'live'
const SYMBOL = { idle: '?', live: '•', good: '✓', fix: '!' } as const

export default function V2Glow() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const t = tone(s)
  const word = s.phase === 'result' && s.verdict?.kind === 'learning' ? `Rep ${s.rep}` : s.cue.title
  return (
    <div className="g2" data-tone={t}>
      <div className="g2-cam"><Backdrop arrow={s.phase === 'result' && s.verdict?.kind === 'fix' && s.verdict.feature === 'kneeWidth'} /></div>
      <div className="g2-ring" aria-hidden="true" />
      <header className="g2-top">
        <span className="g2-count"><b className="tabular">{s.rep}</b>/{TOTAL}</span>
        {s.activity !== 'away' && s.phase !== 'done' && <span className="g2-label" role="status">{s.label}</span>}
        <Gear onClick={() => setSettings(true)} />
      </header>
      <section className="g2-say" role="status" aria-live="polite">
        <span key={`${s.seq}-${t}`} className="g2-symbol pe-pop" aria-hidden="true">{SYMBOL[t]}</span>
        <p className="g2-word">{word}</p>
        <p className="g2-hint">{s.cue.hint}</p>
      </section>
      <button type="button" className="g2-pause" aria-label={s.phase === 'done' ? 'Do another set' : s.paused ? 'Resume' : 'Pause'} onClick={d.toggle}>
        {s.phase === 'done' ? '↺' : s.paused ? '▶' : 'II'}
      </button>
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
