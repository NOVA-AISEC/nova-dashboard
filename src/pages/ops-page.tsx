import { useEffect, useMemo, useState } from 'react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  bottleneckSolutions,
  campusContextAreas,
  complianceNotices,
} from '@/data/mock-data'
import { useAsyncData } from '@/hooks/use-async-data'
import { formatDateTime, formatRelativeHours, titleCase } from '@/lib/formatters'
import { readShiftNotes, writeShiftNotes } from '@/lib/operator-storage'
import { exportShiftBrief } from '@/lib/shift-brief'
import { useAuth } from '@/lib/auth'
import type { SearchResults } from '@/types/domain'

function getMetrics(results: SearchResults) {
  const openAlerts = results.alerts.filter((alert) => alert.status !== 'closed')
  const humanValidations = [
    ...openAlerts.filter((alert) => alert.requiresHumanValidation).map((alert) => alert.id),
    ...results.cases.filter((caseItem) => caseItem.humanValidationRequired).map((caseItem) => caseItem.id),
  ]

  return [
    {
      label: 'Open alerts by zone',
      value: String(new Set(openAlerts.map((alert) => alert.zone)).size).padStart(2, '0'),
      delta: 'Zones currently under watch',
      tone: 'accent' as const,
    },
    {
      label: 'Peak zones today',
      value: String(openAlerts.filter((alert) => alert.severity === 'critical').length).padStart(2, '0'),
      delta: 'Critical pressure points',
      tone: 'warning' as const,
    },
    {
      label: 'Average triage time',
      value: '11m',
      delta: 'Mock campus baseline',
      tone: 'success' as const,
    },
    {
      label: 'Pending human validations',
      value: String(humanValidations.length).padStart(2, '0'),
      delta: 'Required before escalation',
      tone: 'ink' as const,
    },
  ]
}

function useOpsData() {
  return useAsyncData(() => api.search(''), [])
}

