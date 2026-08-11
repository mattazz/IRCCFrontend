export interface RollingAveragePoint {
  date: string
  average: number
}

/**
 * Computes a rolling average of CRS scores over a window of consecutive draws.
 * Mirrors IRCCBackend's irccDrawAnalyzer.analyzeCRSRollingAverage (see
 * IRCCBackend/test/unit/irccDrawAnalyzer.test.js for the reference behavior:
 * window size, the "not enough data" empty-result case, and filtering out
 * non-numeric CRS values before averaging). Reimplemented here per Decision 3
 * in docs/DRAW_ANALYSIS_PLAN.md, so the window size can change instantly
 * without a network round-trip.
 *
 * `draws` must already be in chronological (oldest -> newest) order, same as
 * what /api/v1/draws/all and filterDrawsByClass already produce.
 */
export function computeRollingAverage(
  draws: { date: string; crs: string }[],
  windowSize: number,
): RollingAveragePoint[] {
  const crsData = draws
    .map((draw) => ({ date: draw.date, crs: Number(draw.crs) }))
    .filter((point) => !Number.isNaN(point.crs))

  if (crsData.length < windowSize) return []

  const result: RollingAveragePoint[] = []
  for (let i = 0; i <= crsData.length - windowSize; i++) {
    const batch = crsData.slice(i, i + windowSize)
    const average = batch.reduce((sum, point) => sum + point.crs, 0) / windowSize
    result.push({
      date: batch[0].date, // date of the first draw in the batch, same convention as the backend
      average: Math.round(average * 100) / 100,
    })
  }
  return result
}
