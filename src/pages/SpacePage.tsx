import { useCallback, useState } from 'react'
import type { Landmark } from '@mediapipe/tasks-vision'
import useCameraStream from '../capture/useCameraStream.ts'
import useSimVitals from '../data/useSimVitals.ts'
import SimulatedCamera from '../components/SimulatedCamera.tsx'
import CameraPanel from '../components/space/CameraPanel.tsx'
import Header from '../components/space/Header.tsx'
import HelpDialog, { type HelpTopic } from '../components/space/HelpDialog.tsx'
import Menu from '../components/space/Menu.tsx'
import StatusBar from '../components/space/StatusBar.tsx'
import { ToolButton, ToolGroup, ToolNote, Toolbar } from '../components/space/Toolbar.tsx'
import ModelCheck from '../components/space/ModelCheck.tsx'
import Panel from '../components/space/Panel.tsx'
import ParameterSheet from '../components/space/ParameterSheet.tsx'
import RotateGate from '../components/space/RotateGate.tsx'
import Recommendation, { type Tone } from '../components/space/Recommendation.tsx'
import DriftChart, { type DriftPoint } from '../components/space/DriftChart.tsx'
import VitalsGrid from '../components/space/VitalsGrid.tsx'
import Workbench from '../components/space/Workbench.tsx'
import { OVERLAY_TAGS, PARAMETERS, SESSION } from '../data/demo.ts'
import { createRepDetector, CUES, FEATURES, fromMediaPipe, kneeFlexion, LABELS, MEDIAPIPE_NOISE, MEDIAPIPE_UP, meanFeatures, repsCsv, scoreRep, SHORT, withNoise, type FeatureKey, type RepFeatures } from '../engine/squat.ts'
import { EVAL, REHAB_MODEL, REPLAY } from '../engine/squatModel.ts'
import type { Parameter } from '../types.ts'

const s = SESSION
const CALIBRATION = 3 // shortcut: the first reps of the session are the personal baseline; later, load it from past sessions.
const THRESHOLD = EVAL.personal.threshold // z at 10% false alerts on held-out people
const LIVE_MODEL = withNoise(REHAB_MODEL, MEDIAPIPE_NOISE)
const POPULATION: RepFeatures = { depth: REHAB_MODEL.depth.mean, kneeWidth: REHAB_MODEL.kneeWidth.mean, trunkLean: REHAB_MODEL.trunkLean.mean, asymmetry: REHAB_MODEL.asymmetry.mean }
const pct = (x: number) => `${Math.round(x * 100)}%`
const drift = (score: number) => Math.max(0, score) / THRESHOLD // 0 = your normal, 1 = flag
// Before the camera is on: a real held-out UI-PRMD person, scored the same way (see scripts/train-squat.ts).
const REPLAY_POINTS: DriftPoint[] = REPLAY.reps.map((r, i) => ({ drift: drift(r.score), calibration: i < REPLAY.calibration, flag: SHORT[r.worst] }))

const fmt = (k: FeatureKey, v: number) => (k === 'kneeWidth' ? v.toFixed(2) : `${Math.round(v)}°`)
const signed = (k: FeatureKey, v: number) => { const t = k === 'kneeWidth' ? v.toFixed(2) : `${Math.round(v)}`; return v > 0 ? `+${t}` : t.replace('-', '−') }

// Live reps → what the workbench shows: parameter rows, flag, per-rep scores.
function liveView(reps: RepFeatures[]) {
  const last = reps[reps.length - 1]
  const baseline = reps.length >= CALIBRATION ? meanFeatures(reps.slice(0, CALIBRATION)) : null
  const center = baseline ?? POPULATION
  // calibration reps are scored too, against the baseline they set, so the chart shows their spread
  const all = baseline ? reps.map((f) => scoreRep(f, LIVE_MODEL, baseline)) : []
  const scored = all.slice(CALIBRATION)
  const result = scored.at(-1)
  const flagged = result !== undefined && result.score > THRESHOLD ? result.worst : null
  const rows: Parameter[] = FEATURES.map((k) => ({
    name: LABELS[k],
    now: fmt(k, last[k]),
    base: fmt(k, center[k]),
    delta: signed(k, last[k] - center[k]),
    flag: result && result.z[k] > THRESHOLD ? 'rehab' : undefined,
  }))
  const state = !baseline ? `CALIBRATING ${reps.length}/${CALIBRATION}` : !result ? 'BASELINE SET' : flagged ? 'FLAGGED' : 'GOOD REP'
  const points: DriftPoint[] = baseline
    ? all.map((r, i) => ({ drift: drift(r.score), calibration: i < CALIBRATION, flag: SHORT[r.worst] }))
    : reps.map(() => ({ drift: 0, calibration: true }))
  const flags = scored.filter((r) => r.score > THRESHOLD).length
  return { rows, flagged, baseline, state, result, points, flags }
}

