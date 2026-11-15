import { useEffect, useRef, type ReactNode } from 'react'
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision'
import usePose from '../../capture/usePose.ts'
import styles from './CameraPanel.module.css'

// Camera view: the live `stream` + MediaPipe skeleton when given (camera on/off lives in the toolbar), the overlay on top, capture info (top right).
// `children(live)` renders the overlay; `live` tells it to drop its drawn background.
interface Props {
  stream: MediaStream | null
  caption: string[]
  onPose: (world: Landmark[], image: NormalizedLandmark[], width: number, height: number) => void
  children: (live: boolean) => ReactNode
}

const MODEL = 'heavy' // the ISS tablet can take the 30 MB model; it holds limbs better behind the ARED frame
const POSE_NOTE = { off: 'Live video', loading: 'Loading pose model…', running: `Live · MediaPipe Pose ${MODEL} · video stays on device`, error: 'Pose model failed to load' }

export default function CameraPanel({ stream, caption, onPose, children }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = stream !== null
  const pose = usePose(video, canvas, live, onPose, MODEL)

  useEffect(() => { if (video.current) video.current.srcObject = stream }, [stream])

  return (
    <div className={styles.panel}>
      {live && <video ref={video} className={styles.video} autoPlay playsInline muted />}
      {live && <canvas ref={canvas} className={styles.video} aria-hidden="true" />}
      {children(live)}
      <span className={styles.caption}>{caption.filter(Boolean).map((line) => <span key={line}>{line}</span>)}</span>
      <span className={styles.note} role="status">{live ? POSE_NOTE[pose] : 'Simulated view · camera video stays on device'}</span>
    </div>
  )
}
