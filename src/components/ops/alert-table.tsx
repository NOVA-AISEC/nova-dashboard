import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { ActionButton } from '@/components/shared/action-button'
import { SeverityBadge } from '@/components/shared/severity-badge'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getAlertAccentClassName } from '@/lib/alert-accent'
import { getAlertSeverityTone, getAlertStatusTone } from '@/lib/action-gradient'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types/domain'

interface AlertTableProps {
  alerts: Alert[]
  title?: string
  description?: string
  onAcknowledge?: (alert: Alert) => void
  busyAlertId?: string | null
}

export function AlertTable({
  alerts,
  title = 'Alert queue',
  description = 'Prioritized detections backed by snapshots and chain-of-custody metadata.',
  onAcknowledge,
  busyAlertId,
}: AlertTableProps) {
  return (
    <Card className="overflow-hidden bg-primaryDeep">
      <CardHeader className="border-b border-surfaceMuted/20">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-primaryDark/95 backdrop-blur">
              <tr className="text-[11px] uppercase tracking-[0.22em] text-textSecondary">
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
                    'border-t border-surfaceMuted/20 align-top',
                    index % 2 === 0 ? 'bg-primaryDark/45' : 'bg-transparent',
                    getAlertAccentClassName(getAlertSeverityTone(alert.severity)),
                  )}
                >
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'font-display text-base font-bold tracking-[-0.02em]',
                            alert.severity === 'critical' && 'alert-title-critical',
                            alert.severity === 'high' && 'alert-title-high',
                          )}
                        >
                          {alert.title}
                        </span>
                        <span className="text-xs text-textSecondary">{alert.id}</span>
                      </div>
                      <p className="max-w-lg text-textSecondary">{alert.summary}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-textSecondary">
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
                    <SeverityBadge tone={getAlertSeverityTone(alert.severity)}>
                      {alert.severity}
                    </SeverityBadge>
                  </td>
                  <td className="px-4 py-3.5">
                    <SeverityBadge tone={getAlertStatusTone(alert.status)}>
                      {alert.status}
                    </SeverityBadge>
                  </td>
                  <td className="px-4 py-3.5 text-textSecondary">
                    <div>{alert.zone}</div>
                    <div className="text-xs uppercase tracking-[0.18em]">{alert.cameraId}</div>
                  </td>
                  <td className="px-4 py-3.5 text-textSecondary">
                    {alert.evidenceIds.length} snapshot
                    {alert.evidenceIds.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3.5 text-textSecondary">
                    <div>{formatDateTime(alert.updatedAt)}</div>
                    <div className="text-xs uppercase tracking-[0.18em]">
                      {alert.assignee}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      className="brand-link underline"
                      to={`/cases/${alert.caseId}`}
                    >
                      Open case
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    {onAcknowledge ? (
                      <ActionButton
                        intent="action"
                        loading={busyAlertId === alert.id}
                        size="sm"
                        disabled={
                          alert.status === 'acknowledged' ||
                          alert.status === 'closed'
                        }
                        onClick={() => onAcknowledge(alert)}
                      >
                        {busyAlertId === alert.id ? 'Saving...' : 'Acknowledge'}
                      </ActionButton>
                    ) : (
                      <span className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                        Human review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {!alerts.length ? (
                <tr>
                  <td className="px-5 py-10 text-center text-textSecondary" colSpan={9}>
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
