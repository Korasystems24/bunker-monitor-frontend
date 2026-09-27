import type { ParsedBeam } from '../../types'
import { formatLevel } from '../../lib/formatters'

interface BeamTooltipProps {
  beam: ParsedBeam
  /** Show the raw height even when the beam is not marked reliable. */
  showHeight?: boolean
}

export function BeamTooltip({ beam, showHeight = false }: BeamTooltipProps) {
  const heightVisible = showHeight || beam.reliable
  return (
    <div className="pointer-events-none z-50 w-52 rounded-lg border border-surface-3 bg-surface-1 p-3 shadow-xl text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-slate-100 text-sm">{beam.beam_name}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            beam.reliable ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'
          }`}
        >
          {beam.reliable ? 'Достоверен' : 'Недостоверен'}
        </span>
      </div>
      <div className="mb-2">
        <span className="text-slate-500">Высота: </span>
        <span className="font-mono text-slate-200">
          {heightVisible ? formatLevel(beam.height) : '—'}
        </span>
      </div>
      {beam.statusFlags.length > 0 && (
        <div>
          <span className="text-slate-500 block mb-1">Статус:</span>
          <ul className="space-y-0.5">
            {beam.statusFlags.map((flag) => (
              <li key={flag} className="text-yellow-400">
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}
      {beam.statusFlags.length === 0 && (
        <span className="text-slate-500">Флаги: нет</span>
      )}
    </div>
  )
}
