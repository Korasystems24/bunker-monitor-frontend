import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BeamHealthBar } from '../BeamHealthBar'
import type { Beam, Measurement } from '../../../types'

const makeBeam = (beam_name: string, status: string, height = 1.5): Beam => ({
  beam_name,
  height,
  status,
})

const makeMeasurement = (beams: Beam[]): Measurement => ({
  id: 1,
  ts: '2026-06-22T10:00:00.000Z',
  avg_level: 1.5,
  min_level: 1.0,
  max_level: 2.0,
  mass: 10,
  volume: 5,
  beams,
})

describe('BeamHealthBar', () => {
  it('renders nothing when measurement is undefined', () => {
    const { container } = render(<BeamHealthBar measurement={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('counts reliable beams as "Достоверных"', () => {
    // WeakSignal is not in the unreliable-flag set, so A1/A2/A3 all count as reliable
    const measurement = makeMeasurement([
      makeBeam('A1', ''),
      makeBeam('A2', ''),
      makeBeam('A3', 'WeakSignal'),
    ])
    render(<BeamHealthBar measurement={measurement} />)
    expect(screen.getByText('Достоверных').parentElement?.textContent).toContain('3')
  })

  it('counts degraded beams (unreliable but not Disabled)', () => {
    const measurement = makeMeasurement([
      makeBeam('A1', 'DistanceNotUpdating'),
      makeBeam('A2', 'NotUsed'),
      makeBeam('A3', 'Disabled'),
    ])
    render(<BeamHealthBar measurement={measurement} />)
    expect(screen.getByText('Деградация').parentElement?.textContent).toContain('2')
  })

  it('counts disabled beams separately from degraded', () => {
    const measurement = makeMeasurement([makeBeam('A1', 'Disabled'), makeBeam('A2', 'Disabled')])
    render(<BeamHealthBar measurement={measurement} />)
    expect(screen.getByText('Отключено').parentElement?.textContent).toContain('2')
  })

  it('shows outer zone ratio for reliable beams at positions >= threshold (6)', () => {
    const measurement = makeMeasurement([
      makeBeam('A6', ''), // outer, reliable
      makeBeam('A7', 'Disabled'), // outer, unreliable
      makeBeam('A1', ''), // inner, reliable — not counted in outer
    ])
    render(<BeamHealthBar measurement={measurement} />)
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('counts non-disabled outer beams when show-all is on, and still skips Disabled', () => {
    const measurement = makeMeasurement([
      makeBeam('A6', 'NotUsed, WeakSignal', 2.4),
      makeBeam('A7', 'Disabled', 0),
      makeBeam('A8', '', 1.5),
      makeBeam('A1', 'NotUsed', 2.0),
    ])
    const { rerender } = render(<BeamHealthBar measurement={measurement} />)
    expect(screen.getByText('1/3')).toBeInTheDocument()

    rerender(<BeamHealthBar measurement={measurement} showAllExceptDisabled />)
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })
})
