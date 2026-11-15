import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision'
import useCameraStream from '../capture/useCameraStream.ts'
import { playChime } from '../capture/chimes.ts'
import { speak, stopSpeaking } from '../capture/speak.ts'
import AboutYou from '../components/earth/AboutYou.tsx'
import ChunkyButton from '../components/earth/ChunkyButton.tsx'
import CoachBar from '../components/earth/CoachBar.tsx'
import CoachScreen from '../components/earth/CoachScreen.tsx'
import DeviceFrame from '../components/earth/DeviceFrame.tsx'
import EarthCamera, { type BodyMark } from '../components/earth/EarthCamera.tsx'
import NoteCard from '../components/earth/NoteCard.tsx'
import PlacePhone from '../components/earth/PlacePhone.tsx'
import Settings from '../components/earth/Settings.tsx'
import { activityLabel, createActivityTracker, type Activity } from '../engine/activity.ts'
import { judgeLastRep, markFor, noteFor, repResults, SET_REPS, soundFor, startHint, type NoteKind } from '../engine/earthCoach.ts'
import { createRepDetector, fromMediaPipe, MEDIAPIPE_NOISE, MEDIAPIPE_UP, withNoise, type RepFeatures } from '../engine/squat.ts'
import { EVAL, REHAB_MODEL } from '../engine/squatModel.ts'
import { TEXT, type Lang } from '../earthText.ts'
import { clearProfile, loadLang, loadProfile, saveLang, saveProfile } from '../store.ts'
import type { EarthProfile } from '../types.ts'

const MODEL = withNoise(REHAB_MODEL, MEDIAPIPE_NOISE)
const THRESHOLD = EVAL.personal.threshold

type Screen = 'about' | 'place' | 'live' | 'settings'

