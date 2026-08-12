import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CrsMatcherPage } from './CrsMatcherPage'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    draws: {
      all: vi.fn(),
    },
  },
}))

const mockDraws = [
  { drawNumber: '310', date: '2024-07-15', crs: '520', class: 'Canadian Experience Class', subclass: '', drawSize: '3,000' },
  { drawNumber: '304', date: '2024-05-31', crs: '500', class: 'Canadian Experience Class', subclass: '', drawSize: '3,000' },
]

describe('CrsMatcherPage', () => {
  it('renders loading state initially and then displays match results', async () => {
    vi.mocked(api.draws.all).mockResolvedValueOnce(mockDraws)

    render(<CrsMatcherPage />)

    expect(screen.getByText(/Loading draw data for eligibility calculations/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: /Express Entry CRS Eligibility Matcher/i })).toBeInTheDocument()
      expect(screen.getByText(/How to Use This Tool/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Match Rate/i).length).toBeGreaterThan(0)
      expect(screen.getByText(/Historical Draws Breakdown/i)).toBeInTheDocument()
    })
  })

  it('displays error message when API call fails', async () => {
    vi.mocked(api.draws.all).mockRejectedValueOnce(new Error('Network error loading draws'))

    render(<CrsMatcherPage />)

    await waitFor(() => {
      expect(screen.getByText(/Network error loading draws/i)).toBeInTheDocument()
    })
  })
})
