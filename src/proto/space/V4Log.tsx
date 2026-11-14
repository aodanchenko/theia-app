// Variant 4 · Log console: run controls on top, an inspector with collapsible sections, a live event log at the bottom.
import { useState, type ReactNode } from 'react'
import ModelCheck from '../../components/space/ModelCheck.tsx'
import ParameterSheet from '../../components/space/ParameterSheet.tsx'
import Recommendation from '../../components/space/Recommendation.tsx'
import RepChart from '../../components/space/RepChart.tsx'
import VitalsGrid from '../../components/space/VitalsGrid.tsx'
import { VITALS } from '../../data/demo.ts'
import { EVAL } from '../../engine/squatModel.ts'
import { CAL, Cam, LIMIT, LIMITS, S, TOTAL, useDemo } from './demo.tsx'

export default function V4Log() {
  const d = useDemo()
  const [filter, setFilter] = useState<'all' | 'flags'>('all')
  const lines = d.log.filter((l) => filter === 'all' || l.state === 'flagged')

  return (
    <div className="v4">
      <header className="v4-top">
        <b>THEIA</b>
        <div className="v4-run" role="toolbar">
          <button type="button" className="p-btn" data-camera={!d.camera || undefined} onClick={d.toggleCamera}>{d.camera ? '■ Stop' : '● Record'}</button>
          <button type="button" className="p-btn" onClick={d.next}>▸ Next rep</button>
          <button type="button" className="p-btn" onClick={d.reset}>↺ Reset baseline</button>
          <button type="button" className="p-btn" onClick={d.download}>⤓ Export CSV</button>
        </div>
        <span className="v4-crumb">{S.file} › set {S.set} › rep {d.rep}/{TOTAL}</span>
      </header>

      <main className="v4-main">
        <div className="v4-cam"><Cam d={d} width={520} height={440} /></div>
        <aside className="v4-inspector">
          <Recommendation {...d.rec} basis={d.basis} id={d.rep} />
          <Section title="Parameters" open><ParameterSheet rows={d.rows} /></Section>
          <Section title="R knee valgus by rep" open><RepChart values={d.values} total={TOTAL} limits={LIMITS} label="R knee valgus per rep" /></Section>
          <Section title="Model check"><ModelCheck rows={[{ label: 'Textbook', caught: EVAL.base.caught }, { label: 'Rehab, population', caught: EVAL.rehab.caught }, { label: 'Personal + rehab', caught: EVAL.personal.caught, ours: true }]} caption="Bad reps caught at 10% false alerts." /></Section>
          <Section title="Vitals · simulated"><VitalsGrid vitals={VITALS} /></Section>
        </aside>
        <section className="v4-console">
          <div className="v4-console-bar">
            <b>Event log</b>
            <button type="button" className="p-toggle" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All {d.log.length}</button>
            <button type="button" className="p-toggle" aria-pressed={filter === 'flags'} onClick={() => setFilter('flags')}>Flags {d.flags}</button>
            <span className="v4-hint">known cause: {S.knownCause} · video stays on device</span>
          </div>
          <ol className="v4-lines">
            {lines.length === 0 && <li className="v4-empty">No reps yet. Squat in view of the camera, or press Next rep.</li>}
            {lines.map((l) => (
              <li key={l.rep} data-state={l.state}>
                <span className="v4-t">{l.t}</span>
                <span className="v4-lvl">{l.state === 'flagged' ? 'FLAG' : l.state === 'calibrating' ? 'CAL ' : 'OK  '}</span>
                REP {String(l.rep).padStart(2, '0')} · R valgus {l.value}°
                {l.rep <= CAL ? ' · baseline' : l.value >= LIMIT ? ` ≥ ${LIMIT}° rehab limit → knees out` : ' · within baseline'}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  )
}

function Section({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="v4-section" open={open}>
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  )
}
