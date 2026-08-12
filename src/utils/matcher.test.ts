import { describe, expect, it } from 'vitest'
import { computeDrawMatch } from './matcher'
import type { Draw } from '../types/api'

const mockDraws: Draw[] = [
  { drawNumber: '310', date: '2024-07-15', crs: '520', class: 'Canadian Experience Class', subclass: '', drawSize: '3000' },
  { drawNumber: '304', date: '2024-05-31', crs: '500', class: 'Canadian Experience Class', subclass: '', drawSize: '3000' },
  { drawNumber: '298', date: '2024-04-24', crs: '495', class: 'Canadian Experience Class', subclass: '', drawSize: '3000' },
  { drawNumber: '292', date: '2024-03-12', crs: '525', class: 'Canadian Experience Class', subclass: '', drawSize: '3000' },
]

describe('matcher utility', () => {
  it('computes match result correctly for qualifying score', () => {
    const result = computeDrawMatch(mockDraws, 508, 'CEC', 0)
    expect(result.totalDraws).toBe(4)
    expect(result.qualifyingDrawsCount).toBe(2)
    expect(result.matchRatePercentage).toBe(50)
    expect(result.chanceLevel).toBe('Moderate')
    expect(result.latestCutoff).toBe(520)
    expect(result.scoreGapLatest).toBe(-12)
    expect(result.recommendations.pointsToLatest).toBe(12)
  })

  it('clamps user score within 1 to 1200 range', () => {
    const lowResult = computeDrawMatch(mockDraws, -50, 'CEC', 0)
    expect(lowResult.userScore).toBe(1)

    const highResult = computeDrawMatch(mockDraws, 1500, 'CEC', 0)
    expect(highResult.userScore).toBe(1200)
  })

  it('returns empty result when no draws match filter', () => {
    const result = computeDrawMatch([], 500, 'AGRI', 12)
    expect(result.totalDraws).toBe(0)
    expect(result.matchRatePercentage).toBe(0)
    expect(result.chanceLevel).toBe('Unlikely')
  })

  it('sorts output draws newest-first even if input draws are chronological', () => {
    const chronologicalDraws: Draw[] = [
      { drawNumber: '100', date: '2023-01-01', crs: '480', class: 'Canadian Experience Class', subclass: '', drawSize: '1000' },
      { drawNumber: '200', date: '2024-06-01', crs: '520', class: 'Canadian Experience Class', subclass: '', drawSize: '2000' },
    ]
    const result = computeDrawMatch(chronologicalDraws, 500, 'CEC', 0)
    expect(result.draws[0].drawNumber).toBe('200')
    expect(result.draws[0].date).toBe('2024-06-01')
    expect(result.latestCutoff).toBe(520)
  })
})
