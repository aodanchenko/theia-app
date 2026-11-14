// Variant 2 · Spreadsheet: the grid IS the interface. Click a cell, the formula bar explains how it was computed.
import { useState } from 'react'
import RepChart from '../../components/space/RepChart.tsx'
import { CAL, Cam, LIMIT, LIMITS, S, TOTAL, useDemo } from './demo.tsx'

const COLS = ['A', 'B', 'C', 'D', 'E', 'F']
const SHEETS = ['Live', 'Baseline', 'Rehab priors'] as const

export default function V2Sheet() {
  const d = useDemo()
  const [cell, setCell] = useState<{ r: number; c: number }>({ r: Math.max(0, d.rep - 1), c: 2 })
  const [sheet, setSheet] = useState<(typeof SHEETS)[number]>('Live')
  const rows = d.log.map((l) => {
    const z = (l.value - 3) / 1.3
    return [String(l.rep), l.t, `${l.value}°`, l.rep <= CAL ? '' : z.toFixed(1), l.rep <= CAL ? 'baseline' : l.value >= LIMIT ? '▲ knees out' : '✓ good', l.state]
  })
  const sel = rows[cell.r]
  const formula = !sel ? '' : [
    `=${sel[0]}`,
    `=TIME(${sel[1]})`,
    `=VALGUS(R_HIP, R_KNEE, R_ANKLE)  → ${sel[2]}`,
    sel[3] ? `=(C${cell.r + 2} − BASELINE 3°) / SD_REHAB 1.3°  → ${sel[3]} sd` : '=  (baseline rep, not scored)',
    sel[3] ? `=IF(C${cell.r + 2} ≥ REHAB_LIMIT ${LIMIT}°, "KNEES OUT", "GOOD")  → ${sel[4]}` : '="baseline"',
    '',
  ][cell.c]
  const numeric = d.values
  const avg = numeric.length ? (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(1) : '–'

  return (
    <div className="v2">
      <nav className="v2-title"><b>THEIA</b><span>{S.file} — Workbook</span></nav>
      <div className="v2-ribbon" role="toolbar">
        <div className="v2-group"><div><button type="button" className="p-btn" data-camera={!d.camera || undefined} onClick={d.toggleCamera}>{d.camera ? 'Stop' : 'Camera'}</button><button type="button" className="p-btn" onClick={d.next}>Next rep</button></div><small>Capture</small></div>
        <div className="v2-group"><div><button type="button" className="p-btn" onClick={d.reset}>Reset baseline</button></div><small>Baseline</small></div>
        <div className="v2-group"><div><button type="button" className="p-btn" onClick={d.download}>Export CSV</button></div><small>Data</small></div>
        <div className="v2-rec" data-tone={d.rec.tone}><small>{d.rec.tone === 'alert' ? '▲ ' : d.rec.tone === 'good' ? '✓ ' : ''}{d.rec.decision}</small><b>{d.rec.action}</b></div>
      </div>
      <div className="v2-formula"><span className="v2-name">{COLS[cell.c]}{cell.r + 2}</span><span className="v2-fx">fx</span><code>{formula}</code></div>

      <main className="v2-main">
        <div className="v2-cam"><Cam d={d} width={440} height={470} /></div>
        <div className="v2-right">
          {sheet === 'Live' && (
            <div className="v2-grid-wrap">
              <table className="v2-grid">
                <thead>
                  <tr><th />{COLS.map((c) => <th key={c}>{c}</th>)}</tr>
                  <tr className="v2-head"><td>1</td><th>Rep</th><th>Time</th><th>R valgus</th><th>z vs base</th><th>Verdict</th><th>Phase</th></tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} data-flag={r[5] === 'flagged' || undefined}>
                      <td>{i + 2}</td>
                      {r.map((v, c) => (
                        <td key={c} className={c === 0 || c === 2 || c === 3 ? 'n' : undefined} data-sel={(cell.r === i && cell.c === c) || undefined} onClick={() => setCell({ r: i, c })}>{v}</td>
                      ))}
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, TOTAL - rows.length) }, (_, i) => <tr key={`e${i}`} className="v2-empty"><td>{rows.length + i + 2}</td>{COLS.map((c) => <td key={c} />)}</tr>)}
                </tbody>
              </table>
            </div>
          )}
          {sheet === 'Baseline' && <p className="v2-note">Baseline: R knee valgus 2–4° from {S.baselineSessions} sessions; first {CAL} reps of a live set re-check it.</p>}
          {sheet === 'Rehab priors' && <p className="v2-note">Rehab scale from UI-PRMD: one person's correct reps vary by ~1.3° valgus; flag at {LIMIT}° (rehab) vs 10° (textbook).</p>}
          <div className="v2-chart"><RepChart values={d.values} total={TOTAL} limits={LIMITS} label="R knee valgus per rep" /></div>
        </div>
      </main>

      <footer className="v2-status">
        <span>Ready</span><span>{S.knownCause} · known cause</span>
        <span className="v2-agg">AVERAGE {avg}° · COUNT {numeric.length} · MAX {numeric.length ? Math.max(...numeric) : '–'}° · FLAGS {d.flags}</span>
      </footer>
      <nav className="v2-sheets">{SHEETS.map((t) => <button key={t} type="button" aria-current={sheet === t || undefined} onClick={() => setSheet(t)}>{t}</button>)}</nav>
    </div>
  )
}
