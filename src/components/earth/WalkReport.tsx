import type { EarthText } from '../../earthText.ts'
import { compensationFor, type Compensation, type WalkPerson, type WalkWindow } from '../../engine/gait.ts'
import Icon from './Icon.tsx'
import styles from './SetReport.module.css' // same card as the squat report

// Walking so far, in the camera's place while paused or done: seconds of good walking, then each compensation seen
// with how often and what to do, and that the feedback is experimental.
export default function WalkReport({ t, windows, who, total }: { t: EarthText; windows: WalkWindow[]; who: WalkPerson; total: number }) {
  const found = windows.map((w) => compensationFor(w, who))
  const seen = new Map<Compensation, { n: number; side: 'left' | 'right' | null }>()
  for (const f of found) if (f) seen.set(f.kind, { n: (seen.get(f.kind)?.n ?? 0) + 1, side: f.side })
  const good = found.filter((f) => !f).length
  return (
    <section className={styles.report} aria-label={t.walkSoFar(windows.length, total)}>
      <span className={styles.label}>{t.walkSoFar(windows.length, total)}</span>
      <ul className={styles.lines}>
        {windows.length === 0 && <li>{t.walkNone}</li>}
        {windows.length > 0 && <li data-kind="good"><Icon name="check" size={22} /><span><b>{t.walkSummary(good, windows.length)}</b></span></li>}
        {[...seen].sort((a, b) => b[1].n - a[1].n).map(([kind, { n, side }]) => (
          <li key={kind} data-kind="fix"><b className={styles.mark}>!</b><span><b>{t.comp[kind].tip(side)}</b><small> · {t.comp[kind].name}, {t.walkTimes(n)}</small></span></li>
        ))}
        <li><small>{t.walkExperimental}</small></li>
      </ul>
    </section>
  )
}
