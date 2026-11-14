import { useCallback, useEffect, useRef, useState } from 'react'

const ERRORS: Record<string, string> = {
  NotAllowedError: 'Camera access was blocked. Allow it in the browser settings and try again.',
  NotFoundError: 'No camera found on this device.',
  NotReadableError: 'The camera is busy in another app.',
}

// Front camera as a MediaStream. Video stays on the device; tracks stop on `stop` and on unmount.
export default function useCameraStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [status, setStatus] = useState<'off' | 'starting' | 'on'>('off')
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null) // DOMException name, so a page can word the error itself
  const current = useRef<MediaStream | null>(null)
  const mounted = useRef(true)

  const stop = useCallback(() => {
    current.current?.getTracks().forEach((t) => t.stop())
    current.current = null
    setStream(null)
    setStatus('off')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices) { setErrorCode('insecure'); return setError('The camera needs HTTPS or localhost.') }
    setStatus('starting')
    setError(null)
    setErrorCode(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
      if (!mounted.current) return s.getTracks().forEach((t) => t.stop()) // unmounted while asking
      current.current = s
      setStream(s)
      setStatus('on')
    } catch (e) {
      const { name, message } = e as Error
      setStatus('off')
      setErrorCode(name)
      setError(ERRORS[name] ?? `Could not start the camera: ${message}`)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; stop() }
  }, [stop])

  return { stream, status, error, errorCode, start, stop }
}
