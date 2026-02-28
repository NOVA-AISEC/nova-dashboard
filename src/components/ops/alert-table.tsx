import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Alert, AlertSeverity, AlertStatus } from '@/types/domain'

interface AlertTableProps {
  alerts: Alert[]
  title?: string
  description?: string
  onAcknowledge?: (alert: Alert) => void
  busyAlertId?: string | null
}

const severityClasses: Record<AlertSeverity, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
}

const statusClasses: Record<AlertStatus, string> = {
  new: 'badge-status-info',
  acknowledged: 'badge-status-muted',
  triaging: 'badge-high',
  contained: 'badge-status-success',
  closed: 'badge-neutral',
}

export function AlertTable({
  alerts,
  title = 'Alert queue',
  description = 'Prioritized detections backed by snapshots and chain-of-custody metadata.',
  onAcknowledge,
  busyAlertId,
}: AlertTableProps) {
  return (
    <Card className="overflow-hidden bg-panel">
      <CardHeader className="border-b border-border">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Alert</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
                <th className="px-4 py-3 font-semibold">Evidence</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold">Case</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, index) => (
                <tr
                  key={alert.id}
                  className={cn(
                    'border-t border-border align-top',
                    index % 2 === 0 ? 'bg-background/45' : 'bg-transparent',
                  )}
                >
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-base font-bold tracking-[-0.02em]">
                          {alert.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{alert.id}</span>
                      </div>
                      <p className="max-w-lg text-muted-foreground">{alert.summary}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {alert.rule}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className="badge-neutral">
                      {alert.category.replaceAll('-', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={cn(severityClasses[alert.severity])}>
                      {alert.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={cn(statusClasses[alert.status])}>
                      {alert.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <div>{alert.zone}</div>
                    <div className="text-xs uppercase tracking-[0.18em]">{alert.cameraId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {alert.evidenceIds.length} snapshot
                    {alert.evidenceIds.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <div>{formatDateTime(alert.updatedAt)}</div>
                    <div className="text-xs uppercase tracking-[0.18em]">
                      {alert.assignee}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      className="brand-link underline decoration-brand-gold/35 underline-offset-4"
                      to={`/cases/${alert.caseId}`}
                    >
                      Open case
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    {onAcknowledge ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          busyAlertId === alert.id ||
                          alert.status === 'acknowledged' ||
                          alert.status === 'closed'
                        }
                        onClick={() => onAcknowledge(alert)}
                      >
                        {busyAlertId === alert.id ? 'Saving...' : 'Acknowledge'}
                      </Button>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Human review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!alerts.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-muted-foreground" colSpan={9}>
                    No alerts match the current filter set.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
