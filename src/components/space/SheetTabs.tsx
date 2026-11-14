import styles from './SheetTabs.module.css'

export default function SheetTabs({ tabs, active }: { tabs: string[]; active: string }) {
  return (
    <nav className={styles.tabs} aria-label="Sheets">
      {tabs.map((tab) => <span key={tab} aria-current={tab === active ? 'page' : undefined}>{tab}</span>)}
    </nav>
  )
}
