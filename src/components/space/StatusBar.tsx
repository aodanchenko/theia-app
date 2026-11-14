import styles from './StatusBar.module.css'

// Blue bar at the bottom: session facts left, the next step right.
export default function StatusBar({ items, next }: { items: string[]; next: string }) {
  return (
    <footer className={styles.bar} role="status">
      {items.map((it) => <span key={it}>{it}</span>)}
      <span className={styles.next}>{next}</span>
    </footer>
  )
}
