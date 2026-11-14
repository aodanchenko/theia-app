import styles from './ModelCheck.module.css'

export interface ModelCheckRow {
  label: string
  caught: number // 0..1
  falseAlerts?: number // 0..1, correct reps wrongly flagged
  ours?: boolean
}

// Share of incorrect reps each method catches (bar), with its false alerts when given.
export default function ModelCheck({ rows, caption }: { rows: ModelCheckRow[]; caption: string }) {
  return (
    <figure className={styles.check}>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} data-ours={r.ours || undefined}>
              <th scope="row">{r.label}</th>
              <td className={styles.track}><span className={styles.bar} style={{ width: `${r.caught * 100}%` }} /></td>
              <td className={styles.num}>{Math.round(r.caught * 100)}%</td>
              {r.falseAlerts !== undefined && <td className={styles.num}>{Math.round(r.falseAlerts * 100)}% false</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
