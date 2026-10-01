import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCheck,
  CircleAlert,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  Users,
  Workflow,
} from 'lucide-react'
import { MissionDetail } from '@/components/security/mission-detail'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { useSecurityOS } from '@/hooks/use-security-os'
import { useOperations } from '@/hooks/use-operations'
import { missionLabels as labels } from '@/lib/mission-brief'
import { notifyOperationsChanged } from '@/lib/operations'
import type { Mission } from '../../shared/security-engine'

export function MissionsPage() {
  const { data, error, isLoading } = useSecurityOS()
  const operations = useOperations()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [failure, setFailure] = useState('')
  if (isLoading && !data) return <LoadingPanel />
  if (!data || error) return <ErrorPanel message={error ?? 'Unable to load missions.'} />
  const filtered = data.missions.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      [item.title, item.location, item.assignedTeam, item.incidentId, item.id].some((value) =>
        value.toLowerCase().includes(query.trim().toLowerCase()),
      ),
  )
  const mission = filtered.find((item) => item.id === params.get('mission')) ?? filtered[0]
  const run = data.runs.find((item) => item.id === mission?.runId)
  return (
    <div className="os-page">
      <div className="os-heading">
        <div>
          <p className="eyebrow">NOVA SECURITY OS / RESPONSE</p>
          <h1>Mission control</h1>
          <p>Coordinate the response. Keep ownership, decisions, and outcomes in one record.</p>
        </div>
        <Link to="/command" className="os-quiet-link">
          Assess an incident <ArrowRight size={15} />
        </Link>
      </div>
      <div className="os-mission-stats">
        {(['pending-approval', 'active', 'completed'] as const).map((status) => (
          <button key={status} onClick={() => setFilter(status)}>
            <span>
              {status === 'pending-approval' ? (
                <Clock3 size={19} />
              ) : status === 'active' ? (
                <Workflow size={19} />
              ) : (
                <CheckCheck size={19} />
              )}
            </span>
            <div>
              <strong>{data.missions.filter((item) => item.status === status).length}</strong>
              <small>{labels[status]}</small>
            </div>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="os-mission-toolbar">
        <label className="os-mission-search">
          <Search size={16} />
          <input
            aria-label="Search missions"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a mission, team, or incident…"
          />
        </label>
        <Button variant="outline" onClick={notifyOperationsChanged} disabled={isLoading}>
          <RefreshCw size={14} />
          {isLoading ? 'Refreshing…' : 'Refresh records'}
        </Button>
      </div>
      <div className="os-filter-tabs" aria-label="Mission status">
        {['all', 'pending-approval', 'active', 'paused', 'completed', 'rejected', 'cancelled'].map(
          (status) => (
            <button key={status} aria-pressed={filter === status} onClick={() => setFilter(status)}>
              {status === 'all' ? 'All missions' : labels[status as Mission['status']]}
            </button>
          ),
        )}
      </div>
      {failure && (
        <div className="os-error" role="alert">
          <CircleAlert size={16} />
          {failure}
          <button className="os-quiet-link" onClick={() => setFailure('')}>
            Dismiss
          </button>
        </div>
      )}
      {!filtered.length ? (
        <div className="workspace-panel os-missions-empty">
          <Workflow size={38} />
          <h2>
            {data.missions.length
              ? 'No missions match this view'
              : 'Start with an informed response'}
          </h2>
          <p>
            {data.missions.length
              ? 'Change the status filter or search by team, location, or incident.'
              : 'Assess an incident in Command, then prepare a mission for supervisor review.'}
          </p>
          <Link to="/command" className="text-link">
            Open Command <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="os-missions-layout">
          <aside className="workspace-panel os-mission-list" aria-label="Missions">
            {filtered.map((item) => (
              <button
                key={item.id}
                aria-pressed={mission?.id === item.id}
                onClick={() => {
                  setParams({ mission: item.id })
                  setFailure('')
                }}
              >
                <span className={`os-mission-status status-${item.status}`}>
                  {labels[item.status]}
                </span>
                <strong>{item.title}</strong>
                <span>
                  <MapPin size={12} />
                  {item.location}
                </span>
                <span>
                  <Users size={12} />
                  {item.assignedTeam}
                </span>
                <div>
                  <small>
                    {item.steps.filter((step) => step.status === 'completed').length}/
                    {item.steps.length} outcomes recorded
                  </small>
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </aside>
          {mission && run && (
            <MissionDetail
              key={`${mission.id}:${mission.revision}`}
              mission={mission}
              run={run}
              records={operations.error ? null : operations.data}
              recordsLoading={operations.isLoading}
              onFailure={setFailure}
            />
          )}
        </div>
      )}
    </div>
  )
}
