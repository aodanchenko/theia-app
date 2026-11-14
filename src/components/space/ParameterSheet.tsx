import type { Parameter } from '../../types.ts'
import styles from './ParameterSheet.module.css'

// Movement parameters: this rep vs correct form and vs the personal baseline.
export default function ParameterSheet({ rows }: { rows: Parameter[] }) {
  return (
    <table className={`enter ${styles.sheet}`}>
      <thead>
        <tr><th scope="col">Parameter</th><th scope="col" className={styles.num}>Now</th><th scope="col" className={styles.num}>Correct</th><th scope="col" className={styles.num}>Your base</th><th scope="col">Flag</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} data-tone={row.tone}>
            <th scope="row">{row.name}</th>
            <td className={styles.num}>{row.now}</td>
            <td className={styles.num}>{row.correct}</td>
            <td className={styles.num}>{row.base}</td>
            <td>{row.flag && `${row.tone === 'alert' ? '▲' : '!'} ${row.flag}`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
