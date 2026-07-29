import { useLocation, useNavigate } from 'react-router-dom'
import type { BunkerInfo } from '../types'

interface BunkerSwitcherProps {
  bunkers: BunkerInfo[]
  activeBunkerId: string
}

/**
 * Bunker selector for the dashboard/history views, driven by the URL. Deliberately kept apart
 * from AlertsBell in the header — alerts are always global across all bunkers, and sitting next
 * to a single-bunker selector wrongly implied it filtered them (see feedback memory).
 */
export function BunkerSwitcher({ bunkers, activeBunkerId }: BunkerSwitcherProps) {
  const location = useLocation()
  const navigate = useNavigate()

  if (bunkers.length <= 1) return null

  const isHistory = location.pathname.endsWith('/history')

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    navigate(isHistory ? `/bunkers/${id}/history` : `/bunkers/${id}`)
  }

  return (
    <select
      value={activeBunkerId}
      onChange={handleChange}
      className="rounded-lg border border-surface-3 bg-surface-1 px-3 py-1.5 text-xs text-slate-300 focus:border-blue-600 focus:outline-none"
      aria-label="Выбор бункера"
    >
      {bunkers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  )
}
