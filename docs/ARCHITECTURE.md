# Architecture

How IRCCFrontend is put together, for picking the project back up without re-reading every file.

## What this is

A React SPA that consumes [IRCCBackend](https://github.com/mattazz/IRCCBackend)'s public read-only JSON API (see [IRCCBackend/docs/API.md](../../IRCCBackend/docs/API.md)) and presents Canadian immigration data: IRCC news, Express Entry draw history, and government speeches. Two pages today: a home page with three at-a-glance sections, and a dedicated draw-analysis page with charting/comparison tools (see [DRAW_ANALYSIS_PLAN.md](./DRAW_ANALYSIS_PLAN.md) for how that page was built).

This repo has no server of its own — it's a static SPA (Vite build) that talks to the backend over HTTP. No SSR, no API routes, no database access.

## Stack

- **React 19** + **TypeScript**, built with **Vite**
- **react-router-dom** (`BrowserRouter`) for client-side routing
- **Tailwind CSS v4** (via `@tailwindcss/vite`) for styling, dark mode via `dark:` variants (follows OS preference, no manual toggle)
- **Recharts v3** for the draw-analysis chart (see Decision 1 in the dev plan for why)
- **oxlint** for linting (not ESLint)
- No test framework wired up yet (no test runner in `package.json`) — a known gap, see the dev plan's Phase 5

## Directory layout

```
src/
  api/client.ts          Typed fetch wrapper - the only place that calls the backend
  types/api.ts            Response shapes + CLASS_CODES/CLASS_NAMES, hand-mirrored from the backend
  hooks/useApiData.ts      Generic fetch-on-deps-change hook (loading/error/data + stale-response guard)
  components/
    Layout.tsx             Header + nav shell, wraps every page
    Section.tsx             Shared card: title, action slot, loading/error/empty states
    NewsSection.tsx          Home page: latest news list
    DrawsSection.tsx          Home page: draws table + class filter + link to /draws
    SpeechesSection.tsx       Home page: latest speeches list
  pages/
    HomePage.tsx            Composes the three home sections
    DrawAnalysisPage.tsx     /draws - chart, filters, comparison, stats, detail cards (the bulk of the app's logic)
  utils/
    draws.ts                filterDrawsByClass - client-side class filtering
    rollingAverage.ts        computeRollingAverage - TS port of the backend's rolling-average algorithm
  App.tsx                  Router wiring (routes -> Layout -> pages)
  main.tsx                 Entry point (StrictMode + createRoot)
  index.css                Tailwind entry
```

Flat and shallow on purpose: no state management library, no design-system package, no barrel files. Each page owns its own data-fetching and derived state via hooks; components are shared only where the same shape (a titled card with loading/error/empty handling) actually repeats.

## Data flow

1. `src/api/client.ts` exports a single `api` object (`api.news.*`, `api.draws.*`, `api.speeches.*`), each method a thin `fetch` wrapper around one backend endpoint. `API_BASE_URL` comes from `VITE_API_BASE_URL` (see `.env.example`), defaulting to `http://localhost:3000`.
2. Every `4xx`/`5xx` response throws `ApiError` (status + message from the backend's `{ error: "..." }` body).
3. Components call `api.*` through `useApiData(fetcher, deps)`, which tracks `{ data, error, loading }`, re-runs when `deps` changes, and ignores results from a stale run if `deps` changes again before the previous fetch resolves (guards against race conditions on rapid filter changes).
4. `Section` renders the loading/error/empty/content states consistently — every data-bearing component wraps its content in one.

There is no client-side cache or global store: each component/page fetches what it needs independently. `DrawAnalysisPage` is the one place that deliberately fetches broad (`api.draws.all()`, the entire ~435-draw history) once and does all filtering/aggregation client-side, specifically so switching class/metric/window is instant with no refetch (see Decision 2-3 in the dev plan).

## Type contract with the backend

`src/types/api.ts` hand-mirrors the response shapes documented in `IRCCBackend/docs/API.md` — there's no shared package or codegen between the two repos, so if the backend's response shape changes, this file (and anywhere that shape is consumed) needs a manual update. Same for `CLASS_CODES`/`CLASS_NAMES`, which must stay in sync with the backend's `utils.classFilterMap`.

## The draw-analysis page

`DrawAnalysisPage.tsx` is the most involved piece of the app. Worth knowing before touching it:

- **One fetch, all derived client-side.** `api.draws.all()` runs once; `filterDrawsByClass`, `computeRollingAverage`, chart-row shaping, stats, and brush-filtered draw lists are all `useMemo`'d off that one dataset plus local UI state (selected classes, metric, rolling-average window, brush range).
- **Rolling average is reimplemented in TypeScript**, not fetched from the backend's `/rolling-average/:classCode` (which is fixed at a 4-draw window) — see `utils/rollingAverage.ts`'s docstring for exactly what it mirrors and why.
- **Multi-class comparison forces CRS-only.** Selecting 2+ class chips disables the Invitations/Both metric toggle — overlaying two metrics across multiple classes would need multiple Y-axes and stops being legible.
- **`TaggedDraw`** (`Draw & { matchedClassCode: ClassCode }`) exists because a draw's raw `class` text can match more than one selected class filter; tagging avoids reverse-parsing that text to figure out which color/class a card belongs to. Stats de-duplicate by `drawNumber` for the same reason.
- **The Recharts `<Brush>`** drives both the visible date range and (indirectly) the stats panel and draw cards below the chart — dragging it doesn't refetch anything, it just narrows what the existing derived data renders.

See [DRAW_ANALYSIS_PLAN.md](./DRAW_ANALYSIS_PLAN.md) for the full phase-by-phase history and what's still outstanding (currently: CSV/PNG export, and all automated testing).

## Conventions

- Path-based imports are relative (`../api/client`, no `@/` alias configured).
- Dark mode is Tailwind's `dark:` variant throughout, driven by OS preference — no theme toggle or stored preference.
- Components that fetch data follow the same shape: a `useCallback`'d fetcher, `useApiData` for state, and a `Section` wrapping the render. New home-page-style sections should follow `NewsSection`/`SpeechesSection` as the template.
- No global error boundary or toast system — errors surface inline via `Section`'s error slot, scoped to whichever section's fetch failed.

## Environment

- `VITE_API_BASE_URL` — base URL of the IRCCBackend API (see `.env.example`). Required for anything beyond the Vite default dev proxy assumption of `http://localhost:3000`.

## Known gaps

- No automated tests (no test runner installed, no `test` script, no test files) — see dev plan Phase 5.
- No CSV/PNG export on the draw-analysis page yet — see dev plan Phase 4.
- Mobile responsiveness on the draw-analysis page hasn't had a dedicated verification pass (see the dev plan's "Mobile support" section for the specific things to check).
