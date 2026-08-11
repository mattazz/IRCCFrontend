import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FaqPage } from './FaqPage'

describe('FaqPage', () => {
  it('shows the main menu of topics at the root', () => {
    render(<FaqPage />)
    expect(screen.getByText('Welcome to the IRCC FAQ! Choose a topic to get started.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Immigrating through Express Entry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn about Provincial Nomination Programs' })).toBeInTheDocument()
  })

  it('drills into a branch and shows its content plus further choices', async () => {
    const user = userEvent.setup()
    render(<FaqPage />)

    await user.click(screen.getByRole('button', { name: 'Learn about Provincial Nomination Programs' }))

    expect(screen.getByText('Which Provincial Nomination Program do you want to know more about?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alberta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yukon' })).toBeInTheDocument()
  })

  it('shows a leaf node\'s answer and source link', async () => {
    const user = userEvent.setup()
    render(<FaqPage />)

    await user.click(screen.getByRole('button', { name: 'Learn about Provincial Nomination Programs' }))
    await user.click(screen.getByRole('button', { name: 'Alberta' }))

    expect(screen.getByText(/economic immigration program that nominates people/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Alberta Advantage Immigration Program/ })).toHaveAttribute(
      'href',
      'https://www.alberta.ca/alberta-advantage-immigration-program',
    )
  })

  it('navigates back one level with Back, and to the root with Main Menu', async () => {
    const user = userEvent.setup()
    render(<FaqPage />)

    await user.click(screen.getByRole('button', { name: 'Immigrating through Express Entry' }))
    await user.click(screen.getByRole('button', { name: 'What are the Express Entry programs available?' }))
    await user.click(screen.getByRole('button', { name: 'Canadian Experience Class' }))
    expect(screen.getByText(/Canadian Experience Class is for skilled workers/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '⏪ Back' }))
    expect(screen.getByRole('button', { name: 'Canadian Experience Class' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '🏠 Main Menu' }))
    expect(screen.getByText('Welcome to the IRCC FAQ! Choose a topic to get started.')).toBeInTheDocument()
  })

  it('lets the breadcrumb jump back to an ancestor', async () => {
    const user = userEvent.setup()
    render(<FaqPage />)

    await user.click(screen.getByRole('button', { name: 'Immigrating through Express Entry' }))
    await user.click(screen.getByRole('button', { name: 'What are the Express Entry programs available?' }))
    await user.click(screen.getByRole('button', { name: 'Canadian Experience Class' }))

    await user.click(screen.getByRole('button', { name: 'Immigrating through Express Entry' }))
    expect(screen.getByRole('button', { name: 'What are the Express Entry programs available?' })).toBeInTheDocument()
  })
})
