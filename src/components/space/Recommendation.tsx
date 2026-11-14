import styles from './Recommendation.module.css'

export type Tone = 'alert' | 'caution' | 'good' | 'neutral'

// The decision in large text, so it reads from the squat rack. `key` on the action re-runs the entrance per new rep.
// `basis` says what the decision is compared against (baseline, model, known cause).
export default function Recommendation({ decision, action, reason, basis, tone, id }: { decision: string; action: string; reason: string; basis: string; tone: Tone; id: string | number }) {
  return (
    <section className={styles.rec} data-tone={tone} aria-live="polite">
      <span className={styles.decision}>{tone === 'alert' ? '▲ ' : tone === 'caution' ? '! ' : tone === 'good' ? '✓ ' : ''}{decision}</span>
      <span key={id} className={`enter ${styles.action}`}>{action}</span>
      <span className={styles.reason}>{reason}</span>
      <span className={styles.basis}>{basis}</span>
    </section>
  )
}
