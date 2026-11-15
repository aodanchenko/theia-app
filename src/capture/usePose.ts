import { useEffect, useRef, useState, type RefObject } from 'react'
import { DrawingUtils, FilesetResolver, PoseLandmarker, type Landmark, type NormalizedLandmark } from '@mediapipe/tasks-vision'
import { createLandmarkSmoother } from '../engine/oneEuro.ts'

// shortcut: wasm and model load from the internet on first use; copy them into public/ for fully offline use.
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
// full (9 MB) for phones; heavy (30 MB, slower) holds limbs better when the ARED frame hides part of the body
// Body only: MediaPipe's face points (0–10: nose, eyes, ears, mouth) are not drawn; they distract and the engines do not need them drawn.
export const BODY_CONNECTIONS = PoseLandmarker.POSE_CONNECTIONS.filter(({ start, end }) => start > 10 && end > 10)
const modelUrl = (m: 'full' | 'heavy') => `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${m}/float16/1/pose_landmarker_${m}.task`

// While `enabled`, runs MediaPipe Pose on the playing <video>, draws the skeleton on the canvas, and calls onPose
// with the 33 world landmarks (metres) and the image landmarks (0..1 of the video frame) for every frame with a person in it. Both the drawn and the reported landmarks are
// One-Euro smoothed. Video never leaves the device.
export default function usePose(
  videoRef: RefObject<HTMLVideoElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
  onPose: (world: Landmark[], image: NormalizedLandmark[]) => void,
  model: 'full' | 'heavy' = 'full',
) {
  const [result, setResult] = useState<'running' | 'error' | null>(null)
  const onPoseRef = useRef(onPose)
  useEffect(() => { onPoseRef.current = onPose })

  useEffect(() => {
    const video = videoRef.current
    const ctx = canvasRef.current?.getContext('2d')
    if (!enabled || !video || !ctx) return
    let landmarker: PoseLandmarker | undefined
    let frame = 0
    let stopped = false
    ;(async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM)
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: modelUrl(model), delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
      if (stopped) return landmarker.close()
      const pose = landmarker
      const draw = new DrawingUtils(ctx)
      const joint = getComputedStyle(ctx.canvas).getPropertyValue('--good').trim() // joints in phosphor green: red is only for flags
      const smoothImage = createLandmarkSmoother(), smoothWorld = createLandmarkSmoother()
      let lastTime = -1
      const loop = () => {
        frame = requestAnimationFrame(loop)
        if (video.readyState < 2 || video.currentTime === lastTime) return // no new frame yet
        lastTime = video.currentTime
        ctx.canvas.width = video.videoWidth
        ctx.canvas.height = video.videoHeight
        const now = performance.now()
        const result = pose.detectForVideo(video, now)
        if (!result.landmarks[0]) return
        const landmarks = smoothImage(result.landmarks[0], now)
        draw.drawConnectors(landmarks, BODY_CONNECTIONS, { color: '#ffffff', lineWidth: 3 })
        draw.drawLandmarks(landmarks.slice(11), { color: joint, radius: 4 })
        onPoseRef.current(smoothWorld(result.worldLandmarks[0], now), landmarks)
      }
      loop()
      setResult('running')
    })().catch((e: unknown) => {
      console.error('Pose model failed to start', e)
      if (!stopped) setResult('error')
    })
    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      landmarker?.close()
      setResult(null)
    }
  }, [enabled, videoRef, canvasRef, model])

  return !enabled ? 'off' : result ?? 'loading'
}
