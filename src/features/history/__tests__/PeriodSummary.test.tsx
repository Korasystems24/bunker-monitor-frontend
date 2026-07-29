import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PeriodSummary } from '../PeriodSummary'
import type { BunkerStats } from '../../../types'

const makeStats = (overrides: Partial<BunkerStats> = {}): BunkerStats => ({
  period: 'day',
  min_level: 1.234,
  avg_level: 2.5,
  max_level: 3.876,
  series: [],
  ...overrides,
})

describe('PeriodSummary', () => {
  it('renders min, avg, and max level cards with unit', () => {
    render(<PeriodSummary stats={makeStats()} />)
    expect(screen.getByText('Мин. уровень')).toBeInTheDocument()
    expect(screen.getByText('Сред. уровень')).toBeInTheDocument()
    expect(screen.getByText('Макс. уровень')).toBeInTheDocument()
  })

  it('formats values with 2 decimal places', () => {
    render(<PeriodSummary stats={makeStats({ min_level: 1.2, avg_level: 2, max_level: 3.876 })} />)
    expect(screen.getByText(/1\.20/)).toBeInTheDocument()
    expect(screen.getByText(/2\.00/)).toBeInTheDocument()
    expect(screen.getByText(/3\.88/)).toBeInTheDocument()
  })

  it('shows the level unit (м) alongside each value', () => {
    render(<PeriodSummary stats={makeStats()} />)
    expect(screen.getAllByText('м')).toHaveLength(3)
  })
})
