import type { Vital, VitalStatus } from '../../types.ts'
import Sparkline from './Sparkline.tsx'
import styles from './VitalsGrid.module.css'

// Lamp text per status: never colour alone (red = flag only; an explained change is plain ink).
const LAMP: Record<VitalStatus, string> = { normal: 'Normal', expected: 'Expected', watch: 'Watch', flag: '▲ Flag' }

// Instrument tiles: engraved name + status lamp, value in a recessed window, trend over the personal baseline band.
export default function VitalsGrid({ vitals }: { vitals: Vital[] }) {
  return (
    <div className={styles.grid}>
      {vitals.map((v) => (
        <div key={v.name} className={styles.tile} data-status={v.status}>
          <div className={styles.head}>
            <span className={styles.name}>{v.name}</span>
            <span className={styles.lamp}>{LAMP[v.status]}</span>
          </div>
          <div className={styles.body}>
            <span className={styles.window}><b>{v.value}</b><span className={styles.unit}>{v.unit}</span></span>
            {v.trend && v.domain ? <Sparkline points={v.trend} domain={v.domain} band={v.base} status={v.status} /> : null}
          </div>
          <span className={styles.foot}>
            {v.source ?? (v.base && `base ${v.base[0]}–${v.base[1]}`)}
            {v.cause && <> · {v.cause}</>}
          </span>
        </div>
      ))}
    </div>
  )
}
