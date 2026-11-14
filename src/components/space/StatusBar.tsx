import styles from './StatusBar.module.css'

// Bottom bar: session facts on the left, the next step on the right.
export default function StatusBar({ items, next }: { items: string[]; next: string }) {
  return (
    <div className={styles.bar}>
      {items.map((item) => <span key={item}>{item}</span>)}
      <span className={styles.next}>{next}</span>
    </div>
  )
}
