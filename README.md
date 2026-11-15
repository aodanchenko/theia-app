<p align="center"><img src="public/icon.svg" width="96" height="96" alt="Theia app icon"></p>

<h1 align="center">Theia</h1>

<p align="center">A phone camera checks each squat against your own normal and tells you, in plain words, what to adjust.</p>

Built for the NASA Space Apps Challenge 2026 (Vienna), challenge "Health Monitoring Software for Astronauts". One web app, two modes:

- **Space** (`/space`, tablet): an astronaut's squat on ARED. MediaPipe Pose tracks the body, the app compares the astronaut with their own baseline and suggests: continue / change load / change technique.
- **Earth** (`/earth`, phone): the same check for rehab at home, in English and Ukrainian, one calm instruction at a time.

Live: https://theia-app.pages.dev

Runs fully in the browser; camera video never leaves the device. No backend.

```sh
npm install
npm run dev     # http://localhost:5173
npm test        # engine tests (node:test)
npm run lint
npm run typecheck
```

## Layout and design system

See [AGENTS.md](AGENTS.md): folders, design tokens, the component catalog, and code and product rules.

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

The site is public. `functions/_middleware.ts` only redirects old `/path/` URLs to `/path`.

## Sources and third-party licences

Space Apps requires every source to be cited and every non-NASA material to be open source.

| What | Used for | Licence |
|---|---|---|
| [MediaPipe Tasks Vision](https://github.com/google-ai-edge/mediapipe) + Pose Landmarker model | body tracking | Apache-2.0 |
| [React](https://react.dev), [Vite](https://vite.dev) | app framework, build | MIT |
| [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), [IBM Plex](https://github.com/IBM/plex), [Computer Modern Unicode](https://cm-unicode.sourceforge.io) | fonts | SIL OFL 1.1 |
| UI-PRMD: Vakanski et al., "A Data Set of Human Body Movements for Physical Rehabilitation Exercises", *Data* 3(1):2, 2018 ([zenodo](https://zenodo.org/records/23104965)) | tuning the squat thresholds; only derived statistics are in the repo, not the data | as published by the authors |
| NASA photo S133-E-008323 (`public/ared-squat.jpg`) | Space demo | NASA media, no copyright |
| Lang et al., *J Bone Miner Res* 19(6), 2004; Smith et al., *J Bone Miner Res* 27(9), 2012 | bone-loss facts in "This week" | cited, not copied |
| Casiez et al., "1 € Filter", CHI 2012 | smoothing pose landmarks (our own implementation) | algorithm |

Feedback sounds are synthesized in the browser by our own code (`src/capture/chimes.ts`).

## License

Our own code and content: [Apache License 2.0](LICENSE), the licence NASA applies to Space Apps solutions by default. Third-party parts keep their own licences (above).
