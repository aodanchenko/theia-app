// Throwaway style lab for the Earth "On you" screen (dev only, /lab/earth-style).
// Every look is a pure function of `config`: pick a palette and tune it, then Save to keep the JSON.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import './earth.css'
import './lab.css'
import V5OnYou from './V5OnYou.tsx'

type Tone = { L: number; C: number; H: number }
interface Palette { name: string; note: string; dark?: boolean; paper: string; card: string; line: string; lip: string; ink: string; inkLip: string; muted: string; frame: number; good: Tone; fix: Tone }

// Neutrals share one hue per palette; states are blue/orange-type pairs that stay apart for red-green colour blindness.
const PALETTES: Record<string, Palette> = {
  linen: { name: 'Linen & Pine', note: 'Today, calmer. Green vs orange: weakest for colour-blind users.', paper: '0.965 0.012 80', card: '0.99 0.006 80', line: '0.89 0.018 80', lip: '0.82 0.024 80', ink: '0.22 0.02 60', inkLip: '0.1 0.01 60', muted: '0.5 0.03 65', frame: 0.27, good: { L: 0.5, C: 0.09, H: 155 }, fix: { L: 0.7, C: 0.14, H: 65 } },
  wheat: { name: 'Wheat & Sky', note: 'Ivory ground, sky blue = on target, wheat amber = adjust.', paper: '0.97 0.02 90', card: '0.995 0.008 90', line: '0.9 0.025 88', lip: '0.83 0.03 85', ink: '0.22 0.02 70', inkLip: '0.1 0.01 70', muted: '0.5 0.03 75', frame: 0.28, good: { L: 0.52, C: 0.13, H: 245 }, fix: { L: 0.74, C: 0.14, H: 75 } },
  workshop: { name: 'Workshop', note: 'Bone and near-black, steel blue, safety yellow. Highest contrast.', paper: '0.95 0.008 85', card: '0.99 0.004 85', line: '0.88 0.01 85', lip: '0.78 0.012 85', ink: '0.18 0.01 60', inkLip: '0.05 0 0', muted: '0.46 0.015 70', frame: 0.2, good: { L: 0.48, C: 0.1, H: 250 }, fix: { L: 0.85, C: 0.16, H: 92 } },
  clay: { name: 'Clay & Sage', note: 'Softest. Deep teal vs terracotta, physio-clinic warmth.', paper: '0.95 0.02 60', card: '0.985 0.01 60', line: '0.88 0.03 55', lip: '0.8 0.035 50', ink: '0.25 0.03 40', inkLip: '0.12 0.02 40', muted: '0.5 0.04 45', frame: 0.3, good: { L: 0.5, C: 0.08, H: 200 }, fix: { L: 0.66, C: 0.12, H: 45 } },
  evening: { name: 'Evening', note: 'Dark warm charcoal for living-room evenings.', dark: true, paper: '0.22 0.015 60', card: '0.27 0.018 60', line: '0.34 0.02 60', lip: '0.16 0.015 60', ink: '0.93 0.02 85', inkLip: '0.72 0.02 85', muted: '0.74 0.02 80', frame: 0.15, good: { L: 0.72, C: 0.11, H: 245 }, fix: { L: 0.8, C: 0.14, H: 75 } },
}

const SCENES: [string, number][] = [['Out of view', 0], ['Ready', 1], ['Learning', 9], ['Good rep', 17], ['Knee tip', 25], ['Chest tip', 33], ['Set done', 42]]

export interface Config {
  palette: keyof typeof PALETTES
  goodHue: number; fixHue: number // hue of "on target" / "adjust", degrees
  chroma: number // colour strength multiplier
  frame: number // lightness of the camera frame background
  lip: number // px depth of the pressable lip
  radius: number // corner scale
  text: number // text size scale
  tag: 'fill' | 'yellow' | 'outline'
  numbers: 'atkinson' | 'plex'
  stand: 'outline' | 'feet'
  scene: number
}

const DEFAULT: Config = { palette: 'wheat', goodHue: 245, fixHue: 75, chroma: 1, frame: 0.28, lip: 4, radius: 1, text: 1, tag: 'fill', numbers: 'atkinson', stand: 'feet', scene: 25 }
const ok = (L: number, C: number, H: number) => `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`

