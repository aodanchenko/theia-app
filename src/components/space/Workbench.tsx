import type { ReactNode } from 'react'
import styles from './Workbench.module.css'

// Tablet layout: header, toolbar, then camera | side panels.
export default function Workbench({ header, toolbar, camera, side }: Record<'header' | 'toolbar' | 'camera' | 'side', ReactNode>) {
  return (
    <div className={styles.workbench}>
      {header}
      {toolbar}
      <div className={styles.main}>
        {camera}
        <div className={styles.side}>{side}</div>
      </div>
    </div>
  )
}
