import { api } from '@/api'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { SectionHeader } from '@/components/shared/section-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { formatDateTime } from '@/lib/formatters'

export function AuditPage() {
  const { data, error, isLoading } = useAsyncData(() => api.listAudit({ page: 1, pageSize: 25 }), [])

  if (isLoading && !data) {
    return <LoadingPanel lines={10} />
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Audit log is unavailable.'} />
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operator Trace"
        title="Audit Log"
        description="Review a local trail of acknowledgements, escalations, and export-related actions."
      />

      <Card className="overflow-hidden bg-primaryDeep">
        <CardHeader className="border-b border-surfaceMuted/20">
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Latest operator and simulator actions relevant to campus operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-primaryDark/90">
                <tr className="text-[11px] uppercase tracking-[0.22em] text-textSecondary">
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Entity</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'border-t border-surfaceMuted/20 bg-primaryDark/45' : 'border-t border-surfaceMuted/20'}>
                    <td className="px-4 py-3.5">{item.action}</td>
                    <td className="px-4 py-3.5 text-textSecondary">{item.entityType} · {item.entityId}</td>
                    <td className="px-4 py-3.5 text-textSecondary">{item.actor}</td>
                    <td className="px-4 py-3.5 text-textSecondary">{formatDateTime(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