// config → CSS variables for the prototype. Pure: same config, same look.
export function render(c: Config): CSSProperties {
  const p = PALETTES[c.palette]
  const dark = !!p.dark
  const g = { ...p.good, H: c.goodHue, C: p.good.C * c.chroma }
  const f = { ...p.fix, H: c.fixHue, C: p.fix.C * c.chroma }
  const onFill = (L: number) => (L > 0.6 ? 'oklch(0.2 0.02 60)' : 'oklch(0.985 0.005 85)') // L above 0.6 needs dark text
  const soft = (t: Tone) => ok(dark ? 0.32 : 0.93, 0.05 * c.chroma, t.H)
  const text = (t: Tone) => ok(dark ? 0.82 : 0.42, Math.min(t.C, 0.12), t.H) // titles on the soft band
  const tag = c.tag === 'yellow' ? { bg: ok(0.86, 0.16 * c.chroma, 92), ink: 'oklch(0.18 0.01 60)', lip: ok(0.68, 0.14, 85) } : { bg: ok(f.L, f.C, f.H), ink: onFill(f.L), lip: ok(f.L - 0.16, f.C, f.H) }
  return {
    '--x-paper': `oklch(${p.paper})`, '--x-card': `oklch(${p.card})`, '--x-line': `oklch(${p.line})`, '--x-lip': `oklch(${p.lip})`,
    '--x-ink': `oklch(${p.ink})`, '--x-ink-lip': `oklch(${p.inkLip})`, '--x-muted': `oklch(${p.muted})`,
    '--x-good': ok(g.L, g.C, g.H), '--x-good-lip': ok(g.L - 0.15, g.C, g.H), '--x-good-soft': soft(g), '--good-text': text(g), '--good-ink': onFill(g.L),
    '--x-fix': ok(f.L, f.C, f.H), '--x-fix-lip': ok(f.L - 0.16, f.C, f.H), '--x-fix-soft': soft(f), '--fix-text': text(f), '--fix-ink': onFill(f.L),
    '--frame-bg': ok(c.frame, 0.015, 60),
    '--lip-d': `${c.lip}px`, '--r-frame': `${20 * c.radius}px`, '--r-card': `${16 * c.radius}px`, '--r-tag': `${10 * c.radius}px`,
    '--text-md': `${Math.round(18 * c.text)}px`, '--text-lg': `${Math.round(30 * c.text)}px`,
    '--tag-bg': tag.bg, '--tag-ink': tag.ink, '--tag-lip': tag.lip, '--tag-outline': c.tag === 'outline' ? '2px' : '0px',
    '--num-font': c.numbers === 'plex' ? 'var(--font-sans)' : 'inherit',
  }
}

