import { describe, expect, it } from 'vitest'
import { filterByDateRange, sortByDate } from './dateOrder'

describe('sortByDate', () => {
  it('sorts chronologically regardless of input order', () => {
    const items = [{ date: '2024-03-01' }, { date: '2024-01-01' }, { date: '2024-02-01' }]
    expect(sortByDate(items).map((i) => i.date)).toEqual(['2024-01-01', '2024-02-01', '2024-03-01'])
  })

  it('does not mutate the input array', () => {
    const items = [{ date: '2024-03-01' }, { date: '2024-01-01' }]
    const original = [...items]
    sortByDate(items)
    expect(items).toEqual(original)
  })

  it('leaves already-sorted input unchanged', () => {
    const items = [{ date: '2024-01-01' }, { date: '2024-01-08' }, { date: '2024-01-15' }]
    expect(sortByDate(items).map((i) => i.date)).toEqual(['2024-01-01', '2024-01-08', '2024-01-15'])
  })

  it('handles an empty array', () => {
    expect(sortByDate([])).toEqual([])
  })
})

describe('filterByDateRange', () => {
  const items = [{ date: '2024-01-01' }, { date: '2024-01-08' }, { date: '2024-01-15' }, { date: '2024-01-22' }]

  it('includes both boundary dates (inclusive range)', () => {
    const result = filterByDateRange(items, '2024-01-08', '2024-01-15')
    expect(result.map((i) => i.date)).toEqual(['2024-01-08', '2024-01-15'])
  })

  it('excludes dates outside the range', () => {
    const result = filterByDateRange(items, '2024-01-08', '2024-01-15')
    expect(result).not.toContainEqual({ date: '2024-01-01' })
    expect(result).not.toContainEqual({ date: '2024-01-22' })
  })

  it('returns everything when the range spans the whole list', () => {
    expect(filterByDateRange(items, '2024-01-01', '2024-01-22')).toHaveLength(4)
  })

  it('returns nothing when the range matches no dates', () => {
    expect(filterByDateRange(items, '2025-01-01', '2025-12-31')).toEqual([])
  })
})
