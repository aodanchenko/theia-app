import SimulatedCamera from '../components/SimulatedCamera.jsx'
import CoachScreen from '../components/earth/CoachScreen.jsx'
import CueCard from '../components/earth/CueCard.jsx'
import RepCounter from '../components/earth/RepCounter.jsx'
import StopButton from '../components/earth/StopButton.jsx'

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
