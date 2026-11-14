import type { ReactNode } from 'react'
import styles from './Toolbar.module.css'

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>
}

// Read-only state chip (not a button): shows what the session is using.
export function ToolChip({ active = false, live = false, children }: { active?: boolean; live?: boolean; children: ReactNode }) {
  return (
    <span className={styles.chip} data-active={active || undefined}>
      {live && <span className={styles.led} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function ToolSeparator() {
  return <span className={styles.separator} aria-hidden="true" />
}
