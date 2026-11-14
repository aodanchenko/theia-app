import type { ReactNode } from 'react'
import styles from './Workbench.module.css'

// Tablet layout: menu, toolbar, camera | side panels, status bar, sheet tabs.
export default function Workbench({ menu, toolbar, camera, side, status, tabs }: Record<'menu' | 'toolbar' | 'camera' | 'side' | 'status' | 'tabs', ReactNode>) {
  return (
    <div className={styles.workbench}>
      {menu}
      {toolbar}
      <div className={styles.main}>
        {camera}
        <div className={styles.side}>{side}</div>
      </div>
      {status}
      {tabs}
    </div>
  )
}
