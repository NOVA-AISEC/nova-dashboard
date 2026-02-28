import { campusEvents } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'

export function EventsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Campus Scheduling"
        title="Events"
        description="Watch crowd surges and scheduled activity that can change triage load, parking pressure, or perimeter patrol priority."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {campusEvents.map((eventItem) => (
          <Card key={eventItem.id} className="bg-panel">
            <CardHeader className="border-b border-border">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle>{eventItem.title}</CardTitle>
                  <Badge className="border-border bg-background text-foreground">{eventItem.status}</Badge>
                </div>
                <CardDescription>{eventItem.zone}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="text-sm text-muted-foreground">{eventItem.detail}</div>
              <div className="flex items-center justify-between gap-3">
                <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">{eventItem.crowdLevel} crowd</Badge>
                <div className="text-sm text-muted-foreground">{formatDateTime(eventItem.startsAt)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
