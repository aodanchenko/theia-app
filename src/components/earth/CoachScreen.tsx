import type { ReactNode } from 'react'
import styles from './CoachScreen.module.css'

// Phone layout: full-screen camera; top: what you're doing + settings, then one cue; bottom: rep count and start/stop.
export default function CoachScreen({ camera, label, onMenu, cue, counter, action }: { camera: ReactNode; label?: string; onMenu?: () => void; cue: ReactNode; counter: ReactNode; action: ReactNode }) {
  return (
    <div className={styles.screen}>
      <div className={styles.camera}>{camera}</div>
      <div className={styles.top}>
        <div className={styles.bar}>
          {label ? <span className={styles.label} role="status">{label}</span> : <span />}
          {onMenu && <button type="button" className={styles.menu} aria-label="Settings" onClick={onMenu}>⚙︎</button>}
        </div>
        {cue}
      </div>
      <div className={styles.bottom}>{counter}{action}</div>
    </div>
  )
}
