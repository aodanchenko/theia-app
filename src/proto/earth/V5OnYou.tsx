// Variant 5 · On you: the correction is marked on the body in the frame; the text below stays short.
import { useState } from 'react'
import { Frame, Icon, MainButton, say, SettingsSheet, TopBar, useEarthDemo } from './demo.tsx'

export default function V5OnYou() {
  const d = useEarthDemo()
  const { s } = d
  const [settings, setSettings] = useState(false)
  const t = say(s)
  const fix = s.phase === 'result' && s.verdict?.kind === 'fix' ? s.verdict.feature : null
  return (
    <div className="pe o5">
      <TopBar d={d} onSettings={() => setSettings(true)} />
      <Frame arrow={fix === 'kneeWidth'} label={s.activity !== 'away' && s.phase !== 'done' ? s.label : undefined}>
        {fix === 'kneeWidth' && <span key={s.seq} className="o5-tag pe-in" style={{ left: '56%', top: '56%' }}>Knee out<Icon name="right" size={18} /></span>}
        {fix === 'trunkLean' && <span key={s.seq} className="o5-tag pe-in" style={{ left: '54%', top: '24%' }}>Chest up<Icon name="up" size={18} /></span>}
        {t.kind === 'good' && <span key={s.seq} className="o5-ok pe-in" style={{ left: '50%', top: '44%' }}><Icon name="check" size={36} /></span>}
        {s.activity === 'away' && <span className="o5-spot" aria-hidden="true" />}
        {s.activity === 'away' && <svg className="o5-feet" viewBox="0 0 120 80" aria-hidden="true"><path d="M30 8c9 0 14 12 13 26s-5 24-12 24-12-9-12-23S21 8 30 8Zm-2 56c6 0 9 3 9 8s-4 8-9 8-9-3-9-8 3-8 9-8Z" /><path d="M90 8c-9 0-14 12-13 26s5 24 12 24 12-9 12-23S99 8 90 8Zm2 56c-6 0-9 3-9 8s4 8 9 8 9-3 9-8-3-8-9-8Z" /></svg>}
      </Frame>
      <section className="o5-note" data-kind={t.kind} role="status" aria-live="polite">
        <p className="pe-title">{t.title}</p>
        <p className="pe-line">{t.line}</p>
      </section>
      <MainButton d={d} />
      <SettingsSheet d={d} open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
