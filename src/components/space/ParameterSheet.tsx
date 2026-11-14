import type { Parameter } from '../../types.ts'
import styles from './ParameterSheet.module.css'

const COLUMNS = ['A', 'B', 'C', 'D', 'E']

// Spreadsheet of movement parameters: now vs personal baseline. Row 1 is the header row.
export default function ParameterSheet({ rows, selected = 0 }: { rows: Parameter[]; selected?: number }) {
  return (
    <table className={`enter ${styles.sheet}`}>
      <thead>
        <tr><th aria-hidden="true" />{COLUMNS.map((c) => <th key={c} aria-hidden="true">{c}</th>)}</tr>
        <tr className={styles.header}>
          <td>1</td><th scope="col">Parameter</th><th scope="col">Now</th><th scope="col">Base</th><th scope="col">Δ</th><th scope="col">Flag</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row.name} data-flag={row.flag ? true : undefined}>
            <td>{i + 2}</td>
            <th scope="row">{row.name}</th>
            <td className={styles.num} data-selected={i === selected || undefined}>{row.now}</td>
            <td className={styles.num}>{row.base}</td>
            <td className={styles.num}>{row.delta}</td>
            <td>{row.flag && `▲ ${row.flag}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