// The one thing to do now, for the large recommendation panel.
function recommend(live: ReturnType<typeof liveView> | null, n: number, tracking: string | null): { decision: string; action: string; reason: string; tone: Tone } {
  const z = (x: number) => `z ${x.toFixed(1)}, limit ${THRESHOLD.toFixed(1)}`
  if (live?.flagged && live.result) return { decision: 'Change technique', action: CUES[live.flagged], reason: `Rep ${n}: ${LABELS[live.flagged]} off your baseline (${z(live.result.score)})`, tone: 'alert' }
  if (live && !live.baseline) return { decision: 'Calibrating', action: `Squat normally · ${n}/${CALIBRATION}`, reason: `The first ${CALIBRATION} reps set your personal baseline`, tone: 'neutral' }
  if (live?.result) return { decision: 'Continue', action: 'Good rep', reason: `Rep ${n} within your baseline (worst: ${LABELS[live.result.worst]}, ${z(live.result.score)})`, tone: 'good' }
  if (live) return { decision: 'Baseline set', action: 'Continue the set', reason: `Next reps are compared with your first ${CALIBRATION}`, tone: 'good' }
  if (tracking?.startsWith('LEGS')) return { decision: 'Framing', action: 'Step back, show your legs', reason: 'Hips and knees must be visible to score a rep', tone: 'caution' }
  if (tracking) return { decision: 'Ready', action: 'Squat to start', reason: tracking, tone: 'neutral' }
  return { decision: 'Change technique', action: s.cue, reason: `SIMULATED · rep 6 R knee valgus past rehab limit · repeat rep 8, then ${s.nextLoadKg} kg`, tone: 'alert' }
}

