import { campusZones } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'

export function ZonesPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Campus Coverage"
        title="Zones & Cameras"
        description="See which campus areas are healthy, on watch, or in maintenance before a dispatch or export decision is made."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {campusZones.map((zone) => (
          <Card key={zone.id} className="bg-panel">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{zone.name}</CardTitle>
                  <CardDescription>{zone.cameraId}</CardDescription>
                </div>
                <Badge className="border-border bg-background text-foreground">{zone.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="text-sm text-muted-foreground">{zone.coverage}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-border bg-background p-3">
                  <div className="eyebrow text-[10px]">Open alerts</div>
                  <div className="mt-1 font-display text-2xl font-bold">{zone.alertCount}</div>
                </div>
                <div className="border border-border bg-background p-3">
                  <div className="eyebrow text-[10px]">Last checked</div>
                  <div className="mt-1 text-sm">{formatDateTime(zone.lastCheckedAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
