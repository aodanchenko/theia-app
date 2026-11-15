// Throwaway: what the camera frame shows while the Earth set is paused, at /proto/paused (dev only).
// Real Earth chrome around it (bar, note, button); only the frame changes per variant.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import CoachBar from '../../components/earth/CoachBar.tsx'
import CoachScreen from '../../components/earth/CoachScreen.tsx'
import ChunkyButton from '../../components/earth/ChunkyButton.tsx'
import DeviceFrame from '../../components/earth/DeviceFrame.tsx'
import NoteCard from '../../components/earth/NoteCard.tsx'
import Icon from '../../components/earth/Icon.tsx'
import SimulatedCamera from '../../components/SimulatedCamera.tsx'
import SetReport from '../../components/earth/SetReport.tsx'
import { repResults, setReport, type NoteKind } from '../../engine/earthCoach.ts'
import { MEDIAPIPE_NOISE, withNoise } from '../../engine/squat.ts'
import { EVAL, REHAB_MODEL } from '../../engine/squatModel.ts'
import { TEXT } from '../../earthText.ts'
import type { EarthProfile, Joint } from '../../types.ts'
import './paused.css'

const t = TEXT.en
const MODEL = withNoise(REHAB_MODEL, MEDIAPIPE_NOISE)

// Stick figure, front view, in a 200 × 300 box.
type Pose = Record<Joint, [number, number]>
const STAND: Pose = {
  head: [100, 50], neck: [100, 74], ls: [78, 82], rs: [122, 82], le: [70, 124], re: [130, 124], lw: [68, 162], rw: [132, 162],
  lh: [86, 162], rh: [114, 162], lk: [85, 216], rk: [115, 216], la: [85, 270], ra: [115, 270],
}
// Side view for the demo squat (near and far limbs on top of each other), facing right: hips back, knees over toes.
const side = (j: Record<'head' | 'neck' | 's' | 'e' | 'w' | 'h' | 'k' | 'a', [number, number]>): Pose => ({ head: j.head, neck: j.neck, ls: j.s, rs: j.s, le: j.e, re: j.e, lw: j.w, rw: j.w, lh: j.h, rh: j.h, lk: j.k, rk: j.k, la: j.a, ra: j.a })
const SIDE_STAND = side({ head: [100, 50], neck: [100, 74], s: [100, 84], e: [100, 124], w: [100, 160], h: [100, 162], k: [100, 216], a: [100, 270] })
const SIDE_SQUAT = side({ head: [112, 98], neck: [106, 120], s: [98, 130], e: [122, 140], w: [146, 140], h: [70, 200], k: [118, 222], a: [100, 270] })
// Last rep as the camera saw it: a little lean, right knee a touch in.
const LAST: Pose = { ...STAND, head: [104, 52], neck: [102, 76], ls: [80, 84], rs: [124, 82], rk: [110, 216], rw: [134, 160] }
const BONES: [Joint, Joint][] = [['neck', 'ls'], ['neck', 'rs'], ['ls', 'rs'], ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'], ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'], ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra']]
const mix = (a: Pose, b: Pose, k: number) => Object.fromEntries(Object.keys(a).map((j) => [j, [a[j as Joint][0] + (b[j as Joint][0] - a[j as Joint][0]) * k, a[j as Joint][1] + (b[j as Joint][1] - a[j as Joint][1]) * k]])) as Pose

function Figure({ pose, kind, dots = false, colour }: { pose: Pose; kind: 'ink' | 'mapped' | 'ghost'; dots?: boolean; colour?: Partial<Record<Joint, string>> }) {
  return (
    <g className={`fig fig-${kind}`}>
      {kind === 'mapped' && <line x1={pose.head[0]} y1={pose.head[1]} x2={pose.neck[0]} y2={pose.neck[1]} />}
      {BONES.map(([a, b]) => <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} />)}
      <circle className="head" cx={pose.head[0]} cy={pose.head[1]} r={kind === 'mapped' ? 4 : 17} />
      {dots && (Object.keys(pose) as Joint[]).filter((j) => j !== 'head').map((j) => <circle key={j} className="dot" cx={pose[j][0]} cy={pose[j][1]} r={colour?.[j] ? 7 : 4} style={colour?.[j] ? { fill: colour[j] } : undefined} />)}
    </g>
  )
}

// One clock for the looping variants; still when reduced motion is on.
function useLoop(ms: number) {
  const [k, setK] = useState(0)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let id = 0
    const start = performance.now()
    const tick = (now: number) => { setK(((now - start) % ms) / ms); id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [ms])
  return k
}

const Stage = ({ tone, label, children, foot }: { tone: 'dark' | 'paper'; label: string; children: ReactNode; foot?: ReactNode }) => (
  <div className="pz-frame" data-tone={tone}>
    <span className="pz-label">{label}</span>
    <svg className="pz-svg" viewBox="0 0 200 300" aria-hidden="true">{children}</svg>
    {foot && <p className="pz-foot">{foot}</p>}
  </div>
)

