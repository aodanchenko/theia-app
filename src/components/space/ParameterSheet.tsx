import type { Parameter } from '../../types.ts'
import styles from './ParameterSheet.module.css'

const HEADS = ['Parameter', 'Now', 'Correct', 'Your base', 'Flag']

// Movement parameters: this rep vs correct form and vs the personal baseline (walking passes its own column names).
export default function ParameterSheet({ rows, heads = HEADS }: { rows: Parameter[]; heads?: string[] }) {
  return (
    <table className={`enter ${styles.sheet}`}>
      <thead>
        <tr>{heads.map((h, i) => <th key={h || i} scope="col" className={i > 0 && i < 4 ? styles.num : undefined}>{h}</th>)}</tr>
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
