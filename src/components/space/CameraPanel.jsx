import { useEffect, useRef } from 'react'
import useCameraStream from '../../capture/useCameraStream.js'
import styles from './CameraPanel.module.css'

// Camera view: live video when enabled, the overlay on top, cue (top left), capture info (top right).
// `children(live)` renders the overlay; `live` tells it to drop its drawn background.
export default function CameraPanel({ cue, caption, children }) {
  const { stream, status, error, start, stop } = useCameraStream()
  const video = useRef(null)
  const live = status === 'on'

  useEffect(() => { if (video.current) video.current.srcObject = stream }, [stream])

  return (
    <div className={styles.panel}>
      {live && <video ref={video} className={styles.video} autoPlay playsInline muted />}
      {children(live)}
      {cue && <span className={`enter ${styles.cue}`} role="status">{cue}</span>}
      <span className={styles.caption}>{caption.map((line) => <span key={line}>{line}</span>)}</span>
      <div className={styles.controls}>
        <button type="button" className={styles.toggle} data-live={live || undefined} onClick={live ? stop : start} disabled={status === 'starting'}>
          {live ? 'Stop camera' : status === 'starting' ? 'Starting…' : 'Enable camera'}
        </button>
        <span className={styles.note} role="status">{error ?? (live ? 'Live video · overlay simulated' : 'Simulated view')}</span>
      </div>
    </div>
  )
}
