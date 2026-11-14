import styles from './HomePage.module.css'

const MODES = [
  { href: '/space', name: 'Space', text: 'Astronaut workbench for ARED squats. Tablet, landscape.' },
  { href: '/earth', name: 'Earth', text: 'Rehab coach at home. Phone, portrait.' },
]

export default function HomePage() {
  return (
    <main className={styles.home}>
      <h1>Theia</h1>
      <p className={styles.lead}>Movement checks against your own baseline, tuned with rehab data.</p>
      <ul className={styles.modes}>
        {MODES.map(({ href, name, text }) => (
          <li key={href}><a href={href}><b>{name}</b><span>{text}</span></a></li>
        ))}
      </ul>
    </main>
  )
}
