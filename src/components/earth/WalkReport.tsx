import type { EarthText } from '../../earthText.ts'
import { REGIONS, worstRegion, type WalkWindow } from '../../engine/gait.ts'
import Icon from './Icon.tsx'
import styles from './SetReport.module.css' // same card as the squat report

// Walking so far, in the camera's place while paused or done: each body region measured, steady or how often it was
// off typical walking (the experimental density model), and that the feedback is experimental.
export default function WalkReport({ t, windows, total }: { t: EarthText; windows: WalkWindow[]; total: number }) {
  const off = REGIONS.map((region) => ({ region, n: windows.filter((w) => worstRegion(w)?.region === region).length, seen: windows.some((w) => w.regions.some((r) => r.region === region && r.state !== 'unavailable')) }))
  const steady = windows.filter((w) => !worstRegion(w)).length
  return (
    <section className={styles.report} aria-label={t.walkSoFar(windows.length, total)}>
      <span className={styles.label}>{t.walkSoFar(windows.length, total)}</span>
      <ul className={styles.lines} style={{ marginTop: 0 }}>{/* no figure above: the list starts at the top */}
        {windows.length === 0 && <li>{t.walkNone}</li>}
        {windows.length > 0 && <li data-kind="good"><Icon name="check" size={22} /><span><b>{t.walkSummary(steady, windows.length)}</b></span></li>}
        {off.filter((r) => r.n).map((r) => (
          <li key={r.region} data-kind="fix"><b className={styles.mark}>!</b><span><b>{t.region[r.region]}</b><small> · {t.walkTimes(r.n)}</small></span></li>
        ))}
        {off.filter((r) => r.seen && !r.n).map((r) => <li key={r.region} data-kind="good"><Icon name="check" size={22} /><span>{t.region[r.region]}</span></li>)}
        <li><small>{t.walkExperimental}</small></li>
      </ul>
    </section>
  )
}
