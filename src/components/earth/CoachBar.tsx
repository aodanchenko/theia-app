import type { EarthText } from '../../earthText.ts'
import type { NoteKind } from '../../engine/earthCoach.ts'
import Icon from './Icon.tsx'
import styles from './CoachBar.module.css'

// Top of the camera screen: pause/resume, one segment per rep coloured by its result, the count, settings.
export default function CoachBar({ t, results, total, paused, onPause, onSettings }: { t: EarthText; results: NoteKind[]; total: number; paused: boolean; onPause: () => void; onSettings: () => void }) {
  return (
    <header className={styles.bar}>
      <button type="button" className={styles.icon} aria-label={paused ? t.resume : t.pause} onClick={onPause}><Icon name={paused ? 'play' : 'pause'} /></button>
      <div className={styles.segs} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={results.length} aria-label={t.repsInSet}>
        {Array.from({ length: total }, (_, k) => <i key={k} data-r={results[k]} />)}
      </div>
      <span className={styles.count}><b>{results.length}</b>/{total}</span>
      <button type="button" className={styles.icon} aria-label={t.settings} onClick={onSettings}><Icon name="gear" /></button>
    </header>
  )
}
