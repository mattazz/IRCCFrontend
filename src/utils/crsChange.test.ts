import { describe, expect, it } from 'vitest'
import { getCrsChangeForDraw, matchClassCodeForDraw } from './crsChange'
import type { Draw } from '../types/api'

function draw(overrides: Partial<Draw>): Draw {
  return { date: '2024-01-01', drawNumber: '1', crs: '500', class: '', subclass: '', drawSize: '1000', ...overrides }
}

describe('matchClassCodeForDraw', () => {
  it('distinguishes "Trade occupations" (TO) from "Federal Skilled Trades" (FST) instead of conflating them', () => {
    // Regression test: DrawsSection.tsx used to have its own normalizeCategory() helper that
    // mapped any class string containing "trade" to a single 'trades' bucket, merging these
    // two distinct classes. matchClassCodeForDraw checks CLASS_CODES in order (FST before TO),
    // so the more specific "Federal Skilled Trades" keyword wins for FST draws.
    expect(matchClassCodeForDraw(draw({ class: 'Trade occupations' }))).toBe('TO')
    expect(matchClassCodeForDraw(draw({ class: 'Federal Skilled Trades' }))).toBe('FST')
  })

  it('returns null when no class code matches', () => {
    expect(matchClassCodeForDraw(draw({ class: 'Some Unrecognized Category' }))).toBeNull()
  })

  it('matches French language proficiency draws regardless of version suffix', () => {
    expect(matchClassCodeForDraw(draw({ class: 'French-Language proficiency 2026-Version 2' }))).toBe('FLP')
  })
})

describe('getCrsChangeForDraw', () => {
  it('compares against the most recent earlier draw in the same auto-detected class', () => {
    const draws = [
      draw({ drawNumber: '3', date: '2024-03-01', crs: '470', class: 'Trade occupations' }),
      draw({ drawNumber: '2', date: '2024-02-01', crs: '460', class: 'Federal Skilled Trades' }),
      draw({ drawNumber: '1', date: '2024-01-01', crs: '450', class: 'Trade occupations' }),
    ]
    // #3 (Trade occupations) should skip over #2 (Federal Skilled Trades) and compare against
    // #1 (also Trade occupations) - the previous buggy normalizeCategory() implementation would
    // have incorrectly compared #3 against #2 since both contained the substring "trade".
    const change = getCrsChangeForDraw(draws[0], draws)
    expect(change).not.toBeNull()
    expect(change?.prevDrawNumber).toBe('1')
    expect(change?.diff).toBe(20)
    expect(change?.formatted).toBe('+20')
  })

  it('accepts an explicit classCode instead of auto-detecting one (DrawAnalysisPage usage)', () => {
    const draws = [
      draw({ drawNumber: '2', date: '2024-02-01', crs: '500', class: 'Canadian Experience Class' }),
      draw({ drawNumber: '1', date: '2024-01-01', crs: '520', class: 'Canadian Experience Class' }),
    ]
    const change = getCrsChangeForDraw(draws[0], draws, 'CEC')
    expect(change?.diff).toBe(-20)
    expect(change?.formatted).toBe('-20')
  })

  it('returns null when the draw is not found in allDrawsSortedDesc', () => {
    const draws = [draw({ drawNumber: '1' })]
    const missing = draw({ drawNumber: '999' })
    expect(getCrsChangeForDraw(missing, draws)).toBeNull()
  })

  it('returns null when crs is not numeric', () => {
    const draws = [draw({ drawNumber: '1', crs: 'N/A' })]
    expect(getCrsChangeForDraw(draws[0], draws)).toBeNull()
  })

  it('returns null when there is no earlier draw in the same class', () => {
    const draws = [draw({ drawNumber: '1', class: 'Canadian Experience Class' })]
    expect(getCrsChangeForDraw(draws[0], draws)).toBeNull()
  })
})