export function OpsPage() {
  const { session } = useAuth()
  const { data, error, isLoading } = useOpsData()
  const [shiftNotes, setShiftNotes] = useState(() => readShiftNotes())

  useEffect(() => {
    writeShiftNotes(shiftNotes)
  }, [shiftNotes])

  const openAlerts = useMemo(
    () => data?.alerts.filter((alert) => alert.status !== 'closed') ?? [],
    [data],
  )

  if (!session) {
    return null
  }

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LoadingPanel lines={4} />
        <section className="grid gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingPanel key={index} lines={3} />
          ))}
        </section>
        <LoadingPanel lines={10} />
      </div>
    )
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Operations data is unavailable.'} />
  }

  const metrics = getMetrics(data)
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
    .slice(0, 4)

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Campus Command Center"
        title="Ops Command"
        description="Run Strathmore-facing campus security operations across gates, hostels, library, parking, perimeter, and event flow. Work stays evidence-first with snapshots plus metadata only, biometrics disabled, and human validation required."
        actions={
          <>
            <Badge className="chip-compliance">Biometrics disabled</Badge>
            <Badge className="chip-compliance">Snapshots</Badge>
            <Badge className="chip-compliance">Metadata only</Badge>
            <Link className={buttonVariants({ variant: 'outline' })} to="/queue">
              Open live queue
            </Link>
            <Button
              onClick={() =>
                exportShiftBrief({
                  generatedBy: session.name,
                  notes: shiftNotes,
                  alerts: openAlerts,
                  cases: activeCases,
                })
              }
            >
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
        <Card className="overflow-hidden bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Campus context</CardTitle>
            <CardDescription>
              Surfaces currently reflected in the command center without exposing sensitive campus detail.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-3">
            {campusContextAreas.map((area) => (
              <div key={area.name} className="border border-surfaceMuted/20 bg-primaryDark p-4">
                <div className="font-display text-lg font-bold">{area.name}</div>
                <div className="mt-2 text-sm text-textSecondary">{area.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-command">
          <CardHeader className="surface-command-divider border-b">
            <CardTitle className="text-ink">Operational guardrails</CardTitle>
            <CardDescription className="surface-command-copy">
              Compliance posture for every campus workflow in this shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {complianceNotices.map((notice) => (
              <div key={notice} className="surface-command-row flex gap-3 border p-3">
                <ShieldBan className="mt-0.5 h-4 w-4 text-accentGlow" />
                <p className="surface-command-copy text-sm">{notice}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.95fr)]">
        <AlertTable
          alerts={openAlerts}
          title="Triage queue"
          description="Prioritized campus alerts for guard dispatch, incident desk review, lost & found, parking control, and perimeter patrol."
        />

        <div className="space-y-6">
          <Card className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <CardTitle>Active cases</CardTitle>
              <CardDescription>
                Cases with pending human validation, admin review, or supervisor escalation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {activeCases.map((caseItem) => (
                <div key={caseItem.id} className="space-y-3 border border-surfaceMuted/20 bg-primaryDark p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-[10px]">{caseItem.id}</p>
                      <h3 className="font-display text-lg font-bold">{caseItem.title}</h3>
                    </div>
                    <Badge className="badge-high">
                      {titleCase(caseItem.priority)}
                    </Badge>
                  </div>
                  <p className="text-sm text-textSecondary">{caseItem.summary}</p>
                  <div className="flex items-center justify-between text-sm text-textSecondary">
                    <span>{caseItem.location}</span>
                    <span>{formatRelativeHours(caseItem.updatedAt)}</span>
                  </div>
                  <Link className="brand-link" to={`/cases/${caseItem.id}`}>
                    Open workspace
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <CardTitle>Shift handover notes</CardTitle>
              <CardDescription>
                Save notes locally, then export a printable brief from the current queue and cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <Textarea
                value={shiftNotes}
                placeholder="Capture dispatch updates, unresolved library or hostel exceptions, parking bottlenecks, and who needs the next handoff."
                onChange={(event) => setShiftNotes(event.target.value)}
              />
              <div className="flex items-center justify-between gap-4 text-sm text-textSecondary">
                <span>Saved locally for this operator.</span>
                <span>{shiftNotes.trim() ? `${shiftNotes.trim().split(/\s+/).length} words` : 'No notes yet'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Campus safety posture snapshot</CardTitle>
            <CardDescription>
              Where alert density is highest right now and which surfaces are driving response load.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {zoneSummary.map(([zone, count]) => (
              <div key={zone} className="flex items-center justify-between gap-4 border border-surfaceMuted/20 bg-primaryDark p-4">
                <div className="space-y-1">
                  <div className="font-display text-lg font-bold">{zone}</div>
                  <div className="text-sm text-textSecondary">
                    {count} alert{count === 1 ? '' : 's'} currently open
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold">
                    {count === zoneSummary[0]?.[1] ? 'Peak' : `#${count}`}
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                    Zone load
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Bottlenecks solved</CardTitle>
            <CardDescription>
              How the product reduces campus security and operations friction during a live shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
            {bottleneckSolutions.map((item) => (
              <div key={item.title} className="border border-surfaceMuted/20 bg-primaryDark p-4">
                <div className="font-display text-lg font-bold">{item.title}</div>
                <div className="mt-2 text-sm text-textSecondary">{item.detail}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Open alerts by zone</CardTitle>
            <CardDescription>Useful for perimeter patrol, parking response, and event crowd control handoff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {zoneSummary.map(([zone, count]) => (
              <div key={zone} className="flex items-center justify-between border border-surfaceMuted/20 bg-primaryDark px-4 py-3">
                <span className="font-medium">{zone}</span>
                <Badge className="badge-panel">{count} open</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Latest analyst actions</CardTitle>
            <CardDescription>Recent case updates for the incident desk and supervisor handoff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {activeCases.map((caseItem) => (
              <div key={caseItem.id} className="flex flex-col gap-2 border border-surfaceMuted/20 bg-primaryDark p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="eyebrow text-[10px]">{caseItem.leadAnalyst}</p>
                  <div className="font-display text-lg font-bold">{caseItem.title}</div>
                  <div className="text-sm text-textSecondary">{caseItem.protocol}</div>
                </div>
                <div className="text-sm text-textSecondary">{formatDateTime(caseItem.updatedAt)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
