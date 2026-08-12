# Mobile Optimization Plan

**Branch:** `feature/mobile-optimization`  
**Target:** Full mobile usability down to iPhone SE (375 px wide) and up  
**Stack:** React 18 · Vite · Tailwind CSS v4 · Recharts  

---

## Background & Goals

The current frontend was designed primarily for desktop widths. While a `useMediaQuery` hook and a handful of `sm:` / `md:` Tailwind classes already exist, several areas break down or become hard to use at phone-sized viewports:

- The navigation bar wraps awkwardly and links are close together (small tap targets)
- Wide HTML tables in `DrawsSection` and `CrsMatcherPage` require horizontal scrolling with no affordance
- The class-selector chip row in `DrawAnalysisPage` wraps into too many lines with tiny tap targets
- The `PoolDistributionPage` draw-picker is a bare `<select>` with no visual context on small screens
- Font sizes on stat tiles, table cells, and chart axes get cramped below 400 px
- The CRS Matcher controls (`range` + `number` input + preset buttons) stack awkwardly
- No bottom navigation or persistent access to pages when the top nav wraps

---

## Phase 1 — Navigation & Layout Foundation

> **Goal:** A shell that works cleanly on every screen size before touching individual pages.

### 1.1 Responsive Header / Navigation

**File:** `src/components/Layout.tsx`

- Add a **hamburger menu** (`☰`) visible only below `sm` (640 px)  
  - Pressing it toggles a full-width slide-down or drawer-style menu  
  - Each nav link is a full-width row with `min-h-[48px]` (minimum 48 px touch target per WCAG 2.5.5)  
  - Menu closes on navigation or outside click  
- Desktop nav (≥640 px) stays as-is  
- Ensure the page title + subtitle text does not overflow on narrow screens (wrap or truncate gracefully)

### 1.2 Global Touch Target Audit

- Review every `<button>` and `<a>` across all components  
- Add `min-h-[44px] min-w-[44px]` (Apple HIG minimum) to any interactive element that is currently smaller  
- Increase default `px` / `py` padding on pill buttons and filter chips

### 1.3 Main Content Padding

**File:** `src/components/Layout.tsx`  
- Reduce `px-4` to `px-3` below `sm`, keep `px-6` at `md+` to avoid content touching the screen edges

---

## Phase 2 — Data Tables → Card/Stack Views on Mobile

> **Goal:** Replace or supplement horizontal-scroll tables with stacked card layouts on narrow screens.

### 2.1 `DrawsSection` Home Page Table

**File:** `src/components/DrawsSection.tsx`

The current `overflow-x-auto` table is the biggest pain point on phones.

**Approach:** render two separate markup trees — a `<table>` (shown only `sm:block`) and a card list (`block sm:hidden`):

- Each draw becomes a compact card:
  - Header row: **Draw #** (link) + **Date** right-aligned
  - Second row: Stream / Category text
  - Footer row: **Cutoff CRS** (large, bold) + CRS change indicator | **Invitations** right-aligned
- Cards use `divide-y` separators; no borders required
- The class filter `<select>` and "Full draw analysis →" link stay above the list

### 2.2 `CrsMatcherPage` Historical Draws Table

**File:** `src/pages/CrsMatcherPage.tsx`

The 7-column table (`Status`, `Draw #`, `Date`, `Stream`, `Cutoff CRS`, `Your Gap`, `ITAs`) is too wide for phones.

**Approach:** same dual-tree pattern:

- Card: Status badge (full-width pill), then a two-column grid:
  - Left: `Draw #` + Date
  - Right: `Cutoff CRS` + `Your Gap` (coloured)
  - Below: Stream name + ITAs issued

---

## Phase 3 — Controls & Filter UI on Mobile

> **Goal:** All interactive controls remain discoverable and comfortably tappable on a 375 px screen.

### 3.1 `DrawAnalysisPage` Class-Selector Chips

**File:** `src/pages/DrawAnalysisPage.tsx`

- Each chip already has `min-h-8` — increase to `min-h-[40px]` on mobile  
- Wrap `CLASS_CODES` chip row inside a horizontally scrollable strip (`flex overflow-x-auto gap-2 pb-1 snap-x`) instead of wrapping to multiple lines — this keeps all class toggles accessible without cluttering vertical space  
- "All" and "Reset" buttons move to a dedicated row below the strip

### 3.2 `DrawAnalysisPage` Metric Toggle & Rolling Average Controls

- The metric toggle group (`CRS score | Invitations | Both`) — ensure button `py` is at least 10 px for a finger-friendly tap zone  
- On screens `<sm`, stack the metric toggle + rolling average checkbox vertically instead of in a flex row

### 3.3 `CrsMatcherPage` Score Input Controls

**File:** `src/pages/CrsMatcherPage.tsx`

- Stack the `range` slider and `number` input vertically on `<sm` (currently they share one row)  
- The `number` input width (`w-24`) can stay, but make the slider full-width on mobile  
- Preset buttons: keep `flex-wrap`, just ensure each button `min-h-[40px]`

### 3.4 `CrsMatcherPage` Match Verdict Banner

- The `flex-wrap items-center justify-between` row that contains the chance badge + "Latest Cutoff Gap" side panel becomes cramped on phones  
- On `<sm`: stack vertically (chance badge + match rate above; cutoff gap below, left-aligned instead of right)

