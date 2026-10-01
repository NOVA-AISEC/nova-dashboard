import { useState } from 'react'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { campusEvents } from '@/data/mock-data'
import { PageHeader } from '@/components/page-header'
import { formatDateTime } from '@/lib/formatters'

export function EventsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const labels = { scheduled: 'Scheduled', live: 'In progress', monitoring: 'Monitoring' }
  const filtered = campusEvents
    .filter(
      (item) =>
        (status === 'all' || item.status === status) &&
        `${item.title} ${item.zone} ${item.detail}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Campus"
        title="Campus events"
        subtitle="Plan coverage around sample events and expected crowd pressure."
      />
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search campus events"
            placeholder="Search an event or zone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select aria-label="Event status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All events</option>
          {Object.entries(labels).map(([value, label]) => (
            <option value={value} key={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <p className="results-meta">{filtered.length} events · Scheduled order · Sample records</p>
      <div className="supporting-grid">
        {filtered.map((item) => (
          <article key={item.id} className="workspace-panel supporting-card">
            <div className="supporting-card-top">
              <span className="supporting-icon">
                <CalendarDays size={20} />
              </span>
              <span className="context-tag">{labels[item.status]}</span>
            </div>
            <h2>{item.title}</h2>
            <p className="supporting-location">
              <MapPin size={13} />
              {item.zone}
            </p>
            <p className="supporting-copy">{item.detail}</p>
            <div className="event-crowd">
              <Users size={15} />
              <span
                className={`signal-badge signal-${item.crowdLevel === 'high' ? 'high' : item.crowdLevel === 'moderate' ? 'medium' : 'low'}`}
              >
                {item.crowdLevel} crowd pressure
              </span>
            </div>
            <footer>
              <time>{formatDateTime(item.startsAt)} EAT</time>
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="workspace-panel empty-state">
          <CalendarDays size={30} />
          <strong>No matching events</strong>
          <p>Try another event name or status.</p>
        </div>
      )}
    </div>
  )
}