const KEY = 'theia.lab.earth-style'
const load = (): Config[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export default function StyleLab() {
  const [c, setC] = useState<Config>(DEFAULT)
  const [saved, setSaved] = useState<Config[]>(load)
  const [note, setNote] = useState('')
  const [mount, setMount] = useState(0)
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setC((x) => ({ ...x, [k]: v }))
  const pickPalette = (k: Config['palette']) => setC((x) => ({ ...x, palette: k, goodHue: PALETTES[k].good.H, fixHue: PALETTES[k].fix.H, frame: PALETTES[k].frame }))

  // The scripted session reads ?step / ?hold on mount: set them, then remount the screen.
  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('step', String(c.scene)); url.searchParams.set('hold', '1')
    history.replaceState(null, '', url)
    setMount((m) => m + 1)
  }, [c.scene])

  const save = async () => {
    const next = [c, ...saved].slice(0, 8)
    setSaved(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* kept for this visit only */ }
    try { await navigator.clipboard.writeText(JSON.stringify(c, null, 2)); setNote('Saved and copied as JSON') } catch { setNote('Saved (clipboard blocked)') }
  }

  return (
    <div className="lab">
      <div className="lab-stage">
        <div className="lab-phone" data-stand={c.stand} style={render(c)}>
          <div className="lab-notch" aria-hidden="true" />
          <V5OnYou key={mount} />
        </div>
      </div>

      <aside className="lab-panel" aria-label="Style controls">
        <h1>Earth style lab</h1>
        <Group label="Palette">
          {Object.entries(PALETTES).map(([k, p]) => (
            <button key={k} type="button" className="lab-pal" aria-pressed={c.palette === k} onClick={() => pickPalette(k as Config['palette'])}>
              <span className="lab-swatches">{[p.paper, p.ink].map((v) => <i key={v} style={{ background: `oklch(${v})` }} />)}<i style={{ background: ok(p.good.L, p.good.C, p.good.H) }} /><i style={{ background: ok(p.fix.L, p.fix.C, p.fix.H) }} /></span>
              <b>{p.name}</b><small>{p.note}</small>
            </button>
          ))}
        </Group>
        <Group label="Scene">
          <div className="lab-seg">{SCENES.map(([n, step]) => <button key={n} type="button" aria-pressed={c.scene === step} onClick={() => set('scene', step)}>{n}</button>)}</div>
        </Group>
        <Group label="Colour">
          <Slider label="On-target hue" value={c.goodHue} min={0} max={360} step={1} unit="°" onChange={(v) => set('goodHue', v)} hue />
          <Slider label="Adjust hue" value={c.fixHue} min={0} max={360} step={1} unit="°" onChange={(v) => set('fixHue', v)} hue />
          <Slider label="Colour strength" value={c.chroma} min={0.4} max={1.4} step={0.05} unit="×" onChange={(v) => set('chroma', v)} />
          <Slider label="Camera frame lightness" value={c.frame} min={0.1} max={0.5} step={0.01} onChange={(v) => set('frame', v)} />
        </Group>
        <Group label="Shape">
          <Slider label="Lip depth" value={c.lip} min={0} max={8} step={1} unit="px" onChange={(v) => set('lip', v)} />
          <Slider label="Corner scale" value={c.radius} min={0.4} max={1.6} step={0.05} unit="×" onChange={(v) => set('radius', v)} />
          <Slider label="Text size" value={c.text} min={0.85} max={1.35} step={0.05} unit="×" onChange={(v) => set('text', v)} />
        </Group>
        <Group label="Marks on the body">
          <div className="lab-seg">{(['fill', 'yellow', 'outline'] as const).map((t) => <button key={t} type="button" aria-pressed={c.tag === t} onClick={() => set('tag', t)}>{{ fill: 'Adjust colour', yellow: 'Safety yellow', outline: 'Outlined' }[t]}</button>)}</div>
          <div className="lab-seg">{(['feet', 'outline'] as const).map((t) => <button key={t} type="button" aria-pressed={c.stand === t} onClick={() => set('stand', t)}>{t === 'feet' ? 'Stand here: footprints' : 'Stand here: outline'}</button>)}</div>
          <div className="lab-seg">{(['atkinson', 'plex'] as const).map((t) => <button key={t} type="button" aria-pressed={c.numbers === t} onClick={() => set('numbers', t)}>{t === 'atkinson' ? 'Numbers: Atkinson (Ø)' : 'Numbers: Plex (0)'}</button>)}</div>
        </Group>
        <div className="lab-save">
          <button type="button" className="lab-primary" onClick={save}>Save this look</button>
          <button type="button" onClick={() => setC(DEFAULT)}>Reset</button>
          {note && <span role="status">{note}</span>}
        </div>
        {saved.length > 0 && (
          <Group label="Saved">
            <div className="lab-saved">{saved.map((s, i) => (
              <button key={i} type="button" onClick={() => setC(s)} title={JSON.stringify(s)}>
                <span className="lab-swatches"><i style={{ background: `oklch(${PALETTES[s.palette].paper})` }} /><i style={{ background: ok(PALETTES[s.palette].good.L, PALETTES[s.palette].good.C * s.chroma, s.goodHue) }} /><i style={{ background: ok(PALETTES[s.palette].fix.L, PALETTES[s.palette].fix.C * s.chroma, s.fixHue) }} /></span>
                {PALETTES[s.palette].name}
              </button>
            ))}</div>
          </Group>
        )}
      </aside>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return <section className="lab-group"><h2>{label}</h2>{children}</section>
}

function Slider({ label, value, min, max, step, unit = '', hue, onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; hue?: boolean; onChange: (v: number) => void }) {
  return (
    <label className="lab-slider" data-hue={hue || undefined}>
      <span>{label}<b className="tabular">{Number.isInteger(step) ? value : value.toFixed(2)}{unit}</b></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}
