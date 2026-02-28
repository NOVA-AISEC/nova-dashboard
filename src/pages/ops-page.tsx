import { Link } from 'react-router-dom'
import { ArrowUpRight, Download, ShieldBan } from 'lucide-react'
import { api } from '@/api'
import { AlertTable } from '@/components/ops/alert-table'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { MetricCard } from '@/components/shared/metric-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { complianceNotices } from '@/lib/compliance'
import { formatDateTime, formatRelativeHours, titleCase } from '@/lib/formatters'
import type { SearchResults } from '@/types/domain'

function getMetrics(results: SearchResults) {
  const openAlerts = results.alerts.filter((alert) => alert.status !== 'closed')
  const activeCases = results.cases.filter((caseItem) => caseItem.status !== 'closed')

  return [
    {
      label: 'Open alert load',
      value: String(openAlerts.length).padStart(2, '0'),
      delta: `${openAlerts.filter((alert) => alert.severity === 'critical').length} critical`,
      tone: 'accent' as const,
    },
    {
      label: 'Evidence bundles sealed',
      value: String(results.evidence.length).padStart(2, '0'),
      delta: 'Snapshots + metadata only',
      tone: 'success' as const,
    },
    {
      label: 'Active cases',
      value: String(activeCases.length).padStart(2, '0'),
      delta: 'Human validation required',
      tone: 'warning' as const,
    },
    {
      label: 'Biometric actions',
      value: '00',
      delta: 'Disabled by policy',
      tone: 'ink' as const,
    },
  ]
}

function useOpsData() {
  return useAsyncData(() => api.search(''), [])
}

export function OpsPage() {
  const { data, error, isLoading } = useOpsData()

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LoadingPanel lines={4} />
        <section className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingPanel key={index} lines={3} />
          ))}
        </section>
        <LoadingPanel lines={8} />
      </div>
    )
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Operations data is unavailable.'} />
  }

  const metrics = getMetrics(data)
  const openAlerts = data.alerts.filter((alert) => alert.status !== 'closed')
  const activeCases = [...data.cases].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )
  const zoneSummary = Object.entries(
    openAlerts.reduce<Record<string, number>>((accumulator, alert) => {
      accumulator[alert.zone] = (accumulator[alert.zone] ?? 0) + 1
      return accumulator
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Live command"
        title="DAMA LTD shift board"
        description="Monitor alert pressure, active cases, and evidence compliance from a single command surface. Every workflow is constrained to snapshots plus metadata with biometrics disabled and human validation required."
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/alerts">
              Review queue
            </Link>
            <Button>
              <Download className="h-4 w-4" />
              Export shift brief
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]">
        <AlertTable
          alerts={openAlerts}
          title="Priority queue"
          description="Triage the highest-risk items currently open across perimeter, gate, and dock surfaces."
        />

        <div className="space-y-6">
          <Card className="bg-panel">
            <CardHeader className="border-b border-border">
              <CardTitle>Active cases</CardTitle>
              <CardDescription>
                Cases with sealed evidence bundles and pending human validation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {activeCases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className="space-y-3 border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-[10px]">{caseItem.id}</p>
                      <h3 className="font-display text-lg font-bold">{caseItem.title}</h3>
                    </div>
                    <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">
                      {titleCase(caseItem.priority)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{caseItem.summary}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{caseItem.location}</span>
                    <span>{formatRelativeHours(caseItem.updatedAt)}</span>
                  </div>
                  <Link
                    className="inline-flex items-center gap-2 font-semibold text-accent"
                    to={`/cases/${caseItem.id}`}
                  >
                    Open workspace
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#1d1c19] text-[#f5f3ef]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-[#f5f3ef]">Operational guardrails</CardTitle>
              <CardDescription className="text-[#d6cfc1]">
                Active DAMA LTD compliance posture for the current shift.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {complianceNotices.map((notice) => (
                <div key={notice} className="flex gap-3 border border-white/10 p-3">
                  <ShieldBan className="mt-0.5 h-4 w-4 text-accent" />
                  <p className="text-sm text-[#e7dfd2]">{notice}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="bg-panel">
          <CardHeader className="border-b border-border">
            <CardTitle>Sensor posture</CardTitle>
            <CardDescription>
              Surfaces with the highest live alert density in the local simulator feed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {zoneSummary.map(([zone, count]) => (
              <div
                key={zone}
                className="flex items-center justify-between gap-4 border border-border bg-background p-4"
              >
                <div className="space-y-1">
                  <div className="font-display text-lg font-bold">{zone}</div>
                  <div className="text-sm text-muted-foreground">
                    {count} alert{count === 1 ? '' : 's'} currently open
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold">
                    +{count * 4}%
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Event density
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-panel">
          <CardHeader className="border-b border-border">
            <CardTitle>Latest analyst actions</CardTitle>
            <CardDescription>
              Case owners with the most recent evidence-backed updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {activeCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className="flex flex-col gap-2 border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="eyebrow text-[10px]">{caseItem.leadAnalyst}</p>
                  <div className="font-display text-lg font-bold">{caseItem.title}</div>
                  <div className="text-sm text-muted-foreground">{caseItem.protocol}</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDateTime(caseItem.updatedAt)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
