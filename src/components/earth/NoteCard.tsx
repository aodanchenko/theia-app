import type { NoteKind } from '../../engine/earthCoach.ts'
import styles from './NoteCard.module.css'

// The one instruction under the camera. Tinted by result; the words carry the meaning, the tint only supports it.
export default function NoteCard({ kind, title, line }: { kind: NoteKind; title: string; line: string }) {
  return (
    <section className={styles.note} data-kind={kind} role="status" aria-live="polite">
      <p key={title} className={`enter ${styles.title}`}>{title}</p>
      <p className={styles.line}>{line}</p>
    </section>
  )
}