### 3.5 `PoolDistributionPage` Draw Picker

**File:** `src/pages/PoolDistributionPage.tsx`

- The draw-selection UI (currently a raw `<select>`) should show a readable label alongside it (e.g., "Viewing draw from: 2025-06-04")  
- Increase `<select>` height to `py-2.5` for better touch usability

---

## Phase 4 — Chart & Visualization Adjustments

> **Goal:** Charts remain readable and interactive on small screens without overflowing.

### 4.1 `DrawAnalysisPage` Line Chart

**File:** `src/pages/DrawAnalysisPage.tsx`

- `isNarrow` (`max-width: 639px`) already narrows Y-axis widths — extend this to also:
  - Reduce `Brush` height from 32 px to 24 px on mobile
  - Reduce font size of axis ticks from 12 → 10 on narrow
  - Add `minTickGap={60}` on `<sm` to prevent X-axis label overlaps
- Chart container height is `h-72 sm:h-96 md:h-[420px]` — this is fine; no change needed

### 4.2 `CrsMatcherPage` Pool Position Bar Chart

**File:** `src/pages/CrsMatcherPage.tsx`

- Bar chart X-axis labels are angled at -45° with font-size 10 — on very narrow screens they can still clip  
- Add `useMediaQuery('(max-width: 639px)')` to this page (already used in `DrawAnalysisPage`) and:
  - On narrow: increase `bottom` margin from 25 → 40 px to give angled labels room
  - Reduce Y-axis `tick` font-size to 9 on narrow

### 4.3 Visual Score Position Bar (`CrsMatcherPage`)

- The indicator pin (`h-12 w-1` absolute element) can clip outside its parent on extreme scores  
- Already clamped at `min(95, …)%` — verify this is sufficient on a 375 px screen and add `overflow-hidden` to the parent if needed

---

## Phase 5 — Typography & Readability Polish

> **Goal:** No text is too small to read; line lengths stay comfortable on narrow screens.

### 5.1 Minimum Font Sizes

- All body text: minimum `text-sm` (14 px) — audit for any `text-xs` used on meaningful content (not labels)  
- `DrawCard` CRS and Invitations text: currently `text-xs` — bump to `text-sm` on mobile  
- Key metric values in `CrsMatcherPage` use `text-2xl font-bold` — these are fine

### 5.2 Long Text Wrapping

- "Stream / Category" column content (draw class + subclass) can be long  
- On mobile card views, allow it to wrap naturally (no `line-clamp-1`) so users see the full category name  
- Only clamp in the table column on desktop where column width is constrained

### 5.3 `FaqPage`

**File:** `src/pages/FaqPage.tsx`

- Quick scan required — FAQ is likely already fine since it's mostly prose, but verify:
  - Accordion buttons have adequate touch height
  - Code snippets do not overflow horizontally

---

## Phase 6 — QA & Cross-Device Testing

> **Goal:** Confirm every interaction works at 375 px (iPhone SE), 390 px (iPhone 14), and 430 px (iPhone 14 Plus).

### 6.1 Checklist

| Area | Check |
|---|---|
| Navigation | Hamburger opens/closes; all links reachable; active state visible |
| Home page draws table | Cards render; filter select works; "Full analysis →" link visible |
| Draw Analysis filters | All chips accessible via horizontal scroll; metric toggle tappable |
| Draw Analysis chart | Renders without overflow; Brush draggable with a finger |
| CRS Matcher controls | Slider full-width; number input usable; presets tappable |
| CRS Matcher verdict | Stacked layout on mobile; gap value readable |
| CRS Matcher table | Card layout replaces table below `sm`; status badges visible |
| Pool Bar Chart | Labels do not clip; bars distinguishable |
| Pool Distribution page | Draw picker usable; chart renders correctly |
| FAQ page | Accordions open/close; text readable |
| Dark mode | All above verified in dark mode |

### 6.2 Browser DevTools Simulation

Use Chrome DevTools device emulation (iPhone SE, iPhone 14, Galaxy S21) during development; do a final pass with Safari on an actual iOS device or Xcode Simulator before merging.

---

## Implementation Order

| # | Phase | Est. Complexity | Files Touched |
|---|---|---|---|
| 1 | Navigation & Layout Foundation | Medium | `Layout.tsx` |
| 2 | Tables → Card Views | High | `DrawsSection.tsx`, `CrsMatcherPage.tsx` |
| 3 | Controls & Filter UI | Medium | `DrawAnalysisPage.tsx`, `CrsMatcherPage.tsx`, `PoolDistributionPage.tsx` |
| 4 | Chart Adjustments | Low–Medium | `DrawAnalysisPage.tsx`, `CrsMatcherPage.tsx` |
| 5 | Typography & Readability | Low | All pages (minor tweaks) |
| 6 | QA & Testing | — | — |

Phases can overlap; Phases 3–5 can be worked in parallel once Phase 1 is stable.

---

## Non-Goals (Out of Scope for This Branch)

- A dedicated native-app-style bottom tab bar (may be a separate PR if desired)
- PWA / offline support
- Any changes to backend or API layer
- Restructuring routing or adding new pages
