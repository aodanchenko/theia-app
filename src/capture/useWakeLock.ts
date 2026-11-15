import { useEffect } from 'react'

// Keeps the screen on while `on`: the phone stands across the room, so nobody can tap it to stop it dimming mid-set.
// The browser drops the lock when the page is hidden, so it is taken again when the page comes back.
export default function useWakeLock(on: boolean) {
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null, live = true
    const take = () => { if (document.visibilityState === 'visible') navigator.wakeLock.request('screen').then((l) => { if (live) lock = l; else void l.release() }).catch(() => {}) } // refused (e.g. battery saver): the screen just dims as usual
    take()
    document.addEventListener('visibilitychange', take)
    return () => { live = false; document.removeEventListener('visibilitychange', take); void lock?.release() }
  }, [on])
}
