import { startTransition, useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ShieldBan } from 'lucide-react'
import { api } from '@/api'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { FiltersBar } from '@/components/shared/filters-bar'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { formatDateTime } from '@/lib/formatters'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [cameraId, setCameraId] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const query = searchParams.get('q') ?? ''
  const deferredQuery = useDeferredValue(query)

  const { data, error, isLoading } = useAsyncData(
    () =>
      api.search(deferredQuery, {
        cameraId,
        severity,
        status,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      }),
    [deferredQuery, cameraId, severity, status, dateFrom, dateTo],
  )

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LoadingPanel lines={4} />
        <LoadingPanel lines={4} />
        <LoadingPanel lines={10} />
      </div>
    )
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Search data is unavailable.'} />
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Snapshot index"
        title="Search evidence metadata"
        description="Search titles, zones, camera IDs, classes, timestamps, and linked alerts. The index stores still images plus metadata only and keeps biometric functions disabled."
      />

      <FiltersBar
        searchValue={query}
        onSearchChange={(value) => {
          startTransition(() => {
            if (value) {
              setSearchParams({ q: value })
            } else {
              setSearchParams({})
            }
          })
        }}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        groups={[
          {
            id: 'camera',
            label: 'Camera',
            value: cameraId,
            options: [
              { label: 'All', value: 'all' },
              ...data.cameras.map((item) => ({ label: item, value: item })),
            ],
          },
          {
            id: 'severity',
            label: 'Severity',
            value: severity,
            options: [
              { label: 'All', value: 'all' },
              { label: 'Critical', value: 'critical' },
              { label: 'High', value: 'high' },
              { label: 'Medium', value: 'medium' },
              { label: 'Low', value: 'low' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            value: status,
            options: [
              { label: 'All', value: 'all' },
              { label: 'New', value: 'new' },
              { label: 'Ack', value: 'acknowledged' },
              { label: 'Triaging', value: 'triaging' },
              { label: 'Contained', value: 'contained' },
              { label: 'Closed', value: 'closed' },
            ],
          },
        ]}
        onGroupChange={(groupId, value) => {
          if (groupId === 'camera') {
            setCameraId(value)
          }

          if (groupId === 'severity') {
            setSeverity(value)
          }

          if (groupId === 'status') {
            setStatus(value)
          }
        }}
        rightSlot={
          <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">
            <ShieldBan className="h-3.5 w-3.5" />
            biometrics disabled
          </Badge>
        }
      />

      <Card className="bg-panel">
        <CardHeader className="border-b border-border">
          <CardTitle>Search results</CardTitle>
          <CardDescription>
            {data.evidence.length} snapshot{data.evidence.length === 1 ? '' : 's'},{' '}
            {data.alerts.length} alert{data.alerts.length === 1 ? '' : 's'}, and{' '}
            {data.cases.length} case{data.cases.length === 1 ? '' : 's'} matched the current
            query.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {data.alerts.length ? (
            <div className="flex flex-wrap gap-3">
              {data.alerts.slice(0, 4).map((alert) => (
                <Badge key={alert.id} className="border-border bg-background text-foreground">
                  {alert.severity} / {alert.zone}
                </Badge>
              ))}
            </div>
          ) : null}

          {data.evidence.length ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {data.evidence.map((snapshot) => (
                <article
                  key={snapshot.id}
                  className="overflow-hidden border border-border bg-background"
                >
                  <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
                    <img
                      alt={snapshot.title}
                      className="h-full w-full object-cover"
                      src={snapshot.snapshotUrl}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-[0.22em] text-white/70">
                      <span>{snapshot.metadata.cameraId}</span>
                      <span>{snapshot.id}</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
                      <h3 className="font-display text-2xl font-bold">{snapshot.title}</h3>
                      <p className="max-w-md text-sm text-white/75">
                        {snapshot.analyticsSummary}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap gap-2">
                      {snapshot.metadata.classes.map((tag) => (
                        <Badge key={tag} className="border-border bg-panel text-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{snapshot.summary}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{snapshot.metadata.zone}</span>
                      <span>{formatDateTime(snapshot.metadata.ts)}</span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Biometrics disabled: {String(snapshot.metadata.biometricsDisabled)} /
                      human validation required
                    </p>
                    <Link
                      className="inline-flex items-center gap-2 font-semibold text-accent"
                      to={`/cases/${snapshot.relatedCaseId}`}
                    >
                      Open linked case
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border bg-background p-10 text-center text-muted-foreground">
              No snapshots matched. Broaden the query or clear the active filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
