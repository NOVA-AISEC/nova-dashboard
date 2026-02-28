import { startTransition, useDeferredValue, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, ShieldBan } from 'lucide-react'
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
import {
  searchCameras,
  searchEvidence,
  searchLocations,
} from '@/data/mock-data'
import { formatDateTime } from '@/lib/formatters'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [location, setLocation] = useState('all')
  const [cameraId, setCameraId] = useState('all')
  const query = searchParams.get('q') ?? ''
  const deferredQuery = useDeferredValue(query)

  const results = searchEvidence({
    query: deferredQuery,
    location: location === 'all' ? undefined : location,
    cameraId: cameraId === 'all' ? undefined : cameraId,
  })

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Snapshot index"
        title="Search evidence metadata"
        description="Search across snapshot titles, zones, camera IDs, analytics summaries, and tags. Results are evidence-only and preserve redactions."
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
        groups={[
          {
            id: 'location',
            label: 'Location',
            value: location,
            options: [
              { label: 'All', value: 'all' },
              ...searchLocations.map((item) => ({ label: item, value: item })),
            ],
          },
          {
            id: 'camera',
            label: 'Camera',
            value: cameraId,
            options: [
              { label: 'All', value: 'all' },
              ...searchCameras.map((item) => ({ label: item, value: item })),
            ],
          },
        ]}
        onGroupChange={(groupId, value) => {
          if (groupId === 'location') {
            setLocation(value)
          }

          if (groupId === 'camera') {
            setCameraId(value)
          }
        }}
        rightSlot={
          <Badge className="border-accent bg-[#f6e1d8] text-[#7d381f]">
            <ShieldBan className="h-3.5 w-3.5" />
            no biometric search
          </Badge>
        }
      />

      <Card className="bg-panel">
        <CardHeader className="border-b border-border">
          <CardTitle>Search results</CardTitle>
          <CardDescription>
            {results.length} snapshot
            {results.length === 1 ? '' : 's'} matched the current query.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {results.length ? (
            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {results.map((snapshot) => (
                <article
                  key={snapshot.id}
                  className="overflow-hidden border border-border bg-background"
                >
                  <div className="panel-grid border-b border-border bg-gradient-to-br from-[#3a2c27] via-[#26211f] to-[#171717] px-4 py-5 text-white">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/60">
                      <span>{snapshot.cameraId}</span>
                      <span>{snapshot.id}</span>
                    </div>
                    <div className="mt-10 space-y-2">
                      <h3 className="font-display text-2xl font-bold">{snapshot.title}</h3>
                      <p className="max-w-md text-sm text-white/70">{snapshot.analyticsSummary}</p>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="flex flex-wrap gap-2">
                      {snapshot.tags.map((tag) => (
                        <Badge key={tag} className="border-border bg-panel text-foreground">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{snapshot.summary}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{snapshot.location}</span>
                      <span>{formatDateTime(snapshot.capturedAt)}</span>
                    </div>
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
              No snapshots matched. Broaden the query or clear the location filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
