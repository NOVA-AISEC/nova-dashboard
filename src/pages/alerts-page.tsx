import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { AlertTable } from '@/components/ops/alert-table'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { useOperations } from '@/hooks/use-operations'
import { isActiveAlert, statusLabels } from '@/lib/operations'

export function AlertsPage() {
  const { data, error, isLoading, refresh } = useOperations()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [camera, setCamera] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [advanced, setAdvanced] = useState(false)
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Alerts unavailable.'} />
  const active = data.alerts.filter(isActiveAlert)
  const filterCount = [severity !== 'all', status !== 'all', camera !== 'all', !!from, !!to].filter(
    Boolean,
  ).length
  const filtered = data.alerts.filter(
    (alert) =>
      (severity === 'all' || alert.severity === severity) &&
      (status === 'all' || alert.status === status) &&
      (camera === 'all' || alert.cameraId === camera) &&
      (!from || alert.createdAt.slice(0, 10) >= from) &&
      (!to || alert.createdAt.slice(0, 10) <= to) &&
      `${alert.title} ${alert.zone} ${alert.id} ${alert.cameraId}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  function reset() {
    setQuery('')
    setSeverity('all')
    setStatus('all')
    setCamera('all')
    setFrom('')
    setTo('')
  }
  return (
    <div className="space-y-5">
      <div className="overview-heading">
        <div>
          <p className="page-kicker">
            <span className="status-dot" />
            INCIDENT MANAGEMENT
          </p>
          <h1>
            Alert inbox<span className="heading-dot">.</span>
          </h1>
          <p>Every campus signal, with the context to make a decision.</p>
        </div>
        <button className="quiet-button" onClick={refresh}>
          Refresh alerts
        </button>
      </div>
      <div className="queue-summary">
        {[
          { label: 'All alerts', value: data.alerts.length },
          { label: 'Critical active', value: active.filter((alert) => alert.severity === 'critical').length },
          { label: 'Needs review', value: active.filter((alert) => alert.status === 'new').length },
          { label: 'Contained / closed', value: data.alerts.length - active.length },
        ].map((metric, index) => (
          <div key={metric.label}>
            <span className={`summary-dot summary-tone-${index}`} />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <section className="workspace-panel filter-panel">
        <div className="queue-toolbar">
          <label className="workspace-search-input">
            <Search size={16} />
            <input
              aria-label="Search alerts"
              placeholder="Search by incident, location, camera, or ID…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Alert priority"
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
          >
            <option value="all">All priorities</option>
            {['critical', 'high', 'medium', 'low'].map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
          <select
            aria-label="Alert status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="quiet-button"
            aria-expanded={advanced}
            onClick={() => setAdvanced((value) => !value)}
          >
            <SlidersHorizontal size={14} />
            Filters{!!filterCount && <span>{filterCount}</span>}
          </button>
        </div>
        {advanced && (
          <div className="advanced-filters">
            <label>
              Camera
              <select value={camera} onChange={(event) => setCamera(event.target.value)}>
                <option value="all">All cameras</option>
                {data.cameras.map((camera) => (
                  <option key={camera}>{camera}</option>
                ))}
              </select>
            </label>
            <label>
              From date
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            </label>
            <label>
              To date
              <input
                type="date"
                min={from || undefined}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <button className="text-link" onClick={reset}>
              <X size={13} />
              Clear filters
            </button>
          </div>
        )}
      </section>
      {(!!filterCount || query) && (
        <div className="results-meta">
          <span>
            {filtered.length} of {data.alerts.length} alerts match your filters
          </span>
          <button className="text-link" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
      <AlertTable
        alerts={filtered}
        title="Campus alerts"
        description="Select an incident to review its evidence, assignment, and next steps."
      />
    </div>
  )
}
