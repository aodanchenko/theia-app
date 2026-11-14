// Plain JS, no React or DOM: must also run in Node (tests, a future backend).
// Landmarks: MediaPipe Pose, 33 points {x, y, z, visibility}, x/y normalised to the image.
export const LM = { L_HIP: 23, R_HIP: 24, L_KNEE: 25, R_KNEE: 26, L_ANKLE: 27, R_ANKLE: 28 }

// Angle at b in degrees, in the image plane.
export function angle(a, b, c) {
  const ab = Math.atan2(a.y - b.y, a.x - b.x)
  const cb = Math.atan2(c.y - b.y, c.x - b.x)
  const deg = Math.abs((ab - cb) * 180 / Math.PI)
  return deg > 180 ? 360 - deg : deg
}

export function kneeAngles(lm) {
  return {
    left: angle(lm[LM.L_HIP], lm[LM.L_KNEE], lm[LM.L_ANKLE]),
    right: angle(lm[LM.R_HIP], lm[LM.R_KNEE], lm[LM.R_ANKLE]),
  }
}
