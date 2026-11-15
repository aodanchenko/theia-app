// Throwaway: the Earth camera screen with a public-domain rehab photo in place of the selfie video, mapped live by
// MediaPipe Pose, for demo screenshots at /proto/demo-shot (dev only).
// Photo: Army Sgt. Joshua Ben at Walter Reed's Military Advanced Training Center, 2009. DoD photo by Samantha L. Quigley,
// public domain (Wikimedia Commons, "Defense.gov photo essay 090421-D-8901W-0025.jpg").
import { useEffect, useRef, useState } from 'react'
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import ChunkyButton from '../../components/earth/ChunkyButton.tsx'
import CoachBar from '../../components/earth/CoachBar.tsx'
import CoachScreen from '../../components/earth/CoachScreen.tsx'
import DeviceFrame from '../../components/earth/DeviceFrame.tsx'
import Icon from '../../components/earth/Icon.tsx'
import NoteCard from '../../components/earth/NoteCard.tsx'
import cam from '../../components/earth/EarthCamera.module.css'
import { TEXT } from '../../earthText.ts'
import { BODY_CONNECTIONS } from '../../capture/usePose.ts'
import photo from './rehab-prosthesis.jpg'

const t = TEXT.en
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task'

export default function DemoShot() {
  const frame = useRef<HTMLDivElement>(null)
  const img = useRef<HTMLImageElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hip, setHip] = useState<{ left: string; top: string } | null>(null)

  useEffect(() => {
    let closed = false
    ;(async () => {
      const el = img.current, c = canvas.current, box = frame.current
      if (!el || !c || !box) return
      await el.decode()
      const vision = await FilesetResolver.forVisionTasks(WASM)
      const pose = await PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: MODEL }, runningMode: 'IMAGE', numPoses: 1 })
      if (closed) return pose.close()
      const lm = pose.detect(el).landmarks[0]
      pose.close()
      if (!lm) return console.error('no person found')
      c.width = el.naturalWidth
      c.height = el.naturalHeight
      const ctx = c.getContext('2d')
      if (!ctx) return
      const draw = new DrawingUtils(ctx)
      draw.drawConnectors(lm, BODY_CONNECTIONS, { color: '#ffffff', lineWidth: 6 }) // the app draws 3 px on a 720p video; this photo is 1280 × 2050
      draw.drawLandmarks(lm.slice(11), { color: getComputedStyle(c).getPropertyValue('--good').trim(), radius: 8 })
      // the ✓ goes on the hips, as in the app after an on-target rep (object-fit: cover, not mirrored: it is a photo)
      const s = Math.max(box.clientWidth / el.naturalWidth, box.clientHeight / el.naturalHeight)
      const x = (box.clientWidth - el.naturalWidth * s) / 2 + ((lm[23].x + lm[24].x) / 2) * el.naturalWidth * s
      const y = (box.clientHeight - el.naturalHeight * s) / 2 + ((lm[23].y + lm[24].y) / 2) * el.naturalHeight * s
      setHip({ left: `${(x / box.clientWidth) * 100}%`, top: `${(y / box.clientHeight) * 100}%` })
      document.body.dataset.ready = '' // for the screenshot script
    })().catch((e: unknown) => console.error(e))
    return () => { closed = true }
  }, [])

  return (
    <DeviceFrame t={t}>
      <CoachScreen
        bar={<CoachBar t={t} results={['learn', 'learn', 'learn', 'good']} total={10} paused={false} onPause={() => {}} onSettings={() => {}} />}
        camera={
          <div ref={frame} className={cam.frame}>
            <img ref={img} src={photo} alt="" className={cam.layer} style={{ transform: 'none' }} />
            <canvas ref={canvas} className={cam.layer} style={{ transform: 'none' }} aria-hidden="true" />
            <span className={cam.label}>{t.activity.standing}</span>
            {hip && <span className={`enter ${cam.mark}`} data-kind="good" style={hip}><Icon name="check" size={30} /></span>}
          </div>
        }
        note={<NoteCard kind="good" title={`${t.rep(4)} · ${t.onTarget}`} line={t.sameAsNormal} />}
        action={<ChunkyButton onClick={() => {}}>{t.pause}</ChunkyButton>}
      />
    </DeviceFrame>
  )
}
