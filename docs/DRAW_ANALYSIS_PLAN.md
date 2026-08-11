# Development Plan: Draw Analysis Chart Page

A dedicated page for exploring Express Entry draw history — beyond the simple table already on the home page — with trend tools aimed at people actually analyzing the data (immigration consultants, applicants tracking CRS trends, etc.), not just skimming the last few draws.

## Goal

Default view: a simple, clean CRS-over-time chart for a single class. Layered on top: filtering, trend, comparison, and export tools for deeper analysis — opt-in complexity, not a wall of controls on first load.

## What already exists

- **Home page** (`src/components/DrawsSection.tsx`): a simple table + single-class dropdown, showing at most 10 draws. This plan doesn't replace it — it stays as a quick-glance preview, with a link added to the new page for the full view.
- **Backend endpoints** (see [IRCCBackend/docs/API.md](../../IRCCBackend/docs/API.md)):
  - `GET /api/v1/draws/filter/:classCode` → all draws matching a class (no count cap), cache order (most recent first)
  - `GET /api/v1/draws/rolling-average/:classCode` → same draws, chronological, plus a rolling average computed with a **fixed 4-draw window** (not configurable via the API today)
  - `GET /api/v1/draws/latest?count=n` → most recent `n` draws across all classes, **capped at 100** (of ~435 total in the cache)
- **Types already defined** (`src/types/api.ts`): `Draw`, `ClassCode`, `CLASS_CODES`, `CLASS_NAMES` — reusable as-is for this page.

## Decisions (resolved)

1. **Charting library: Recharts.** Composable React components, brush-to-zoom built in, smaller bundle than ECharts. Custom tooltips/export UI will be hand-built as needed rather than relying on a toolbox widget.
2. **Full-history access: new backend route.** `/api/v1/draws/latest` caps at 100, but there are ~435 draws total (since 2015) and multi-class comparison needs the full set. Add `GET /api/v1/draws/all` to the backend — uncapped, returns the entire cached draw history in one request. The frontend fetches once and filters/slices client-side for whatever view is showing, rather than issuing one request per class.
3. **Rolling average: computed client-side.** The backend's `/rolling-average/:classCode` endpoint is fixed at a 4-draw window. For an adjustable window size, the algorithm gets reimplemented in TypeScript (small, ~15 lines, already unit-tested on the backend as a reference) rather than adding a `?window=n` param and round-tripping on every change.
4. **Default view: single class, CEC preselected.**
5. **Multi-class comparison is a Phase 3 feature**, not required for the first shippable version (Phase 1-2).

## Phases

### Phase 0 — Foundations ✅
- [x] Added `react-router-dom`; `/` (home) and `/draws` (new analysis page, placeholder content for now) routes, via a shared `Layout` component (`src/components/Layout.tsx`) with header + nav. `App.tsx` is now just the router wiring; the old inline home content moved to `src/pages/HomePage.tsx`
- [x] Added Recharts (not used yet - Phase 1)
- [x] Backend: added `GET /api/v1/draws/all` (uncapped, chronological, ~435 draws) - documented in `IRCCBackend/docs/API.md`, covered by a new test in `IRCCBackend/test/routes/api.test.js`
- [x] Added a "Full draw analysis →" link in the home page's `DrawsSection` (next to the class filter, so it stays visible regardless of loading/error/empty state)

Verified live: routing works, nav highlights the active page, backend route returns all 435 draws oldest-first, no console errors on a fresh load. One dev-only hiccup along the way: installing new packages while the Vite dev server was already running left a stale dependency pre-bundle cache (`node_modules/.vite`) that caused a transient "Invalid hook call" error - fixed by clearing that cache and restarting. Not a code bug; worth remembering if it recurs after future `npm install`s mid-session.

### Phase 1 — Simple default chart
- [ ] Fetch draw history for CEC (default class)
- [ ] Single-line CRS-over-time chart, chronological order
- [ ] Class filter dropdown (reuse `CLASS_CODES`/`CLASS_NAMES` from `src/types/api.ts`, same pattern as the home page's dropdown)
- [ ] Tooltip on hover: date, CRS, class, invitations issued

Exit criteria: a working, simple chart - this is the "default" experience the plan's goal describes.

### Phase 2 — Trend tools
- [ ] Toggleable rolling-average overlay line
- [ ] Window-size control for the rolling average (client-side computation, per Decision 3)
- [ ] Toggle primary metric: CRS score vs. invitations issued (draw size) - both are things analysts track
- [ ] Summary stats panel for the current view: min/max/average CRS, total invitations, draw count

### Phase 3 — Comparison & filtering
- [ ] Multi-class overlay: select 2+ classes, render as separate colored series with a legend
- [ ] Date range selection (brush-to-zoom on the chart, or explicit from/to date pickers)
- [ ] "All classes" combined view as an option, not just single/multi specific-class views

### Phase 4 — Polish & export
- [ ] CSV export of the currently-filtered/visible data
- [ ] Chart image export (PNG) - custom-built, since Recharts has no built-in export toolbox (see Decision 1)
- [ ] Loading/error/empty states consistent with the existing `Section` component pattern
- [ ] Responsive layout (chart usable on mobile, not just desktop)

### Phase 5 — Testing
- [ ] Unit tests for any client-side logic that reimplements backend behavior (rolling average, date filtering) - mirror the rigor of `IRCCBackend/test/unit/irccDrawAnalyzer.test.js` given this project's history of exactly this kind of off-by-one/alignment bug
- [ ] Basic render tests for the page (loads, shows chart once data arrives, shows error state on a failed fetch)

## Non-goals (for now)

- Server-side rendering / SEO for this page - it's an interactive tool, not content that needs to be crawlable.
- Persisting a user's filter/window selections (e.g. to a URL query string or local storage) - nice-to-have, not blocking for a first version.
