import type { EarthText } from '../../earthText.ts'
import styles from './ExerciseSwitch.module.css'

export type Exercise = 'squat' | 'walk'

// Squat or walk, above the camera. Switching starts a new set.
export default function ExerciseSwitch({ t, value, onChange }: { t: EarthText; value: Exercise; onChange: (e: Exercise) => void }) {
  return (
    <div className={styles.switch} role="group" aria-label={t.exercise}>
      {(['squat', 'walk'] as const).map((e) => (
        <button key={e} type="button" aria-pressed={value === e} onClick={() => value !== e && onChange(e)}>{t[e]}</button>
      ))}
    </div>
  )
}
