import type { Vital } from '../../types.ts'
import Sparkline from './Sparkline.tsx'
import styles from './VitalsGrid.module.css'

export default function VitalsGrid({ vitals }: { vitals: Vital[] }) {
  return (
    <div className={styles.grid}>
      {vitals.map(({ name, value, unit, alert, trend }) => (
        <div key={name} className={styles.tile} data-alert={alert || undefined}>
          <small>{name}</small>
          <b>{value}{unit && <span className={styles.unit}>{unit}</span>}</b>
          <Sparkline points={trend} alert={alert} />
        </div>
      ))}
    </div>
  )
}
