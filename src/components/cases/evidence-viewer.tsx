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
import type { EvidenceSnapshot, SnapshotPalette } from '@/types/domain'

interface EvidenceViewerProps {
  snapshots: EvidenceSnapshot[]
}

const paletteClasses: Record<SnapshotPalette, string> = {
  amber: 'from-[#8a4a28] via-[#33241d] to-[#171717]',
  teal: 'from-[#4e7567] via-[#243630] to-[#171717]',
  slate: 'from-[#5f6774] via-[#2c2e35] to-[#171717]',
  crimson: 'from-[#8f3d3d] via-[#331f22] to-[#171717]',
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
      <Card className="bg-panel">
        <CardHeader>
          <CardTitle>Evidence viewer</CardTitle>
          <CardDescription>No evidence linked to this case.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-panel">
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Evidence Viewer</p>
            <CardTitle className="text-2xl">{selected.title}</CardTitle>
            <CardDescription>{selected.summary}</CardDescription>
          </div>
          <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">
            <ShieldBan className="h-3.5 w-3.5" />
            biometric identification disabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.5fr)_22rem]">
        <div className="space-y-4">
          <div
            className={`panel-grid relative aspect-[16/9] overflow-hidden border border-border bg-gradient-to-br ${paletteClasses[selected.palette]}`}
          >
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/15 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/70">
              <span>{selected.cameraId}</span>
              <span>{selected.location}</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-white/15 bg-black/35 p-4 text-white">
              <div className="flex flex-wrap gap-2">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-white/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="max-w-2xl text-sm text-white/80">{selected.analyticsSummary}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {snapshots.map((snapshot) => (
              <button
                key={snapshot.id}
                className={`group border p-0 text-left transition-colors ${
                  snapshot.id === selected.id
                    ? 'border-accent bg-[#f8ece6]'
                    : 'border-border bg-background hover:border-foreground'
                }`}
                onClick={() => setSelectedId(snapshot.id)}
                type="button"
              >
                <div
                  className={`h-24 bg-gradient-to-br ${paletteClasses[snapshot.palette]}`}
                />
                <div className="space-y-1 p-3">
                  <div className="font-display text-sm font-bold">{snapshot.title}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {snapshot.cameraId}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 border border-border bg-background p-4">
          <div className="space-y-1">
            <p className="eyebrow text-[10px]">Snapshot metadata</p>
            <p className="text-sm text-muted-foreground">
              {formatLongDateTime(selected.capturedAt)}
            </p>
          </div>

          <dl className="space-y-4 text-sm">
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
              <dt className="eyebrow text-[10px]">Linked case</dt>
              <dd>
                <Link
                  className="inline-flex items-center gap-2 font-semibold text-accent"
                  to={`/cases/${selected.relatedCaseId}`}
                >
                  {selected.relatedCaseId}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}
