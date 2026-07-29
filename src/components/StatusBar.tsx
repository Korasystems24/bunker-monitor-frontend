import { IS_MOCK_MODE } from '../config'
import { formatRelativeTime } from '../lib/formatters'

interface StatusBarProps {
  isConnected: boolean
  lastFetchTime: string | null
  errorMessage: string | null
}

export function StatusBar({ isConnected, lastFetchTime, errorMessage }: StatusBarProps) {
  return (
    <footer className="flex h-8 items-center gap-4 border-t border-surface-3 bg-surface px-4 text-xs text-slate-500">
      {/* Connection indicator */}
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          aria-hidden="true"
        />
        <span className={isConnected ? 'text-green-500' : 'text-red-400'}>
          {isConnected ? 'Связь' : 'Нет связи'}
        </span>
      </span>

      {/* Last successful fetch */}
      {lastFetchTime && (
        <span>Обновлено: {formatRelativeTime(lastFetchTime)}</span>
      )}

      {/* Error */}
      {errorMessage && (
        <span className="text-red-400">{errorMessage}</span>
      )}

      <span className="ml-auto" />

      {/* Mock mode indicator */}
      {IS_MOCK_MODE && (
        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-400 border border-amber-800/50">
          MOCK
        </span>
      )}
    </footer>
  )
}
