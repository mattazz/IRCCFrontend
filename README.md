# IRCC News Frontend

A React SPA for browsing Canadian immigration data: IRCC news, Express Entry draw history (with a dedicated trend-analysis page), and official speeches. Consumes the public read-only JSON API served by [IRCCBackend](https://github.com/mattazz/IRCCBackend).

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how the codebase is put together, and [`docs/DRAW_ANALYSIS_PLAN.md`](./docs/DRAW_ANALYSIS_PLAN.md) for the draw-analysis page's design decisions and build history.

## Stack

React 19 + TypeScript, Vite, Tailwind CSS v4, react-router-dom, Recharts. Linted with oxlint, tested with Vitest + React Testing Library.

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
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the test suite in watch mode |

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the IRCCBackend API | `http://localhost:3000` |

## Pages

- **`/`** — News, latest draws (with direct official web links, category badges, program eligibility, and tie-breaking details), and official speeches.
- **`/draws`** — Full Express Entry draw history: CRS/invitations trend chart, rolling-average overlay, multi-class comparison, date-range brush, summary stats, and per-draw detail cards.
- **`/matcher`** — Interactive CRS Score & Draw Eligibility Matcher: candidate score slider, verdict banner, ITA match rate, percentile position gauge, points gap advice, and historical draw qualification breakdown.
- **`/pool`** — Candidate Pool Distribution Dashboard: Recharts bar chart of active Express Entry profiles broken down by 15 score brackets (`601–1200`, `501–600`, `491–500`, etc.), total candidates, and snapshot selector.
- **`/faq`** — Interactive FAQ guide covering Express Entry & Provincial Nominee Programs.

## Project status

Actively developed. All phases of the draw-analysis page ([`docs/DRAW_ANALYSIS_PLAN.md`](./docs/DRAW_ANALYSIS_PLAN.md)) and CRS Matcher page ([`docs/CRS_MATCHER_PLAN.md`](./docs/CRS_MATCHER_PLAN.md)) are complete with 100% automated test coverage (41 tests).
