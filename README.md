# Theia app

NASA Space Apps Challenge 2026: Health Monitoring Software for Astronauts.

A short daily movement check for astronauts (ARED squat). The camera tracks the body with MediaPipe Pose, the app compares the astronaut with their own baseline, and suggests: continue / change load / change technique. Rehab movement data tunes the decision (see the research repo).

Runs fully in the browser. No backend.

```sh
npm install
npm run dev
```

Simulated astronaut data is labelled "simulated" in the UI. Never commit raw video or datasets.