// Saves text as a file on the device (nothing is uploaded).
function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function SpacePage() {
  const camera = useCameraStream()
  const [reps, setReps] = useState<RepFeatures[]>([])
  const newDetector = () => createRepDetector(MEDIAPIPE_UP, (f) => setReps((r) => [...r, f]))
  const [detect, setDetect] = useState(newDetector) // replaced on Reset baseline, so a half-done rep is dropped too
  const [view, setView] = useState({ tags: true, chart: true, model: true, vitals: true })
  const toggle = (k: keyof typeof view) => () => setView((v) => ({ ...v, [k]: !v[k] }))
  const [help, setHelp] = useState<HelpTopic | null>(null)
  const [tracking, setTracking] = useState<string | null>(null) // null until the pose model sees someone
  const onPose = useCallback((world: Landmark[]) => {
    const sk = fromMediaPipe(world)
    if (!sk) return setTracking('LEGS NOT VISIBLE · STEP BACK')
    detect(sk)
    const f = kneeFlexion(sk)
    setTracking(`KNEE ${Math.round((f.left + f.right) / 10) * 5}°`) // 5° steps, so the page re-renders only on change
  }, [detect])
  const live = reps.length > 0 ? liveView(reps) : null
  const vitals = useSimVitals(camera.status === 'on', reps.length)

  const rec = recommend(live, reps.length, tracking)
  const basis = live
    ? `vs your baseline (first ${CALIBRATION} reps) · UI-PRMD rehab scale · known cause: ${s.knownCause}`
    : `vs your baseline (${s.baselineSessions} sessions) · ${s.model} · known cause: ${s.knownCause}`

  return (
    <>
    <RotateGate />
    <Workbench
      header={
        <Header title="THEIA Workbench" file={s.file}>
          <Menu label="View" items={[
            { label: 'Joint tags (simulated view)', checked: view.tags, onSelect: toggle('tags') },
            { label: 'Rep chart', checked: view.chart, onSelect: toggle('chart') },
            { label: 'Rehab model check', checked: view.model, onSelect: toggle('model') },
            { label: 'Vitals', checked: view.vitals, onSelect: toggle('vitals') },
          ]} />
          <Menu label="Help" items={[
            { label: 'How Theia decides', onSelect: () => setHelp('decide') },
            { label: 'Data & privacy', onSelect: () => setHelp('privacy') },
          ]} />
        </Header>
      }
      toolbar={
        <Toolbar>
          <ToolGroup>
            {camera.status === 'on'
              ? <ToolButton onClick={camera.stop}>■ Stop camera</ToolButton>
              : <ToolButton camera onClick={camera.start} disabled={camera.status === 'starting'}>{camera.status === 'starting' ? 'Starting…' : '● Enable camera'}</ToolButton>}
            <ToolButton onClick={() => { setReps([]); setDetect(newDetector) }} disabled={reps.length === 0}>↺ Reset baseline</ToolButton>
            <ToolButton onClick={() => download(`theia-reps-${new Date().toISOString().slice(0, 16).replace(':', '-')}.csv`, repsCsv(reps, CALIBRATION, LIVE_MODEL, THRESHOLD))} disabled={reps.length === 0}>⤓ Export CSV</ToolButton>
          </ToolGroup>
          {camera.error && <ToolNote caution>{camera.error}</ToolNote>}
          {!camera.error && <ToolNote>{reps.length ? `${reps.length} reps · video stays on device` : 'Video stays on device'}</ToolNote>}
        </Toolbar>
      }
      camera={
        <CameraPanel
          stream={camera.stream}
          caption={live || tracking ? [`REP ${reps.length} · ${live?.state ?? 'SQUAT TO START'}`, tracking ?? ''] : [`SET ${s.set} · REP ${s.rep}/${s.reps} · ${s.loadKg} KG`]}
          onPose={onPose}
        >
          {(cam) => (cam ? null : <SimulatedCamera theme="space" width={420} height={548} scene tags={view.tags ? OVERLAY_TAGS : []} ruler={view.tags} />)}
        </CameraPanel>
      }
      side={
        <>
          <Recommendation {...rec} basis={basis} id={`${reps.length}-${rec.decision}`} />
          {view.chart && (live
            ? (
              <Panel title="Form drift by rep · live" note={`first ${CALIBRATION} reps = baseline`} delay={90} grow>
                <DriftChart points={live.points} total={Math.max(10, live.points.length)} label="Form drift per rep: worst deviation from your baseline, 1.0 = flag" />
              </Panel>
            )
            : (
              <Panel title="Form drift by rep · replay" note={`UI-PRMD person ${REPLAY.subject.slice(1)}, held out · 3 bad reps acted`} delay={90} grow>
                <DriftChart points={REPLAY_POINTS} total={REPLAY_POINTS.length} label="Form drift per rep for a held-out UI-PRMD person: 7 correct reps, then 3 incorrect" />
              </Panel>
            ))}
          {view.vitals && (
          <Panel title="Vitals" note={camera.status === 'on' ? 'SIMULATED · follows your reps' : `SIMULATED · base: personal, ${s.baselineSessions} sessions`} delay={180}>
            <VitalsGrid vitals={vitals} />
          </Panel>
          )}
          <ParameterSheet rows={live?.rows ?? PARAMETERS} />
          {view.model && (
          <Panel title="Rehab model check · deep squat" note="UI-PRMD · PDDL 1.0" delay={60}>
            <ModelCheck
              rows={[
                { label: 'Textbook thresholds', caught: EVAL.base.caught },
                { label: 'Rehab data, population', caught: EVAL.rehab.caught },
                { label: 'Personal baseline only', caught: EVAL.personalBase.caught },
                { label: 'Personal + rehab data', caught: EVAL.personal.caught, ours: true },
              ]}
              caption={`Incorrect reps caught at ${pct(EVAL.falseAlertRate)} false alerts, people held out. ${EVAL.subjects} people, ${EVAL.correctReps} good + ${EVAL.incorrectReps} bad reps (Vicon). Untuned 2 sd: ${pct(EVAL.personal.at2sd.caught)} caught, ${pct(EVAL.personal.at2sd.falseAlerts)} false alerts.`}
            />
          </Panel>
          )}
          <HelpDialog topic={help} onClose={() => setHelp(null)} calibration={CALIBRATION} threshold={THRESHOLD} />
        </>
      }
      status={
        <StatusBar
          items={live
            ? [`REP ${reps.length}`, `LOAD ${s.loadKg} KG`, live.baseline ? `FLAGS ${live.flags}` : `CALIBRATING ${reps.length}/${CALIBRATION}`, 'VIDEO ON DEVICE']
            : [`REP ${s.rep}/${s.reps}`, `LOAD ${s.loadKg} KG`, `MD ${s.missionDay}`, 'FLAGS 2 · SIMULATED']}
          next={`Next: ${rec.tone === 'alert' ? `${rec.action.toLowerCase()} · repeat the rep` : rec.action.toLowerCase()}`}
        />
      }
    />
    </>
  )
}
