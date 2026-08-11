/**
 * Draw dates are ISO `YYYY-MM-DD` strings, so plain string comparison sorts/filters them
 * chronologically without parsing - same chronological convention the backend's
 * `/draws/all` and `/draws/rolling-average` routes use (there, via `new Date(...)` sort;
 * see IRCCBackend/src/routes/api.js). Kept here as shared helpers rather than duplicated
 * inline comparators, given this project's history of off-by-one/alignment bugs around
 * exactly this kind of date logic (see docs/DRAW_ANALYSIS_PLAN.md).
 */

export function sortByDate<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** Inclusive on both ends. */
export function filterByDateRange<T extends { date: string }>(items: T[], startDate: string, endDate: string): T[] {
  return items.filter((item) => item.date >= startDate && item.date <= endDate)
}
