// Variant 5 · On you: the correction is drawn on the body, with a short label next to the joint. Text panels stay tiny.
import { useState } from 'react'
import { Backdrop, Gear, SettingsSheet, TOTAL, useEarthDemo } from './demo.tsx'

export default function V5OnYou() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const fix = s.phase === 'result' && s.verdict?.kind === 'fix' ? s.verdict.feature : null
  const good = s.phase === 'result' && s.verdict?.kind === 'good'
  return (
    <div className="o5">
      <div className="o5-cam"><Backdrop arrow={fix === 'kneeWidth'} /></div>
      {fix === 'kneeWidth' && <span key={s.seq} className="o5-tag pe-pop" style={{ left: '58%', top: '53%' }}>Knee out →</span>}
      {fix === 'trunkLean' && (
        <>
          <svg key={`a${s.seq}`} className="o5-arrow pe-pop" viewBox="0 0 60 80" style={{ left: '46%', top: '24%' }} aria-hidden="true"><path d="M30 74V12M14 28 30 10l16 18" /></svg>
          <span key={s.seq} className="o5-tag pe-pop" style={{ left: '58%', top: '27%' }}>Chest up ↑</span>
        </>
      )}
      {good && <span key={s.seq} className="o5-good pe-pop" style={{ left: '50%', top: '42%' }} aria-hidden="true">✓</span>}
      {s.activity === 'away' && <div className="o5-ghost" aria-hidden="true"><span>Stand here</span></div>}

      <header className="o5-top">
        {s.activity !== 'away' && s.phase !== 'done' ? <span className="o5-label" role="status">{s.label}</span> : <span />}
        <Gear onClick={() => setSettings(true)} />
      </header>
      <footer className="o5-bottom">
        <div className="o5-note" role="status" aria-live="polite">
          <p className="o5-title">{good ? 'Good rep' : s.cue.title}</p>
          <p className="o5-hint">{s.cue.hint}</p>
        </div>
        <div className="o5-controls">
          <span className="o5-count" aria-label={`${s.rep} of ${TOTAL} reps`}><b className="tabular">{s.rep}</b><small>of {TOTAL}</small></span>
          <button type="button" className="pe-chunky o5-go" data-primary={s.paused || s.phase === 'done' || undefined} onClick={d.toggle}>{s.phase === 'done' ? 'Again' : s.paused ? 'Go' : 'Pause'}</button>
        </div>
      </footer>
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
