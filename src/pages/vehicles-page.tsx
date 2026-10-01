import { useState } from 'react'
import { CarFront, MapPin, Search } from 'lucide-react'
import { vehicleSightings } from '@/data/mock-data'
import { PageHeader } from '@/components/page-header'
import { AlertDetail } from '@/components/ops/alert-detail'
import { useOperations } from '@/hooks/use-operations'
import { formatDateTime } from '@/lib/formatters'
import type { Alert } from '@/types/domain'

export function VehiclesPage() {
  const { data } = useOperations()
  const [zone, setZone] = useState('all')
  const [vehicleType, setVehicleType] = useState('all')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<Alert | null>(null)
  const filtered = vehicleSightings
    .filter(
      (item) =>
        (zone === 'all' || item.zone === zone) &&
        (vehicleType === 'all' || item.type === vehicleType) &&
        [item.color, item.type, item.direction, item.zone, ...item.attributes]
          .join(' ')
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        (!from || item.timestamp.slice(0, 10) >= from) &&
        (!to || item.timestamp.slice(0, 10) <= to),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Mobility"
        title="Vehicle search"
        subtitle="Find sample sightings by description, location, and recorded date."
      />
      <section className="workspace-panel filter-panel">
        <div className="queue-toolbar">
          <label className="workspace-search-input">
            <Search size={16} />
            <input
              aria-label="Search vehicle sightings"
              placeholder="Color, direction, or attribute…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select aria-label="Vehicle zone" value={zone} onChange={(event) => setZone(event.target.value)}>
            <option value="all">All zones</option>
            {[...new Set(vehicleSightings.map((item) => item.zone))].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
          <select
            aria-label="Vehicle type"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
          >
            <option value="all">All types</option>
            {[...new Set(vehicleSightings.map((item) => item.type))].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="evidence-date-filters">
          <label>
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          {(query || zone !== 'all' || vehicleType !== 'all' || from || to) && (
            <button
              className="text-link"
              onClick={() => {
                setQuery('')
                setZone('all')
                setVehicleType('all')
                setFrom('')
                setTo('')
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </section>
      <p className="results-meta">{filtered.length} sightings · Latest first · Sample records</p>
      <div className="supporting-grid">
        {filtered.map((item) => (
          <article key={item.id} className="workspace-panel supporting-card">
            <div className="supporting-card-top">
              <span className="supporting-icon">
                <CarFront size={20} />
              </span>
              <span className="context-tag">{item.direction}</span>
            </div>
            <h2>
              {item.color} {item.type}
            </h2>
            <p className="supporting-location">
              <MapPin size={13} />
              {item.zone}
            </p>
            <div className="attribute-tags">
              {item.attributes.map((attribute) => (
                <span key={attribute}>{attribute}</span>
              ))}
            </div>
            <footer>
              <time>{formatDateTime(item.timestamp)} EAT</time>
              {item.linkedAlertId && data?.alerts.some((alert) => alert.id === item.linkedAlertId) ? (
                <button
                  className="text-link"
                  onClick={() => setSelected(data.alerts.find((alert) => alert.id === item.linkedAlertId)!)}
                >
                  Review incident
                </button>
              ) : (
                <span>No linked incident</span>
              )}
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="workspace-panel empty-state">
          <CarFront size={30} />
          <strong>No matching sightings</strong>
          <p>Try another description, zone, or date range.</p>
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
