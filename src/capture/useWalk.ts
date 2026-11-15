import { useCallback, useEffect, useRef, useState } from 'react'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { assessWindow, createGaitTracker, loadTcn, toPose17, type TcnWeights, type WalkWindow } from '../engine/gait.ts'
import tcnUrl from '../engine/gait-tcn.bin?url' // content-hashed by Vite: a re-exported model never meets an old cached file

// Walking assessment while `on`: feed every pose frame; every 0.5 s a 1 s window is scored by the density model and the
// TCN (weights fetched once, 1 MB). Returns all windows since the last reset; pausing keeps them.
// shortcut: runs on the main thread (~tens of ms per window, twice a second); move to a worker if frames drop on phones.
export default function useWalk(on: boolean) {
  const [windows, setWindows] = useState<WalkWindow[]>([])
  const size = useRef(720)
  const tracker = useRef<ReturnType<typeof createGaitTracker> | null>(null)
  const weights = useRef<TcnWeights | null>(null)
  useEffect(() => {
    if (!on || weights.current) return
    fetch(tcnUrl).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`walking model: HTTP ${r.status}`)))).then((b) => { weights.current = loadTcn(b) })
      .catch((e: unknown) => console.error('Walking model failed to load; regional density only', e))
  }, [on])

  const reset = useCallback(() => { tracker.current = null; setWindows([]) }, [])

  const feed = useCallback((image: NormalizedLandmark[], width: number, height: number) => {
    if (!on) return
    size.current = Math.min(width, height)
    tracker.current ??= createGaitTracker((p, elapsed, start) => setWindows((ws) => [...ws, assessWindow(weights.current, p, { minSide: size.current, elapsed, start })]))
    tracker.current(performance.now() / 1000, toPose17(image, width, height))
  }, [on])

  return { feed, windows, reset }
}
