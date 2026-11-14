import type { ReactNode } from 'react'
import styles from './CoachScreen.module.css'

// Phone layout: full-screen camera, one cue on top, rep count and stop at the bottom.
export default function CoachScreen({ camera, cue, counter, action }: { camera: ReactNode; cue: ReactNode; counter: ReactNode; action: ReactNode }) {
  return (
    <div className={styles.screen}>
      <div className={styles.camera}>{camera}</div>
      <div className={styles.top}>{cue}</div>
      <div className={styles.bottom}>{counter}{action}</div>
    </div>
  )
}
