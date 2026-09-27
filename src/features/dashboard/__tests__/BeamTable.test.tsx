import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BeamTable } from '../BeamTable'
import { BeamTablePanel } from '../BeamTablePanel'
import { parseBeam } from '../../../lib/parseMeasurement'
import type { Beam, Measurement } from '../../../types'

function parsed(beam_name: string, height: number, status: string) {
  const raw: Beam = { beam_name, height, status }
  return parseBeam(raw)
}

const beams = [
  parsed('A1', 2.5, 'NotUsed, WeakSignal'),
  parsed('A2', 1.2, 'Disabled'),
  parsed('A3', 3.1, ''),
]

describe('BeamTable', () => {
  it('hides NotUsed heights until show-all is enabled, and never shows Disabled', () => {
    const { rerender } = render(
      <BeamTable beams={beams} selectedBeam={null} onSelectBeam={() => {}} />,
    )

    expect(screen.getByLabelText('A1: —')).toBeInTheDocument()
    expect(screen.getByLabelText('A3: 3.10 м')).toBeInTheDocument()

    rerender(
      <BeamTable beams={beams} selectedBeam={null} onSelectBeam={() => {}} showAllExceptDisabled />,
    )

    expect(screen.getByLabelText('A1: 2.50 м')).toBeInTheDocument()
    expect(screen.getByText('2.50')).toBeInTheDocument()
    expect(screen.getByLabelText('A2: нет данных')).toBeInTheDocument()
    expect(screen.queryByText('1.20')).not.toBeInTheDocument()
  })
})

describe('BeamTablePanel', () => {
  it('checkbox asks to show every beam except Disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const measurement: Measurement = {
      id: 1,
      ts: '2026-06-22T10:00:00.000Z',
      avg_level: 2.5,
      min_level: 1,
      max_level: 3,
      mass: 10,
      volume: 5,
      beams: beams.map(({ beam_name, height, status }) => ({ beam_name, height, status })),
    }

    render(
      <BeamTablePanel
        measurement={measurement}
        isLoading={false}
        selectedBeam={null}
        onSelectBeam={() => {}}
        showAllExceptDisabled={false}
        onShowAllExceptDisabledChange={onChange}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: 'Все лучи, кроме отключённых' }))
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
