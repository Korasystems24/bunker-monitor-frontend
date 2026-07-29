import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { HistoryPage } from './features/history/HistoryPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { Header } from './components/Header'
import { StatusBar } from './components/StatusBar'
import { ToastContainer } from './features/alerts/ToastContainer'
import { useAlertToasts } from './features/alerts/useAlertToasts'
import { useAlerts } from './features/alerts/useAlerts'
import { useBunkers, useHealth } from './api/hooks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 0,
    },
  },
})

function Layout() {
  const { data: bunkers, error: bunkersError } = useBunkers()
  const { error: healthError, dataUpdatedAt: healthUpdatedAt } = useHealth()
  const alerts = useAlerts()
  const { toasts, dismiss } = useAlertToasts(alerts)

  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)

  useEffect(() => {
    if (healthUpdatedAt > 0) {
      setLastFetchTime(new Date(healthUpdatedAt).toISOString())
    }
  }, [healthUpdatedAt])

  const hasError = Boolean(bunkersError ?? healthError)
  const errorMessage = hasError ? 'Ошибка соединения с сервером' : null

  return (
    <div className="flex min-h-screen flex-col bg-surface text-slate-200">
      <Header bunkers={bunkers} alerts={alerts} />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      <StatusBar isConnected={!hasError} lastFetchTime={lastFetchTime} errorMessage={errorMessage} />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

function AppInner() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="bunkers/:bunkerId" element={<DashboardPage />} />
          <Route path="bunkers/:bunkerId/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
