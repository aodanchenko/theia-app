# Theia app

NASA Space Apps Challenge 2026: Health Monitoring Software for Astronauts.

A short daily movement check for astronauts (ARED squat). The camera tracks the body with MediaPipe Pose, the app compares the astronaut with their own baseline, and suggests: continue / change load / change technique. Rehab movement data tunes the decision (see the research repo).

MVP runs fully in the browser. No backend yet.

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # engine tests (node:test)
npm run lint
```

## Layout

| Path | What | Rule |
|---|---|---|
| `src/engine/` | features (joint angles, depth, asymmetry, tempo, sway) and the decision | Plain JS, no React/DOM. Must run in Node too, so a backend can reuse it |
| `src/store.js` | all saving and loading (browser storage for now) | The only file that touches storage |
| `src/capture/` | camera + MediaPipe Pose → 33 landmarks | Add when built |
| `src/session/` | Duolingo-style flow: same steps, feedback, streak | Add when built |
| `src/ui/` | decision card, body figure, charts | Add when built |

## Rules

- Compare each astronaut with their own baseline, never Earth norms.
- Triage and guidance only, never prescription. Every flag carries a cited action.
- Simulated data is labelled "simulated" in the UI.
- Never commit raw video or datasets.

## Deploy

Hosted on Cloudflare Pages: https://theia-app.pages.dev

```sh
npx wrangler login   # once
npm run deploy
```

The whole site is behind one shared password, checked on Cloudflare before any file is served (`functions/_middleware.js`). Any username works. To change the password: `npx wrangler pages secret put APP_PASSWORD --project-name theia-app`, then deploy again.
