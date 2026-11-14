import { useEffect, useRef } from 'react'
import type { Landmark } from '@mediapipe/tasks-vision'
import usePose from '../../capture/usePose.ts'
import styles from './EarthCamera.module.css'

// Full-bleed live camera with the MediaPipe skeleton on top. Mirrored like a selfie. Video stays on the device.
export default function EarthCamera({ stream, onPose }: { stream: MediaStream | null; onPose: (world: Landmark[]) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  usePose(video, canvas, stream !== null, onPose)
  useEffect(() => { if (video.current) video.current.srcObject = stream }, [stream])
  return (
    <div className={styles.camera}>
      {stream && <video ref={video} className={styles.layer} autoPlay playsInline muted />}
      {stream && <canvas ref={canvas} className={styles.layer} aria-hidden="true" />}
    </div>
  )
}
