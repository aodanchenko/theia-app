import styles from './DriftChart.module.css'

export interface DriftPoint {
  drift: number // worst deviation from the personal baseline ÷ flag threshold: 1 = flag
  calibration?: boolean // one of the reps that set the baseline
  flag?: string // short name of the worst measure, shown on flagged reps
}

const TOP = 2 // axis top; bigger drifts are pinned here with their value written next to them
const isFlag = (p?: DriftPoint) => !!p && !p.calibration && p.drift > 1

// Form drift per rep as a line with a dot per rep: calibration reps grey, the flag line at 1.0, flagged reps red
// with the measure that drifted most (labelled once per run); empty ticks for reps not done yet.
export default function DriftChart({ points, total, label }: { points: DriftPoint[]; total: number; label: string }) {
  const x = (i: number) => 34 + i * (280 / Math.max(total - 1, 1))
  const y = (d: number) => 116 - (Math.min(Math.max(d, 0), TOP) / TOP) * 96
  const calib = points.filter((p) => p.calibration).length
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.drift)}`).join('')

  return (
    <svg className={styles.chart} viewBox="0 0 400 140" role="img" aria-label={label}>
      <rect className={styles.over} x="20" y={y(TOP)} width="300" height={y(1) - y(TOP)} />
      {calib > 0 && (
        <>
          <rect className={styles.calib} x={x(0) - 10} y={y(TOP)} width={x(calib - 1) - x(0) + 20} height={116 - y(TOP)} />
          <text x={x(0) - 8} y={y(TOP) + 10}>BASELINE</text>
        </>
      )}
      <line className={styles.limit} x1="20" x2="320" y1={y(1)} y2={y(1)} />
      <text className={styles.alert} x="324" y={y(1) + 3}>FLAG 1.0</text>
      <text x="324" y={y(0) + 3}>YOUR NORMAL 0</text>
      <line className={styles.axis} x1="20" x2="320" y1="116" y2="116" />

      <path className={styles.line} d={line} />
      {Array.from({ length: total }, (_, i) => {
        const p = points[i]
        if (!p) return <line key={i} className={styles.todo} x1={x(i)} x2={x(i)} y1="113" y2="116" />
        const flagged = isFlag(p)
        const labelled = flagged && !(isFlag(points[i - 1]) && points[i - 1].flag === p.flag) // one label per run of the same flag
        return (
          <g key={i} className={p.calibration ? styles.calibDot : flagged ? styles.flagged : styles.dot}>
            <circle cx={x(i)} cy={y(p.drift)} r="3.2"><title>Rep {i + 1}: drift {p.drift.toFixed(2)}{p.flag ? `, ${p.flag}` : ''}</title></circle>
            {labelled && <text x={x(i)} y={y(p.drift) - 7} textAnchor="middle">▲ {p.flag}{p.drift > TOP ? ` ${p.drift.toFixed(1)}` : ''}</text>}
          </g>
        )
      })}
      {Array.from({ length: total }, (_, i) => <text key={i} x={x(i)} y="130" textAnchor="middle">{i + 1}</text>)}
      <text x="20" y="138">REP</text>
    </svg>
  )
}
