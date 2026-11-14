import { useEffect, useRef, useState } from 'react'
import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision'
import usePose from '../../capture/usePose.ts'
import Icon, { type IconName } from './Icon.tsx'
import styles from './EarthCamera.module.css'

export interface BodyMark { x: number; y: number; label: string; arrow: IconName | null; kind: 'good' | 'fix' } // x, y: 0..1 of the video frame

// The camera, framed inside the page: mirrored video + MediaPipe skeleton, what you're doing (label),
// a "stand here" outline when nobody is in view, and marks placed on the body. Video stays on the device.
export default function EarthCamera({ stream, onPose, label, away, marks = [] }: {
  stream: MediaStream | null
  onPose: (world: Landmark[], image: NormalizedLandmark[]) => void
  label?: string
  away?: boolean
  marks?: BodyMark[]
}) {
  const frame = useRef<HTMLDivElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState({ cw: 1, ch: 1, vw: 1, vh: 1 })
  usePose(video, canvas, stream !== null, onPose)
  useEffect(() => { if (video.current) video.current.srcObject = stream }, [stream])
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(() => setBox((b) => ({ ...b, cw: el.clientWidth, ch: el.clientHeight })))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Video is object-fit: cover and mirrored, so map 0..1 video coords through the same crop and flip.
  const place = (m: BodyMark) => {
    const s = Math.max(box.cw / box.vw, box.ch / box.vh)
    const x = box.cw - ((box.cw - box.vw * s) / 2 + m.x * box.vw * s)
    const y = (box.ch - box.vh * s) / 2 + m.y * box.vh * s
    return { left: `${Math.min(76, Math.max(24, (x / box.cw) * 100))}%`, top: `${Math.min(90, Math.max(10, (y / box.ch) * 100))}%` } // marks are centred and up to 44% wide: keep them inside the frame
  }

  return (
    <div ref={frame} className={styles.frame}>
      {stream && <video ref={video} className={styles.layer} autoPlay playsInline muted onLoadedMetadata={(e) => { const { videoWidth: vw, videoHeight: vh } = e.currentTarget; setBox((b) => ({ ...b, vw, vh })) }} />}
      {stream && <canvas ref={canvas} className={styles.layer} aria-hidden="true" />}
      {label && <span className={styles.label} role="status">{label}</span>}
      {away && <span className={styles.spot} aria-hidden="true" />}
      {marks.map((m) => (
        <span key={`${m.label}-${m.x.toFixed(2)}`} className={`enter ${styles.mark}`} data-kind={m.kind} style={place(m)}>
          {m.kind === 'good' ? <Icon name="check" size={30} /> : <>{m.label}{m.arrow && <Icon name={m.arrow} size={18} />}</>}
        </span>
      ))}
    </div>
  )
}
