import { useEffect, useRef, useState } from 'react'
import type { Alert } from '../../types'
import { AlertsPanel } from './AlertsPanel'
import { useUnseenAlerts } from './useUnseenAlerts'

interface AlertsBellProps {
  alerts: Alert[]
}

export function AlertsBell({ alerts }: AlertsBellProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { unseenAlerts, markAllSeen } = useUnseenAlerts(alerts)

  const hasUnseenCritical = unseenAlerts.some((a) => a.severity === 'critical')

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggleOpen() {
    setOpen((wasOpen) => {
      const willOpen = !wasOpen
      if (willOpen) markAllSeen()
      return willOpen
    })
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-surface-2 hover:text-slate-200"
        aria-label={`Алерты${unseenAlerts.length > 0 ? `: ${unseenAlerts.length} непросмотренных` : ''}`}
        aria-expanded={open}
      >
        <BellIcon />
        {unseenAlerts.length > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
              hasUnseenCritical ? 'bg-red-600' : 'bg-amber-600'
            }`}
          >
            {unseenAlerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-surface-3 bg-surface-1 shadow-xl">
          <div className="border-b border-surface-3 px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Алерты
            </h2>
          </div>
          <AlertsPanel alerts={alerts} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
