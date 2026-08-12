# Development Plan: CRS Score & Draw Matcher Page

Tracks the frontend implementation of an interactive candidate tool for evaluating Express Entry CRS scores against historical IRCC draw cutoffs, calculating ITA match rates, and providing target score guidance.

## Goal

Add a dedicated `/matcher` page (accessible via header navigation) where users enter their current CRS score (via input field or interactive slider) and select their target category (e.g. CEC, STEM, French, Healthcare) to receive:
1. **Match Verdict & Likelihood:** Clear indicator (High, Moderate, Low, Unlikely) of invitation chances.
2. **Score Gap Metrics:** Point differential from latest, average, and minimum cutoffs.
3. **Visual Position Gauge:** Graphical representation of where candidate's score lies among historical cutoffs.
4. **Draw Eligibility History Table:** Detailed listing of past draws with status badges (✅ Qualified vs ❌ Missed by X points).
5. **Target Recommendations:** Point improvement targets to reach higher invitation probabilities.

---

## Phases

### Phase 0 — Types, API Client & Client-Side Matcher ✅
- [x] Add `DrawMatchResult` interfaces to `src/types/api.ts`.
- [x] Add `api.draws.match()` helper to `src/api/client.ts`.
- [x] Implement `src/utils/matcher.ts` for instant client-side calculations (allowing zero-latency slider updates).
- [x] Add unit tests in `src/utils/matcher.test.ts`.

### Phase 1 — Interactive Tool Component (`CrsMatcherPage.tsx`) ✅
- [x] Create `src/pages/CrsMatcherPage.tsx`.
- [x] Build **Score Input & Slider Control** (1–1200 points, preset buttons for typical scores like 500, 520, 550).
- [x] Build **Verdict Banner** (color-coded status pill with match rate percentage).
- [x] Build **Key Metrics Grid** (Match Rate, Latest Gap, Average Gap, Percentile Rank).
- [x] Build **Visual CRS Position Meter** (visual bar/gauge indicating user score vs Min/Avg/Max cutoffs).
- [x] Build **Draw Eligibility Breakdown Table** (scrollable list of draws with status badges).
- [x] Build **Points Gap Advice Card** (actionable points boost targets).

### Phase 2 — Routing & Navigation Integration ✅
- [x] Register `/matcher` route in `src/App.tsx`.
- [x] Add `"CRS Matcher"` link to navigation header in `src/components/Layout.tsx`.

### Phase 3 — Testing & Mobile Optimization ✅
- [x] Add component tests in `src/pages/CrsMatcherPage.test.tsx` using Vitest + React Testing Library.
- [x] Verify responsive behavior on mobile viewports (<640px).
