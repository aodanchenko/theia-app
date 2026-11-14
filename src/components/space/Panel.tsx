import type { ReactNode } from 'react'
import styles from './Panel.module.css'

// Titled section in the side column. `note` sits right-aligned in the title row.
export default function Panel({ title, note, delay = 0, children }: { title: string; note?: string; delay?: number; children: ReactNode }) {
  return (
    <section className={`enter ${styles.panel}`} style={{ '--delay': `${delay}ms` }}>
      <h2 className={styles.title}>{title}{note && <span className={styles.note}>{note}</span>}</h2>
      {children}
    </section>
  )
}
