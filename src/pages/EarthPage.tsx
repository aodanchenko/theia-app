import SimulatedCamera from '../components/SimulatedCamera.tsx'
import CoachScreen from '../components/earth/CoachScreen.tsx'
import CueCard from '../components/earth/CueCard.tsx'
import RepCounter from '../components/earth/RepCounter.tsx'
import StopButton from '../components/earth/StopButton.tsx'

export default function EarthPage() {
  return (
    <CoachScreen
      camera={<SimulatedCamera theme="earth" height={760} figureHeight={640} arrow />}
      cue={<CueCard title="Push your right knee out" hint="Like the arrow shows" />}
      counter={<RepCounter done={7} total={10} />}
      action={<StopButton />}
    />
  )
}
