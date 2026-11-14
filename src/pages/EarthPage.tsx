import { useCallback, useEffect, useRef, useState } from 'react'
import type { Landmark } from '@mediapipe/tasks-vision'
import useCameraStream from '../capture/useCameraStream.ts'
import { speak, stopSpeaking } from '../capture/speak.ts'
import AboutYou from '../components/earth/AboutYou.tsx'
import CoachScreen from '../components/earth/CoachScreen.tsx'
import CueCard from '../components/earth/CueCard.tsx'
import DeviceFrame from '../components/earth/DeviceFrame.tsx'
import EarthCamera from '../components/earth/EarthCamera.tsx'
import PlacePhone from '../components/earth/PlacePhone.tsx'
import RepCounter from '../components/earth/RepCounter.tsx'
import Settings from '../components/earth/Settings.tsx'
import StartStopButton from '../components/earth/StartStopButton.tsx'
import { activityLabel, createActivityTracker, type Activity } from '../engine/activity.ts'
import { cueFor, judgeLastRep, startHint } from '../engine/earthCoach.ts'
import { createRepDetector, fromMediaPipe, MEDIAPIPE_NOISE, MEDIAPIPE_UP, withNoise, type RepFeatures } from '../engine/squat.ts'
import { EVAL, REHAB_MODEL } from '../engine/squatModel.ts'
import { clearProfile, loadProfile, saveProfile } from '../store.ts'
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

  const save = (p: EarthProfile) => { saveProfile(p); setProfile(p) }
  useEffect(() => { document.documentElement.toggleAttribute('data-big-text', !!profile?.bigText) }, [profile?.bigText])

  // Live video straight away on the setup and camera screens.
  const wantsCamera = screen === 'place' || screen === 'live'
  const { status, error, start, stop } = camera
  useEffect(() => { if (wantsCamera && status === 'off' && !error) void start() }, [wantsCamera, status, error, start]) // after an error, wait for a tap on Start
  useEffect(() => { if (!wantsCamera) stop() }, [wantsCamera, stop])

  // Coaching session.
  const [running, setRunning] = useState(true)
  const [reps, setReps] = useState<RepFeatures[]>([])
  const [seen, setSeen] = useState(false)
  const [activity, setActivity] = useState<Activity>('away')
  const tracker = useRef(createActivityTracker())
  const detector = useRef(createRepDetector(MEDIAPIPE_UP, (f) => setReps((r) => [...r, f])))
  const runningRef = useRef(running)
  useEffect(() => { runningRef.current = running }, [running])

  const onPose = useCallback((world: Landmark[]) => {
    const sk = fromMediaPipe(world)
    setSeen(sk !== null)
    setActivity(tracker.current(sk, performance.now()))
    if (sk && runningRef.current) detector.current(sk)
  }, [])

  const toggle = () => {
    if (running) { setRunning(false); stopSpeaking(); return }
    setReps([])
    detector.current = createRepDetector(MEDIAPIPE_UP, (f) => setReps((r) => [...r, f]))
    setRunning(true)
    if (status === 'off') void start()
  }

  // Speak each new rep's tip.
  const verdict = reps.length ? judgeLastRep(reps, MODEL, THRESHOLD) : null
  const repCue = verdict && profile ? cueFor(verdict, profile) : null
  const spoken = useRef(0) // reps already spoken, so each rep's tip is said once
  const say = repCue && profile?.voice && running ? repCue.title : null
  useEffect(() => {
    if (say && reps.length !== spoken.current) speak(say)
    spoken.current = reps.length
  }, [say, reps.length])

  let content
  if (screen === 'about' || !profile) {
    content = (
      <AboutYou
        initial={editing ? profile : null}
        onCancel={editing ? () => { setEditing(false); setScreen('settings') } : undefined}
        onDone={(p) => { save(p); setScreen(editing ? 'settings' : 'place'); setEditing(false) }}
      />
    )
  } else if (screen === 'settings') {
    content = (
      <Settings
        profile={profile}
        onChange={save}
        onEditAbout={() => { setEditing(true); setScreen('about') }}
        onPlace={() => setScreen('place')}
        onReset={() => { clearProfile(); setProfile(null); setReps([]); setScreen('about') }}
        onClose={() => setScreen('live')}
      />
    )
  } else {
    const cam = <EarthCamera stream={camera.stream} onPose={onPose} />
    content = screen === 'place'
      ? <PlacePhone camera={cam} seen={seen} error={camera.error} onRetry={() => void start()} onDone={() => setScreen('live')} />
      : (
        <CoachScreen
          camera={cam}
          label={camera.status === 'on' ? activityLabel(activity, profile.position === 'seated') : undefined}
          onMenu={() => setScreen('settings')}
          cue={<LiveCue key={repCue?.title ?? 'start'} profile={profile} cameraError={camera.error} cameraOn={camera.status === 'on'} running={running} away={activity === 'away'} cue={repCue} />}
          counter={<RepCounter done={reps.length} />}
          action={<StartStopButton running={running && camera.status === 'on'} onToggle={toggle} />}
        />
      )
  }

  return <DeviceFrame>{content}</DeviceFrame>
}

// The one instruction for right now, in priority order: camera problem → paused → not in view → last rep's tip → start.
function LiveCue({ profile, cameraError, cameraOn, running, away, cue }: { profile: EarthProfile; cameraError: string | null; cameraOn: boolean; running: boolean; away: boolean; cue: { title: string; hint: string } | null }) {
  if (cameraError) return <CueCard title="Camera is off" hint={`${cameraError} Then tap Start.`} />
  if (!cameraOn) return <CueCard title="Starting the camera…" hint="Allow the camera when your phone asks." />
  if (!running) return <CueCard title="Paused" hint="Tap Start when you are ready." />
  if (away) return <CueCard title="Step into view" hint="Your whole body should fit on the screen." />
  if (cue) return <CueCard title={cue.title} hint={cue.hint} />
  return <CueCard title="Start moving" hint={startHint(profile)} />
}
