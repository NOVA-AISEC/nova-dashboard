import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ShieldBan } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatLongDateTime } from '@/lib/formatters'
import type { Evidence } from '@/types/domain'

interface EvidenceViewerProps {
  snapshots: Evidence[]
}

export function EvidenceViewer({ snapshots }: EvidenceViewerProps) {
  const [selectedId, setSelectedId] = useState(snapshots[0]?.id ?? '')
  const resolvedSelectedId = snapshots.find((snapshot) => snapshot.id === selectedId)
    ? selectedId
    : snapshots[0]?.id ?? ''
  const selected =
    snapshots.find((snapshot) => snapshot.id === resolvedSelectedId) ?? snapshots[0]

  if (!selected) {
    return (
      <Card className="bg-primaryDeep">
        <CardHeader>
          <CardTitle>Evidence viewer</CardTitle>
          <CardDescription>No evidence linked to this case.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-primaryDeep">
      <CardHeader className="border-b border-surfaceMuted/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Evidence Viewer</p>
            <CardTitle className="text-2xl">{selected.title}</CardTitle>
            <CardDescription>{selected.summary}</CardDescription>
          </div>
          <Badge className="badge-compliance">
            <ShieldBan className="h-3.5 w-3.5" />
            biometric identification disabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.5fr)_22rem]">
        <div className="space-y-4">
          <div className="relative aspect-[16/9] overflow-hidden border border-surfaceMuted/20 bg-primaryDark">
            <img
              alt={selected.title}
              className="h-full w-full object-cover"
              src={selected.snapshotUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primaryDark via-primaryDeep to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-surfaceMuted/20 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-surfaceMuted">
              <span>{selected.metadata.cameraId}</span>
              <span>{selected.metadata.zone}</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-surfaceMuted/20 bg-primaryDark/85 p-4 text-surfaceLight">
              <div className="flex flex-wrap gap-2">
                {selected.metadata.classes.map((tag) => (
                  <span
                    key={tag}
                    className="border border-surfaceMuted/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-surfaceMuted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="max-w-2xl text-sm text-surfaceMuted">{selected.analyticsSummary}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                className={`group border p-0 text-left transition-colors ${
                  snapshot.id === selected.id
                    ? 'snapshot-thumb-active'
                    : 'snapshot-thumb'
                }`}
                onClick={() => setSelectedId(snapshot.id)}
                type="button"
              >
                  <img
                    alt={snapshot.title}
                    className="h-24 w-full object-cover"
                    src={snapshot.snapshotUrl}
                  />
                  <div className="space-y-1 p-3">
                    <div className="font-display text-sm font-bold">{snapshot.title}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                      {snapshot.metadata.cameraId}
                    </div>
                  </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 border border-surfaceMuted/20 bg-primaryDark p-4">
          <div className="space-y-1">
            <p className="eyebrow text-[10px]">Snapshot metadata</p>
            <p className="text-sm text-textSecondary">
              {formatLongDateTime(selected.metadata.ts)}
            </p>
          </div>

          <dl className="space-y-4 text-sm">
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Camera / zone</dt>
              <dd>
                {selected.metadata.cameraId} / {selected.metadata.zone}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Retention</dt>
              <dd>{selected.retention}</dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Chain of custody</dt>
              <dd>{selected.chainOfCustody}</dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Redactions</dt>
              <dd>{selected.redactions}</dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Detections</dt>
              <dd>
                {selected.metadata.classes.join(', ')} at{' '}
                {Math.round(selected.metadata.confidence * 100)}% confidence
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Linked case</dt>
              <dd>
                <Link
                  className="brand-link"
                  to={`/cases/${selected.relatedCaseId}`}
                >
                  {selected.relatedCaseId}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="eyebrow text-[10px]">Compliance</dt>
              <dd>
                Biometrics disabled: {String(selected.metadata.biometricsDisabled)}. Human
                validation required: {String(selected.metadata.humanValidationRequired)}.
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
