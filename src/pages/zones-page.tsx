import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveCampusPlace } from '../../shared/campus-reference'
import { Camera, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { campusZones } from '@/data/mock-data'
import { useOperations } from '@/hooks/use-operations'
import { isActiveAlert, formatShiftDate, formatTime } from '@/lib/operations'

export function ZonesPage() {
  const { data } = useOperations()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const zones = campusZones.filter(
    (zone) =>
      (status === 'all' ||
        (status === 'maintenance'
          ? zone.status === 'maintenance'
          : zone.status !== 'maintenance')) &&
      `${zone.name} ${zone.cameraId}`.toLowerCase().includes(query.trim().toLowerCase()),
  )
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Campus coverage"
        title="Zones & cameras"
        subtitle="Legacy demo camera inventory. Device identifiers, placement and availability have not been verified with Strathmore."
      />
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search cameras"
            placeholder="Search a camera or zone…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Camera availability"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All cameras</option>
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <section className="workspace-panel">
        <div className="panel-header">
          <h2>
            Campus inventory <span className="count-pill">{zones.length}</span>
          </h2>
          <span className="panel-meta">Sample camera status</span>
        </div>
        <div className="camera-grid">
          {zones.map((zone) => (
            <div key={zone.id} className="camera-card">
              <div>
                <Camera size={21} />
                <span
                  className={`signal-badge signal-${zone.status === 'maintenance' ? 'high' : 'low'}`}
                >
                  {zone.status === 'maintenance' ? 'Maintenance' : 'Available'}
                </span>
              </div>
              <h3>{zone.name}</h3>
              <span className="mono muted">{zone.cameraId}</span>
              <p>{zone.coverage}</p>
              {resolveCampusPlace(zone.name) ? (
                <Link
                  to={`/campus?place=${resolveCampusPlace(zone.name)!.id}`}
                  className="twin-camera-link"
                >
                  Inspect proposed campus mapping
                </Link>
              ) : (
                <p className="camera-last-checked">
                  Unverified location · excluded from campus twin
                </p>
              )}
              <small>
                {data?.alerts.filter(
                  (alert) => alert.cameraId === zone.cameraId && isActiveAlert(alert),
                ).length ?? '—'}{' '}
                active incidents
              </small>
              <p className="camera-last-checked">
                Last checked {formatShiftDate(zone.lastCheckedAt)} ·{' '}
                {formatTime(zone.lastCheckedAt)} EAT
              </p>
            </div>
          ))}
        </div>
        {!zones.length && <div className="empty-state">No cameras match your filters.</div>}
      </section>
    </div>
  )
}
