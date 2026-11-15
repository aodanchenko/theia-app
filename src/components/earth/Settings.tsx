import type { ReactNode } from 'react'
import type { EarthText, Lang } from '../../earthText.ts'
import type { EarthProfile } from '../../types.ts'
import { canPrompt, installed, isIPhone, promptInstall } from '../../capture/install.ts'
import LangSwitch from './LangSwitch.tsx'
import styles from './Settings.module.css'

// Settings: About you, language, voice, text size, phone placement, help, add to home screen, about, start over.
export default function Settings({ t, lang, onLang, profile, onChange, onEditAbout, onPlace, onReset, onClose }: {
  t: EarthText
  lang: Lang
  onLang: (l: Lang) => void
  profile: EarthProfile
  onChange: (p: EarthProfile) => void
  onEditAbout: () => void
  onPlace: () => void
  onReset: () => void
  onClose: () => void
}) {
  const summary = [t.sideSummary[profile.side], t[profile.position], profile.prosthesis && t.prosthesis, profile.aid && t.walkingAid].filter(Boolean).join(' · ')
  return (
    <div className={styles.screen}>
      <header className={styles.bar}>
        <h1>{t.settings}</h1>
        <button type="button" className={styles.done} onClick={onClose}>{t.done}</button>
      </header>

      <Group title={t.you}>
        <Row label={t.aboutYou} detail={summary} onClick={onEditAbout} />
        <div className={styles.row}><b>{t.language}</b><LangSwitch lang={lang} label={t.language} onChange={onLang} /></div>
        <Toggle label={t.sounds} on={profile.sounds !== false} onChange={(sounds) => onChange({ ...profile, sounds })} />
        <Toggle label={t.speakTips} on={profile.voice} onChange={(voice) => onChange({ ...profile, voice })} />
        <Toggle label={t.biggerText} on={profile.bigText} onChange={(bigText) => onChange({ ...profile, bigText })} />
      </Group>

      <Group title={t.help}>
        <Row label={t.howToPlace} onClick={onPlace} />
        <details className={styles.more}>
          <summary>{t.getHelp}</summary>
          <p>{t.helpPain[0]}<b>{t.helpPain[1]}</b>{t.helpPain[2]}</p>
          <p>{t.help112[0]}<a href="tel:112">112</a>{t.help112[1]}</p>
          <p>{t.notAdvice}</p>
        </details>
        {!installed() && (
          <details className={styles.more}>
            <summary>{t.install}</summary>
            <p>{t.installWhy}</p>
            {canPrompt()
              ? <p><button type="button" className={styles.install} onClick={() => void promptInstall()}>{t.installNow}</button></p>
              : <p>{isIPhone() ? t.installIPhone : t.installAndroid}</p>}
          </details>
        )}
        <details className={styles.more}>
          <summary>{t.aboutTheia}</summary>
          <p>{t.aboutHow}</p>
          <p>{t.aboutPrivacy}</p>
        </details>
      </Group>

      <button type="button" className={styles.reset} onClick={onReset}>{t.startOver}</button>
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
