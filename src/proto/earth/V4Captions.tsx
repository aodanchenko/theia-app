// Variant 4 · Captions: voice-first. The coach's words as big subtitles; a speaking indicator; almost no chrome.
import { useState } from 'react'
import { Backdrop, Gear, SettingsSheet, TOTAL, useEarthDemo } from './demo.tsx'

export default function V4Captions() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const talking = (s.phase === 'result' || s.phase === 'ready' || s.phase === 'away' || s.phase === 'done') && !s.paused
  const line = s.phase === 'result' && s.verdict?.kind === 'learning' ? `${s.cue.title}. ${s.cue.hint}.` : `${s.cue.title}. ${s.cue.hint}`
  return (
    <div className="c4">
      <div className="c4-cam"><Backdrop /></div>
      <header className="c4-top">
        <span className="c4-rep"><b className="tabular">{s.rep}</b> of {TOTAL}</span>
        <Gear onClick={() => setSettings(true)} />
      </header>
      <section className="c4-caption" role="status" aria-live="polite">
        <span className="c4-who"><span className="c4-wave" data-on={talking || undefined} aria-hidden="true"><i /><i /><i /><i /></span>Coach{s.activity !== 'away' && s.phase !== 'done' ? ` · you're ${s.label.toLowerCase()}` : ''}</span>
        <p key={line} className="c4-line">{line}</p>
      </section>
      <footer className="c4-bottom">
        <button type="button" className="c4-voice" aria-pressed={d.voice} onClick={() => d.setVoice(!d.voice)}>{d.voice ? 'Voice on' : 'Voice off'}</button>
        <button type="button" className="c4-play" aria-label={s.phase === 'done' ? 'Do another set' : s.paused ? 'Resume' : 'Pause'} onClick={d.toggle}>{s.phase === 'done' ? '↺' : s.paused ? '▶' : 'II'}</button>
      </footer>
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
