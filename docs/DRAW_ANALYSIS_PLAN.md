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

### Phase 1 — Simple default chart ✅
- [x] Fetch draw history via `api.draws.all()`, fetched once and filtered client-side (so switching class/metric is instant, no refetch)
- [x] Single-line CRS-over-time chart, chronological order, default CEC
- [x] Class filter dropdown (reuse `CLASS_CODES`/`CLASS_NAMES`)
- [x] Tooltip on hover: date, CRS, class, invitations issued (`src/pages/DrawAnalysisPage.tsx`)
- [x] **Pulled forward from Phase 2**: a CRS score / Invitations / Both metric toggle, requested mid-build. "Both" renders a dual-axis chart (CRS on the left, invitations on the right, color-matched ticks + legend) since the two metrics are on wildly different scales (~65-900 vs ~4-8,000+) - a single shared axis would make one series look flat.

Exit criteria: a working, simple chart - this is the "default" experience the plan's goal describes. ✅ Verified live in-browser across all three metric modes, class switching, and tooltips, with zero console errors.

One Recharts v3 gotcha hit along the way: the `Tooltip`'s `content` prop wanted a `TooltipContentProps<TValue, TName>` shape that fights TypeScript's generic inference when over-specified - resolved by typing `ChartTooltip` against the untyped (default) `TooltipContentProps` rather than pinning `<number, string>`, and passing the component directly as `content={ChartTooltip}` instead of wrapping it in a JSX element.

### Phase 2 — Trend tools ✅
- [x] Toggleable rolling-average overlay line - amber dashed line, `src/utils/rollingAverage.ts` (`computeRollingAverage`), a faithful TypeScript port of the backend's `analyzeCRSRollingAverage` (see the file's docstring for exactly what it mirrors). Only shown when metric includes CRS, since it's inherently a CRS concept
- [x] Window-size control for the rolling average - a 3/4/6/8/12-draw dropdown, recomputes instantly client-side (per Decision 3). Verified live: 12-draw window visibly smooths the historic 2021 CRS dip more than the 4-draw default, as expected
- [x] Toggle primary metric: CRS score vs. invitations issued (draw size) - done early, in Phase 1, as a "CRS / Invitations / Both" toggle (the "Both" option goes further than originally scoped, adding a dual-axis overlay rather than just switching which single metric is plotted)
- [x] Summary stats panel for the current view: min/max/average CRS, total invitations, draw count - a 5-tile row below the chart, recomputed from the same filtered data driving the chart

Verified live: rolling average toggle, window changes, and combined with "Both" metric mode (rolling average + CRS + invitations, three lines, dual axis, legend) all render correctly with zero console errors.

