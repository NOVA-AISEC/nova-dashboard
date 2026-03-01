import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api'
import { AlertTable } from '@/components/ops/alert-table'
import { PageHeader } from '@/components/page-header'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { FiltersBar } from '@/components/shared/filters-bar'
import { MetricCard } from '@/components/shared/metric-card'
import { buttonVariants } from '@/components/ui/button-variants'
import { useAsyncData } from '@/hooks/use-async-data'

export function AlertsPage() {
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [cameraId, setCameraId] = useState('all')
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [busyAlertId, setBusyAlertId] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query)

  const metadataState = useAsyncData(() => api.search(''), [])
  const alertsState = useAsyncData(
    () =>
      api.listAlerts({
        severity,
        status,
        cameraId,
        q: deferredQuery,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        page: 1,
        pageSize: 50,
      }),
    [severity, status, cameraId, deferredQuery, dateFrom, dateTo, refreshKey],
  )

  async function handleAcknowledge(alertId: string) {
    try {
      setBusyAlertId(alertId)
      await api.ackAlert(alertId)
      setRefreshKey((value) => value + 1)
    } finally {
      setBusyAlertId(null)
    }
  }

  if (alertsState.isLoading && !alertsState.data) {
    return (
      <div className="space-y-6">
        <LoadingPanel lines={4} />
        <section className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingPanel key={index} lines={3} />
          ))}
        </section>
        <LoadingPanel lines={8} />
      </div>
    )
  }

  if (alertsState.error || !alertsState.data) {
    return <ErrorPanel message={alertsState.error ?? 'Alert data is unavailable.'} />
  }

  const alerts = alertsState.data.items
  const cameras =
    metadataState.data?.cameras ??
    Array.from(new Set(alerts.map((alert) => alert.cameraId))).sort()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident Desk"
        title="Campus alert queue"
        subtitle="Filter the triage queue by severity, state, camera, date range, and free-text query. Acknowledgement supports guard dispatch and still requires human validation."
        actions={
          <>
            <Link className={buttonVariants({ variant: 'action' })} to="/cases">
              Create case from selection
            </Link>
            <Link className={buttonVariants({ variant: 'outline' })} to="/exports">
              Export evidence pack
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          label="Critical open"
          value={String(
            alerts.filter((alert) => alert.severity === 'critical').length,
          ).padStart(2, '0')}
          delta="Immediate analyst review"
          tone="warning"
        />
        <MetricCard
          label="Triaging"
          value={String(
            alerts.filter((alert) => alert.status === 'triaging').length,
          ).padStart(2, '0')}
          delta="Analyst-owned work"
          tone="accent"
        />
        <MetricCard
          label="Acknowledged"
          value={String(
            alerts.filter((alert) => alert.status === 'acknowledged').length,
          ).padStart(2, '0')}
          delta="Awaiting next action"
          tone="success"
        />
      </section>

      <FiltersBar
        searchValue={query}
        onSearchChange={setQuery}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        groups={[
          {
            id: 'severity',
            label: 'Severity',
            value: severity,
            options: [
              { label: 'All', value: 'all' },
              { label: 'Critical', value: 'critical' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: status,
            options: [
              { label: 'All', value: 'all' },
              { label: 'New', value: 'new' },
              { label: 'Ack', value: 'acknowledged' },
              { label: 'Triaging', value: 'triaging' },
              { label: 'Contained', value: 'contained' },
              { label: 'Closed', value: 'closed' },
            ],
          },
          {
            id: 'camera',
            label: 'Camera',
            value: cameraId,
            options: [
              { label: 'All', value: 'all' },
              ...cameras.map((item) => ({ label: item, value: item })),
            ],
          },
        ]}
        onGroupChange={(groupId, value) => {
          if (groupId === 'severity') {
            setSeverity(value)
          }

          if (groupId === 'status') {
            setStatus(value)
          }

          if (groupId === 'camera') {
            setCameraId(value)
          }
        }}
      />

      {alertsState.error ? (
        <ErrorPanel message={alertsState.error} />
      ) : (
        <AlertTable
          alerts={alerts}
          busyAlertId={busyAlertId}
          onAcknowledge={(alert) => void handleAcknowledge(alert.id)}
          title="Filtered queue"
          description="Open a case to inspect snapshots, metadata, audit, and human-validation history."
        />
      )}
    </div>
  )
}
