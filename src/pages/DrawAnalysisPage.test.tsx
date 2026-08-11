import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DrawAnalysisPage } from './DrawAnalysisPage'
import { api, ApiError } from '../api/client'
import type { Draw } from '../types/api'

vi.mock('../api/client', () => {
  class MockApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { api: { draws: { all: vi.fn() } }, ApiError: MockApiError }
})

const sampleDraws: Draw[] = [
  { date: '2024-01-01', drawNumber: '1', crs: '500', class: 'Canadian Experience Class', subclass: 'Canadian Experience Class', drawSize: '1,000' },
  { date: '2024-01-15', drawNumber: '2', crs: '480', class: 'Canadian Experience Class', subclass: 'Canadian Experience Class', drawSize: '2,000' },
]

beforeEach(() => {
  vi.mocked(api.draws.all).mockReset()
})

describe('DrawAnalysisPage', () => {
  it('shows a loading state before data arrives', () => {
    vi.mocked(api.draws.all).mockReturnValue(new Promise(() => {})) // never resolves
    render(<DrawAnalysisPage />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders the chart once data arrives', async () => {
    vi.mocked(api.draws.all).mockResolvedValue(sampleDraws)
    render(<DrawAnalysisPage />)

    // Waiting on the loading text to disappear isn't enough here: the chart only mounts
    // once loading flips false, and Recharts' <ResponsiveContainer> then needs its own
    // ResizeObserver-driven effect (mocked in src/test/setup.ts) to run and re-render
    // before the <svg> actually appears - a second, cascading update after the one that
    // clears "Loading…". Assert on the thing we actually care about instead of a proxy
    // for it, so waitFor's polling covers that extra render.
    await waitFor(() => expect(document.querySelector('svg.recharts-surface')).toBeInTheDocument())

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
    expect(screen.getByText('Canadian Experience Class — CRS score trend')).toBeInTheDocument()
    // Stats panel, derived from the same fetched data
    expect(screen.getByText('Draws')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // draw count
  })

  it('shows an error state on a failed fetch', async () => {
    vi.mocked(api.draws.all).mockRejectedValue(new ApiError(500, 'Draws cache is still warming up'))
    render(<DrawAnalysisPage />)

    await waitFor(() => expect(screen.getByText('Draws cache is still warming up')).toBeInTheDocument())
    expect(document.querySelector('svg.recharts-surface')).not.toBeInTheDocument()
  })
})
