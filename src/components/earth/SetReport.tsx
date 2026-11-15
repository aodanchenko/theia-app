import type { EarthProfile } from '../../types.ts'
import type { EarthText, Lang } from '../../earthText.ts'
import { CALIBRATION, markFor, type setReport } from '../../engine/earthCoach.ts'
import Icon from './Icon.tsx'
import styles from './SetReport.module.css'

type Joint = 'ls' | 'rs' | 'lh' | 'rh' | 'lk' | 'rk' | 'la' | 'ra' | 'le' | 're' | 'lw' | 'rw' | 'neck'
// Front-view figure in a 200 × 300 box; the screen's left is the person's left, as in the mirrored camera.
const P: Record<Joint, [number, number]> = {
  neck: [100, 74], ls: [78, 82], rs: [122, 82], le: [70, 124], re: [130, 124], lw: [68, 162], rw: [132, 162],
  lh: [86, 162], rh: [114, 162], lk: [85, 216], rk: [115, 216], la: [85, 270], ra: [115, 270],
}
const BONES: [Joint, Joint][] = [['neck', 'ls'], ['neck', 'rs'], ['ls', 'rs'], ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'], ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'], ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra']]
const LANDMARK: Record<number, Joint> = { 11: 'ls', 12: 'rs', 23: 'lh', 24: 'rh', 25: 'lk', 26: 'rk' } // MediaPipe index → figure joint

// Feedback on the set so far, in the camera's place while paused or done: the body with the fix that came up most,
// and up to three lines (on target, the fix and its reps, knee bend vs your normal). The figure is drawn standing,
// so seated and lying sets get the lines only.
export default function SetReport({ t, lang, profile, report, total }: { t: EarthText; lang: Lang; profile: EarthProfile; report: ReturnType<typeof setReport>; total: number }) {
  const { learned, scored, good, best, fix, depth } = report
  const done = learned + scored
  const marks = fix ? markFor(fix.verdict, profile, lang) : []
  const fixAt = new Set(marks.flatMap((m) => m.joints.map((j) => LANDMARK[j])))
  const tip = (m: (typeof marks)[number]) => {
    const pts = m.joints.map((j) => P[LANDMARK[j]])
    return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]
  }

  return (
    <section className={styles.report} aria-label={t.setSoFar(done, total)}>
      <span className={styles.label}>{t.setSoFar(done, total)}</span>
      {profile.position === 'standing' && (
        <svg className={styles.figure} viewBox="0 0 200 300" aria-hidden="true">
          {BONES.map(([a, b]) => <line key={a + b} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} />)}
          <circle className={styles.head} cx="100" cy="50" r="17" />
          {(Object.keys(P) as Joint[]).filter((j) => j !== 'neck').map((j) => {
            const kind = fixAt.has(j) ? 'fix' : scored && !fix && (j === 'lh' || j === 'rh') ? 'good' : undefined
            return <circle key={j} className={styles.joint} data-kind={kind} cx={P[j][0]} cy={P[j][1]} r={kind ? 8 : 4} />
          })}
          {marks.map((m) => {
            const [x, y] = tip(m), right = x > 100
            return (
              <g key={m.label + x} className={styles.callout}>
                <line x1={x + (right ? 10 : -10)} y1={y} x2={right ? 150 : 50} y2={y} />
                <text x={right ? 153 : 47} y={y + 5} textAnchor={right ? 'start' : 'end'}>{m.label}</text>
              </g>
            )
          })}
        </svg>
      )}
      <ul className={styles.lines}>
        {done === 0 && <li>{t.noReps}</li>}
        {done > 0 && scored === 0 && <li>{t.learning(learned, CALIBRATION)}</li>}
        {scored > 0 && (
          <li data-kind="good"><Icon name="check" size={22} /><span><b>{t.goodCount(good, scored)}</b>{best >= 2 && <small> · {t.bestRun(best)}</small>}</span></li>
        )}
        {scored > 0 && (fix
          ? <li data-kind="fix"><b className={styles.mark}>!</b><span><b>{fix.title}</b><small> · {t.onReps(fix.reps)}</small></span></li>
          : <li data-kind="good"><Icon name="check" size={22} /><span>{t.noFixes}</span></li>)}
        {depth && <li><span className={styles.num}>{t.kneeBend(depth.now, depth.normal)}</span></li>}
      </ul>
    </section>
  )
}
