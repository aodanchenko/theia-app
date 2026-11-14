import { useCallback, useEffect, useRef, useState } from 'react'
import type { Landmark } from '@mediapipe/tasks-vision'
import { playChime } from '../capture/chimes.ts'
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
import { DEMO_REPS, OVERLAY_TAGS, SESSION } from '../data/demo.ts'
import { createRepDetector, CUES, FEATURES, fromMediaPipe, kneeFlexion, LABELS, MEDIAPIPE_NOISE, MEDIAPIPE_UP, meanFeatures, repsCsv, scoreRep, SHORT, withNoise, formLimitText, formMiss, pastForm, type FeatureKey, type RepFeatures } from '../engine/squat.ts'
import { EVAL, IDEAL, REHAB_MODEL } from '../engine/squatModel.ts'
import type { Parameter } from '../types.ts'

const s = SESSION
const CALIBRATION = 3 // shortcut: the first reps of the session are the personal baseline; later, load it from past sessions.
const THRESHOLD = EVAL.personal.threshold // z at 10% false alerts on held-out people
const LIVE_MODEL = withNoise(REHAB_MODEL, MEDIAPIPE_NOISE)
const POPULATION: RepFeatures = { depth: REHAB_MODEL.depth.mean, kneeWidth: REHAB_MODEL.kneeWidth.mean, trunkLean: REHAB_MODEL.trunkLean.mean, asymmetry: REHAB_MODEL.asymmetry.mean }
const pct = (x: number) => `${Math.round(x * 100)}%`
const drift = (score: number) => Math.max(0, score) / THRESHOLD // 0 = your normal, 1 = flag

const fmt = (k: FeatureKey, v: number) => (k === 'kneeWidth' ? v.toFixed(2) : `${Math.round(v)}°`)
// The reason, in body terms: what this rep did and what correct looks like.
const SAY: Record<FeatureKey, (v: string) => string> = { depth: (v) => `knees bent to ${v}`, kneeWidth: (v) => `knees at ${v}× foot width`, trunkLean: (v) => `trunk leaned ${v}`, asymmetry: (v) => `left–right gap ${v}` }
const say = (k: FeatureKey, v: number) => `${SAY[k](fmt(k, v))}, correct ${formLimitText(k)} (ideal ${fmt(k, IDEAL[k])})`

// Reps → what the workbench shows: parameter rows, flag, per-rep scores.
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
    correct: formLimitText(k),
    base: fmt(k, center[k]),
    ...(result && result.z[k] > THRESHOLD ? { flag: CUES[k].toLowerCase(), tone: 'alert' as const }
      : pastForm(k, last[k]) > 0 ? { flag: CUES[k].toLowerCase(), tone: 'caution' as const } : {}),
  }))
  const state = !baseline ? `CALIBRATING ${reps.length}/${CALIBRATION}` : !result ? 'BASELINE SET' : flagged ? 'FLAGGED' : 'GOOD REP'
  const points: DriftPoint[] = baseline
    ? all.map((r, i) => ({ drift: drift(r.score), calibration: i < CALIBRATION, flag: SHORT[r.worst] }))
    : reps.map(() => ({ drift: 0, calibration: true }))
  const flags = scored.filter((r) => r.score > THRESHOLD).length
  const run = scored.length - 1 - scored.findLastIndex((r) => r.score <= THRESHOLD) // flagged reps in a row, ending now
  return { rows, flagged, baseline, state, result, points, flags, last, run }
}

// Before the camera is on: the photo astronaut's set (reps 1–9 simulated, rep 10 = the photo), run like live reps.
const DEMO_VIEW = liveView(DEMO_REPS)

