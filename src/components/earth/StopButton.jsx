import styles from './StopButton.module.css'

export default function StopButton({ onStop }) {
  return (
    <button type="button" className={`enter ${styles.stop}`} style={{ '--delay': '180ms' }} onClick={onStop}>
      Stop
    </button>
  )
}
