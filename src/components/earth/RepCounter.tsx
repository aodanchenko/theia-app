import styles from './RepCounter.module.css'

// Big rep count. With `total`: "7 of 10"; without: "7 reps".
export default function RepCounter({ done, total }: { done: number; total?: number }) {
  return (
    <p className={`enter ${styles.counter}`} style={{ '--delay': '180ms' }} aria-label={total ? `Rep ${done} of ${total}` : `${done} reps`}>
      <b className="tabular">{done}</b>
      <span>{total ? `of ${total}` : done === 1 ? 'rep' : 'reps'}</span>
    </p>
  )
}
