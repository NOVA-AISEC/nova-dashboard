import { Link } from 'react-router-dom'
import { ArrowUpRight, Download, ShieldBan } from 'lucide-react'
import { AlertTable } from '@/components/ops/alert-table'
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
import { alerts, cases, complianceNotices, opsMetrics } from '@/data/mock-data'
import { formatDateTime, formatRelativeHours, titleCase } from '@/lib/formatters'

export function OpsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Live command"
        title="NOVA Sentinel shift board"
        description="Monitor alert pressure, active cases, and evidence compliance from a single command surface. Every action on this dashboard is grounded in snapshots and metadata only."
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
        {opsMetrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,1fr)]">
        <AlertTable
          alerts={alerts.filter((alert) => alert.status !== 'closed')}
          title="Priority queue"
          description="Triage the highest-risk items currently open across perimeter, gate, and dock surfaces."
        />

        <div className="space-y-6">
          <Card className="bg-panel">
            <CardHeader className="border-b border-border">
              <CardTitle>Active cases</CardTitle>
              <CardDescription>
                Cases with evidence bundles already sealed for analyst review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              {cases.map((caseItem) => (
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

          <Card className="bg-[#1e1c19] text-[#f5f3ef]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-[#f5f3ef]">Operational guardrails</CardTitle>
              <CardDescription className="text-[#d6cfc1]">
                Policy state for the current shift.
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
              Key surfaces reporting elevated event density this shift.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {[
              ['Dock 7 Corridor', 'Rule collisions + manifest drift'],
              ['North Perimeter', 'Thermal exclusion events'],
              ['South Gate', 'Vehicle dwell and screening lag'],
            ].map(([zone, detail]) => (
              <div
                key={zone}
                className="flex items-center justify-between gap-4 border border-border bg-background p-4"
              >
                <div className="space-y-1">
                  <div className="font-display text-lg font-bold">{zone}</div>
                  <div className="text-sm text-muted-foreground">{detail}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold">+12%</div>
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
              Timestamped handoffs from the active shift roster.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {cases.map((caseItem) => (
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
