import styles from './MenuBar.module.css'

export default function MenuBar({ title, items, file }) {
  return (
    <div className={styles.menu}>
      <b>{title}</b>
      {items.map((item) => <span key={item}>{item}</span>)}
      <span className={styles.file}>{file}</span>
    </div>
  )
}
