import { useEffect, useRef, useState } from 'react'
import { DrawingUtils, FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'

// shortcut: wasm and model load from the internet on first use; copy them into public/ for fully offline use.
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

const MESSAGES = {
  idle: 'Camera is off.',
  loading: 'Starting camera and pose model…',
  running: 'Tracking. Stand so your whole body is visible.',
}

// Live camera → MediaPipe Pose. Calls onPose(landmarks, timeMs) for every frame with a person in it.
// Video stays on the device: only the 33 landmarks leave this component.
export default function PoseCamera({ onPose }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const stopRef = useRef(null)
  const onPoseRef = useRef(onPose)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  useEffect(() => { onPoseRef.current = onPose })
  useEffect(() => () => stopRef.current?.(), [])

  async function start() {
    setStatus('loading')
    setError(null)
    let stream, landmarker, frame
    const stop = () => {
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((t) => t.stop())
      landmarker?.close()
      stopRef.current = null
    }
    stopRef.current = stop
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false })
      const video = videoRef.current
      video.srcObject = stream
      await video.play()

      const vision = await FilesetResolver.forVisionTasks(WASM)
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      if (stopRef.current !== stop) return stop() // stopped or unmounted while loading

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const draw = new DrawingUtils(ctx)
      let lastTime = -1
      const loop = () => {
        frame = requestAnimationFrame(loop)
        if (video.currentTime === lastTime) return // no new frame yet
        lastTime = video.currentTime
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const now = performance.now()
        const landmarks = landmarker.detectForVideo(video, now).landmarks[0]
        if (!landmarks) return
        draw.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#8fa3ff', lineWidth: 3 })
        draw.drawLandmarks(landmarks, { color: '#ffffff', radius: 3 })
        onPoseRef.current?.(landmarks, now)
      }
      loop()
      setStatus('running')
    } catch (e) {
      stop()
      setStatus('idle')
      setError(e.name === 'NotAllowedError' ? 'Camera access was blocked. Allow it in the browser settings and try again.'
        : e.name === 'NotFoundError' ? 'No camera found on this device.'
        : `Could not start: ${e.message}`)
    }
  }

  function stopCamera() {
    stopRef.current?.()
    setStatus('idle')
  }

  return (
    <section className="pose-camera">
      <div className="pose-camera__view">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <p role="status">{error ?? MESSAGES[status]}</p>
      {status === 'idle'
        ? <button onClick={start}>Start camera</button>
        : <button onClick={stopCamera}>Stop camera</button>}
    </section>
  )
}
