import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ShieldBan } from 'lucide-react'
import { api } from '@/api'
import { CaseTimeline } from '@/components/cases/case-timeline'
import { EvidenceViewer } from '@/components/cases/evidence-viewer'
import { AlertTable } from '@/components/ops/alert-table'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { MetricCard } from '@/components/shared/metric-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { formatLongDateTime, titleCase } from '@/lib/formatters'

export function CaseDetailPage() {
  const { id = '' } = useParams()
  const { data: caseRecord, error, isLoading } = useAsyncData(() => api.getCase(id), [id])

  if (isLoading && !caseRecord) {
    return (
      <div className="space-y-6">
        <LoadingPanel lines={4} />
        <section className="grid gap-4 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingPanel key={index} lines={3} />
          ))}
        </section>
        <LoadingPanel lines={10} />
      </div>
    )
  }

  if (error || !caseRecord) {
    return (
      <Card className="bg-panel">
        <CardHeader>
          <CardTitle>Case not found</CardTitle>
          <CardDescription>
            {error ?? 'The requested case workspace is unavailable or was archived.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonVariants({ variant: 'outline' })} to="/ops">
            Return to operations
          </Link>
        </CardContent>
      </Card>
    )
  }

  const caseEvidence = caseRecord.evidence ?? []
  const caseAlerts = caseRecord.alerts ?? []

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={caseRecord.id}
        title={caseRecord.title}
        description={caseRecord.summary}
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/alerts">
              <ArrowLeft className="h-4 w-4" />
              Back to queue
            </Link>
            <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">
              {titleCase(caseRecord.priority)}
            </Badge>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard
          label="Status"
          value={caseRecord.status.toUpperCase()}
          delta={`Updated ${formatLongDateTime(caseRecord.updatedAt)}`}
          tone="accent"
        />
        <MetricCard
          label="Linked alerts"
          value={String(caseAlerts.length).padStart(2, '0')}
          delta={caseRecord.location}
          tone="warning"
        />
        <MetricCard
          label="Evidence snapshots"
          value={String(caseEvidence.length).padStart(2, '0')}
          delta="Snapshots + metadata only"
          tone="success"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <Card className="bg-panel">
          <CardHeader className="border-b border-border">
            <CardTitle>Case overview</CardTitle>
            <CardDescription>
              Response summary and review protocol for this campus incident workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
            <div className="space-y-4 border border-border bg-background p-4">
              <div className="space-y-1">
                <p className="eyebrow text-[10px]">Lead analyst</p>
                <p className="font-display text-xl font-bold">{caseRecord.leadAnalyst}</p>
              </div>
              <div className="space-y-1">
                <p className="eyebrow text-[10px]">Opened</p>
                <p className="text-sm">{formatLongDateTime(caseRecord.openedAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="eyebrow text-[10px]">Updated</p>
                <p className="text-sm">{formatLongDateTime(caseRecord.updatedAt)}</p>
              </div>
            </div>

            <div className="space-y-4 border border-border bg-background p-4">
              <div className="space-y-1">
                <p className="eyebrow text-[10px]">Protocol</p>
                <p className="text-sm text-muted-foreground">{caseRecord.protocol}</p>
              </div>
              <div className="flex gap-3 border border-dashed border-accent bg-[#f8ece6] p-3 text-sm text-[#7d381f]">
                <ShieldBan className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Evidence review is limited to snapshots and metadata. Biometrics are
                  disabled and human validation remains mandatory.
                </span>
              </div>
              <Link
                className="inline-flex items-center gap-2 font-semibold text-accent"
                to="/search"
              >
                Continue in snapshot search
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {caseRecord.timeline.length ? (
          <CaseTimeline events={caseRecord.timeline} />
        ) : (
          <ErrorPanel title="Timeline unavailable" message="No timeline events were found." />
        )}
      </section>

      <EvidenceViewer snapshots={caseEvidence} />

      <AlertTable
        alerts={caseAlerts}
        title="Linked alerts"
        description="Underlying detections attached to this case file."
      />
    </div>
  )
}
