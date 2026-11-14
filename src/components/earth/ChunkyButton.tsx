import type { ReactNode } from 'react'
import styles from './ChunkyButton.module.css'

// Full-width primary action with a solid lip that disappears when pressed. One per screen.
export default function ChunkyButton({ onClick, tone, disabled, children }: { onClick: () => void; tone?: 'good'; disabled?: boolean; children: ReactNode }) {
  return <button type="button" className={styles.button} data-tone={tone} disabled={disabled} onClick={onClick}>{children}</button>
}
