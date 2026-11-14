import type { ReactNode } from 'react'
import styles from './Workbench.module.css'

// Tablet layout: header, toolbar, camera | side panels, status bar.
export default function Workbench({ header, toolbar, camera, side, status }: Record<'header' | 'toolbar' | 'camera' | 'side' | 'status', ReactNode>) {
  return (
    <div className={styles.workbench}>
      {header}
      {toolbar}
      <div className={styles.main}>
        {camera}
        <div className={styles.side}>{side}</div>
      </div>
      {status}
    </div>
  )
}
