// Variant 3 · Path: lesson-like progress. Thick progress bar, "in a row" combo, a result banner per rep, a lesson-complete summary.
import { useState } from 'react'
import { Backdrop, Gear, SettingsSheet, TOTAL, useEarthDemo } from './demo.tsx'

export default function V3Path() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const banner = s.phase === 'result' && s.verdict
    ? s.verdict.kind === 'good' ? 'good' : s.verdict.kind === 'fix' ? 'fix' : 'learn'
    : null

  if (s.phase === 'done') {
    return (
      <div className="p3 p3-done">
        <div className="p3-medal pe-pop" aria-hidden="true">★</div>
        <h1>Set complete!</h1>
        <p>{s.cue.hint}</p>
        <div className="p3-tiles">
          <div className="p3-tile" data-c="green"><small>Good reps</small><b>{s.good}</b></div>
          <div className="p3-tile" data-c="orange"><small>Tips</small><b>{s.fixes}</b></div>
          <div className="p3-tile" data-c="blue"><small>Total</small><b>{TOTAL}</b></div>
        </div>
        <button type="button" className="pe-chunky" data-primary onClick={d.toggle}>Do another set</button>
      </div>
    )
  }
  return (
    <div className="p3">
      <div className="p3-cam"><Backdrop arrow={banner === 'fix' && s.verdict?.kind === 'fix' && s.verdict.feature === 'kneeWidth'} /></div>
      <header className="p3-top">
        <button type="button" className="p3-x" aria-label={s.paused ? 'Resume' : 'Pause'} onClick={d.toggle}>{s.paused ? '▶' : 'II'}</button>
        <div className="p3-bar" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={s.rep} aria-label="Reps done"><i style={{ width: `${(s.rep / TOTAL) * 100}%` }} /></div>
        <Gear onClick={() => setSettings(true)} />
      </header>
      <div className="p3-chips">
        {s.activity !== 'away' && <span className="p3-chip" role="status">{s.label}</span>}
        {s.streak >= 2 && <span key={s.streak} className="p3-chip p3-combo pe-pop"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1c1 3 4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-4 0-7Z" /></svg>{s.streak} in a row</span>}
      </div>
      {!banner && (
        <div className="p3-prompt" role="status" aria-live="polite">
          <p className="p3-title">{s.cue.title}</p>
          <p className="p3-hint">{s.cue.hint}</p>
        </div>
      )}
      {banner && (
        <section key={s.seq} className="p3-banner" data-kind={banner} role="status" aria-live="polite">
          <div className="p3-banner-head">
            <span className="p3-badge" aria-hidden="true">{banner === 'good' ? '✓' : banner === 'fix' ? '!' : s.rep}</span>
            <p className="p3-title">{banner === 'good' ? 'Nice!' : s.cue.title}</p>
            {banner === 'good' && <span className="p3-plus pe-pop">+1</span>}
          </div>
          <p className="p3-hint">{s.cue.hint}</p>
        </section>
      )}
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
