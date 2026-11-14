// Throwaway: shared demo session for the /proto/space variants. Nothing in production imports this.
import { useEffect, useState } from 'react'
import SimulatedCamera from '../../components/SimulatedCamera.tsx'
import type { Tone } from '../../components/space/Recommendation.tsx'
import { OVERLAY_TAGS, PARAMETERS, SESSION } from '../../data/demo.ts'
import type { Parameter } from '../../types.ts'

export const VALGUS = [2, 3, 3, 4, 5, 7, 9, 8, 5, 4] // R knee valgus per rep, degrees
export const TOTAL = 10
export const CAL = 3
export const LIMIT = 6
export const LIMITS = { baseline: [2, 4] as [number, number], rehab: LIMIT, base: 10 }
export const S = SESSION
export type State = 'ready' | 'calibrating' | 'good' | 'flagged'

const CLOCK = new Date('2026-11-14T15:42:00')

export interface LogLine { t: string; rep: number; value: number; state: State }

export function useDemo() {
  const [rep, setRep] = useState(7)
  const [camera, setCamera] = useState(false)
  const [log, setLog] = useState<LogLine[]>(() => VALGUS.slice(0, 7).map((v, i) => line(i + 1, v)))
  const values = VALGUS.slice(0, rep)
  const last = values.at(-1) ?? 0
  const state: State = rep === 0 ? 'ready' : rep <= CAL ? 'calibrating' : last >= LIMIT ? 'flagged' : 'good'
  const flags = values.filter((v, i) => i >= CAL && v >= LIMIT).length

  const rec: { decision: string; action: string; reason: string; tone: Tone } = {
    ready: { decision: 'Ready', action: 'Squat to start', reason: `The first ${CAL} reps set your baseline`, tone: 'neutral' as Tone },
    calibrating: { decision: 'Calibrating', action: `Squat normally · ${rep}/${CAL}`, reason: 'Building your personal baseline', tone: 'neutral' as Tone },
    good: { decision: 'Continue', action: 'Good rep', reason: `Rep ${rep}: R knee valgus ${last}°, within your baseline 2–4° + rehab margin`, tone: 'good' as Tone },
    flagged: { decision: 'Change technique', action: 'Knees out', reason: `Rep ${rep}: R knee valgus ${last}° ≥ rehab limit ${LIMIT}°`, tone: 'alert' as Tone },
  }[state]
  const basis = `vs your baseline (${S.baselineSessions} sessions) · ${S.model} · known cause: ${S.knownCause}`

  const rows: Parameter[] = PARAMETERS.map((p, i) => (i === 0
    ? { ...p, now: `${last}°`, delta: `${last - 3 >= 0 ? '+' : '−'}${Math.abs(last - 3)}`, flag: state === 'flagged' ? 'rehab' : undefined }
    : p))

  const next = () => {
    if (rep >= TOTAL) return
    setRep(rep + 1)
    setLog((l) => [...l, line(rep + 1, VALGUS[rep])])
  }
  const reset = () => { setRep(0); setLog([]) }
  const download = () => {
    const csv = ['rep,r_knee_valgus_deg,flagged', ...values.map((v, i) => `${i + 1},${v},${i >= CAL && v >= LIMIT}`)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'theia-proto-reps.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return { rep, values, last, state, flags, rec, basis, rows, camera, toggleCamera: () => setCamera((c) => !c), next, reset, download, log }
}

function line(rep: number, value: number): LogLine {
  const t = new Date(CLOCK.getTime() + rep * 6000).toTimeString().slice(0, 8)
  return { t, rep, value, state: rep <= CAL ? 'calibrating' : value >= LIMIT ? 'flagged' : 'good' }
}

export type Demo = ReturnType<typeof useDemo>

// Camera stand-in with the knee tag following the current rep.
export function Cam({ d, width = 520, height = 548, showTags = true }: { d: Demo; width?: number; height?: number; showTags?: boolean }) {
  const tags = OVERLAY_TAGS.map((t) => (t.joint === 'rk' ? { ...t, label: `VALGUS ${d.last}°`, alert: d.state === 'flagged' } : t))
  return <SimulatedCamera theme="space" width={width} height={height} scene tags={showTags ? tags : []} ruler={showTags} />
}

// Mission elapsed time, ticking.
export function useClock() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const met = 112 * 86400 + Math.floor(now / 1000) % 86400
  const d = Math.floor(met / 86400), h = Math.floor(met / 3600) % 24, m = Math.floor(met / 60) % 60, s = met % 60
  return `${String(d).padStart(3, '0')}/${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Click-outside dropdown menu used by the desktop variants.
export function Menu({ label, items, open, onOpen }: { label: string; items: { label: string; hint?: string; on?: () => void; checked?: boolean }[]; open: boolean; onOpen: (l: string | null) => void }) {
  return (
    <div className="p-menu">
      <button type="button" className="p-menu-trigger" data-open={open || undefined} onClick={() => onOpen(open ? null : label)} onMouseEnter={(e) => { if (e.currentTarget.closest('[data-menus-open]')) onOpen(label) }}>{label}</button>
      {open && (
        <div className="p-menu-list" role="menu">
          {items.map((it) => (
            <button key={it.label} type="button" role="menuitem" className="p-menu-item" onClick={() => { it.on?.(); onOpen(null) }}>
              <span className="p-check">{it.checked ? '✓' : ''}</span>{it.label}<span className="p-hint">{it.hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
