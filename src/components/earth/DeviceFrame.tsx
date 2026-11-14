import type { ReactNode } from 'react'
import styles from './DeviceFrame.module.css'

// Earth is a phone app. Laptop / desktop (mouse): shown inside a phone frame. Touch devices: full screen,
// upright only — turned sideways, a "turn it upright" screen covers it. Pure CSS media queries.
export default function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.stage}>
      <div className={styles.device}>{children}</div>
      <p className={styles.caption}>Theia Earth is made for phones. Open this page on your phone to use the camera.</p>
      <div className={styles.rotate} role="alertdialog" aria-labelledby="upright-title">
        <svg className={styles.icon} viewBox="0 0 96 96" aria-hidden="true">
          <rect className={styles.ghost} x="22" y="34" width="52" height="28" rx="5" />
          <rect className={styles.phone} x="34" y="20" width="28" height="56" rx="5" />
          <path className={styles.turn} d="M76 46 A28 28 0 0 0 60 18" />
          <path className={styles.turn} d="M58 12 l2 6 l6 -2" />
        </svg>
        <h1 id="upright-title">Turn your device upright</h1>
        <p>The coach works in portrait: you, the camera and one instruction at a time.</p>
      </div>
    </div>
  )
}
