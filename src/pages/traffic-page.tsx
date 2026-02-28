import { trafficAdvisories } from '@/data/mock-data'
import { MetricCard } from '@/components/shared/metric-card'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'

export function TrafficPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Mobility Control"
        title="Parking / Traffic"
        description="Track parking lane pressure, event crossover, and gate release timing to keep campus flow moving."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCard label="Action zones" value={String(trafficAdvisories.filter((item) => item.status === 'action').length).padStart(2, '0')} delta="Immediate field coordination" tone="warning" />
        <MetricCard label="Watch zones" value={String(trafficAdvisories.filter((item) => item.status === 'watch').length).padStart(2, '0')} delta="Monitor during next wave" tone="accent" />
        <MetricCard label="Stable zones" value={String(trafficAdvisories.filter((item) => item.status === 'stable').length).padStart(2, '0')} delta="No dispatch change required" tone="success" />
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        {trafficAdvisories.map((item) => (
          <Card key={item.id} className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.zone}</CardTitle>
                  <CardDescription>{formatDateTime(item.updatedAt)}</CardDescription>
                </div>
                <Badge className="border-surfaceMuted bg-primaryDark text-surfaceLight">{item.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 text-sm text-textSecondary">{item.summary}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
