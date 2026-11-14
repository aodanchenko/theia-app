import styles from './StartStopButton.module.css'

// The one round control on the camera screen: Stop while coaching, Start when paused.
export default function StartStopButton({ running, onToggle }: { running: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`enter ${styles.button}`} data-running={running || undefined} style={{ '--delay': '180ms' }} onClick={onToggle}>
      {running ? 'Stop' : 'Start'}
    </button>
  )
}
