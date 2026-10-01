import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, FileText, MapPin, Plus, Search } from 'lucide-react'
import { api } from '@/api'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { useOperations } from '@/hooks/use-operations'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, notifyOperationsChanged } from '@/lib/operations'
import { campusZones } from '@/data/mock-data'
import type { CasePriority } from '@/types/domain'

export function CasesPage() {
  const { data, error, isLoading } = useOperations()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState(campusZones[0].name)
  const [priority, setPriority] = useState<CasePriority>('priority-2')
  const [summary, setSummary] = useState('')
  async function createCase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setBusy(true)
    setFormError('')
    try {
      const record = await api.createCase({
        title: title.trim(),
        summary: summary.trim(),
        location,
        priority,
        status: 'active',
        leadAnalyst: session.name,
        protocol: 'Review the evidence, confirm with the assigned response team, and document the outcome.',
      })
      notifyOperationsChanged()
      setOpen(false)
      navigate(`/cases/${record.id}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to create this case.')
    } finally {
      setBusy(false)
    }
  }
  if (isLoading && !data) return <LoadingPanel lines={10} />
  if (error || !data) return <ErrorPanel message={error ?? 'Cases unavailable.'} />
  const filtered = [...data.cases]
    .filter(
      (item) =>
        (status === 'all' || item.status === status) &&
        `${item.title} ${item.location} ${item.leadAnalyst}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <div className="space-y-5">
      <div className="overview-heading">
        <div>
          <p className="page-kicker">
            <span className="status-dot" />
            INCIDENT MANAGEMENT
          </p>
          <h1>
            Case management<span className="heading-dot">.</span>
          </h1>
          <p>Bring the evidence, decisions, and response together.</p>
        </div>
        <Button
          onClick={() => {
            setFormError('')
            setOpen(true)
          }}
        >
          <Plus size={16} />
          New case
        </Button>
      </div>
      <div className="queue-toolbar">
        <label className="workspace-search-input">
          <Search size={16} />
          <input
            aria-label="Search cases"
            placeholder="Search cases, locations, or lead analysts…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select aria-label="Case status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {['active', 'monitoring', 'escalated', 'closed'].map((value) => (
            <option key={value} value={value}>
              {value[0].toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="case-grid">
        {filtered.map((item) => (
          <Link to={`/cases/${item.id}`} key={item.id} className="product-case-card">
            <div className="case-card-top">
              <span
                className={`signal-badge signal-${item.priority === 'priority-1' ? 'critical' : item.priority === 'priority-2' ? 'high' : 'low'}`}
              >
                {item.priority.replace('priority-', 'Priority ')}
              </span>
              <span className={`case-status case-status-${item.status}`}>
                <i />
                {item.status}
              </span>
            </div>
            <h2>{item.title}</h2>
            <p className="case-location">
              <MapPin size={13} />
              {item.location}
            </p>
            <p className="case-summary">{item.summary}</p>
            <div className="case-evidence-count">
              <FileText size={13} />
              {item.alertIds.length} alerts<span>·</span>
              {item.evidenceIds.length} snapshots
            </div>
            <div className="case-card-footer">
              <span className="avatar avatar-small">
                {item.leadAnalyst
                  .split(' ')
                  .map((word) => word[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <div>
                <strong>{item.leadAnalyst}</strong>
                <span>Updated {formatShiftDate(item.updatedAt)}</span>
              </div>
              <ArrowUpRight size={16} />
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && (
        <div className="workspace-panel empty-state">
          <FileText size={30} />
          <strong>No cases match your search</strong>
          <p>Try another location or status.</p>
        </div>
      )}
      <WorkspaceDialog
        open={open}
        onOpenChange={setOpen}
        title="Open a new case"
        description="Start an investigation with the context your team needs."
      >
        <form className="product-form" onSubmit={(event) => void createCase(event)}>
          <label>
            Case title
            <input
              required
              maxLength={120}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A concise description of the incident"
            />
          </label>
          <div className="form-row">
            <label>
              Location
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                {campusZones.map((zone) => (
                  <option key={zone.id}>{zone.name}</option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(event) => setPriority(event.target.value as CasePriority)}>
                <option value="priority-1">Priority 1 · Critical</option>
                <option value="priority-2">Priority 2 · High</option>
                <option value="priority-3">Priority 3 · Routine</option>
              </select>
            </label>
          </div>
          <label>
            Investigation summary
            <textarea
              required
              rows={4}
              maxLength={3000}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="What happened, what has been checked, and what still needs follow-up?"
            />
          </label>
          <p className="muted">Case lead: {session?.name}. Saved to this demo workspace.</p>
          {formError && (
            <p role="alert" className="action-error">
              {formError}
            </p>
          )}
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !title.trim() || !summary.trim()}>
              {busy ? 'Creating…' : 'Create case'}
            </Button>
          </div>
        </form>
      </WorkspaceDialog>
    </div>
  )
}
