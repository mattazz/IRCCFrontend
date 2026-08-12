import { CLASS_CODES, type ClassCode, type Draw } from '../types/api'
import { filterDrawsByClass } from './draws'

export interface CrsChangeInfo {
  diff: number
  formatted: string
  prevDrawNumber: string
  prevCrs: string
}

/**
 * Determines which ClassCode a draw belongs to, using the same matching rule as
 * filterDrawsByClass (a CLASS_MATCH_KEYWORDS substring match against the draw's class field).
 * Checks CLASS_CODES in declaration order, so a more specific keyword (e.g. FST's "Federal
 * Skilled Trades") is tried before a broader one that could also match the same text (e.g.
 * TO's "Trade"). Returns null if no class code's keyword appears in the draw's class text.
 */
export function matchClassCodeForDraw(draw: Draw): ClassCode | null {
  return CLASS_CODES.find((code) => filterDrawsByClass([draw], code).length > 0) ?? null
}

/**
 * Finds the CRS point difference between `draw` and the most recent earlier draw in the same
 * class-code category, searching backwards through allDrawsSortedDesc (must be sorted
 * newest-first). `classCode` defaults to an auto-detected match via matchClassCodeForDraw, so
 * callers that already know a draw's matched class code (e.g. DrawAnalysisPage's TaggedDraw,
 * tagged via the class filter the user selected) can pass it directly instead of re-detecting
 * it - both call sites end up using the identical matching rule either way, so the "same
 * category" badge is consistent wherever a draw is shown.
 */
export function getCrsChangeForDraw(
  draw: Draw,
  allDrawsSortedDesc: Draw[],
  classCode: ClassCode | null = matchClassCodeForDraw(draw)
): CrsChangeInfo | null {
  const crsNum = Number(draw.crs)
  if (isNaN(crsNum) || !classCode) return null

  const currentIndex = allDrawsSortedDesc.findIndex((d) => d.drawNumber === draw.drawNumber)
  if (currentIndex === -1) return null

  for (let i = currentIndex + 1; i < allDrawsSortedDesc.length; i++) {
    const prev = allDrawsSortedDesc[i]
    // Resolve prev's own canonical class code rather than re-running filterDrawsByClass with
    // `classCode` directly: a short keyword like TO's "Trade" is itself a substring of a longer,
    // more specific one like FST's "Federal Skilled Trades", so checking prev's raw text against
    // `classCode` alone would still conflate the two. Comparing resolved codes keeps them apart.
    if (matchClassCodeForDraw(prev) === classCode) {
      const prevCrs = Number(prev.crs)
      if (!isNaN(prevCrs)) {
        const diff = crsNum - prevCrs
        return {
          diff,
          formatted: diff > 0 ? `+${diff}` : `${diff}`,
          prevDrawNumber: prev.drawNumber,
          prevCrs: prev.crs,
        }
      }
    }
  }

  return null
}
