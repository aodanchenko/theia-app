import { useEffect, useRef } from 'react'
import styles from './HelpDialog.module.css'

export type HelpTopic = 'decide' | 'privacy'

// Modal help from the Help menu. Native <dialog>: focus trap, Escape and backdrop come for free.
export default function HelpDialog({ topic, onClose, calibration, threshold }: { topic: HelpTopic | null; onClose: () => void; calibration: number; threshold: number }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (topic) ref.current?.showModal(); else ref.current?.close() }, [topic])
  return (
    <dialog ref={ref} className={styles.dialog} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}>
      {topic === 'decide' && (
        <>
          <h2>How Theia decides</h2>
          <ol>
            <li>The camera finds your joints (MediaPipe Pose, on this device).</li>
            <li>Each squat is measured at the bottom: depth, knee width, trunk lean, left/right difference.</li>
            <li>Your first {calibration} reps become <b>your baseline</b>. You are compared with yourself, not with other people.</li>
            <li>Every later rep is scored by how far it strays from your baseline, in units of normal rep-to-rep variation learned from rehab data (UI-PRMD).</li>
            <li>Past {threshold.toFixed(1)} the rep is flagged and the worst measurement picks the cue, e.g. "Knees out".</li>
          </ol>
          <p>Theia gives technique guidance, never a diagnosis or a prescription.</p>
        </>
      )}
      {topic === 'privacy' && (
        <>
          <h2>Data &amp; privacy</h2>
          <ul>
            <li>Video never leaves this device; only joint angles are computed from it.</li>
            <li>Export CSV saves your rep log to this device. Nothing is uploaded.</li>
            <li>Vitals and the demo set are simulated and labelled SIMULATED.</li>
            <li>Rehab data: UI-PRMD, University of Idaho (public domain, PDDL 1.0).</li>
          </ul>
        </>
      )}
      <form method="dialog"><button className={styles.close}>Close</button></form>
    </dialog>
  )
}
