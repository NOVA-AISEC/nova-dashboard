import { useState } from 'react'
import { MapPin, Route, Search } from 'lucide-react'
import { trafficAdvisories } from '@/data/mock-data'
import { PageHeader } from '@/components/page-header'
import { AlertDetail } from '@/components/ops/alert-detail'
import { useOperations } from '@/hooks/use-operations'
import { formatDateTime } from '@/lib/formatters'
import { isActiveAlert } from '@/lib/operations'
import type { Alert } from '@/types/domain'

export function TrafficPage() {
  const { data } = useOperations()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<Alert | null>(null)
  const labels = { action: 'Action needed', watch: 'Monitor', stable: 'Stable' }
  const order = { action: 0, watch: 1, stable: 2 }
  const filtered = trafficAdvisories
    .filter(
      (item) =>
        (status === 'all' || item.status === status) &&
        `${item.zone} ${item.summary}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => order[a.status] - order[b.status])
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Mobility"
        title="Parking & traffic"
        subtitle="Gate pressure, parking advisories, and the incidents behind them."
      />
      <div className="queue-summary three-column">
        {(['action', 'watch', 'stable'] as const).map((state, index) => (
          <div key={state}>
            <span className={`summary-dot summary-tone-${index}`} />
            <span>{labels[state]}</span>
            <strong>{trafficAdvisories.filter((item) => item.status === state).length}</strong>
          </div>
        ))}
      </div>
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search traffic advisories"
            placeholder="Search a gate or advisory…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Traffic status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.entries(labels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="supporting-grid">
        {filtered.map((item) => {
          const related =
            data?.alerts.filter((alert) => alert.zone === item.zone && isActiveAlert(alert)) ?? []
          return (
            <article key={item.id} className="workspace-panel supporting-card">
              <div className="supporting-card-top">
                <span className="supporting-icon">
                  <Route size={20} />
                </span>
                <span
                  className={`signal-badge signal-${item.status === 'action' ? 'critical' : item.status === 'watch' ? 'high' : 'low'}`}
                >
                  {labels[item.status]}
                </span>
              </div>
              <h2>{item.zone}</h2>
              <p className="supporting-copy">{item.summary}</p>
              {related.map((alert) => (
                <button className="related-incident" key={alert.id} onClick={() => setSelected(alert)}>
                  <MapPin size={13} />
                  {alert.title}
                  <span>Review →</span>
                </button>
              ))}
              <footer>
                <time>Updated {formatDateTime(item.updatedAt)} EAT</time>
                <span>Sample advisory</span>
              </footer>
            </article>
          )
        })}
      </div>
      {!filtered.length && (
        <div className="workspace-panel empty-state">
          <Route size={30} />
          <strong>No matching advisories</strong>
          <p>Try a different zone or status.</p>
        </div>
      )}
      <AlertDetail
        alert={selected ? (data?.alerts.find((alert) => alert.id === selected.id) ?? selected) : null}
        evidence={data?.evidence}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
