import type { ReactNode } from 'react'
import styles from './Toolbar.module.css'

// Row of working controls under the header. Every button must do something.
export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar} role="toolbar">{children}</div>
}

// `camera` = the red Enable camera button (the one exception to "red means flagged").
export function ToolButton({ onClick, disabled, camera, children }: { onClick: () => void; disabled?: boolean; camera?: boolean; children: ReactNode }) {
  return <button type="button" className={styles.button} data-camera={camera || undefined} onClick={onClick} disabled={disabled}>{children}</button>
}

export function ToolNote({ alert, children }: { alert?: boolean; children: ReactNode }) {
  return <span className={styles.note} data-alert={alert || undefined} role="status">{children}</span>
}
