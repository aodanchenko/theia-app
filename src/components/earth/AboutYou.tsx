import { useState } from 'react'
import type { EarthProfile } from '../../types.ts'
import styles from './AboutYou.module.css'

type Key = keyof EarthProfile
const QUESTIONS: { key: Key; q: string; why: string; options: [EarthProfile[Key], string][] }[] = [
  { key: 'side', q: 'Which side is affected?', why: 'So the tips name the right leg.', options: [['left', 'Left'], ['right', 'Right'], ['both', 'Both'], ['unsure', 'Not sure']] },
  { key: 'prosthesis', q: 'Do you use a prosthesis?', why: 'Theia will not push you to go deeper than feels steady.', options: [[true, 'Yes'], [false, 'No']] },
  { key: 'aid', q: 'Do you use a cane, crutch or walker?', why: 'Theia will remind you to keep it within reach.', options: [[true, 'Yes'], [false, 'No']] },
  { key: 'position', q: 'Do you exercise seated or standing?', why: 'Seated: stand up and sit down. Standing: bend your knees.', options: [['seated', 'Seated'], ['standing', 'Standing']] },
  { key: 'voice', q: 'Should Theia speak the tips?', why: 'Handy when the phone is a few steps away.', options: [[true, 'Yes, speak'], [false, 'No, text only']] },
  { key: 'bigText', q: 'Do you want bigger text?', why: 'You can change this later in Settings.', options: [[true, 'Yes, bigger'], [false, 'No, keep it']] },
]

// "About you": one question per screen, tap only. Tapping an answer moves on; the last one saves.
export default function AboutYou({ initial, onDone, onCancel }: { initial?: EarthProfile | null; onDone: (p: EarthProfile) => void; onCancel?: () => void }) {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<Partial<EarthProfile>>(initial ?? {})
  const q = QUESTIONS[i]

  const pick = (value: EarthProfile[Key]) => {
    const next: Partial<EarthProfile> = { ...answers, [q.key]: value }
    setAnswers(next)
    if (i < QUESTIONS.length - 1) setI(i + 1)
    else onDone(next as EarthProfile) // every question answered by now: one answer per step, no skipping
  }

  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        {i > 0 ? <button type="button" className={styles.back} onClick={() => setI(i - 1)}>← Back</button> : onCancel ? <button type="button" className={styles.back} onClick={onCancel}>Cancel</button> : <span />}
        <span className={styles.step} aria-label={`Question ${i + 1} of ${QUESTIONS.length}`}>
          {QUESTIONS.map((_, k) => <i key={k} data-on={k <= i || undefined} />)}
        </span>
      </header>
      {i === 0 && !initial && <p className={styles.intro}>About you · 6 quick taps</p>}
      <h1 key={q.key} className={`enter ${styles.q}`}>{q.q}</h1>
      <p className={styles.why}>{q.why}</p>
      <div className={styles.options}>
        {q.options.map(([value, label]) => (
          <button key={label} type="button" className={styles.option} aria-pressed={answers[q.key] === value} onClick={() => pick(value)}>{label}</button>
        ))}
      </div>
    </div>
  )
}
