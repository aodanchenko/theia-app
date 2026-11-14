import { useState } from 'react'
import { TEXT, type Lang, type EarthText } from '../../earthText.ts'
import type { EarthProfile } from '../../types.ts'
import LangSwitch from './LangSwitch.tsx'
import styles from './AboutYou.module.css'

type Key = keyof EarthProfile
type Question = { key: Key; q: string; why: string; options: [EarthProfile[Key], string][] }
const questions = (t: EarthText): Question[] => {
  const Q = t.questions, yesNo: [boolean, string][] = [[true, t.yes], [false, t.no]]
  return [
    { key: 'side', ...Q.side, options: Object.entries(Q.side.options) as [EarthProfile['side'], string][] },
    { key: 'prosthesis', ...Q.prosthesis, options: yesNo },
    { key: 'aid', ...Q.aid, options: yesNo },
    { key: 'position', ...Q.position, options: Object.entries(Q.position.options) as [EarthProfile['position'], string][] },
    { key: 'voice', ...Q.voice, options: [[true, Q.voice.yes], [false, Q.voice.no]] },
    { key: 'bigText', ...Q.bigText, options: [[true, Q.bigText.yes], [false, Q.bigText.no]] },
  ]
}

// "About you": one question per screen, tap only. Tapping an answer moves on; the last one saves. The language switch sits on the first screen.
export default function AboutYou({ lang, onLang, initial, onDone, onCancel }: { lang: Lang; onLang: (l: Lang) => void; initial?: EarthProfile | null; onDone: (p: EarthProfile) => void; onCancel?: () => void }) {
  const t = TEXT[lang], QUESTIONS = questions(t)
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
        {i > 0 ? <button type="button" className={styles.back} onClick={() => setI(i - 1)}>{t.back}</button> : onCancel ? <button type="button" className={styles.back} onClick={onCancel}>{t.cancel}</button> : <LangSwitch lang={lang} label={t.language} onChange={onLang} />}
        <span className={styles.step} aria-label={t.question(i + 1, QUESTIONS.length)}>
          {QUESTIONS.map((_, k) => <i key={k} data-on={k <= i || undefined} />)}
        </span>
      </header>
      {i === 0 && !initial && <p className={styles.intro}>{t.intro}</p>}
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
