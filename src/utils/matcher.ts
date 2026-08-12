import type { ClassCode, Draw, DrawMatchResult } from '../types/api'
import { CLASS_MATCH_KEYWORDS, CLASS_NAMES } from '../types/api'

export function computeDrawMatch(
  draws: Draw[],
  userScore: number,
  classCode: string = '',
  timeframeMonths: number = 12
): DrawMatchResult {
  const score = Math.max(1, Math.min(1200, Number(userScore) || 0))
  let filteredDraws = [...draws]

  const upperClassCode = (classCode || '').toUpperCase() as ClassCode
  const className = upperClassCode && CLASS_NAMES[upperClassCode] ? CLASS_NAMES[upperClassCode] : 'All Classes'

  if (upperClassCode && CLASS_MATCH_KEYWORDS[upperClassCode]) {
    const keyword = CLASS_MATCH_KEYWORDS[upperClassCode].toLowerCase()
    const primary = filteredDraws.filter((d) => (d.class || '').toLowerCase().includes(keyword))
    const secondary = filteredDraws.filter((d) => (d.subclass || '').toLowerCase().includes(keyword))
    filteredDraws = primary.length > 0 ? primary : secondary
  }

  if (timeframeMonths > 0) {
    const cutoffDate = new Date()
    cutoffDate.setMonth(cutoffDate.getMonth() - timeframeMonths)
    filteredDraws = filteredDraws.filter((d) => {
      const drawDate = new Date(d.date)
      return !isNaN(drawDate.getTime()) && drawDate >= cutoffDate
    })
  }

  const validDraws = filteredDraws
    .map((d) => ({
      ...d,
      crsNum: Number(d.crs),
    }))
    .filter((d) => !isNaN(d.crsNum))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalDraws = validDraws.length

  if (totalDraws === 0) {
    return {
      userScore: score,
      classCode: upperClassCode || 'ALL',
      className,
      timeframeMonths,
      totalDraws: 0,
      qualifyingDrawsCount: 0,
      matchRatePercentage: 0,
      chanceLevel: 'Unlikely',
      latestCutoff: null,
      averageCutoff: null,
      minCutoff: null,
      maxCutoff: null,
      scoreGapLatest: null,
      scoreGapAverage: null,
      percentileRank: 0,
      recommendations: {
        pointsToLatest: 0,
        pointsToAverage: 0,
        pointsTo75thPercentile: 0,
      },
      draws: [],
    }
  }

  const annotatedDraws = validDraws.map((d) => ({
    date: d.date,
    drawNumber: d.drawNumber,
    crs: d.crs,
    class: d.class,
    subclass: d.subclass || '',
    drawSize: d.drawSize,
    url: d.url || '',
    tieBreakingRule: d.tieBreakingRule || '',
    drawDateTime: d.drawDateTime || '',
    poolTotal: d.poolTotal || '',
    poolDistributionAsOn: d.poolDistributionAsOn || '',
    qualified: score >= d.crsNum,
    gap: score - d.crsNum,
  }))

  const qualifyingDrawsCount = annotatedDraws.filter((d) => d.qualified).length
  const matchRatePercentage = Math.round((qualifyingDrawsCount / totalDraws) * 100)

  let chanceLevel: 'High' | 'Moderate' | 'Low' | 'Unlikely' = 'Unlikely'
  if (matchRatePercentage >= 70) {
    chanceLevel = 'High'
  } else if (matchRatePercentage >= 40) {
    chanceLevel = 'Moderate'
  } else if (matchRatePercentage >= 10) {
    chanceLevel = 'Low'
  }

  const crsValues = validDraws.map((d) => d.crsNum)
  const latestCutoff = crsValues[0]
  const minCutoff = Math.min(...crsValues)
  const maxCutoff = Math.max(...crsValues)
  const sumCutoffs = crsValues.reduce((acc, curr) => acc + curr, 0)
  const averageCutoff = Math.round(sumCutoffs / totalDraws)

  const scoreGapLatest = score - latestCutoff
  const scoreGapAverage = score - averageCutoff

  const percentileRank = Math.round((crsValues.filter((c) => score >= c).length / totalDraws) * 100)

  const sortedCutoffs = [...crsValues].sort((a, b) => a - b)
  const p75Index = Math.min(sortedCutoffs.length - 1, Math.floor(sortedCutoffs.length * 0.75))
  const target75thCutoff = sortedCutoffs[p75Index]

  const recommendations = {
    pointsToLatest: Math.max(0, latestCutoff - score),
    pointsToAverage: Math.max(0, averageCutoff - score),
    pointsTo75thPercentile: Math.max(0, target75thCutoff - score),
  }

  return {
    userScore: score,
    classCode: upperClassCode || 'ALL',
    className,
    timeframeMonths,
    totalDraws,
    qualifyingDrawsCount,
    matchRatePercentage,
    chanceLevel,
    latestCutoff,
    averageCutoff,
    minCutoff,
    maxCutoff,
    scoreGapLatest,
    scoreGapAverage,
    percentileRank,
    recommendations,
    draws: annotatedDraws,
  }
}