// The one thing to do now, for the large recommendation panel.
function recommend(live: ReturnType<typeof liveView> | null, n: number, tracking: string | null): { decision: string; action: string; reason: string; next?: string; tone: Tone } {
  if (live?.flagged && live.baseline) {
    const k = live.flagged
    const row = `Rep ${n}: ${say(k, live.last[k])} · your normal ${fmt(k, live.baseline[k])}${live.run > 1 ? ` · ${live.run} reps in a row` : ''}`
    return { decision: 'Change technique', action: CUES[k], reason: row, next: live.run >= 3 ? 'Stop the set · rest, then lower the load' : 'Repeat the rep', tone: 'alert' }
  }
  if (live && !live.baseline) return { decision: 'Calibrating', action: `Squat normally · ${n}/${CALIBRATION}`, reason: `The first ${CALIBRATION} reps set your personal baseline`, tone: 'neutral' }
  // correct form beats "like your baseline": a rep (or a baseline) short of it gets an amber nudge, never counted as fine
  const miss = live && formMiss(live.last)
  if (live?.baseline && miss) {
    const own = n === CALIBRATION && formMiss(live.baseline) ? 'Baseline short of correct form: ' : `Rep ${n}: `
    return { decision: 'Adjust form', action: CUES[miss], reason: `${own}${say(miss, live.last[miss])}`, next: 'Continue the set', tone: 'caution' }
  }
  if (live?.result) return { decision: 'Continue', action: 'Good rep', reason: `Rep ${n}: correct form, within your baseline`, tone: 'good' }
  if (live) return { decision: 'Baseline set', action: 'Continue the set', reason: `Next reps are compared with your first ${CALIBRATION}`, tone: 'good' }
  if (tracking?.startsWith('LEGS')) return { decision: 'Framing', action: 'Step back, show your legs', reason: 'Hips and knees must be visible to score a rep', tone: 'caution' }
  return { decision: 'Ready', action: 'Squat to start', reason: tracking ?? '', tone: 'neutral' }
}

const DEMO_REC = recommend(DEMO_VIEW, DEMO_REPS.length, null)

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
  const [view, setView] = useState({ tags: true, chart: true, model: true, vitals: true, sounds: true })
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
  const shown = live ?? DEMO_VIEW
  const vitals = useSimVitals(camera.status === 'on', reps.length)

  // Theia chimes on each new live rep: baseline learned (rep 3), on target, adjust, every 5 on target in a row.
  const heard = useRef(0)
  const streak = useRef(0)
  const flaggedNow = !!live?.flagged
  useEffect(() => {
    const n = reps.length
    if (n <= heard.current) { heard.current = n; if (n === 0) streak.current = 0; return } // reset or nothing new
    heard.current = n
    if (n < CALIBRATION) return
    const chime = n === CALIBRATION ? 'baseline' : flaggedNow ? 'fix' : ++streak.current % 5 === 0 ? 'streak' : 'good'
    if (flaggedNow) streak.current = 0
    if (view.sounds) playChime(chime)
  }, [reps.length, flaggedNow, view.sounds])
  const rec = live || tracking ? recommend(live, reps.length, tracking) : DEMO_REC
  const basis = live
    ? `Baseline = your first ${CALIBRATION} reps · known cause: ${s.knownCause}`
    : `SIMULATED reps 1–${DEMO_REPS.length - 1} · rep ${DEMO_REPS.length} = the photo, measured by MediaPipe · baseline = first ${CALIBRATION} reps`

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
            { label: 'Sounds', checked: view.sounds, onSelect: toggle('sounds') },
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
          caption={live || tracking ? [`REP ${reps.length} · ${live?.state ?? 'SQUAT TO START'}`, tracking ?? ''] : [`DEMO · REP ${DEMO_REPS.length} · ${DEMO_VIEW.state}`]}
          onPose={onPose}
        >
          {(cam) => (cam ? null : <SimulatedCamera theme="space" width={420} height={548} scene tags={view.tags ? OVERLAY_TAGS : []} ruler={view.tags} />)}
        </CameraPanel>
      }
      side={
        <>
          <Recommendation {...rec} basis={basis} id={`${reps.length}-${rec.decision}`} />
          <ParameterSheet rows={shown.rows} />
          {view.chart && (
            <Panel title={`Form drift by rep · ${live ? 'live' : 'demo'}`} note={live ? `first ${CALIBRATION} reps = baseline` : `SIMULATED · rep ${DEMO_REPS.length} = photo`} delay={90} grow>
              <DriftChart points={shown.points} total={Math.max(10, shown.points.length)} label="Form drift per rep: worst deviation from the baseline, 1.0 = flag" />
            </Panel>
          )}
          {view.vitals && (
          <Panel title="Vitals" note={camera.status === 'on' ? 'SIMULATED · follows your reps' : `SIMULATED · base: personal, ${s.baselineSessions} sessions`} delay={180}>
            <VitalsGrid vitals={vitals} />
          </Panel>
          )}
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
            : [`REP ${DEMO_REPS.length}`, `FLAGS ${DEMO_VIEW.flags}`, 'DEMO · SIMULATED', `MD ${s.missionDay}`]}
          next={`Next: ${rec.action.toLowerCase()}${rec.next ? ` · ${rec.next.toLowerCase()}` : ''}`}
        />
      }
    />
    </>
  )
}
