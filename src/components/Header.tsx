import type { ReactNode } from 'react'
import { NavLink, useParams } from 'react-router-dom'
import type { Alert, BunkerInfo } from '../types'
import { BunkerSwitcher } from './BunkerSwitcher'
import { AlertsBell } from '../features/alerts/AlertsBell'

interface HeaderProps {
  bunkers: BunkerInfo[] | undefined
  alerts: Alert[]
}

function NavTab({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'text-sky-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-500'
            : 'text-slate-500 hover:text-slate-300'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export function Header({ bunkers, alerts }: HeaderProps) {
  // bunkerId from the route when viewing a specific bunker; otherwise fall back to the first
  // bunker so the Дашборд/История tabs always have somewhere to go, even from the Overview page.
  const { bunkerId: routeBunkerId } = useParams<{ bunkerId: string }>()
  const activeBunkerId = routeBunkerId ?? bunkers?.[0]?.id ?? ''

  return (
    <header className="flex h-12 items-center border-b border-surface-3 bg-surface-1 px-4">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold tracking-tight text-slate-100">УЛМ-3D-64</span>
        <span className="text-xs text-slate-600">Мониторинг бункера</span>
      </div>

      <nav className="ml-8 flex h-full items-end">
        <NavTab to="/" end>
          Обзор
        </NavTab>
        {activeBunkerId && (
          <>
            <NavTab to={`/bunkers/${activeBunkerId}`} end>
              Дашборд
            </NavTab>
            <NavTab to={`/bunkers/${activeBunkerId}/history`}>История</NavTab>
          </>
        )}
      </nav>

      {/* Bunker selector — scoped to the dashboard/history views. Kept apart from AlertsBell
          on the far right: alerts are always global across all bunkers, not filtered by this. */}
      {bunkers && activeBunkerId && (
        <div className="ml-4">
          <BunkerSwitcher bunkers={bunkers} activeBunkerId={activeBunkerId} />
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <AlertsBell alerts={alerts} />
      </div>
    </header>
  )
}
