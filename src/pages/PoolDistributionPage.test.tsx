import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PoolDistributionPage } from './PoolDistributionPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    draws: {
      latest: vi.fn(),
    },
  },
}))

const mockDraws = [
  {
    drawNumber: '434',
    date: '2026-08-07',
    crs: '470',
    class: 'Transport Occupations',
    subclass: '',
    drawSize: '300',
    url: 'https://example.com/434',
    poolTotal: '229,100',
    poolDistributionAsOn: 'August 3, 2026',
    poolDistribution: {
      '601-1200': '500',
      '501-600': '19,705',
      '451-500': '73,099',
    },
  },
]

describe('PoolDistributionPage', () => {
  it('renders loading state initially and then displays candidate pool distribution', async () => {
    vi.mocked(api.draws.latest).mockResolvedValueOnce(mockDraws)

    render(<PoolDistributionPage />)

    expect(screen.getByText(/Loading candidate pool distribution data/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Express Entry Candidate Pool Distribution/i })).toBeInTheDocument()
      expect(screen.getAllByText(/Active Candidates/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Score Bracket Breakdown Table/i)).toBeInTheDocument()
    })
  })

  it('renders error state on API failure', async () => {
    vi.mocked(api.draws.latest).mockRejectedValueOnce(new Error('Failed to fetch pool distribution'))

    render(<PoolDistributionPage />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch pool distribution/i)).toBeInTheDocument()
    })
  })
})
