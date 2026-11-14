import type { ReactNode } from 'react'
import type { EarthProfile } from '../../types.ts'
import styles from './Settings.module.css'

const SIDE = { left: 'Left', right: 'Right', both: 'Both', unsure: 'Not sure' }

// Settings: About you, voice, text size, phone placement, help, about, start over.
export default function Settings({ profile, onChange, onEditAbout, onPlace, onReset, onClose }: {
  profile: EarthProfile
  onChange: (p: EarthProfile) => void
  onEditAbout: () => void
  onPlace: () => void
  onReset: () => void
  onClose: () => void
}) {
  const summary = [`${SIDE[profile.side]} side`, profile.position === 'seated' ? 'seated' : 'standing', profile.prosthesis && 'prosthesis', profile.aid && 'walking aid'].filter(Boolean).join(' · ')
  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <h1>Settings</h1>
        <button type="button" className={styles.done} onClick={onClose}>Done</button>
      </header>

      <Group title="You">
        <Row label="About you" detail={summary} onClick={onEditAbout} />
        <Toggle label="Speak the tips" on={profile.voice} onChange={(voice) => onChange({ ...profile, voice })} />
        <Toggle label="Bigger text" on={profile.bigText} onChange={(bigText) => onChange({ ...profile, bigText })} />
      </Group>

      <Group title="Help">
        <Row label="How to place the phone" onClick={onPlace} />
        <details className={styles.more}>
          <summary>Get help</summary>
          <p>Feel pain, dizziness or chest pain? <b>Stop and sit down.</b> Then call your physiotherapist or doctor.</p>
          <p>In an emergency, call <a href="tel:112">112</a>.</p>
          <p>Theia gives movement tips, not medical advice or a diagnosis.</p>
        </details>
        <details className={styles.more}>
          <summary>About Theia</summary>
          <p>Theia watches your movement through the camera, learns your normal from your first reps, and gives one tip at a time.</p>
          <p>Camera video never leaves this phone. Your answers are saved only on this phone.</p>
        </details>
      </Group>

      <button type="button" className={styles.reset} onClick={onReset}>Start over</button>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <section className={styles.group}><h2>{title}</h2><div className={styles.list}>{children}</div></section>
}

function Row({ label, detail, onClick }: { label: string; detail?: string; onClick: () => void }) {
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <span><b>{label}</b>{detail && <small>{detail}</small>}</span><span aria-hidden="true">›</span>
    </button>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={styles.row} onClick={() => onChange(!on)}>
      <b>{label}</b><span className={styles.switch} data-on={on || undefined} aria-hidden="true" />
    </button>
  )
}
