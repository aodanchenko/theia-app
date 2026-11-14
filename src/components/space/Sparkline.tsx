import type { VitalStatus } from '../../types.ts'
import styles from './Sparkline.module.css'

const W = 72, H = 24

// Recent values as a line over the personal baseline band; the last value is a dot coloured by status.
export default function Sparkline({ points, domain, band, status }: { points: number[]; domain: [number, number]; band?: [number, number]; status: VitalStatus }) {
  const [min, max] = domain
  const y = (v: number) => H - 2 - ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (H - 4)
  const x = (i: number) => 1 + (i * (W - 6)) / Math.max(1, points.length - 1)
  const last = points.length - 1
  return (
    <svg className={styles.spark} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      {band && <rect className={styles.band} x="0" width={W} y={y(band[1])} height={y(band[0]) - y(band[1])} />}
      <polyline points={points.map((p, i) => `${x(i)},${y(p)}`).join(' ')} />
      <circle className={styles.now} data-status={status} cx={x(last)} cy={y(points[last])} r="2.2" />
    </svg>
  )
}
