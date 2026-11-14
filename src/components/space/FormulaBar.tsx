import styles from './FormulaBar.module.css'

export default function FormulaBar({ cell, formula }: { cell: string; formula?: string }) {
  return (
    <div className={styles.bar}>
      <span className={styles.cell}>{cell}</span>
      <i className={styles.fx}>fx</i>
      <code className={styles.formula}>{formula}</code>
    </div>
  )
}
