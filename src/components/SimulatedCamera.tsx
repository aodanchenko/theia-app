import { useId, type SVGProps } from 'react'
import { PoseLandmarker } from '@mediapipe/tasks-vision'
import type { Joint, OverlayTag, Theme } from '../types.ts'
import styles from './SimulatedCamera.module.css'

// Stand-in for the live camera until it is enabled; the live view draws the real MediaPipe skeleton instead.
// Space: NASA photo S133-E-008323 (public domain, squat on ARED aboard the ISS, three-quarter view) with all 33 landmarks
// MediaPipe Pose (heavy) found on it, [x, y, visibility] in photo px; low-visibility ones are drawn faint.
// Earth: a drawn person mid-squat, right knee drifting inward.
type Pose = Record<Joint, [x: number, y: number]>
const PHOTO_LANDMARKS: [x: number, y: number, visibility: number][] = [[265,243,1],[287,199,1],[301,198,1],[317,198,1],[265,202,1],[261,201,1],[257,200,1],[381,209,1],[281,209,1],[297,276,1],[270,276,1],[551,359,1],[301,381,1],[749,557,1],[314,459,.75],[793,380,1],[244,343,.93],[809,313,1],[219,320,.9],[772,296,1],[231,318,.9],[751,325,1],[237,324,.89],[600,721,1],[451,717,1],[454,832,1],[159,715,.99],[522,1212,1],[212,1028,.99],[571,1276,1],[259,1083,.99],[429,1379,1],[67,1141,.99]]
// Face points (0–10) are left out: in a three-quarter view MediaPipe guesses them. MediaPipe has no neck, so (as in
// OpenPose) neck = mid-shoulders and head = mid-ears, joined by one bone.
const SHOWN = PHOTO_LANDMARKS.map((_, i) => i > 10)
const at = (i: number): [number, number] => [PHOTO_LANDMARKS[i][0], PHOTO_LANDMARKS[i][1]]
const mid = (a: number, b: number): [number, number] => [(at(a)[0] + at(b)[0]) / 2, (at(a)[1] + at(b)[1]) / 2]
const HEAD = mid(7, 8), NECK = mid(11, 12)
const PHOTO = {
  href: '/ared-squat.jpg', w: 1103, h: 1440, credit: 'NASA · S133-E-008323',
  // for tags and the ruler
  joints: {
    head: HEAD, neck: NECK, ls: at(11), rs: at(12), le: at(13), re: at(14), lw: at(15), rw: at(16),
    lh: at(23), rh: at(24), lk: at(25), rk: at(26), la: at(27), ra: at(28),
  } satisfies Pose,
}
const JOINTS: Pose = {
  head: [180, 118], neck: [180, 150], ls: [142, 170], rs: [218, 170], le: [124, 226], re: [236, 226],
  lw: [156, 250], rw: [204, 250], lh: [158, 296], rh: [202, 296], lk: [126, 372], rk: [192, 378], la: [138, 462], ra: [222, 462],
}
const BONES: [Joint, Joint][] = [['neck', 'ls'], ['neck', 'rs'], ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'], ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'], ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra']]
const SCENE: Record<Theme, { wall: [string, string]; ground: string; body: string }> = {
  space: { wall: ['#4a5462', '#2a313b'], ground: '#22282f', body: '#141a22' },
  earth: { wall: ['#b9ab95', '#8f8270'], ground: '#7d715f', body: '#4b4236' },
}

const Bone = ({ pose, from, to, ...props }: { pose: Pose; from: Joint; to: Joint } & SVGProps<SVGLineElement>) => (
  <line x1={pose[from][0]} y1={pose[from][1]} x2={pose[to][0]} y2={pose[to][1]} strokeLinecap="round" {...props} />
)

// `figureHeight` sizes the person; a smaller value than `height` leaves floor below them.
// `scene={false}` draws only the overlay (skeleton, cue, tags), for use on top of live video.
interface Props {
  theme: Theme
  width?: number
  height: number
  figureHeight?: number
  scene?: boolean
  arrow?: boolean
  tags?: OverlayTag[]
  ruler?: boolean
}

