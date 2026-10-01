import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Camera,
  Check,
  CircleAlert,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { api } from '@/api'
import { canAccessRoute } from '@/app/access'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button-variants'
import { useAuth } from '@/lib/auth'
import {
  formatShiftDate,
  formatTime,
  notifyOperationsChanged,
  statusLabels,
} from '@/lib/operations'
import type { Alert, Evidence } from '@/types/domain'

export function AlertDetail({
  alert,
  evidence = [],
  onClose,
}: {
  alert: Alert | null
  evidence?: Evidence[]
  onClose: () => void
}) {
  const { session } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [acknowledgedId, setAcknowledgedId] = useState('')
  async function acknowledge() {
    if (!alert || alert.status !== 'new') return
    setBusy(true)
    setError('')
    try {
      await api.ackAlert(alert.id)
      setAcknowledgedId(alert.id)
      notifyOperationsChanged()
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to acknowledge this alert. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }
  const snapshots = evidence.filter((item) => alert?.evidenceIds.includes(item.id))
  const acknowledged = alert?.status === 'acknowledged' || acknowledgedId === alert?.id
  return (
    <WorkspaceDialog
      open={!!alert}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setError('')
        }
      }}
      title="Incident review"
      description="Review the evidence and confirm ownership."
      drawer
    >
      {alert && (
        <div className="drawer-body">
          <div className="flex items-center justify-between gap-3">
            <span className={`signal-badge signal-${alert.severity}`}>
              <span />
              {alert.severity}
            </span>
            <span className="mono muted">{alert.id.toUpperCase()}</span>
          </div>
          <h2 className="incident-detail-title">{alert.title}</h2>
          <Link
            className="text-link"
            to={`/command?incident=${encodeURIComponent(alert.id)}`}
            onClick={onClose}
          >
            Assess in Command <ArrowUpRight size={14} />
          </Link>
          <p className="muted leading-relaxed">{alert.summary}</p>
          <div className="incident-facts">
            <div>
              <MapPin size={16} />
              <span>Location</span>
              <strong>{alert.zone}</strong>
            </div>
            <div>
              <Camera size={16} />
              <span>Camera</span>
              <strong>{alert.cameraId}</strong>
            </div>
            <div>
              <UserRound size={16} />
              <span>Assigned team</span>
              <strong>{alert.assignee}</strong>
            </div>
            <div>
              <CircleAlert size={16} />
              <span>Status</span>
              <strong>{acknowledged ? 'Acknowledged' : statusLabels[alert.status]}</strong>
            </div>
          </div>
          <div className="section-label">
            Evidence snapshots <span>{snapshots.length}</span>
          </div>
          {snapshots.length ? (
            snapshots.map((item) => (
              <figure className="review-snapshot" key={item.id}>
                <img src={item.snapshotUrl} alt={item.title} />
                <figcaption>
                  <Camera size={14} />
                  {item.metadata.cameraId}
                  <span>{formatTime(item.metadata.ts)} EAT</span>
                </figcaption>
              </figure>
            ))
          ) : (
            <div className="empty-state">No snapshots linked to this incident.</div>
          )}
          <div className="notice-panel">
            <ShieldCheck size={18} />
            <p>
              Confirm the situation with the assigned team. Acknowledgement records ownership; human
              validation is still required before escalation.
            </p>
          </div>
          <div className="drawer-rule">
            <span className="muted">Detection rule</span>
            <p>{alert.rule}</p>
            <small className="muted">
              Recorded {formatShiftDate(alert.createdAt)} at {formatTime(alert.createdAt)} EAT
            </small>
          </div>
          {error && (
            <p role="alert" className="action-error">
              {error}
            </p>
          )}
          {acknowledged && (
            <p role="status" className="action-success">
              <Check size={16} />
              This incident has been acknowledged.
            </p>
          )}
          <div className="drawer-actions">
            {alert.status === 'new' &&
              !acknowledged &&
              session &&
              ['guard', 'supervisor', 'admin'].includes(session.role) && (
                <Button onClick={() => void acknowledge()} disabled={busy}>
                  <Check size={16} />
                  {busy ? 'Acknowledging…' : 'Acknowledge incident'}
                </Button>
              )}
            {session && canAccessRoute(session.role, 'cases') && (
              <Link
                to={`/cases/${alert.caseId}`}
                className={buttonVariants({ variant: 'outline' })}
                onClick={onClose}
              >
                Open case file
                <ArrowUpRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}
    </WorkspaceDialog>
  )
}
