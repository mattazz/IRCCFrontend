import { describe, expect, it } from 'vitest'
import { filterDrawsByClass } from './draws'
import type { Draw } from '../types/api'

function draw(overrides: Partial<Draw>): Draw {
  return { date: '2024-01-01', drawNumber: '1', crs: '500', class: '', subclass: '', drawSize: '1000', ...overrides }
}

describe('filterDrawsByClass', () => {
  it('matches draws whose class field contains the class name', () => {
    const draws = [
      draw({ drawNumber: '1', class: 'Canadian Experience Class' }),
      draw({ drawNumber: '2', class: 'Federal Skilled Worker' }),
    ]
    expect(filterDrawsByClass(draws, 'CEC').map((d) => d.drawNumber)).toEqual(['1'])
  })

  it('matches a class name that is a substring of a combined class field', () => {
    const draws = [draw({ drawNumber: '1', class: 'Provincial Nominee Program, 2026-Version 1' })]
    expect(filterDrawsByClass(draws, 'PNP')).toHaveLength(1)
  })

  it('does not fall back to the subclass field', () => {
    const draws = [
      draw({ drawNumber: '1', class: 'Federal Skilled Worker', subclass: 'Canadian Experience Class' }),
    ]
    expect(filterDrawsByClass(draws, 'CEC')).toEqual([])
  })

  it('returns an empty array when nothing matches', () => {
    const draws = [draw({ class: 'Federal Skilled Worker' })]
    expect(filterDrawsByClass(draws, 'CEC')).toEqual([])
  })

  it('preserves the input order', () => {
    const draws = [
      draw({ drawNumber: '3', class: 'Canadian Experience Class' }),
      draw({ drawNumber: '1', class: 'Canadian Experience Class' }),
      draw({ drawNumber: '2', class: 'Canadian Experience Class' }),
    ]
    expect(filterDrawsByClass(draws, 'CEC').map((d) => d.drawNumber)).toEqual(['3', '1', '2'])
  })
})