// Earth journey: About you (first open) → place the phone (optional) → camera home with live coaching; settings from the gear.
export default function EarthPage() {
  const [profile, setProfile] = useState<EarthProfile | null>(loadProfile)
  const [screen, setScreen] = useState<Screen>(profile ? 'live' : 'about')
  const [editing, setEditing] = useState(false) // About you opened from Settings
  const camera = useCameraStream()
  const [lang, setLang] = useState<Lang>(loadLang)
  const t = TEXT[lang]
  const changeLang = (l: Lang) => { saveLang(l); setLang(l); stopSpeaking() }
  useLayoutEffect(() => { document.documentElement.lang = lang; return () => { document.documentElement.lang = 'en' } }, [lang]) // before paint: screen readers, hyphenation, and the Cyrillic font without a flash of Atkinson

  const save = (p: EarthProfile) => { saveProfile(p); setProfile(p) }
  useEffect(() => { document.documentElement.toggleAttribute('data-big-text', !!profile?.bigText) }, [profile?.bigText])

  // Live video straight away on the setup and camera screens.
  const wantsCamera = screen === 'place' || screen === 'live'
  const { status, error, start, stop } = camera
  useEffect(() => { if (wantsCamera && status === 'off' && !error) void start() }, [wantsCamera, status, error, start]) // after an error, wait for a tap on Start
  useEffect(() => { if (!wantsCamera) stop() }, [wantsCamera, stop])

  // Coaching session: one set of SET_REPS reps.
  const [running, setRunning] = useState(true)
  const [reps, setReps] = useState<RepFeatures[]>([])
  const [repPose, setRepPose] = useState<NormalizedLandmark[] | null>(null) // where the joints were when the last rep ended
  const [seen, setSeen] = useState(false)
  const [activity, setActivity] = useState<Activity>('away')
  const tracker = useRef(createActivityTracker())
  const lastImage = useRef<NormalizedLandmark[] | null>(null)
  const newDetector = () => createRepDetector(MEDIAPIPE_UP, (f) => { setReps((r) => (r.length < SET_REPS ? [...r, f] : r)); setRepPose(lastImage.current) })
  const detector = useRef<ReturnType<typeof createRepDetector> | null>(null) // created on first pose, replaced on restart
  const live = useRef(running) // the pose callback reads this without being recreated
  useEffect(() => { live.current = running && reps.length < SET_REPS }, [running, reps.length])

  const onPose = useCallback((world: Landmark[], image: NormalizedLandmark[]) => {
    const sk = fromMediaPipe(world)
    lastImage.current = image
    setSeen(sk !== null)
    setActivity(tracker.current(sk, performance.now()))
    if (sk && live.current) (detector.current ??= newDetector())(sk)
  }, [])

  const done = reps.length >= SET_REPS
  const restart = () => { setReps([]); setRepPose(null); detector.current = null; setRunning(true); stopSpeaking() }
  const toggle = () => {
    if (camera.error) return void start()
    if (done) return restart()
    if (running) { setRunning(false); stopSpeaking() } else setRunning(true)
  }

  // The note for right now, in priority order: camera problem → set done → paused → not in view → last rep → start.
  const verdict = reps.length ? judgeLastRep(reps, MODEL, THRESHOLD) : null
  const results: NoteKind[] = repResults(reps, MODEL, THRESHOLD)
  const good = results.filter((r) => r === 'good').length
  const note: { kind: NoteKind; title: string; line: string } =
    camera.error ? { kind: 'idle', title: t.cameraOff, line: t.cameraErrors[camera.errorCode ?? ''] ?? t.cameraErrors.other }
    : camera.status !== 'on' ? { kind: 'idle', title: t.starting, line: t.allowCamera }
    : done ? { kind: 'done', title: t.setDone, line: t.setSummary(good, SET_REPS) }
    : !running ? { kind: 'idle', title: t.paused, line: t.pausedLine }
    : activity === 'away' ? { kind: 'idle', title: t.stepIn, line: t.stepInLine }
    : verdict && profile ? noteFor(verdict, reps.length, profile, lang)
    : { kind: 'idle', title: t.startWhenReady, line: profile ? startHint(profile, lang) : '' }

  // Marks on the body for the last rep, while you stand between reps.
  const marks: BodyMark[] = verdict && profile && repPose && activity === 'standing' && running && !done
    ? markFor(verdict, profile, lang).map((m) => {
        const pts = m.joints.map((j) => repPose[j]).filter(Boolean)
        return { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length, label: m.label, arrow: m.arrow, kind: verdict.kind === 'good' ? 'good' as const : 'fix' as const }
      }).filter((m) => !Number.isNaN(m.x))
    : []

  // Each new rep: a short sound (if on), then the note spoken (if voice is on), once.
  const announced = useRef(0)
  const sound = profile?.sounds !== false && running ? soundFor(results) : null
  const say = profile?.voice && running && reps.length ? note.title.replace(' · ', ', ') : null
  useEffect(() => {
    if (reps.length === announced.current) return
    announced.current = reps.length
    if (sound) playChime(sound)
    if (say) setTimeout(() => speak(say, t.speech), sound ? 450 : 0) // let the sound finish before the voice; not cancelled if the note changes meanwhile
  }, [reps.length, sound, say, t.speech])

  let content
  if (screen === 'about' || !profile) {
    content = (
      <AboutYou
        lang={lang}
        onLang={changeLang}
        initial={editing ? profile : null}
        onCancel={editing ? () => { setEditing(false); setScreen('settings') } : undefined}
        onDone={(p) => { save(p); setScreen(editing ? 'settings' : 'place'); setEditing(false) }}
      />
    )
  } else if (screen === 'settings') {
    content = (
      <Settings
        t={t}
        lang={lang}
        onLang={changeLang}
        profile={profile}
        onChange={save}
        onEditAbout={() => { setEditing(true); setScreen('about') }}
        onPlace={() => setScreen('place')}
        onReset={() => { clearProfile(); setProfile(null); restart(); setScreen('about') }}
        onClose={() => setScreen('live')}
      />
    )
  } else {
    content = screen === 'place'
      ? <PlacePhone t={t} camera={<EarthCamera stream={camera.stream} onPose={onPose} />} seen={seen} error={camera.error} onRetry={() => void start()} onDone={() => setScreen('live')} />
      : (
        <CoachScreen
          bar={<CoachBar t={t} results={results} total={SET_REPS} paused={!running} onPause={toggle} onSettings={() => setScreen('settings')} />}
          camera={<EarthCamera stream={camera.stream} onPose={onPose} label={camera.status === 'on' && activity !== 'away' && !done ? activityLabel(activity, profile.position, lang) : undefined} away={camera.status === 'on' && activity === 'away'} marks={marks} />}
          note={<NoteCard kind={note.kind} title={note.title} line={note.line} />}
          action={<ChunkyButton tone={done ? 'good' : undefined} onClick={toggle}>{camera.error ? t.tryAgain : done ? t.anotherSet : running ? t.pause : t.resume}</ChunkyButton>}
        />
      )
  }

  return <DeviceFrame t={t}>{content}</DeviceFrame>
}
