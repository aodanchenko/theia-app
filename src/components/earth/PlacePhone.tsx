import type { ReactNode } from 'react'
import type { EarthText } from '../../earthText.ts'
import styles from './PlacePhone.module.css'

// Optional setup: how to place the phone, with the live camera below. The frame turns green once hips and knees are seen.
export default function PlacePhone({ t, camera, seen, error, onRetry, onDone }: { t: EarthText; camera: ReactNode; seen: boolean; error: string | null; onRetry: () => void; onDone: () => void }) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>{t.placeTitle}</h1>
      <div className={styles.how}>
        <svg viewBox="0 0 200 110" className={styles.art} aria-hidden="true">
          <line x1="6" y1="100" x2="194" y2="100" className={styles.floor} />
          {/* phone on a chair at hip height */}
          <path d="M14 100 V68 H44 V100 M14 68 V44" className={styles.chair} />
          <rect x="30" y="44" width="9" height="18" rx="2" className={styles.phone} />
          {/* person 2–3 steps away */}
          <circle cx="162" cy="22" r="7" className={styles.person} />
          <path d="M162 30 V64 M162 40 L150 54 M162 40 L174 54 M162 64 L154 98 M162 64 L170 98" className={styles.person} />
          {/* hip height + distance */}
          <line x1="42" y1="62" x2="160" y2="62" className={styles.guide} />
          <path d="M48 82 H150 M48 78 V86 M150 78 V86" className={styles.measure} />
        </svg>
        <p>{t.place[0]}<b>{t.place[1]}</b>{t.place[2]}<b>{t.place[3]}</b>{t.place[4]}</p>
      </div>
      <div className={styles.preview} data-seen={seen || undefined}>
        {camera}
        {error
          ? <button type="button" className={styles.badge} onClick={onRetry}>{t.cameraOffRetry}</button>
          : <span className={styles.badge} role="status">{seen ? t.seeYou : t.looking}</span>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <button type="button" className={styles.go} data-ready={seen || undefined} onClick={onDone}>{seen ? t.start : t.skip}</button>
    </div>
  )
}
