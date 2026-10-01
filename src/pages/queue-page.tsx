import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListFilter, Plus, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { canAccessRoute } from '@/app/access'
import { AlertDetail } from '@/components/ops/alert-detail'
import { AlertTable } from '@/components/ops/alert-table'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { buttonVariants } from '@/components/ui/button-variants'
import { useOperations } from '@/hooks/use-operations'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, formatTime, isActiveAlert, sortAlerts } from '@/lib/operations'
import type { Alert } from '@/types/domain'

export function QueuePage() {
  const { data, error, isLoading, refresh } = useOperations()
  const { session } = useAuth()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('all')
  const [layout, setLayout] = useState('list')
  const [selected, setSelected] = useState<Alert | null>(null)
  const active = useMemo(() => sortAlerts(data?.alerts.filter(isActiveAlert) ?? []), [data])
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Queue unavailable.'} />
  const filtered = active.filter(
    (alert) =>
      (tab === 'all' || alert.status === tab) &&
      (priority === 'all' || alert.severity === priority) &&
      `${alert.title} ${alert.zone} ${alert.assignee}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const lanes = [
    { id: 'new', label: 'Needs review' },
    { id: 'acknowledged', label: 'Acknowledged' },
    { id: 'triaging', label: 'In progress' },
  ]
  return (
    <div className="space-y-5">
      <div className="overview-heading">
        <div>
          <p className="page-kicker">
            <span className="status-dot" />
            OPERATIONS
          </p>
          <h1>
            Live queue<span className="heading-dot">.</span>
          </h1>
          <p>Review, take ownership, and coordinate your campus response.</p>
        </div>
        <div className="page-actions">
          <button className="quiet-button" onClick={refresh}>
            <RefreshCw size={14} />
            Refresh
          </button>
          {session && canAccessRoute(session.role, 'reports') && (
            <Link to="/reports" className={buttonVariants()}>
              <Plus size={15} />
              New incident
            </Link>
          )}
        </div>
      </div>
      <div className="queue-summary">
        {[
          { label: 'Active incidents', value: active.length },
          { label: 'Needs review', value: active.filter((alert) => alert.status === 'new').length },
          { label: 'In progress', value: active.filter((alert) => alert.status === 'triaging').length },
          { label: 'Contained', value: data.alerts.filter((alert) => alert.status === 'contained').length },
        ].map((metric, index) => (
          <div key={metric.label}>
            <span className={`summary-dot summary-tone-${index}`} />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search queue"
            placeholder="Search incidents, teams, or zones…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="select-filter">
          <ListFilter size={14} />
          <select
            aria-label="Queue priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            <option value="all">All priorities</option>
            {['critical', 'high', 'medium', 'low'].map((value) => (
              <option key={value} value={value}>
                {value[0].toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented-control" aria-label="Queue layout">
          <button aria-pressed={layout === 'list'} onClick={() => setLayout('list')}>
            List
          </button>
          <button aria-pressed={layout === 'board'} onClick={() => setLayout('board')}>
            Board
          </button>
        </div>
      </div>
      <div className="filter-tabs" aria-label="Queue status filters">
        {[{ id: 'all', label: 'All active' }, ...lanes].map((item) => (
          <button
            key={item.id}
            aria-pressed={tab === item.id}
            className={tab === item.id ? 'selected' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span>{active.filter((alert) => item.id === 'all' || alert.status === item.id).length}</span>
          </button>
        ))}
        <span className="filter-caption">
          Sample data · {data.alerts[0] ? formatShiftDate(data.alerts[0].createdAt) : 'No alerts'}
        </span>
      </div>
      {layout === 'list' ? (
        <AlertTable
          alerts={filtered}
          title="Dispatch queue"
          description={`${filtered.length} incidents · Sorted by priority, then time`}
          onReview={setSelected}
        />
      ) : (
        <div className="dispatch-board">
          {lanes.map((lane) => (
            <section key={lane.id}>
              <h2>
                <span className={`status-dot lane-${lane.id}`} />
                {lane.label}
                <span>{filtered.filter((alert) => alert.status === lane.id).length}</span>
              </h2>
              <div>
                {filtered
                  .filter((alert) => alert.status === lane.id)
                  .map((alert) => (
                    <button key={alert.id} className="dispatch-card" onClick={() => setSelected(alert)}>
                      <span className={`signal-badge signal-${alert.severity}`}>{alert.severity}</span>
                      <h3>{alert.title}</h3>
                      <p>{alert.zone}</p>
                      <div>
                        <span>{alert.assignee}</span>
                        <time>{formatTime(alert.createdAt)}</time>
                      </div>
                    </button>
                  ))}
                {!filtered.some((alert) => alert.status === lane.id) && (
                  <div className="board-empty">
                    <ShieldCheck size={20} />
                    No incidents in this lane.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      <AlertDetail
        alert={selected ? (data.alerts.find((alert) => alert.id === selected.id) ?? selected) : null}
        evidence={data.evidence}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
