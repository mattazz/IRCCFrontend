import { describe, expect, it } from 'vitest'
import { computeRollingAverage } from './rollingAverage'

describe('computeRollingAverage', () => {
  it('computes averages over the rolling window', () => {
    const draws = [
      { date: '2024-01-01', crs: '500' },
      { date: '2024-01-08', crs: '480' },
      { date: '2024-01-15', crs: '460' },
      { date: '2024-01-22', crs: '440' },
      { date: '2024-01-29', crs: '420' },
    ]
    const result = computeRollingAverage(draws, 4)
    // 5 draws, window size 4 => 2 rolling windows
    expect(result).toHaveLength(2)
    expect(result[0].average).toBe((500 + 480 + 460 + 440) / 4)
    expect(result[1].average).toBe((480 + 460 + 440 + 420) / 4)
  })

  it('uses the date of the first draw in each window', () => {
    const draws = [
      { date: '2024-01-01', crs: '500' },
      { date: '2024-01-08', crs: '480' },
      { date: '2024-01-15', crs: '460' },
      { date: '2024-01-22', crs: '440' },
    ]
    const result = computeRollingAverage(draws, 4)
    expect(result[0].date).toBe('2024-01-01')
  })

  it('returns an empty array when there is not enough data', () => {
    const draws = [{ date: '2024-01-01', crs: '500' }]
    expect(computeRollingAverage(draws, 4)).toEqual([])
  })

  it('filters out non-numeric CRS values before averaging', () => {
    const draws = [
      { date: '2024-01-01', crs: '500' },
      { date: '2024-01-08', crs: 'N/A' }, // dropped
      { date: '2024-01-15', crs: '460' },
      { date: '2024-01-22', crs: '440' },
      { date: '2024-01-29', crs: '420' },
    ]
    const result = computeRollingAverage(draws, 4)
    // 4 valid numeric points remain => exactly one window
    expect(result).toHaveLength(1)
    expect(result[0].average).toBe((500 + 460 + 440 + 420) / 4)
  })

  it('rounds averages to 2 decimal places', () => {
    const draws = [
      { date: '2024-01-01', crs: '500' },
      { date: '2024-01-08', crs: '499' },
      { date: '2024-01-15', crs: '499' },
    ]
    const result = computeRollingAverage(draws, 3)
    expect(result[0].average).toBe(499.33)
  })

  it('supports window sizes beyond the backend-fixed 4 (Decision 3: adjustable client-side)', () => {
    const draws = Array.from({ length: 12 }, (_, i) => ({ date: `2024-01-${String(i + 1).padStart(2, '0')}`, crs: '500' }))
    expect(computeRollingAverage(draws, 12)).toHaveLength(1)
    expect(computeRollingAverage(draws, 3)).toHaveLength(10)
  })
})
