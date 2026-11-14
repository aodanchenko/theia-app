import type { Vital } from '../../types.ts'
import Sparkline from './Sparkline.tsx'
import styles from './VitalsGrid.module.css'

export default function VitalsGrid({ vitals }: { vitals: Vital[] }) {
  return (
    <div className={styles.grid}>
      {vitals.map(({ name, value, unit, alert, expected, trend }) => (
        <div key={name} className={styles.tile} data-alert={alert || undefined}>
          <small>{name}{expected && <span className={styles.expected}> · expected: {expected}</span>}</small>
          <b>{value}{unit && <span className={styles.unit}>{unit}</span>}</b>
          <Sparkline points={trend} alert={alert} />
        </div>
      ))}
    </div>
  )
}