// 1 · Frozen: your last pose as the camera mapped it, video hidden.
const Frozen = () => (
  <Stage tone="dark" label="Your last rep" foot={<><Icon name="pause" size={18} /> Camera paused · nothing saved</>}>
    <rect className="pz-spot" x="52" y="24" width="96" height="262" rx="10" />
    <Figure pose={LAST} kind="mapped" dots />
  </Stage>
)

// 2 · Breathe: a resting figure that breathes; the words follow the breath.
function Breathe() {
  const k = useLoop(8000)
  const breath = 0.5 - Math.cos(k * Math.PI * 2) / 2 // 0 → 1 → 0
  return (
    <Stage tone="paper" label="Rest" foot={k < 0.5 ? 'Breathe in…' : 'and out…'}>
      <circle className="pz-halo" cx="100" cy="150" r={92 + breath * 14} />
      <g style={{ transform: `scale(${1 + breath * 0.025})`, transformOrigin: '100px 270px' }}><Figure pose={STAND} kind="ink" /></g>
    </Stage>
  )
}

// 3 · Next rep: a slow, correct squat on loop, your standing outline behind it.
function NextRep() {
  const k = useLoop(4000)
  const depth = k < 0.4 ? k / 0.4 : k < 0.5 ? 1 : k < 0.9 ? 1 - (k - 0.5) / 0.4 : 0 // 1.6 s down, hold, 1.6 s up, pause
  const eased = 0.5 - Math.cos(depth * Math.PI) / 2
  return (
    <Stage tone="paper" label="Next rep" foot={depth > 0.95 ? 'Knees over toes' : k < 0.5 ? 'Slowly down…' : 'and up'}>
      <Figure pose={SIDE_STAND} kind="ghost" />
      <Figure pose={mix(SIDE_STAND, SIDE_SQUAT, eased)} kind="ink" />
      <line className="pz-floor" x1="50" x2="150" y1="276" y2="276" />
    </Stage>
  )
}

// 4 · Your set: the real SetReport, on a sample set (3 to learn, then one knees-in rep among good ones).
const SAMPLE = [1.25, 1.22, 1.24, 1.24, 0.8, 1.23, 0.85].map((kneeWidth, i) => ({ depth: 98 + (i % 3), kneeWidth, trunkLean: 30, asymmetry: 3 }))
const PROFILE: EarthProfile = { side: 'right', prosthesis: false, aid: false, position: 'standing', voice: false, bigText: false }
const Set = () => <SetReport t={t} lang="en" profile={PROFILE} report={setReport(SAMPLE, MODEL, EVAL.personal.threshold, PROFILE)} total={10} />
const RESULTS: NoteKind[] = repResults(SAMPLE, PROFILE, MODEL, EVAL.personal.threshold)

// 5 · Room: the drawn person from the camera-off view, dimmed, with a pause mark.
const Room = () => (
  <div className="pz-frame pz-room" data-tone="dark">
    <SimulatedCamera theme="earth" width={360} height={480} figureHeight={440} />
    <span className="pz-pause"><Icon name="pause" size={44} /></span>
    <p className="pz-foot">Take your time</p>
  </div>
)

const VARIANTS: [string, () => ReactNode][] = [['Frozen', Frozen], ['Breathe', Breathe], ['Next rep', NextRep], ['Your set', Set], ['Room', Room]]

export default function PausedLab() {
  const [v, setV] = useState(() => Math.min(VARIANTS.length, Math.max(1, Number(new URLSearchParams(location.search).get('v')) || 1)) - 1)
  const [key, setKey] = useState(0)
  const nav = useRef<HTMLElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const hl = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = items.current[v]
    if (el && hl.current) { hl.current.style.width = `${el.offsetWidth}px`; hl.current.style.transform = `translateX(${el.offsetLeft}px)` }
    const url = new URL(location.href)
    url.searchParams.set('v', String(v + 1))
    history.replaceState(null, '', url)
  }, [v])
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => nav.current?.setAttribute('data-ready', ''))) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= VARIANTS.length) setV(n - 1)
      else if (e.key === 'ArrowRight') setV((i) => (i + 1) % VARIANTS.length)
      else if (e.key === 'ArrowLeft') setV((i) => (i - 1 + VARIANTS.length) % VARIANTS.length)
      else if (e.key === 'r' || e.key === 'R') setKey((k) => k + 1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const Variant = VARIANTS[v][1]
  return (
    <>
      <DeviceFrame t={t}>
        <CoachScreen
          bar={<CoachBar t={t} results={RESULTS} total={10} paused onPause={() => {}} onSettings={() => {}} />}
          camera={<Variant key={`${v}-${key}`} />}
          note={<NoteCard kind="idle" title={t.paused} line={t.pausedLine} />}
          action={<ChunkyButton onClick={() => {}}>{t.resume}</ChunkyButton>}
        />
      </DeviceFrame>
      <nav ref={nav} className="proto-picker" aria-label="Prototype variants">
        <span ref={hl} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map(([name], i) => (
          <button key={name} ref={(el) => { items.current[i] = el }} className="proto-picker-item" data-active={i === v ? '' : undefined} aria-current={i === v ? 'true' : undefined} onClick={() => setV(i)}>{name}</button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setKey((k) => k + 1)}>↻</button>
      </nav>
    </>
  )
}
