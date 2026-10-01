import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowDownToLine, Camera, FileText, MapPin, UserRound } from 'lucide-react'
import { api } from '@/api'
import { canAccessRoute } from '@/app/access'
import { EvidenceViewer } from '@/components/cases/evidence-viewer'
import { CaseTimeline } from '@/components/cases/case-timeline'
import { AlertTable } from '@/components/ops/alert-table'
import { LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, formatTime } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'

export function CaseDetailPage() {
  const { id = '' } = useParams()
  const { data: record, error, isLoading } = useAsyncData(() => api.getCase(id), [id])
  const { session } = useAuth()
  const [tab, setTab] = useState('overview')
  if (isLoading && !record) return <LoadingPanel lines={10} />
  if (error || !record)
    return (
      <div className="workspace-panel empty-state">
        <FileText size={30} />
        <strong>Case unavailable</strong>
        <p>{error ?? 'This case could not be found.'}</p>
        <Link className={buttonVariants({ variant: 'outline' })} to="/cases">
          Back to cases
        </Link>
      </div>
    )
  const evidence = record.evidence ?? []
  const alerts = record.alerts ?? []
  function exportCase() {
    if (record)
      downloadFile(
        `nova-${record.id}-brief.json`,
        JSON.stringify(
          {
            product: 'NOVA',
            workspace: 'Sample campus workspace',
            generatedAt: new Date().toISOString(),
            generatedBy: session?.name,
            case: record,
          },
          null,
          2,
        ),
        'application/json',
      )
  }
  return (
    <div className="space-y-5">
      <Link className="text-link" to="/cases">
        <ArrowLeft size={14} />
        All cases
      </Link>
      <div className="overview-heading">
        <div>
          <p className="page-kicker">{record.id.toUpperCase()}</p>
          <h1 className="case-detail-heading">{record.title}</h1>
          <p className="case-detail-location">
            <MapPin size={13} />
            {record.location}
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" onClick={exportCase}>
            <ArrowDownToLine size={15} />
            Download case brief
          </Button>
        </div>
      </div>
      <div className="case-detail-summary">
        <span
          className={`signal-badge signal-${record.priority === 'priority-1' ? 'critical' : record.priority === 'priority-2' ? 'high' : 'low'}`}
        >
          {record.priority.replace('priority-', 'Priority ')}
        </span>
        <span className={`case-status case-status-${record.status}`}>
          <i />
          {record.status}
        </span>
        <span>
          <UserRound size={13} />
          {record.leadAnalyst}
        </span>
        <span>
          <Camera size={13} />
          {evidence.length} snapshots
        </span>
        <span>
          Updated {formatShiftDate(record.updatedAt)} · {formatTime(record.updatedAt)} EAT
        </span>
      </div>
      <div className="filter-tabs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'evidence', label: `Evidence (${evidence.length})` },
          { id: 'alerts', label: `Linked alerts (${alerts.length})` },
        ].map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'selected' : ''}
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && (
        <div className="case-detail-layout">
          <section className="workspace-panel">
            <div className="panel-header">
              <h2>Investigation overview</h2>
            </div>
            <div className="case-overview-content">
              <h3>Situation</h3>
              <p>{record.summary}</p>
              <h3>Response protocol</h3>
              <p>{record.protocol}</p>
              <div className="case-dates">
                <div>
                  <span>Opened</span>
                  <strong>
                    {formatShiftDate(record.openedAt)} · {formatTime(record.openedAt)} EAT
                  </strong>
                </div>
                <div>
                  <span>Case lead</span>
                  <strong>{record.leadAnalyst}</strong>
                </div>
              </div>
              <div className="notice-panel">
                <UserRound size={16} />
                <p>
                  Validate the evidence with the response team before escalating this case. All evidence in
                  this workspace is sample snapshots and metadata.
                </p>
              </div>
              {session && canAccessRoute(session.role, 'search') && (
                <Link
                  className="text-link"
                  to={`/search?q=${encodeURIComponent(record.location.split('/')[0].trim())}`}
                >
                  Search related evidence
                  <ArrowLeft className="rotate-180" size={14} />
                </Link>
              )}
            </div>
          </section>
          <CaseTimeline events={record.timeline} />
        </div>
      )}
      {tab === 'evidence' && <EvidenceViewer snapshots={evidence} />}
      {tab === 'alerts' && (
        <AlertTable
          alerts={alerts}
          title="Linked incidents"
          description="Open an incident to review its source evidence and response status."
        />
      )}
    </div>
  )
}