export default function SimulatedCamera({ theme, width = 360, height, figureHeight = height, scene = true, arrow = false, tags = [], ruler = false }: Props) {
  const id = useId()
  const palette = SCENE[theme]
  const photo = theme === 'space'
  const pose = photo ? PHOTO.joints : JOINTS
  // fit: the photo covers the frame; the drawn figure scales to figureHeight
  const scale = photo ? Math.max(width / PHOTO.w, height / PHOTO.h) : Math.min(1.08, (figureHeight - 94) / 390)
  const tx = photo ? (width - PHOTO.w * scale) / 2 : width / 2 - 180 * scale
  const ty = photo ? (height - PHOTO.h * scale) / 2 : 70 - 91 * scale
  const k = 1 / scale // stroke widths below are in screen px
  const screen = (j: Joint) => [tx + pose[j][0] * scale, ty + pose[j][1] * scale]
  const [kx, ky] = JOINTS.rk
  const rulerTop = screen(photo ? 'ls' : 'neck')[1], rulerStep = (screen(photo ? 'la' : 'ra')[1] - rulerTop) / 16

  return (
    <svg className={styles.camera} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Simulated camera${photo ? ` (photo ${PHOTO.credit})` : ''}: ${photo ? 'astronaut squatting on ARED' : 'person squatting, right knee moving inward'}`}>
      <defs>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={palette.wall[0]} /><stop offset="1" stopColor={palette.wall[1]} /></linearGradient>
        <radialGradient id={`${id}vignette`} cx=".5" cy=".42" r=".75"><stop offset=".55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".45" /></radialGradient>
        <filter id={`${id}blur`}><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${id}grain`}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 .5 0" /></filter>
      </defs>

      {scene && !photo && <rect width={width} height={height} fill={`url(#${id}wall)`} />}
      {scene && !photo && <rect y={ty + 470 * scale} width={width} height={height} fill={palette.ground} />}

      <g transform={`translate(${tx},${ty}) scale(${scale})`}>
        {scene && photo && <image className={styles.photo} href={PHOTO.href} width={PHOTO.w} height={PHOTO.h} />}
        {scene && !photo && (
          <g filter={`url(#${id}blur)`} opacity=".92" fill={palette.body}>
            {BONES.map(([a, b]) => <Bone key={a + b} pose={pose} from={a} to={b} stroke={palette.body} strokeWidth="30" />)}
            <path d="M142 170L218 170L202 296L158 296Z" />
            <circle cx="180" cy="118" r="27" />
          </g>
        )}

        {photo ? (
          <g className={styles.skeleton}>
            {PoseLandmarker.POSE_CONNECTIONS.filter(({ start, end }) => SHOWN[start] && SHOWN[end]).map(({ start, end }) => {
              const [a, b] = [PHOTO_LANDMARKS[start], PHOTO_LANDMARKS[end]]
              return <line key={`${start}-${end}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={1.5 * k} strokeLinecap="round" opacity={Math.min(a[2], b[2]) < .5 ? .3 : 1} />
            })}
            <line x1={NECK[0]} y1={NECK[1]} x2={HEAD[0]} y2={HEAD[1]} strokeWidth={1.5 * k} strokeLinecap="round" />
            {PHOTO_LANDMARKS.map(([x, y, v], i) => SHOWN[i] && <circle key={i} cx={x} cy={y} r={2.4 * k} opacity={v < .5 ? .3 : 1} />)}
            {[NECK, HEAD].map(([x, y]) => <circle key={`${x},${y}`} cx={x} cy={y} r={2.4 * k} />)}
          </g>
        ) : (
          <g className={styles.skeleton}>
            {BONES.map(([a, b]) => <Bone key={a + b} pose={pose} from={a} to={b} strokeWidth={1.5 * k} />)}
            {Object.entries(pose).filter(([joint]) => joint !== 'head').map(([joint, [x, y]]) => <circle key={joint} cx={x} cy={y} r={2.8 * k} />)}
          </g>
        )}

        {!photo && <g className={styles.cue}>
          <Bone pose={pose} from="rh" to="rk" strokeWidth={2.5 * k} />
          <Bone pose={pose} from="rk" to="ra" strokeWidth={2.5 * k} />
          <circle className="pop" cx={kx} cy={ky} r={14 * k} fill="none" strokeWidth={2 * k} />
          {arrow && (
            <g className="pop" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d={`M${kx + 20} ${ky}h44`} />
              <path d={`M${kx + 56} ${ky - 12}l14 12-14 12`} />
            </g>
          )}
        </g>}
      </g>

      {tags.map(({ joint, dx, dy, label, alert }) => {
        const [jx, jy] = screen(joint)
        const [x, y] = [jx + dx, jy + dy]
        return (
          <g key={label} className={`pop ${styles.tag}`} data-alert={alert || undefined}>
            <line x1={jx} y1={jy} x2={x - Math.sign(dx) * 2} y2={y - 4} />
            <text x={x + Math.sign(dx) * 4} y={y} textAnchor={dx < 0 ? 'end' : 'start'}>{label}</text>
          </g>
        )
      })}

      {scene && !photo && <rect width={width} height={height} fill={`url(#${id}vignette)`} />}
      {scene && !photo && <rect width={width} height={height} filter={`url(#${id}grain)`} opacity=".22" />}
      {scene && photo && <text className={styles.credit} x={width / 2} y={height - 10} textAnchor="middle">{PHOTO.credit}</text>}

      {ruler && (
        <g className={styles.ruler}>
          {Array.from({ length: 17 }, (_, i) => {
            const y = rulerTop + i * rulerStep
            return <line key={i} x1={i % 4 ? 8 : 0} x2="16" y1={y} y2={y} />
          })}
          <path className={styles.rulerMark} d={`M18 ${screen(photo ? 'lh' : 'rh')[1]}l10-6v12z`} />
        </g>
      )}
    </svg>
  )
}
