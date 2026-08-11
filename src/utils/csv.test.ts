import { describe, expect, it } from 'vitest'
import { drawsToCsv } from './csv'
import type { Draw } from '../types/api'

function draw(overrides: Partial<Draw>): Draw {
  return { date: '2024-01-01', drawNumber: '1', crs: '500', class: 'CEC', subclass: 'CEC', drawSize: '1,000', ...overrides }
}

describe('drawsToCsv', () => {
  it('writes a header row followed by one row per draw', () => {
    const csv = drawsToCsv([draw({ drawNumber: '1' }), draw({ drawNumber: '2' })])
    const lines = csv.split('\n')
    expect(lines[0]).toBe('date,drawNumber,class,subclass,crs,invitations')
    expect(lines).toHaveLength(3)
  })

  it('maps drawSize to the invitations column', () => {
    const csv = drawsToCsv([draw({ drawSize: '3,500' })])
    expect(csv.split('\n')[1]).toContain('"3,500"')
  })

  it('quotes fields containing a comma', () => {
    const csv = drawsToCsv([draw({ class: 'Federal Skilled Worker, 2026-Version 1' })])
    expect(csv.split('\n')[1]).toContain('"Federal Skilled Worker, 2026-Version 1"')
  })

  it('escapes embedded quotes by doubling them', () => {
    const csv = drawsToCsv([draw({ class: 'Say "hello"' })])
    expect(csv.split('\n')[1]).toContain('"Say ""hello"""')
  })

  it('leaves plain fields unquoted', () => {
    const csv = drawsToCsv([draw({ date: '2024-01-01', drawNumber: '123', crs: '500' })])
    expect(csv.split('\n')[1].startsWith('2024-01-01,123,')).toBe(true)
  })

  it('returns just the header for an empty list', () => {
    expect(drawsToCsv([])).toBe('date,drawNumber,class,subclass,crs,invitations')
  })
})
