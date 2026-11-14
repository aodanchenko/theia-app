import { useId } from 'react'
import styles from './SimulatedCamera.module.css'

// Drawn stand-in for the live camera: a person mid-squat, front view, right knee drifting inward.
// Swap for <PoseCamera> when the live feed is wired in.
const JOINTS = {
  head: [180, 118], neck: [180, 150], ls: [142, 170], rs: [218, 170], le: [124, 226], re: [236, 226],
  lw: [156, 250], rw: [204, 250], lh: [158, 296], rh: [202, 296], lk: [126, 372], rk: [192, 378], la: [138, 462], ra: [222, 462],
}
const BONES = [['neck', 'ls'], ['neck', 'rs'], ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'], ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'], ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra']]
const SCENE = {
  space: { wall: ['#4a5462', '#2a313b'], ground: '#22282f', body: '#141a22' },
  earth: { wall: ['#b9ab95', '#8f8270'], ground: '#7d715f', body: '#4b4236' },
}

const Bone = ({ from, to, ...props }) => (
  <line x1={JOINTS[from][0]} y1={JOINTS[from][1]} x2={JOINTS[to][0]} y2={JOINTS[to][1]} strokeLinecap="round" {...props} />
)

// `figureHeight` sizes the person; a smaller value than `height` leaves floor below them.
export default function SimulatedCamera({ theme, width = 360, height, figureHeight = height, arrow = false, tags = [], ruler = false }) {
  const id = useId()
  const scene = SCENE[theme]
  const scale = Math.min(1.08, (figureHeight - 94) / 390)
  const tx = width / 2 - 180 * scale
  const ty = 70 - 91 * scale
  const [kx, ky] = JOINTS.rk

  return (
    <svg className={styles.camera} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Simulated camera: person squatting, right knee moving inward">
      <defs>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scene.wall[0]} /><stop offset="1" stopColor={scene.wall[1]} /></linearGradient>
        <radialGradient id={`${id}vignette`} cx=".5" cy=".42" r=".75"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></radialGradient>
        <filter id={`${id}blur`}><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${id}grain`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .5 0" /></filter>
      </defs>

      <rect width={width} height={height} fill={`url(#${id}wall)`} />
      <rect y={ty + 470 * scale} width={width} height={height} fill={scene.ground} />

      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        <g filter={`url(#${id}blur)`} opacity=".92" fill={scene.body}>
          {BONES.map(([a, b]) => <Bone key={a + b} from={a} to={b} stroke={scene.body} strokeWidth="30" />)}
          <path d="M142 170L218 170L202 296L158 296Z" />
          <circle cx="180" cy="118" r="27" />
        </g>

        <g className={styles.skeleton}>
          {BONES.map(([a, b]) => <Bone key={a + b} from={a} to={b} strokeWidth="1.4" />)}
          {Object.entries(JOINTS).filter(([k]) => k !== 'head').map(([k, [x, y]]) => <circle key={k} cx={x} cy={y} r="2.6" />)}
        </g>

        <g className={styles.cue}>
          <Bone from="rh" to="rk" strokeWidth="2.4" />
          <Bone from="rk" to="ra" strokeWidth="2.4" />
          <circle className="pop" cx={kx} cy={ky} r="14" fill="none" strokeWidth="2" />
          {arrow && (
            <g className="pop" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d={`M${kx + 20} ${ky}h44`} />
              <path d={`M${kx + 56} ${ky - 12}l14 12-14 12`} />
            </g>
          )}
        </g>

        {tags.map(({ joint, dx, dy, label, alert }) => {
          const [x, y] = [JOINTS[joint][0] + dx, JOINTS[joint][1] + dy]
          return (
            <g key={label} className={`pop ${styles.tag}`} data-alert={alert || undefined}>
              <rect x={x} y={y - 13} width={label.length * 7.4 + 12} height="20" rx="3" />
              <text x={x + 6} y={y + 1}>{label}</text>
            </g>
          )
        })}
      </g>

      <rect width={width} height={height} fill={`url(#${id}vignette)`} />
      <rect width={width} height={height} filter={`url(#${id}grain)`} opacity=".22" />

      {ruler && (
        <g className={styles.ruler}>
          {Array.from({ length: 17 }, (_, i) => {
            const y = ty + JOINTS.head[1] * scale + i * 22
            return <line key={i} x1={i % 4 ? 8 : 0} x2="16" y1={y} y2={y} />
          })}
          <path className={styles.rulerMark} d={`M18 ${ty + JOINTS.rh[1] * scale}l10-6v12z`} />
        </g>
      )}
    </svg>
  )
}
