import type { ReactNode } from 'react'
import styles from './CoachScreen.module.css'

// Camera home layout: bar on top, the framed camera, one note, one action. Fills its parent (DeviceFrame).
export default function CoachScreen({ bar, camera, note, action }: { bar: ReactNode; camera: ReactNode; note: ReactNode; action: ReactNode }) {
  return <div className={styles.screen}>{bar}{camera}{note}{action}</div>
}
