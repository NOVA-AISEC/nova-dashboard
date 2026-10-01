import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Camera, Search, X } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { useOperations } from '@/hooks/use-operations'
import { formatShiftDate, formatTime } from '@/lib/operations'
import type { Evidence } from '@/types/domain'

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const { data, error, isLoading } = useOperations()
  const [camera, setCamera] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<Evidence | null>(null)
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Evidence search unavailable.'} />
  const filtered = data.evidence.filter(
    (item) =>
      (camera === 'all' || item.metadata.cameraId === camera) &&
      (!from || item.metadata.ts.slice(0, 10) >= from) &&
      (!to || item.metadata.ts.slice(0, 10) <= to) &&
      `${item.title} ${item.metadata.zone} ${item.metadata.cameraId} ${item.metadata.classes.join(' ')} ${item.summary}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  )
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Investigation tools"
        title="Evidence search"
        subtitle="Find the snapshot that brings the full picture into focus."
      />
      <section className="workspace-panel filter-panel">
        <div className="queue-toolbar">
          <label className="workspace-search-input">
            <Search size={16} />
            <input
              aria-label="Search evidence"
              placeholder="Search a location, object, camera, or description…"
              value={query}
              onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})}
            />
          </label>
          <select
            aria-label="Evidence camera"
            value={camera}
            onChange={(event) => setCamera(event.target.value)}
          >
            <option value="all">All cameras</option>
            {data.cameras.map((camera) => (
              <option key={camera}>{camera}</option>
            ))}
          </select>
        </div>
        <div className="evidence-date-filters">
          <label>
            From
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            To
            <input
              type="date"
              min={from || undefined}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </label>
          {(from || to || camera !== 'all' || query) && (
            <button
              className="text-link"
              onClick={() => {
                setParams({})
                setFrom('')
                setTo('')
                setCamera('all')
              }}
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </section>
      <div className="results-meta">
        <span>{filtered.length} snapshots found</span>
        <span>Sample snapshots · Human review required</span>
      </div>
      <div className="evidence-search-grid">
        {filtered.map((item) => (
          <article className="workspace-panel evidence-result" key={item.id}>
            <button
              className="evidence-image-button"
              aria-label={`View snapshot: ${item.title}`}
              onClick={() => setSelected(item)}
            >
              <img src={item.snapshotUrl} alt={item.title} />
              <span>
                <Camera size={12} />
                {item.metadata.cameraId}
              </span>
              <small>Sample snapshot</small>
            </button>
            <div>
              <h2>{item.title}</h2>
              <p>{item.metadata.zone}</p>
              <div className="evidence-tags">
                {item.metadata.classes.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <p className="evidence-result-summary">{item.summary}</p>
              <footer>
                <time>
                  {formatShiftDate(item.metadata.ts)} · {formatTime(item.metadata.ts)} EAT
                </time>
                <Link className="text-link" to={`/cases/${item.relatedCaseId}`}>
                  Case
                  <ArrowUpRight size={13} />
                </Link>
              </footer>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="workspace-panel empty-state">
          <Camera size={30} />
          <strong>No snapshots found</strong>
          <p>Try a broader search or clear the camera and date filters.</p>
        </div>
      )}
      <WorkspaceDialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        title={selected?.title ?? 'Snapshot'}
        description="Sample evidence snapshot with source metadata."
      >
        {selected && (
          <div className="snapshot-modal">
            <img src={selected.snapshotUrl} alt={selected.title} />
            <p>{selected.summary}</p>
            <dl>
              <div>
                <dt>Camera</dt>
                <dd>{selected.metadata.cameraId}</dd>
              </div>
              <div>
                <dt>Zone</dt>
                <dd>{selected.metadata.zone}</dd>
              </div>
              <div>
                <dt>Recorded</dt>
                <dd>
                  {formatShiftDate(selected.metadata.ts)} · {formatTime(selected.metadata.ts)} EAT
                </dd>
              </div>
              <div>
                <dt>Chain of custody</dt>
                <dd>{selected.chainOfCustody}</dd>
              </div>
            </dl>
            <Link className="text-link" to={`/cases/${selected.relatedCaseId}`}>
              Open case
              <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
      </WorkspaceDialog>
    </div>
  )
}
