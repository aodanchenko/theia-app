# AGENTS.md: Theia app

Instructions for coding agents (Claude, Codex, Cursor) and humans working in this repo. Read this before changing UI.

## What this is

NASA Space Apps 2026 (Vienna), challenge "Health Monitoring Software for Astronauts". One web app, two modes:

| Mode | Page | Device | User | Job |
|---|---|---|---|---|
| Space | `/space` | Tablet, landscape | Astronaut on ARED (squat) | Show movement vs personal baseline and the decision: continue / change load / change technique |
| Earth | `/earth` | Phone, portrait | Rehab patient at home | One instruction at a time, rep count, stop |

Runs fully in the browser. No backend.

## Commands

```sh
npm run dev      # http://localhost:5173/space, /earth
npm test         # node:test, engine + functions
npm run lint     # oxlint
npm run build
npm run deploy   # Cloudflare Pages, behind a shared password
```

## Layout

```
src/
  design/tokens.css     design system: tokens, reset, motion. The only global CSS for /space and /earth.
  components/
    SimulatedCamera.jsx  drawn stand-in for the camera (both modes)
    space/               workbench components
    earth/               coach screen components
  pages/                 SpacePage, EarthPage + their entry files (space.jsx, earth.jsx)
  data/demo.js           simulated session data. Replace with engine output.
  engine/                features (plain JS, no React/DOM, must run in Node)
  capture/PoseCamera.jsx live camera + MediaPipe Pose
  store.js               the only file that touches storage
functions/               Cloudflare Pages middleware (password)
proto/                   design reference (static HTML). Not imported by the app.
```

## Design system

### Themes

The page entry sets `document.documentElement.dataset.theme` to `space` or `earth`. Components never hard-code a theme; they read tokens.

| Token | Meaning | Space | Earth |
|---|---|---|---|
| `--bg` | page background | #f3f3f3 | #f3eee4 |
| `--surface` | panels, cards | #fff | #f3eee4 |
| `--surface-head` | sheet headers, tab bar | #e9e9eb | – |
| `--ink` / `--ink-2` / `--muted` | text, strong → weak | #1d1f23 / #3a3d43 / #6b6e75 | #1c1a17 / – / #625a4e |
| `--rule` | 1px lines | #d4d4d6 | #d8cfbf |
| `--accent` / `--on-accent` | active state, status bar | NASA blue #0062b3 / #fff | – |
| `--alert` | flags only | NASA red #fc3b30 | #b4560f |
| `--cue` | overlay drawn on the camera | NASA red | #f0a24a |
| `--good` / `--good-band` | baseline label / band | green | – |
| `--mark` / `--mark-empty` | neutral chart marks | greys | – |
| `--font-body` | body font | IBM Plex Sans | Atkinson Hyperlegible |
| `--font-mono` | numbers, codes, captions | IBM Plex Mono | – |
| `--text-xs…xl` | type scale | 10 / 11 / 12 px | 18 / 30 / 96 px |

Brand constants on `:root`: `--nasa-red`, `--nasa-blue`, `--nasa-black`, `--ease-out`, `--dur-press`, `--dur-enter`.

### Rules

- **Colour comes from tokens.** No hex in components. The exception is `SimulatedCamera`'s scene palette (wall, floor, body), which is an illustration.
- **Red means "flagged".** `--alert` is only for values past a threshold, and always comes with text or `▲`, never colour alone.
- **Numbers are monospace and tabular** (`--font-mono`, `font-variant-numeric: tabular-nums`), right-aligned in tables.
- **Space is dense and flat:** 1px `--rule` borders, 3px radius at most, no shadows, 10–12px type.
- **Earth is large and calm:** one instruction, one primary button, 18px minimum, touch targets ≥ 44px (Stop is 84px).
- **Motion:** entrances only, once. Use the `enter` class (rise, optional `--delay` in ms) or `pop` (SVG overlays). `prefers-reduced-motion` turns them off. No `transition: all`.
- **Anything simulated says so**, with the visible label `SIMULATED` (see Vitals).

## Components

Each component is one `.jsx` file plus a `.module.css` next to it. Props are plain data; components do no fetching and hold no app state.

| Component | Props | Notes |
|---|---|---|
| `SimulatedCamera` | `theme`, `width`, `height`, `figureHeight`, `arrow`, `tags[]`, `ruler` | `tags`: `{ joint, dx, dy, label, alert }`; joints: `rk`, `rh`, `rs` … |
| **space/** | | |
| `Workbench` | `menu`, `toolbar`, `camera`, `side`, `status`, `tabs` (nodes) | Grid shell of the tablet screen |
| `MenuBar` | `title`, `items[]`, `file` | |
| `Toolbar`, `ToolChip`, `ToolSeparator` | `ToolChip`: `active`, `live`, children | Chips are read-only state, not buttons |
| `CameraPanel` | `cue`, `caption[]`, children (camera) | Cue banner top-left, caption top-right |
| `FormulaBar` | `cell`, `formula` | |
| `ParameterSheet` | `rows[]`, `selected` | Row: `{ name, now, base, delta, flag? }`. Flagged rows turn `--alert` |
| `Panel` | `title`, `note`, `delay`, children | Titled section in the side column |
| `RepChart` | `values[]`, `total`, `limits`, `label` | `limits`: `{ baseline: [lo, hi], rehab, base }`. Bars ≥ rehab are flagged |
| `VitalsGrid` | `vitals[]` | Item: `{ name, value, unit, alert?, trend[] }` |
| `Sparkline` | `points[]`, `alert` | Points in 0..16 |
| `StatusBar` | `items[]`, `next` | |
| `SheetTabs` | `tabs[]`, `active` | |
| **earth/** | | |
| `CoachScreen` | `camera`, `cue`, `counter`, `action` (nodes) | Full-screen phone layout |
| `CueCard` | `title`, `hint` | One short imperative sentence |
| `RepCounter` | `done`, `total` | |
| `StopButton` | `onStop` | |

## Code rules

- Plain JS + React 19, Vite, CSS Modules. No TypeScript, no CSS framework, no UI library.
- Smallest change that works. No abstraction, option or wrapper nobody asked for.
- A new component: reuse tokens; add a token only if a value means something new, and add it to both themes when both need it.
- Comments say *why*, in one line. No commented-out code.
- `engine/` stays free of React and DOM, so it can later run on a backend.
- Never commit raw video, datasets or `.app-password.local`.

## Product rules (from the team's decisions)

- Triage and guidance, never prescription. Every flag carries a cited, pre-approved action. No drug dosing, no disease probabilities.
- Compare each person with their **own baseline**, never population or Earth norms (on ARED the feet are anchored and the load is a vacuum cylinder).
- Known causes that explain a change: an exercise session, a spacewalk (EVA), early mission (week 1–2).
- Out of scope: pre-flight, ground monitoring, post-flight recovery.
- Offline-first; the core loop needs no cloud.
