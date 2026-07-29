import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useStats, useBunkers, fetchAllMeasurements } from '../../api/hooks'
import { Skeleton } from '../../components/Skeleton'
import { ErrorMessage } from '../../components/ErrorMessage'
import { LevelChart } from './LevelChart'
import { MassVolumeChart } from './MassVolumeChart'
import { PeriodSummary } from './PeriodSummary'
import { getPeriodRange, PERIOD_LABELS, type Period } from '../../lib/dateUtils'
import { measurementsToCsv, downloadCsv } from '../../lib/csvExport'

export function HistoryPage() {
  const { bunkerId = '' } = useParams<{ bunkerId: string }>()
  const { data: bunkers, isLoading: bunkersLoading } = useBunkers()

  const [period, setPeriod] = useState<Period>('day')
  const [csvLoading, setCsvLoading] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)

  const bunkerName = bunkers?.find((b) => b.id === bunkerId)?.name

  const { data: stats, isLoading: statsLoading, error } = useStats(bunkerId, period)
  const isLoading = bunkersLoading || statsLoading

  // Unknown bunkerId in the URL (e.g. stale link, typo) once the bunkers list has loaded
  if (!bunkersLoading && bunkers && !bunkers.some((b) => b.id === bunkerId)) {
    return <Navigate to="/" replace />
  }

  async function handleExportCsv() {
    setCsvLoading(true)
    setCsvError(null)
    try {
      const { from, to } = getPeriodRange(period)
      const measurements = await fetchAllMeasurements(bunkerId, from, to)
      if (measurements.length === 0) {
        setCsvError('Нет данных за выбранный период')
        return
      }
      const csv = measurementsToCsv(measurements)
      const label = PERIOD_LABELS[period].toLowerCase()
      const safeName = (bunkerName ?? bunkerId).replace(/[^а-яa-z0-9_-]/gi, '_')
      downloadCsv(csv, `${safeName}_${label}_${new Date().toISOString().slice(0, 10)}.csv`)
    } catch {
      setCsvError('Ошибка при выгрузке данных')
    } finally {
      setCsvLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-slate-200">
          История замеров{bunkerName ? ` — ${bunkerName}` : ''}
        </h2>

        {/* Period selector */}
        <div className="flex gap-1 rounded-lg border border-surface-3 bg-surface p-0.5">
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* CSV export */}
        <div className="ml-auto flex flex-col items-end gap-1">
          <button
            onClick={handleExportCsv}
            disabled={csvLoading || isLoading || !bunkerId}
            className="flex items-center gap-2 rounded-lg border border-surface-3 bg-surface-1 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-blue-700 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {csvLoading ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-blue-400" />
                Выгружаем…
              </>
            ) : (
              <>
                <DownloadIcon />
                Выгрузить CSV
              </>
            )}
          </button>
          {csvError && <span className="text-xs text-red-400">{csvError}</span>}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-52" />
          <Skeleton className="h-44" />
        </div>
      ) : error ? (
        <ErrorMessage message="Не удалось загрузить историю. Проверьте соединение с сервером." />
      ) : stats && stats.series.length > 0 ? (
        <div className="flex flex-col gap-4">
          <PeriodSummary stats={stats} />
          <LevelChart stats={stats} />
          <MassVolumeChart stats={stats} />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-surface-3 bg-surface-1 text-sm text-slate-500">
          Нет данных за выбранный период
        </div>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
