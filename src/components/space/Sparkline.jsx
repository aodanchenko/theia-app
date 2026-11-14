import styles from './Sparkline.module.css'

// Tiny trend line. `points` are values in 0..16 (16 = top).
export default function Sparkline({ points, alert = false }) {
  const coords = points.map((p, i) => `${i * 5},${16 - p}`).join(' ')
  return (
    <svg className={styles.spark} viewBox="0 0 56 16" aria-hidden="true">
      <polyline points={coords} data-alert={alert || undefined} />
    </svg>
  )
}
