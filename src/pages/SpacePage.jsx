import SimulatedCamera from '../components/SimulatedCamera.jsx'
import CameraPanel from '../components/space/CameraPanel.jsx'
import FormulaBar from '../components/space/FormulaBar.jsx'
import MenuBar from '../components/space/MenuBar.jsx'
import Panel from '../components/space/Panel.jsx'
import ParameterSheet from '../components/space/ParameterSheet.jsx'
import RepChart from '../components/space/RepChart.jsx'
import SheetTabs from '../components/space/SheetTabs.jsx'
import StatusBar from '../components/space/StatusBar.jsx'
import { ToolChip, Toolbar, ToolSeparator } from '../components/space/Toolbar.jsx'
import VitalsGrid from '../components/space/VitalsGrid.jsx'
import Workbench from '../components/space/Workbench.jsx'
import { OVERLAY_TAGS, PARAMETERS, SESSION, VALGUS_BY_REP, VALGUS_LIMITS, VITALS } from '../data/demo.js'

const s = SESSION

export default function SpacePage() {
  return (
    <Workbench
      menu={<MenuBar title="THEIA Workbench" items={['File', 'Edit', 'View', 'Data', 'Model', 'Help']} file={s.file} />}
      toolbar={
        <Toolbar>
          <ToolChip active live>Live</ToolChip>
          <ToolChip>Pause</ToolChip>
          <ToolSeparator />
          <ToolChip>Baseline: personal ({s.baselineSessions} sessions)</ToolChip>
          <ToolChip active>Model: {s.model}</ToolChip>
          <ToolChip>Compare: base model</ToolChip>
          <ToolSeparator />
          <ToolChip>Known cause: {s.knownCause}</ToolChip>
        </Toolbar>
      }
      camera={
        <CameraPanel cue={s.cue} caption={['CAM 1 · FRONT · 30 FPS', `SET ${s.set} · REP ${s.rep}/${s.reps} · ${s.loadKg} KG`]}>
          <SimulatedCamera theme="space" width={520} height={548} tags={OVERLAY_TAGS} ruler />
        </CameraPanel>
      }
      side={
        <>
          <FormulaBar cell="B2" formula={PARAMETERS[0].formula} />
          <ParameterSheet rows={PARAMETERS} selected={0} />
          <Panel title={`R knee valgus by rep · set ${s.set}`} delay={90}>
            <RepChart values={VALGUS_BY_REP} total={s.reps} limits={VALGUS_LIMITS} label="Right knee valgus per rep" />
          </Panel>
          <Panel title="Vitals" note={`SIMULATED · base: personal, ${s.baselineSessions} sessions`} delay={180}>
            <VitalsGrid vitals={VITALS} />
          </Panel>
        </>
      }
      status={
        <StatusBar
          items={[`REP ${s.rep}/${s.reps}`, `LOAD ${s.loadKg} KG`, `MD ${s.missionDay}`, 'Flagged rep 6 (rehab) · base model: not yet']}
          next={`Next: cue knees out · rep 8 again → ${s.nextLoadKg} kg`}
        />
      }
      tabs={<SheetTabs tabs={['Live', 'Set 1', 'Set 2', 'Baseline', 'Rehab priors', 'Log']} active="Live" />}
    />
  )
}
