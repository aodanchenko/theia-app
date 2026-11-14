import type { ReactNode } from 'react'
import styles from './Header.module.css'

// Title bar: app name, menus (children), session file.
export default function Header({ title, file, children }: { title: string; file: string; children?: ReactNode }) {
  return (
    <header className={styles.header}>
      <b>{title}</b>
      <nav className={styles.menus}>{children}</nav>
      <span className={styles.file}>{file}</span>
    </header>
  )
}
