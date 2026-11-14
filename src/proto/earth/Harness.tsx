// Throwaway prototype harness for /proto/earth (dev only). Picker per the emil-prototype spec.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import '../space/picker.css'
import './earth.css'
import DeviceFrame from '../../components/earth/DeviceFrame.tsx'
import V1Buddy from './V1Buddy.tsx'
import V2Glow from './V2Glow.tsx'
import V3Path from './V3Path.tsx'
import V4Captions from './V4Captions.tsx'
import V5OnYou from './V5OnYou.tsx'

const VARIANTS: [string, ComponentType][] = [
  ['Buddy', V1Buddy],
  ['Glow', V2Glow],
  ['Path', V3Path],
  ['Captions', V4Captions],
  ['On you', V5OnYou],
]

export default function Harness() {
  const [current, setCurrent] = useState(() => Math.min(VARIANTS.length, Math.max(1, Number(new URLSearchParams(location.search).get('v')) || 1)) - 1)
  const [mountKey, setMountKey] = useState(0)
  const [ready, setReady] = useState(false)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const highlight = useRef<HTMLSpanElement>(null)

  const setActive = useCallback((i: number) => {
    if (i < 0 || i >= VARIANTS.length) return
    setCurrent(i)
    setMountKey((k) => k + 1)
    const url = new URL(location.href)
    url.searchParams.set('v', String(i + 1))
    history.replaceState(null, '', url)
  }, [])

  const moveHighlight = useCallback(() => {
    const el = items.current[current]
    if (!el || !highlight.current) return
    highlight.current.style.width = `${el.offsetWidth}px`
    highlight.current.style.transform = `translateX(${el.offsetLeft}px)`
  }, [current])

  useLayoutEffect(moveHighlight, [moveHighlight])
  useEffect(() => { window.addEventListener('resize', moveHighlight); return () => window.removeEventListener('resize', moveHighlight) }, [moveHighlight])
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setReady(true))) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= VARIANTS.length) setActive(n - 1)
      else if (e.key === 'ArrowRight') setActive((current + 1) % VARIANTS.length)
      else if (e.key === 'ArrowLeft') setActive((current - 1 + VARIANTS.length) % VARIANTS.length)
      else if (e.key === 'r' || e.key === 'R') setMountKey((k) => k + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current, setActive])

  const Variant = VARIANTS[current][1]
  return (
    <>
      <DeviceFrame><Variant key={mountKey} /></DeviceFrame>
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready || undefined}>
        <span ref={highlight} className="proto-picker-highlight" aria-hidden="true" />
        {VARIANTS.map(([name], i) => (
          <button key={name} ref={(el) => { items.current[i] = el }} className="proto-picker-item" data-active={i === current || undefined} aria-current={i === current || undefined} onClick={() => setActive(i)}>{name}</button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button className="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)" onClick={() => setMountKey((k) => k + 1)}>↻</button>
      </nav>
    </>
  )
}
