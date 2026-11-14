import styles from './HomePage.module.css'

const MODES = [
  { href: '/space', name: 'Space', text: 'Astronaut workbench for squats on ARED, the station’s resistance machine.', device: 'Tablet · landscape', phoneNote: 'On a phone: turn it sideways.' },
  { href: '/earth', name: 'Earth', text: 'Rehab coach for exercises at home.', device: 'Phone · portrait' },
]
const POINTS = ['Compared with your own baseline', 'Tuned with rehab data', 'Runs on your device']

// Customer-facing entry page: wordmark, headline, the two modes as ink-outline buttons.
export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <span className={styles.mark}>Theia</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Is this rep like your normal?</h1>
        <p className={styles.sub}>Theia watches your movement through the camera, compares each rep with your own normal, and tells you the one thing to change.</p>
        <ul className={styles.points}>{POINTS.map((p) => <li key={p}>{p}</li>)}</ul>

        <nav aria-label="Choose a mode">
          <ul className={styles.modes}>
            {MODES.map((m) => (
              <li key={m.href}>
                <a className={styles.mode} href={m.href}>
                  <span className={styles.top}>
                    <span className={styles.modeName}>{m.name}</span>
                    <span className={styles.arrow} aria-hidden="true">→</span>
                  </span>
                  <span className={styles.text}>{m.text}</span>
                  {m.phoneNote && <span className={styles.phoneNote}>{m.phoneNote}</span>}
                  <span className={styles.device}>{m.device}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <footer className={styles.foot}>Camera video never leaves your device. Simulated readings are always labelled.</footer>
    </div>
  )
}
