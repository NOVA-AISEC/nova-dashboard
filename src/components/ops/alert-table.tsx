import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, ArrowUpRight, ChevronRight, ShieldCheck } from 'lucide-react'
import { canAccessRoute } from '@/app/access'
import { AlertDetail } from '@/components/ops/alert-detail'
import { Button } from '@/components/ui/button'
import { useOperations } from '@/hooks/use-operations'
import { useAuth } from '@/lib/auth'
import { formatTime, severityOrder, statusLabels } from '@/lib/operations'
import { readOperatorPreferences } from '@/lib/operator-storage'
import type { Alert } from '@/types/domain'

interface AlertTableProps {
  alerts: Alert[]
  title?: string
  description?: string
  onAcknowledge?: (alert: Alert) => void
  busyAlertId?: string | null
  onReview?: (alert: Alert) => void
  compact?: boolean
  hideHeader?: boolean
}
export function AlertTable({
  alerts,
  title = 'Incident queue',
  description = 'Review incidents and coordinate the response.',
  onAcknowledge,
  busyAlertId,
  onReview,
  compact = false,
  hideHeader = false,
}: AlertTableProps) {
  const { session } = useAuth()
  const { data } = useOperations()
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [sort, setSort] = useState<'priority' | 'latest'>('priority')
  const sorted = [...alerts].sort((a, b) =>
    sort === 'priority'
      ? severityOrder[a.severity] - severityOrder[b.severity] || b.createdAt.localeCompare(a.createdAt)
      : b.createdAt.localeCompare(a.createdAt),
  )
  const review = (alert: Alert) => (onReview ? onReview(alert) : setSelectedAlert(alert))
  return (
    <div className={hideHeader ? 'incident-table-container' : 'workspace-panel incident-table-container'}>
      {!hideHeader && (
        <div className="panel-header">
          <div>
            <h2>
              {title} <span className="count-pill">{alerts.length}</span>
            </h2>
            <p>{description}</p>
          </div>
          <button
            className="quiet-button"
            onClick={() => setSort((value) => (value === 'priority' ? 'latest' : 'priority'))}
          >
            <ArrowUpDown size={14} />
            {sort === 'priority' ? 'Priority' : 'Latest'}
          </button>
        </div>
      )}
      <div className="table-scroll">
        <table
          className={`incident-table ${compact ? 'compact' : ''} ${readOperatorPreferences().compactTables ? 'dense' : ''}`}
        >
          <thead>
            <tr>
              <th>Incident</th>
              <th>Priority</th>
              <th>Status</th>
              {!compact && <th>Assigned team</th>}
              <th>
                Time <span className="muted">EAT</span>
              </th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((alert) => (
              <tr key={alert.id}>
                <td>
                  <button className="incident-title-button" onClick={() => review(alert)}>
                    {alert.title}
                  </button>
                  <span className="incident-location">
                    {alert.zone}
                    {!compact && <span> · {alert.cameraId}</span>}
                  </span>
                </td>
                <td>
                  <span className={`signal-badge signal-${alert.severity}`}>
                    <span />
                    {alert.severity}
                  </span>
                </td>
                <td>
                  <span className={`status-label status-${alert.status}`}>
                    <i />
                    {statusLabels[alert.status]}
                  </span>
                </td>
                {!compact && (
                  <td>
                    <span className="table-assignee">{alert.assignee}</span>
                  </td>
                )}
                <td className="table-time mono">{formatTime(alert.createdAt)}</td>
                <td>
                  <div className="table-actions">
                    {onAcknowledge && alert.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyAlertId === alert.id}
                        onClick={() => onAcknowledge(alert)}
                      >
                        {busyAlertId === alert.id ? 'Saving…' : 'Acknowledge'}
                      </Button>
                    )}
                    {!compact && session && canAccessRoute(session.role, 'cases') && (
                      <Link
                        className="icon-button"
                        to={`/cases/${alert.caseId}`}
                        aria-label={`Open case for ${alert.title}`}
                      >
                        <ArrowUpRight size={15} />
                      </Link>
                    )}
                    <button
                      className="icon-button"
                      aria-label={`Review ${alert.title}`}
                      onClick={() => review(alert)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!sorted.length && (
              <tr>
                <td colSpan={compact ? 5 : 6}>
                  <div className="empty-state">
                    <ShieldCheck size={28} />
                    <strong>No incidents here</strong>
                    <p>Try adjusting your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!onReview && (
        <AlertDetail
          alert={
            selectedAlert
              ? (data?.alerts.find((item) => item.id === selectedAlert.id) ?? selectedAlert)
              : null
          }
          evidence={data?.evidence}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  )
}
