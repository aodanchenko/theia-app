import { useEffect, useRef, useState } from 'react'
import styles from './Menu.module.css'

export interface MenuItem { label: string; checked?: boolean; onSelect: () => void }

// Menu-bar dropdown. Closes on pick, outside click and Escape. `checked` items show a tick (View toggles).
export default function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [open])
  return (
    <div ref={root} className={styles.menu}>
      <button type="button" className={styles.trigger} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>{label}</button>
      {open && (
        <div className={styles.list} role="menu">
          {items.map((it) => (
            <button key={it.label} type="button" role={it.checked === undefined ? 'menuitem' : 'menuitemcheckbox'} aria-checked={it.checked} className={styles.item} onClick={() => { it.onSelect(); setOpen(false) }}>
              <span className={styles.check} aria-hidden="true">{it.checked ? '✓' : ''}</span>{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
