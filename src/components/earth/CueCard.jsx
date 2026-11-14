import styles from './CueCard.module.css'

// The one instruction for right now. Keep `title` to a short imperative sentence.
export default function CueCard({ title, hint }) {
  return (
    <div className={`enter ${styles.card}`} role="status">
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  )
}
