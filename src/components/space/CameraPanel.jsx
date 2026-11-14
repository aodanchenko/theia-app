import styles from './CameraPanel.module.css'

// Camera view with the current cue (top left) and capture info (top right).
export default function CameraPanel({ cue, caption, children }) {
  return (
    <div className={styles.panel}>
      {children}
      {cue && <span className={`enter ${styles.cue}`} role="status">{cue}</span>}
      <span className={styles.caption}>{caption.map((line) => <span key={line}>{line}</span>)}</span>
    </div>
  )
}
