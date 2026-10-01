import { useState } from 'react'
import { ArrowDownToLine, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { useOperations } from '@/hooks/use-operations'
import { formatShiftDate, formatTime } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'

export function AuditPage() {
  const { data, error, isLoading } = useOperations()
  const [query, setQuery] = useState('')
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Audit unavailable.'} />
  const events = [...data.audit]
    .filter((item) =>
      `${item.action} ${item.entityId} ${item.actor}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        subtitle="A clear record of actions, ownership, and changes in this workspace."
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadFile('nova-audit-log.json', JSON.stringify(events, null, 2), 'application/json')
            }
          >
            <ArrowDownToLine size={15} />
            Download log
          </Button>
        }
      />
      <label className="workspace-search-input">
        <Search size={16} />
        <input
          aria-label="Search audit log"
          placeholder="Search an action, operator, or record…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <section className="workspace-panel">
        <div className="panel-header">
          <h2>
            Recorded actions <span className="count-pill">{events.length}</span>
          </h2>
          <span className="panel-meta">Local sample workspace</span>
        </div>
        <div className="table-scroll">
          <table className="incident-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Record</th>
                <th>Operator</th>
                <th>Timestamp · EAT</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="audit-action">{event.action.toLowerCase().replaceAll('_', ' ')}</td>
                  <td className="muted">
                    {event.entityType} · {event.entityId}
                  </td>
                  <td className="muted">{event.actor}</td>
                  <td className="muted">
                    {formatShiftDate(event.timestamp)} · {formatTime(event.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!events.length && <div className="empty-state">No actions match your search.</div>}
      </section>
    </div>
  )
}
