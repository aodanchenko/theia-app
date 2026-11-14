import styles from './WeekDose.module.css'

// The weekly squat dose: good reps (correct form, within baseline) toward the prescription, this set, and why it
// matters. Population evidence only, never a personal bone or muscle prediction.
// Sources: Lang et al. 2004 (JBMR 19:1006), Mir hip loss; Smith et al. 2012 (JBMR 27:1896), ISS crews on ARED.
export default function WeekDose({ done, target, set, setTotal, bestRun }: { done: number; target: number; set: number; setTotal: number; bestRun: number }) {
  return (
    <div className={styles.dose}>
      <div className={styles.head}>
        <span className={styles.count}><b>{done}</b> / {target}</span>
        <span>good reps this week</span>
      </div>
      <div className={styles.track} role="progressbar" aria-label="Good reps this week" aria-valuemin={0} aria-valuemax={target} aria-valuenow={done}>
        <span className={styles.bar} style={{ width: `${Math.min(1, done / target) * 100}%` }} />
      </div>
      <p className={styles.set}>This set: {set} of {setTotal} good{bestRun >= 3 ? ` · best streak ${bestRun} in a row` : ''}</p>
      <p className={styles.why}>
        Why it counts: on Mir, without heavy resistance training, hips lost 1.2–1.5% of their bone a month. ISS crews training on ARED came home with theirs.
      </p>
    </div>
  )
}
