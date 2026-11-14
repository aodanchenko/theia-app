import styles from './RepCounter.module.css'

export default function RepCounter({ done, total }) {
  return (
    <p className={`enter ${styles.counter}`} style={{ '--delay': '180ms' }} aria-label={`Rep ${done} of ${total}`}>
      <b className="tabular">{done}</b>
      <span>of {total}</span>
    </p>
  )
}
