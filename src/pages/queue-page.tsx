import { Link } from 'react-router-dom'
import { Radio, Users } from 'lucide-react'
import { api } from '@/api'
import { AlertTable } from '@/components/ops/alert-table'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { MetricCard } from '@/components/shared/metric-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { formatDateTime } from '@/lib/formatters'

export function QueuePage() {
  const { data, error, isLoading } = useAsyncData(() => api.search(''), [])

  if (isLoading && !data) {
    return <LoadingPanel lines={8} />
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Live queue is unavailable.'} />
  }

  const openAlerts = data.alerts.filter((alert) => alert.status !== 'closed')
  const pendingDispatch = openAlerts.filter((alert) => alert.status === 'new')
  const pendingValidation = openAlerts.filter((alert) => alert.requiresHumanValidation)
  const latestCases = [...data.cases].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 3)

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Guard Dispatch"
        title="Live Queue"
        description="Run the campus triage queue with dispatch context, incident desk ownership, and human-validation checkpoints."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Open queue" value={String(openAlerts.length).padStart(2, '0')} delta="Active triage items" tone="accent" />
        <MetricCard label="Pending dispatch" value={String(pendingDispatch.length).padStart(2, '0')} delta="Awaiting radio assignment" tone="warning" />
        <MetricCard label="Human validations" value={String(pendingValidation.length).padStart(2, '0')} delta="Cannot auto-escalate" tone="success" />
        <MetricCard label="Resolved this shift" value="03" delta="Contained or redirected" tone="ink" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.9fr)]">
        <AlertTable
          alerts={openAlerts}
          title="Dispatch-ready queue"
          description="Highest-pressure items across gates, hostels, perimeter, and crowd control."
        />

        <div className="space-y-6">
          <Card className="bg-panel">
            <CardHeader className="border-b border-border">
              <CardTitle>Dispatch board</CardTitle>
              <CardDescription>Current desk assignments and next recommended action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {openAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="space-y-2 border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-display text-lg font-bold">{alert.zone}</div>
                    <Badge className="border-border bg-panel text-foreground">{alert.assignee}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.summary}</p>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{alert.category.replaceAll('-', ' ')}</span>
                    <span>{formatDateTime(alert.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[#1d1c19] text-[#f5f3ef]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-[#f5f3ef]">Incident desk watch</CardTitle>
              <CardDescription className="text-[#d6cfc1]">
                Cases needing the next supervisor or admin decision.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {latestCases.map((caseItem) => (
                <Link key={caseItem.id} to={`/cases/${caseItem.id}`} className="flex items-start gap-3 border border-white/10 p-4 transition-colors hover:bg-white/5">
                  <Users className="mt-0.5 h-4 w-4 text-accent" />
                  <div className="space-y-1">
                    <div className="font-display text-lg font-bold">{caseItem.title}</div>
                    <div className="text-sm text-[#d6cfc1]">{caseItem.location}</div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55">
                      <Radio className="h-3.5 w-3.5" />
                      <span>{caseItem.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
