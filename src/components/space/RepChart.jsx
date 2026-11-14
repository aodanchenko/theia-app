import styles from './RepChart.module.css'

// Value per rep as bars, with the personal baseline band and two model thresholds.
// Bars at or above the rehab threshold are flagged; reps not done yet show as stubs.
export default function RepChart({ values, total, limits, label }) {
  const x = (i) => 34 + i * (280 / total)
  const y = (d) => 116 - d * 8.4
  const firstFlag = values.findIndex((v) => v >= limits.rehab)
  const [lo, hi] = limits.baseline

  return (
    <svg className={styles.chart} viewBox="0 0 400 140" role="img" aria-label={label}>
      <rect className={styles.band} x="20" y={y(hi)} width="300" height={y(lo) - y(hi)} />
      <text className={styles.good} x="324" y={y((lo + hi) / 2) + 3}>BASELINE {lo}–{hi}°</text>

      <line className={styles.rehab} x1="20" x2="320" y1={y(limits.rehab)} y2={y(limits.rehab)} />
      <text className={styles.alert} x="324" y={y(limits.rehab) + 3}>REHAB MODEL {limits.rehab}°</text>
      <line className={styles.base} x1="20" x2="320" y1={y(limits.base)} y2={y(limits.base)} />
      <text x="324" y={y(limits.base) + 3}>BASE MODEL {limits.base}°</text>

      <line className={styles.axis} x1="20" x2="320" y1="116" y2="116" />
      {Array.from({ length: total }, (_, i) => {
        const v = values[i]
        return v === undefined
          ? <rect key={i} className={styles.todo} x={x(i) - 9} y={y(0.3)} width="18" height="3" />
          : <rect key={i} className={v >= limits.rehab ? styles.flagged : styles.bar} x={x(i) - 9} y={y(v)} width="18" height={116 - y(v)}><title>Rep {i + 1}: {v}°</title></rect>
      })}
      {Array.from({ length: total }, (_, i) => <text key={i} x={x(i)} y="130" textAnchor="middle">{i + 1}</text>)}

      {firstFlag >= 0 && (
        <g className={styles.alert}>
          <path className={styles.marker} d={`M${x(firstFlag)} ${y(values[firstFlag]) - 6}v-8`} />
          <text x={x(firstFlag)} y={y(values[firstFlag]) - 17} textAnchor="middle">FLAG</text>
        </g>
      )}
      <text x="20" y="138">REP</text>
    </svg>
  )
}
