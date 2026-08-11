# IRCC News Frontend

A React SPA for browsing Canadian immigration data: IRCC news, Express Entry draw history (with a dedicated trend-analysis page), and official speeches. Consumes the public read-only JSON API served by [IRCCBackend](https://github.com/mattazz/IRCCBackend).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how the codebase is put together, and [`docs/DRAW_ANALYSIS_PLAN.md`](./docs/DRAW_ANALYSIS_PLAN.md) for the draw-analysis page's design decisions and build history.

## Stack

React 19 + TypeScript, Vite, Tailwind CSS v4, react-router-dom, Recharts. Linted with oxlint.

## Getting started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your IRCCBackend instance
npm run dev
```

Requires a running instance of [IRCCBackend](https://github.com/mattazz/IRCCBackend) (defaults to `http://localhost:3000`) — this repo has no backend of its own.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the IRCCBackend API | `http://localhost:3000` |

## Pages

- **`/`** — News, latest draws (with a class filter), and speeches, each in its own section.
- **`/draws`** — Full Express Entry draw history: CRS/invitations trend chart, rolling-average overlay, multi-class comparison, date-range brush, summary stats, and per-draw detail cards.

## Project status

Actively developed. See [`docs/DRAW_ANALYSIS_PLAN.md`](./docs/DRAW_ANALYSIS_PLAN.md) for what's done and what's outstanding on the draw-analysis page (currently: automated testing).
