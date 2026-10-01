import { Camera, FileText, ShieldAlert } from 'lucide-react'
import { formatShiftDate, formatTime } from '@/lib/operations'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import type { EngineSource } from '../../../shared/security-engine'

export function SourceReview({
  source,
  onClose,
}: {
  source: EngineSource | null
  onClose: () => void
}) {
  return (
    <WorkspaceDialog
      open={!!source}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title="Source record"
      description="The recorded information used by this assessment."
    >
      {source && (
        <div className="drawer-body">
          <span className="os-source-kind">
            {source.kind === 'evidence' ? (
              <Camera size={15} />
            ) : source.kind === 'case' ? (
              <FileText size={15} />
            ) : (
              <ShieldAlert size={15} />
            )}
            {source.kind} · {source.id}
          </span>
          <h2>{source.title}</h2>
          <p>{source.detail}</p>
          <dl className="os-source-facts">
            <div>
              <dt>Location</dt>
              <dd>{source.location}</dd>
            </div>
            {source.cameraId && (
              <div>
                <dt>Camera</dt>
                <dd>{source.cameraId}</dd>
              </div>
            )}
            <div>
              <dt>Recorded</dt>
              <dd>
                {formatShiftDate(source.recordedAt)} · {formatTime(source.recordedAt)} EAT
              </dd>
            </div>
          </dl>
          <p className="notice-panel">
            This is a stored source snapshot. Confirm current conditions separately.
          </p>
        </div>
      )}
    </WorkspaceDialog>
  )
}
