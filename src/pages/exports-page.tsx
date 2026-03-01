import { evidenceExports } from '@/data/mock-data'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/formatters'

export function ExportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Chain Of Custody"
        title="Evidence Exports"
        subtitle="Release evidence packs for admin review only after human validation. Every package remains snapshots plus metadata only."
        actions={
          <Link className={buttonVariants({ variant: 'default' })} to="/search">
            New export
          </Link>
        }
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
