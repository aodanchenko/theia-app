import { useCallback, useEffect, useRef, useState } from 'react'

const ERRORS = {
  NotAllowedError: 'Camera access was blocked. Allow it in the browser settings and try again.',
  NotFoundError: 'No camera found on this device.',
  NotReadableError: 'The camera is busy in another app.',
}

// Front camera as a MediaStream. Video stays on the device; tracks stop on `stop` and on unmount.
export default function useCameraStream() {
  const [stream, setStream] = useState(null)
  const [status, setStatus] = useState('off') // off | starting | on
  const [error, setError] = useState(null)
  const current = useRef(null)
  const mounted = useRef(true)

  const stop = useCallback(() => {
    current.current?.getTracks().forEach((t) => t.stop())
    current.current = null
    setStream(null)
    setStatus('off')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices) return setError('The camera needs HTTPS or localhost.')
    setStatus('starting')
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
      if (!mounted.current) return s.getTracks().forEach((t) => t.stop()) // unmounted while asking
      current.current = s
      setStream(s)
      setStatus('on')
    } catch (e) {
      setStatus('off')
      setError(ERRORS[e.name] ?? `Could not start the camera: ${e.message}`)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; stop() }
  }, [stop])

  return { stream, status, error, start, stop }
}
