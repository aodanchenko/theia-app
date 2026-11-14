import type { ReactNode } from 'react'
import styles from './Panel.module.css'

// Titled section in the side column. `note` sits right-aligned in the title row.
// `grow` lets the panel take the side column's spare height (the rep chart).
export default function Panel({ title, note, delay = 0, grow, children }: { title: string; note?: string; delay?: number; grow?: boolean; children: ReactNode }) {
  return (
    <section className={`enter ${styles.panel}`} data-grow={grow || undefined} style={{ '--delay': `${delay}ms` }}>
      <h2 className={styles.title}>{title}{note && <span className={styles.note}>{note}</span>}</h2>
      {children}
    </section>
  )
}
