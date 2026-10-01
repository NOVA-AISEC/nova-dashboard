import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { canAccessRoute } from '@/app/access'
import { AlertDetail } from '@/components/ops/alert-detail'
import { CampusMap } from '@/components/ops/campus-map'
import { AlertTable } from '@/components/ops/alert-table'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { campusZones } from '@/data/mock-data'
import { useOperations } from '@/hooks/use-operations'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, formatTime, isActiveAlert, sortAlerts } from '@/lib/operations'
import { readShiftNotes, writeShiftNotes } from '@/lib/operator-storage'
import { exportShiftBrief } from '@/lib/shift-brief'
import type { Alert } from '@/types/domain'

function Sparkline({ values, color = 'var(--accent)' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1)
  const points = values
    .map((value, index) => `${index * (100 / Math.max(values.length - 1, 1))},${30 - (value / max) * 25}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 36" className="metric-sparkline" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function OpsPage() {
  const { session } = useAuth()
  const { data, error, isLoading, refresh } = useOperations()
  const [view, setView] = useState('overview')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [briefDownloaded, setBriefDownloaded] = useState(false)
  const [shiftNotes, setShiftNotes] = useState(readShiftNotes)
  const [notesError, setNotesError] = useState('')
  const [filter, setFilter] = useState('all')
  function saveShiftNotes(value: string) {
    setShiftNotes(value)
    setBriefDownloaded(false)
    try {
      writeShiftNotes(value)
      setNotesError('')
    } catch {
      setNotesError('Notes could not be saved. Check browser storage, or download the brief to keep a copy.')
    }
  }
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Operations data is unavailable.'} />
  if (!session) return null
  const activeAlerts = sortAlerts(data.alerts.filter(isActiveAlert))
  const critical = activeAlerts.filter((alert) => alert.severity === 'critical')
  const needsReview = activeAlerts.filter((alert) => alert.status === 'new')
  const activeCases = data.cases.filter((item) => item.status !== 'closed')
  const sampleDate = data.alerts[0]?.createdAt
  const teams = [...new Set(activeAlerts.map((alert) => alert.assignee))]
  const availableCameras = campusZones.filter((zone) => zone.status !== 'maintenance').length
  const hourCounts = Array.from(
    { length: 12 },
    (_, index) =>
      data.alerts.filter((alert) => Number(formatTime(alert.createdAt).split(':')[0]) === index + 6).length,
  )
  const sortedActivity = [...data.audit].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5)
  const visibleAlerts = activeAlerts.filter(
    (alert) =>
      filter === 'all' || (filter === 'new' ? alert.status === 'new' : alert.severity === 'critical'),
  )
  const can = (route: Parameters<typeof canAccessRoute>[1]) => canAccessRoute(session.role, route)
  return (
    <div className="overview-page">
      <div className="overview-heading">
        <div>
          <p className="page-kicker">
            <span className="status-dot" />
            COMMAND CENTER
          </p>
          <h1>
            Campus overview<span className="heading-dot">.</span>
          </h1>
          <p>Your campus, connected. Every incident, in focus.</p>
        </div>
        <div className="page-actions">
          <button className="quiet-button" onClick={() => setHandoverOpen(true)}>
            <FileText size={16} />
            Shift handover
          </button>
          {can('reports') && (
            <Link to="/reports" className={buttonVariants()}>
              <Plus size={16} />
              New incident
            </Link>
          )}
        </div>
      </div>
      <div className="overview-tabs">
        <div role="tablist" aria-label="Overview sections">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Activity log' },
            { id: 'coverage', label: 'Camera coverage' },
          ].map((tab, index, tabs) => (
            <button
              key={tab.id}
              role="tab"
              tabIndex={view === tab.id ? 0 : -1}
              aria-selected={view === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setView(tab.id)}
              onKeyDown={(event) => {
                if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                event.preventDefault()
                const next =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? tabs.length - 1
                      : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
                setView(tabs[next].id)
                document.getElementById(`tab-${tabs[next].id}`)?.focus()
              }}
            >
              {tab.label}
              {tab.id === 'overview' && <span>{activeAlerts.length}</span>}
            </button>
          ))}
        </div>
        <div className="shift-date">
          <Clock3 size={13} />
          <span>Sample shift · {sampleDate ? formatShiftDate(sampleDate) : 'No incidents'}</span>
          <button aria-label="Refresh dashboard" className="icon-button" onClick={refresh}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <section className="overview-metrics" aria-label="Operations summary">
        <div className="overview-metric">
          <div className="metric-top">
            <span>Active incidents</span>
            <ShieldAlert size={17} />
          </div>
          <div className="metric-middle">
            <strong>{String(activeAlerts.length).padStart(2, '0')}</strong>
            <Sparkline values={hourCounts} />
          </div>
          <p>
            <span className="metric-chip orange">{needsReview.length} need review</span>
            <span>across {new Set(activeAlerts.map((alert) => alert.zone)).size} zones</span>
          </p>
        </div>
        <div className="overview-metric">
          <div className="metric-top">
            <span>Critical alerts</span>
            <Activity size={17} />
          </div>
          <div className="metric-middle">
            <strong>{String(critical.length).padStart(2, '0')}</strong>
            <div className="critical-bars">
              {data.alerts.map((alert) => (
                <i
                  key={alert.id}
                  className={alert.severity === 'critical' && isActiveAlert(alert) ? 'is-critical' : ''}
                />
              ))}
            </div>
          </div>
          <p>
            <span className="metric-chip red">Priority 1</span>
            <span>Immediate attention</span>
          </p>
        </div>
        <div className="overview-metric">
          <div className="metric-top">
            <span>Camera availability</span>
            <Camera size={17} />
          </div>
          <div className="metric-middle">
            <strong>
              {availableCameras}
              <small> / {campusZones.length}</small>
            </strong>
            <span
              className="mini-donut"
              style={
                { '--percentage': `${(availableCameras / campusZones.length) * 100}%` } as React.CSSProperties
              }
            >
              <Camera size={14} />
            </span>
          </div>
          <p>
            <span className="metric-chip green">
              {Math.round((availableCameras / campusZones.length) * 100)}% available
            </span>
            <span>Sample inventory</span>
          </p>
        </div>
        <div className="overview-metric">
          <div className="metric-top">
            <span>Active cases</span>
            <FileText size={17} />
          </div>
          <div className="metric-middle">
            <strong>{String(activeCases.length).padStart(2, '0')}</strong>
            <div className="metric-avatars">
              {activeCases.slice(0, 3).map((item) => (
                <span key={item.id} title={item.leadAnalyst}>
                  {item.leadAnalyst
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              ))}
            </div>
          </div>
          <p>
            <span className="metric-chip neutral">
              {activeCases.filter((item) => item.status === 'escalated').length} escalated
            </span>
            <span>Under investigation</span>
          </p>
        </div>
      </section>
      {view === 'overview' && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview">
          <div className="overview-primary-grid">
            <section className="workspace-panel map-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Campus pulse{' '}
                    <span className="live-pill">
                      <span />
                      Sample
                    </span>
                  </h2>
                  <p>A clear view of where attention is needed.</p>
                </div>
                <span className="panel-meta">
                  <MapPin size={13} />
                  Nairobi campus
                </span>
              </div>
              <CampusMap alerts={data.alerts} onReview={setSelectedAlert} />
            </section>
            <section className="workspace-panel attention-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    Needs attention <span className="count-pill">{needsReview.length}</span>
                  </h2>
                  <p>Your next actions, in priority order.</p>
                </div>
                <ShieldAlert size={18} className="muted" />
              </div>
              <div className="attention-list">
                {needsReview.slice(0, 3).map((alert) => (
                  <button
                    className={`attention-card attention-${alert.severity}`}
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div>
                      <span className={`signal-badge signal-${alert.severity}`}>
                        <span />
                        {alert.severity}
                      </span>
                      <span className="mono muted">{formatTime(alert.createdAt)}</span>
                    </div>
                    <h3>{alert.title}</h3>
                    <p>
                      <MapPin size={12} />
                      {alert.zone}
                    </p>
                    <span className="attention-action">
                      Review incident <ArrowUpRight size={15} />
                    </span>
                  </button>
                ))}
                {!needsReview.length && (
                  <div className="empty-state">
                    <ShieldCheck size={32} />
                    <strong>You’re all caught up</strong>
                    <p>All incidents have an owner.</p>
                  </div>
                )}
              </div>
              <Link to="/alerts" className="panel-footer-link">
                View all alerts <ArrowRight size={15} />
              </Link>
            </section>
          </div>
          <div className="overview-secondary-grid">
            <section className="workspace-panel queue-preview">
              <div className="panel-header">
                <div>
                  <h2>
                    Incident queue <span className="count-pill">{activeAlerts.length}</span>
                  </h2>
                  <p>Track, review, and move incidents forward.</p>
                </div>
                <select
                  aria-label="Filter overview incidents"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">All priorities</option>
                  <option value="critical">Critical only</option>
                  <option value="new">Needs review</option>
                </select>
              </div>
              <AlertTable alerts={visibleAlerts.slice(0, 5)} compact hideHeader onReview={setSelectedAlert} />
              {can('queue') && (
                <Link to="/queue" className="panel-footer-link">
                  Open live queue <ArrowUpRight size={15} />
                </Link>
              )}
            </section>
            <section className="workspace-panel teams-panel">
              <div className="panel-header">
                <div>
                  <h2>Response teams</h2>
                  <p>Incident ownership across campus.</p>
                </div>
                <Radio size={18} className="muted" />
              </div>
              <div className="team-list">
                {teams.slice(0, 5).map((team, index) => (
                  <div key={team}>
                    <span className={`team-avatar team-color-${index % 3}`}>
                      {team
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <div>
                      <strong>{team}</strong>
                      <span>{activeAlerts.find((alert) => alert.assignee === team)?.zone}</span>
                    </div>
                    <span className="team-load">
                      {activeAlerts.filter((alert) => alert.assignee === team).length}
                      <small>active</small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="team-footer">
                <Users size={14} />
                {teams.length} teams with active assignments
              </div>
            </section>
          </div>
          <section className="shift-strip">
            <span className="shift-strip-icon">
              <FileText size={20} />
            </span>
            <div>
              <strong>A smooth shift starts with a clear handover.</strong>
              <span>Keep the next team in the loop with incident context and your notes.</span>
            </div>
            <button className="quiet-button" onClick={() => setHandoverOpen(true)}>
              Prepare handover
              <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
      {view === 'activity' && (
        <section
          id="panel-activity"
          role="tabpanel"
          aria-labelledby="tab-activity"
          className="workspace-panel activity-panel"
        >
          <div className="panel-header">
            <div>
              <h2>Incident activity</h2>
              <p>Recorded events by hour · EAT</p>
            </div>
            <Activity size={19} />
          </div>
          <div className="activity-chart">
            {hourCounts.map((count, index) => (
              <div key={index}>
                <span className="chart-count">{count || ''}</span>
                <div style={{ height: `${Math.max(3, (count / Math.max(...hourCounts, 1)) * 140)}px` }} />
                <span>{String(index + 6).padStart(2, '0')}:00</span>
              </div>
            ))}
          </div>
          <div className="panel-header">
            <h2>Latest operator actions</h2>
            {can('audit') && (
              <Link className="text-link" to="/audit">
                Full audit log
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          <div className="activity-list">
            {sortedActivity.map((event) => (
              <div key={event.id}>
                <span className="activity-icon">
                  <Check size={15} />
                </span>
                <div>
                  <strong>{event.action.toLowerCase().replaceAll('_', ' ')}</strong>
                  <span>
                    {event.actor} · {event.entityId}
                  </span>
                </div>
                <time>
                  {formatShiftDate(event.timestamp)} · {formatTime(event.timestamp)}
                </time>
              </div>
            ))}
            {!sortedActivity.length && <div className="empty-state">No recorded activity.</div>}
          </div>
        </section>
      )}
      {view === 'coverage' && (
        <section
          id="panel-coverage"
          role="tabpanel"
          aria-labelledby="tab-coverage"
          className="workspace-panel"
        >
          <div className="panel-header">
            <div>
              <h2>Camera coverage</h2>
              <p>Sample camera inventory. Select an incident from the map to review its evidence.</p>
            </div>
            {can('zones') && (
              <Link to="/zones" className="text-link">
                Manage zones
                <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          <div className="camera-grid">
            {campusZones.map((zone) => (
              <div key={zone.id} className="camera-card">
                <div>
                  <Camera size={20} />
                  <span
                    className={`signal-badge ${zone.status === 'maintenance' ? 'signal-high' : 'signal-low'}`}
                  >
                    {zone.status === 'maintenance' ? 'Maintenance' : 'Available'}
                  </span>
                </div>
                <h3>{zone.name}</h3>
                <span className="mono muted">{zone.cameraId}</span>
                <p>{zone.coverage}</p>
                <small>
                  {
                    data.alerts.filter((alert) => alert.cameraId === zone.cameraId && isActiveAlert(alert))
                      .length
                  }{' '}
                  active incidents · Checked {formatShiftDate(zone.lastCheckedAt)}
                </small>
              </div>
            ))}
          </div>
        </section>
      )}
      <WorkspaceDialog
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
        title="Prepare shift handover"
        description="Capture what the incoming team needs to know."
      >
        <div className="handover-content">
          <div className="handover-summary">
            <span>
              <ShieldAlert size={17} />
              <strong>{activeAlerts.length}</strong> active incidents
            </span>
            <span>
              <FileText size={17} />
              <strong>{activeCases.length}</strong> active cases
            </span>
          </div>
          <label htmlFor="handover-notes">Shift notes</label>
          <textarea
            id="handover-notes"
            value={shiftNotes}
            onChange={(event) => {
              saveShiftNotes(event.target.value)
            }}
            placeholder="Outstanding actions, patrol updates, and context for the next team…"
            rows={7}
          />
          {notesError ? (
            <p className="action-error" role="alert">
              {notesError}
            </p>
          ) : (
            <p className="muted">
              <Check size={13} />
              Notes saved in this browser.
            </p>
          )}
          <Button
            onClick={() => {
              exportShiftBrief({
                generatedBy: session.name,
                notes: shiftNotes,
                alerts: activeAlerts,
                cases: activeCases,
              })
              setBriefDownloaded(true)
            }}
          >
            <ArrowDownToLine size={16} />
            Download shift brief
          </Button>
          {briefDownloaded && (
            <p role="status">
              Shift brief prepared. Check your browser downloads for the printable HTML file.
            </p>
          )}
        </div>
      </WorkspaceDialog>
      <AlertDetail
        alert={
          selectedAlert ? (data.alerts.find((alert) => alert.id === selectedAlert.id) ?? selectedAlert) : null
        }
        evidence={data.evidence}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  )
}
