import { useState } from 'react'
import PoseCamera from './capture/PoseCamera.jsx'
import { kneeAngles } from './engine/features.js'

export default function App() {
  const [knees, setKnees] = useState(null)

  return (
    <main>
      <h1>Theia</h1>
      <p>Daily ARED squat check for astronauts. <span className="tag">simulated</span></p>
      <PoseCamera onPose={(landmarks) => setKnees(kneeAngles(landmarks))} />
      {knees && (
        <p className="angles">Knee angle: left {Math.round(knees.left)}°, right {Math.round(knees.right)}°</p>
      )}
    </main>
  )
}
