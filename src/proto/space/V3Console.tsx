// Variant 3 · Mission console: annunciator lamps, lit pushbuttons, a guarded reset, master caution, recessed readouts.
import { useEffect, useState } from 'react'
import Panel from '../../components/space/Panel.tsx'
import ParameterSheet from '../../components/space/ParameterSheet.tsx'
import RepChart from '../../components/space/RepChart.tsx'
import VitalsGrid from '../../components/space/VitalsGrid.tsx'
import { VITALS } from '../../data/demo.ts'
import { CAL, Cam, LIMITS, S, TOTAL, useClock, useDemo } from './demo.tsx'

export default function V3Console() {
  const d = useDemo()
  const met = useClock()
  const [guard, setGuard] = useState(false)
  const [ack, setAck] = useState<number | null>(null)
  useEffect(() => { if (!guard) return; const id = setTimeout(() => setGuard(false), 4000); return () => clearTimeout(id) }, [guard])
  const caution = d.state === 'flagged' && ack !== d.rep
  const lamps: [string, 'green' | 'amber' | 'red' | 'white', boolean][] = [
    ['CAMERA', 'white', d.camera],
    ['POSE LOCK', 'green', d.camera],
    ['CALIB', 'amber', d.state === 'calibrating'],
    ['BASELINE', 'green', d.rep > CAL],
    ['FLAG', 'red', d.state === 'flagged'],
    ['ON DEVICE', 'white', true],
  ]

  return (
    <div className="v3">
      <header className="v3-top">
        <b>THEIA</b><span className="v3-sub">ARED · SQUAT · SET {S.set}</span>
        <span className="v3-met"><small>MET</small>{met}</span>
        <span className="v3-file">{S.file}</span>
      </header>
      <div className="v3-panel">
        <div className="v3-buttons">
          <button type="button" className="v3-push" aria-pressed={d.camera} onClick={d.toggleCamera}><span>CAMERA</span><span className="v3-leg">{d.camera ? 'ON' : 'OFF'}</span></button>
          <button type="button" className="v3-push" onClick={d.next}><span>NEXT</span><span className="v3-leg">REP</span></button>
          <div className="v3-guarded" data-open={guard || undefined}>
            <button type="button" className="v3-push" disabled={!guard} onClick={() => { d.reset(); setGuard(false) }}><span>RESET</span><span className="v3-leg">BASELINE</span></button>
            <button type="button" className="v3-cover" aria-label={guard ? 'Close guard' : 'Lift guard to reset baseline'} onClick={() => setGuard(!guard)}>{guard ? '' : <span>GUARD</span>}</button>
          </div>
          <button type="button" className="v3-push" onClick={d.download}><span>EXPORT</span><span className="v3-leg">CSV</span></button>
        </div>
        <div className="v3-lamps" role="status" aria-label="Status lamps">
          {lamps.map(([label, color, on]) => <span key={label} className="v3-lamp" data-color={color} data-on={on || undefined}>{label}</span>)}
        </div>
      </div>

      <main className="v3-main">
        <div className="v3-cam">
          <Cam d={d} />
          <div className="v3-readouts">
            <span className="v3-window"><small>REP</small><b>{String(d.rep).padStart(2, '0')}/{TOTAL}</b></span>
            <span className="v3-window"><small>R VALGUS</small><b>{String(d.last).padStart(2, '0')}°</b></span>
            <span className="v3-window"><small>FLAGS</small><b>{String(d.flags).padStart(2, '0')}</b></span>
          </div>
        </div>
        <div className="v3-side">
          <section className="v3-card" data-tone={d.rec.tone}>
            <button type="button" className="v3-master" data-on={caution || undefined} disabled={!caution} onClick={() => setAck(d.rep)} aria-label="Master caution, press to acknowledge">MASTER<br />CAUTION</button>
            <div className="v3-card-text">
              <small>{d.rec.tone === 'alert' ? '▲ ' : d.rec.tone === 'good' ? '✓ ' : ''}{d.rec.decision}</small>
              <b>{d.rec.action}</b>
              <span>{d.rec.reason}</span>
              <em>{d.basis}</em>
            </div>
          </section>
          <ParameterSheet rows={d.rows} />
          <Panel title="R knee valgus by rep" note="SIMULATED"><RepChart values={d.values} total={TOTAL} limits={LIMITS} label="R knee valgus per rep" /></Panel>
          <Panel title="Vitals" note="SIMULATED"><VitalsGrid vitals={VITALS} /></Panel>
        </div>
      </main>
    </div>
  )
}
