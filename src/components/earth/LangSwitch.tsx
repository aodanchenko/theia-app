import { LANGS, type Lang } from '../../earthText.ts'
import styles from './LangSwitch.module.css'

const SHORT: Record<Lang, string> = { en: 'EN', uk: 'УКР' }

// Two-way language switch: short codes on the buttons, each button named in its own language.
export default function LangSwitch({ lang, label, onChange }: { lang: Lang; label: string; onChange: (l: Lang) => void }) {
  return (
    <div className={styles.switch} role="group" aria-label={label}>
      {LANGS.map(([l, name]) => (
        <button key={l} type="button" lang={l} aria-label={name} aria-pressed={lang === l} onClick={() => onChange(l)}>{SHORT[l]}</button>
      ))}
    </div>
  )
}
