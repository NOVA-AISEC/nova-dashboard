import { evidenceExports } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'

export function ExportsPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Chain Of Custody"
        title="Evidence Exports"
        description="Release evidence packs for admin review only after human validation. Every package remains snapshots plus metadata only."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {evidenceExports.map((item) => (
          <Card key={item.id} className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.packageType}</CardTitle>
                  <CardDescription>{item.destination}</CardDescription>
                </div>
                <Badge className="badge-panel">{item.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-sm text-textSecondary">
              <div>Case: {item.caseId}</div>
              <div>Requested by: {item.requestedBy}</div>
              <div>Requested at: {formatDateTime(item.requestedAt)}</div>
              <div className="text-xs uppercase tracking-[0.18em]">Snapshots + metadata only</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
