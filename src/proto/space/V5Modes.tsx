// Variant 5 · Two modes: EXERCISE (glance from the rack: camera, huge cue, rep count) and REVIEW (the full workbench).
import { useState } from 'react'
import ModelCheck from '../../components/space/ModelCheck.tsx'
import Panel from '../../components/space/Panel.tsx'
import ParameterSheet from '../../components/space/ParameterSheet.tsx'
import Recommendation from '../../components/space/Recommendation.tsx'
import RepChart from '../../components/space/RepChart.tsx'
import VitalsGrid from '../../components/space/VitalsGrid.tsx'
import { VITALS } from '../../data/demo.ts'
import { EVAL } from '../../engine/squatModel.ts'
import { Cam, LIMITS, S, TOTAL, useDemo } from './demo.tsx'
import { RepLog } from './V1Desktop.tsx'

export default function V5Modes() {
  const d = useDemo()
  const [mode, setMode] = useState<'exercise' | 'review'>('exercise')

  return (
    <div className="v5" data-mode={mode}>
      <header className="v5-top">
        <b>THEIA Workbench</b>
        <div className="v5-switch" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'exercise'} onClick={() => setMode('exercise')}>Exercise</button>
          <button type="button" role="tab" aria-selected={mode === 'review'} onClick={() => setMode('review')}>Review</button>
        </div>
        <div className="v5-actions">
          <button type="button" className="p-btn" data-camera={!d.camera || undefined} onClick={d.toggleCamera}>{d.camera ? 'Stop camera' : 'Enable camera'}</button>
          <button type="button" className="p-btn" onClick={() => { d.next(); if (d.rep + 1 === TOTAL) setMode('review') }}>Next rep</button>
          {mode === 'review' && <><button type="button" className="p-btn" onClick={d.reset}>Reset baseline</button><button type="button" className="p-btn" onClick={d.download}>Export CSV</button></>}
        </div>
        <span className="v5-file">{S.file}</span>
      </header>

      {mode === 'exercise' ? (
        <main className="v5-ex">
          <div className="v5-cam"><Cam d={d} width={620} height={640} /></div>
          <div className="v5-glance" data-tone={d.rec.tone}>
            <small>{d.rec.tone === 'alert' ? '▲ ' : d.rec.tone === 'good' ? '✓ ' : ''}{d.rec.decision}</small>
            <b key={d.rep} className="enter">{d.rec.action}</b>
            <span>{d.rec.reason}</span>
            <div className="v5-count"><b>{d.rep}</b><span>/ {TOTAL} reps</span></div>
            <div className="v5-dots" aria-label={`Reps: ${d.flags} flagged`}>
              {Array.from({ length: TOTAL }, (_, i) => <i key={i} data-state={i >= d.values.length ? 'todo' : i < 3 ? 'cal' : d.values[i] >= LIMITS.rehab ? 'flag' : 'good'} />)}
            </div>
          </div>
        </main>
      ) : (
        <main className="v5-rev">
          <div className="v5-col">
            <Recommendation {...d.rec} basis={d.basis} id={d.rep} />
            <ParameterSheet rows={d.rows} />
            <Panel title="Rep log"><RepLog d={d} /></Panel>
          </div>
          <div className="v5-col">
            <Panel title={`R knee valgus by rep · set ${S.set}`} note="SIMULATED"><RepChart values={d.values} total={TOTAL} limits={LIMITS} label="R knee valgus per rep" /></Panel>
            <Panel title="Rehab model check" note="UI-PRMD"><ModelCheck rows={[{ label: 'Textbook thresholds', caught: EVAL.base.caught }, { label: 'Rehab data, population', caught: EVAL.rehab.caught }, { label: 'Personal + rehab data', caught: EVAL.personal.caught, ours: true }]} caption="Bad reps caught at 10% false alerts, people held out." /></Panel>
            <Panel title="Vitals" note="SIMULATED"><VitalsGrid vitals={VITALS} /></Panel>
          </div>
        </main>
      )}

      <footer className="v5-status">
        <span>{mode === 'exercise' ? 'EXERCISE MODE · glance from the rack' : 'REVIEW MODE'}</span><span>REP {d.rep}/{TOTAL}</span><span>FLAGS {d.flags}</span><span>KNOWN CAUSE {S.knownCause}</span>
        <span className="v5-next">Next: {d.state === 'flagged' ? 'knees out · repeat the rep' : d.rep === TOTAL ? 'set done · review' : 'continue'}</span>
      </footer>
    </div>
  )
}
