import {
  AlertTriangle,
  BellRing,
  ClipboardPenLine,
  FolderCheck,
  PackageCheck,
  ShieldAlert,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'
import type { CaseTimelineEvent, TimelineEventKind } from '@/types/domain'

interface CaseTimelineProps {
  events: CaseTimelineEvent[]
}

const timelineIcons: Record<TimelineEventKind, typeof BellRing> = {
  alert: BellRing,
  triage: ClipboardPenLine,
  evidence: PackageCheck,
  note: FolderCheck,
  handoff: ShieldAlert,
  closure: AlertTriangle,
}

export function CaseTimeline({ events }: CaseTimelineProps) {
  return (
    <Card className="bg-primaryDeep">
      <CardHeader className="border-b border-surfaceMuted/20">
        <CardTitle>Case timeline</CardTitle>
        <CardDescription>
          Review decisions, evidence seals, and analyst handoffs in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {events.map((event, index) => {
          const Icon = timelineIcons[event.kind]

          return (
            <div key={event.id} className="relative flex gap-4 pl-1">
              {index < events.length - 1 ? (
                <div className="absolute left-[1.125rem] top-10 h-[calc(100%-1rem)] w-px bg-surfaceMuted/20" />
              ) : null}
              <div className="relative z-10 flex h-9 w-9 items-center justify-center border border-surfaceMuted bg-primaryDark">
                <Icon className="h-4 w-4" />
              </div>
              <div className="space-y-1 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold">{event.title}</h3>
                  <span className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                    {formatDateTime(event.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-textSecondary">{event.detail}</p>
                <p className="eyebrow text-[10px]">{event.operator}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
