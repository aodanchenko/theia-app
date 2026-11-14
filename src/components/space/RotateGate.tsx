import styles from './RotateGate.module.css'

// Covers the workbench on a phone held upright (CSS media query): Space needs a tablet or a phone turned sideways.
export default function RotateGate() {
  return (
    <div className={styles.gate} role="alertdialog" aria-labelledby="rotate-title" aria-describedby="rotate-text">
      <svg className={styles.icon} viewBox="0 0 96 96" aria-hidden="true">
        <rect className={styles.ghost} x="34" y="14" width="28" height="50" rx="5" />
        <rect className={styles.phone} x="22" y="40" width="50" height="28" rx="5" />
        <path className={styles.turn} d="M70 30 A28 28 0 0 0 44 10" />
        <path className={styles.turn} d="M66 22 l4 8 l8 -4" />
      </svg>
      <p className={styles.eyebrow}>Space mode · tablet console</p>
      <h1 id="rotate-title" className={styles.title}>Turn your phone sideways</h1>
      <p id="rotate-text" className={styles.text}>The astronaut workbench needs a wide screen: camera on the left, readings on the right. A tablet in landscape works best.</p>
      <nav className={styles.links}>
        <a href="/earth">Open Earth mode, made for phones</a>
        <a href="/">Back to Theia</a>
      </nav>
    </div>
  )
}
