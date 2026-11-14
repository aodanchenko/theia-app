// Variant 1 · Desktop app: menu bar, toolbar, sheet tabs and status bar are back, and every one of them works.
import { useState } from 'react'
import ModelCheck from '../../components/space/ModelCheck.tsx'
import Panel from '../../components/space/Panel.tsx'
import ParameterSheet from '../../components/space/ParameterSheet.tsx'
import Recommendation from '../../components/space/Recommendation.tsx'
import RepChart from '../../components/space/RepChart.tsx'
import VitalsGrid from '../../components/space/VitalsGrid.tsx'
import { VITALS } from '../../data/demo.ts'
import { EVAL } from '../../engine/squatModel.ts'
import { Cam, LIMITS, Menu, S, TOTAL, useDemo } from './demo.tsx'

const TABS = ['Live', 'Rep log', 'Model check', 'Vitals'] as const

export default function V1Desktop() {
  const d = useDemo()
  const [menu, setMenu] = useState<string | null>(null)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Live')
  const [tags, setTags] = useState(true)
  const [compare, setCompare] = useState(true)
  const limits = compare ? LIMITS : { ...LIMITS, base: undefined }

  return (
    <div className="v1" onClick={(e) => { if (!(e.target as HTMLElement).closest('.p-menu')) setMenu(null) }}>
      <nav className="v1-menubar" data-menus-open={menu ? true : undefined}>
        <b>THEIA Workbench</b>
        <Menu label="Session" open={menu === 'Session'} onOpen={setMenu} items={[
          { label: 'Next rep (demo)', hint: 'N', on: d.next },
          { label: 'Reset baseline', hint: '⇧R', on: d.reset },
        ]} />
        <Menu label="Data" open={menu === 'Data'} onOpen={setMenu} items={[{ label: 'Export reps as CSV', hint: '⌘E', on: d.download }]} />
        <Menu label="View" open={menu === 'View'} onOpen={setMenu} items={[
          { label: 'Joint tags on camera', checked: tags, on: () => setTags(!tags) },
          { label: 'Compare with base model', checked: compare, on: () => setCompare(!compare) },
          ...TABS.map((t) => ({ label: `Sheet: ${t}`, checked: tab === t, on: () => setTab(t) })),
        ]} />
        <Menu label="Help" open={menu === 'Help'} onOpen={setMenu} items={[{ label: 'How the model decides', on: () => setTab('Model check') }]} />
        <span className="v1-file">{S.file}</span>
      </nav>

      <div className="v1-toolbar" role="toolbar">
        <button type="button" className="p-btn" data-camera={!d.camera || undefined} onClick={d.toggleCamera}>{d.camera ? 'Stop camera' : 'Enable camera'}</button>
        <button type="button" className="p-btn" onClick={d.next}>Next rep</button>
        <span className="v1-sep" />
        <button type="button" className="p-toggle" aria-pressed={tags} onClick={() => setTags(!tags)}>Tags</button>
        <button type="button" className="p-toggle" aria-pressed={compare} onClick={() => setCompare(!compare)}>Compare base model</button>
        <span className="v1-sep" />
        <span className="p-field"><small>Baseline</small>personal · {S.baselineSessions} sessions</span>
        <span className="p-field"><small>Known cause</small>{S.knownCause}</span>
      </div>

      <main className="v1-main">
        <div className="v1-cam"><Cam d={d} showTags={tags} /></div>
        <div className="v1-side">
          <Recommendation {...d.rec} basis={d.basis} id={d.rep} />
          {tab === 'Live' && (
            <>
              <ParameterSheet rows={d.rows} />
              <Panel title={`R knee valgus by rep · set ${S.set}`} note="SIMULATED"><RepChart values={d.values} total={TOTAL} limits={limits} label="R knee valgus per rep" /></Panel>
            </>
          )}
          {tab === 'Rep log' && <RepLog d={d} />}
          {tab === 'Model check' && (
            <Panel title="Rehab model check · deep squat" note="UI-PRMD">
              <ModelCheck rows={[{ label: 'Textbook thresholds', caught: EVAL.base.caught }, { label: 'Rehab data, population', caught: EVAL.rehab.caught }, { label: 'Personal baseline only', caught: EVAL.personalBase.caught }, { label: 'Personal + rehab data', caught: EVAL.personal.caught, ours: true }]} caption="Incorrect reps caught at 10% false alerts, people held out." />
            </Panel>
          )}
          {tab === 'Vitals' && <Panel title="Vitals" note="SIMULATED"><VitalsGrid vitals={VITALS} /></Panel>}
        </div>
      </main>

      <footer className="v1-status">
        <span>REP {d.rep}/{TOTAL}</span><span>LOAD {S.loadKg} KG</span><span>FLAGS {d.flags}</span><span>VIDEO ON DEVICE</span>
        <span className="v1-next">Next: {d.state === 'flagged' ? 'knees out · repeat the rep' : 'continue the set'}</span>
      </footer>
      <nav className="v1-tabs">{TABS.map((t) => <button key={t} type="button" aria-current={tab === t || undefined} onClick={() => setTab(t)}>{t}</button>)}</nav>
    </div>
  )
}

export function RepLog({ d }: { d: ReturnType<typeof useDemo> }) {
  return (
    <table className="p-log">
      <thead><tr><th>Rep</th><th>Time</th><th className="n">R valgus</th><th>Phase</th><th>Verdict</th></tr></thead>
      <tbody>
        {d.log.map((l) => (
          <tr key={l.rep} data-flag={l.state === 'flagged' || undefined}>
            <td className="n">{l.rep}</td><td>{l.t}</td><td className="n">{l.value}°</td>
            <td>{l.state === 'calibrating' ? 'baseline' : 'scored'}</td><td>{l.state === 'flagged' ? '▲ knees out' : l.state === 'good' ? '✓ good' : '–'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