### Phase 3 — Comparison & filtering ✅
- [x] Multi-class overlay: click-to-toggle chips for all 11 classes (plus "All"/"Reset"), each rendered as its own colored line (`CLASS_COLORS` in `src/pages/DrawAnalysisPage.tsx`). Chart data is merged by date across selected classes (`${classCode}_crs` keys) rather than duplicating the chart's rendering logic for the single-class case. Comparing 2+ classes forces the metric to CRS-only (Invitations/Both disabled, with a tooltip explaining why) - overlaying two metrics across multiple classes would need multiple axes and isn't legible
- [x] Date range selection via Recharts' `<Brush>`, controlled (`startIndex`/`endIndex`) so it can be reset programmatically when the class selection changes. Automated drag-simulation couldn't confirm this one (recharts v3's internal Redux-backed drag state didn't respond to synthetically dispatched mouse/pointer events) - **manually tested by you and confirmed working**.
- [x] "All classes" combined view: the "All" chip selects all 11 classes at once, reusing the multi-class overlay path rather than being a separate view
- [x] Draw detail cards below the chart/stats, one per draw within the current brush selection (all selected classes' draws if no selection is active), newest first, scrollable. Each card shows drawNumber, date, class, subclass (when it differs from class), CRS, and invitations - the fields the tooltip doesn't carry. Cards are tagged with the class they were matched under (`TaggedDraw`) rather than reverse-parsing the raw class string, since a draw's class text doesn't reliably map back to a single `ClassCode`

Also fixed along the way: the stats panel now recomputes from the brush-selected range (falling back to the full selection when nothing's brushed) instead of always reflecting the full class filter - this is what makes "drag to select a range, see the stats update" actually work. Stats de-duplicate by `drawNumber` in case a draw's class text matches more than one selected class filter (rare, but would otherwise double-count it).

### Phase 4 — Polish & export ✅
- [x] CSV export of the currently-filtered/visible data - `src/utils/csv.ts` (`drawsToCsv`), exports the same brush/class-filtered, drawNumber-deduplicated set that feeds the stats panel and cards. Filename encodes the selected classes and, if a brush range is active, the date range
- [x] Chart image export (PNG) - custom-built (`src/utils/chartImage.ts`, `exportSvgAsPng`), no toolbox dependency added (see Decision 1). Clones the chart's live `<svg>`, inlines each element's *computed* style (fill/stroke/color/font) before serializing since a detached SVG has no access to the page's Tailwind stylesheet - without that step, anything styled via a `className` (grid lines, axis ticks) would render blank. Rasterizes at 2x for a crisp export. Renders the chart itself (lines/axes/grid/brush); the Recharts `Legend` is HTML rendered outside the `<svg>` and isn't captured - an accepted limitation of a hand-rolled export rather than a full DOM-to-canvas library
- [x] Loading/error/empty states consistent with the existing `Section` component pattern - already true going into this phase (the page's filter/chip controls stay visible in the `action` slot regardless of loading/error/empty, same convention as `DrawsSection`); verified with a blocked-request error screenshot showing the same red `Section` error styling used everywhere else
- [x] Responsive layout (chart usable on mobile, not just desktop) - chart height now scales via a wrapper div (`h-72 sm:h-96 md:h-[420px]`) instead of a fixed 420px `ResponsiveContainer`; narrow-screen (`<640px`) axis widths shrink and axis-title labels are dropped so a dual-axis "Both" chart doesn't crowd out the plot area; class chips/export buttons got a `min-h-8` touch target bump; `Brush` traveller handles enlarged (8px → 12px) for easier touch dragging; stats panel's 5th tile (`Total invitations`) now spans full width on the 2-column mobile grid instead of sitting orphaned. Verified live at a 375px viewport across single-class, multi-class, and "Both" + rolling-average modes, zero console errors

Verified live (desktop + 375px mobile viewport, light scheme): CSV export downloads a correctly-shaped file, PNG export produces a legible chart image with real (non-blank) styling, error state renders through `Section` like every other component, and the draw-analysis page holds up at phone width including the dual-axis "Both" view. Brush touch-drag itself still needs a real-device check per the note in Phase 3 - enlarging the traveller handles is as far as this pass could verify without one.

### Phase 5 — Testing
- [ ] Unit tests for any client-side logic that reimplements backend behavior (rolling average, date filtering) - mirror the rigor of `IRCCBackend/test/unit/irccDrawAnalyzer.test.js` given this project's history of exactly this kind of off-by-one/alignment bug
- [ ] Basic render tests for the page (loads, shows chart once data arrives, shows error state on a failed fetch)

## Non-goals (for now)

- Server-side rendering / SEO for this page - it's an interactive tool, not content that needs to be crawlable.
- Persisting a user's filter/window selections (e.g. to a URL query string or local storage) - nice-to-have, not blocking for a first version.

## Mobile support ✅ (pending one manual check)

The page needs to work on mobile, not just desktop - this applies across every phase above, not just the Phase 4 "responsive layout" line item. Folded into Phase 4 as planned:

- **Class chips**: 11 chips + "All"/"Reset" wrap via `flex-wrap`; bumped to `min-h-8` for a consistent touch target. Verified legible and tappable at 375px.
- **Brush drag**: traveller handles enlarged (`travellerWidth` 8px → 12px, `height` 28px → 32px) for an easier touch grab. Recharts v3's drag state still can't be driven by synthetic automation (same gap noted in Phase 3) - **still needs a real-device/touch-emulation check**, this pass only made the target bigger.
- **Dual-axis charts** ("Both" metric, single-class only): below 640px, axis widths shrink (48/56px → 32/40px) and the "CRS"/"Invitations" axis-title labels are dropped, since they're redundant with the legend and were the main source of crowding. Verified live at 375px: plot area stays usable.
- **Draw cards grid**: unchanged (`grid-cols-1` → `lg:grid-cols-3`, already responsive) - touch-scrolling the `max-h-[480px]` area against the page's own scroll wasn't specifically re-tested this pass.
- **Stats panel**: the 5th tile (Total invitations) now spans both columns of the mobile 2-column grid instead of sitting alone - confirmed via screenshot at 375px.

One item carries forward rather than closing out: **brush touch-drag on a real device** is still unverified (automation can't drive Recharts' internal drag state, per Phase 3's note) - the traveller-size increase is this pass's best effort without one.
