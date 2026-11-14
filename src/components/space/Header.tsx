import styles from './Header.module.css'

export default function Header({ title, file }: { title: string; file: string }) {
  return (
    <header className={styles.header}>
      <b>{title}</b>
      <span className={styles.file}>{file}</span>
    </header>
  )
}
