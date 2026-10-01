import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  FileCheck2,
  MapPin,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { api } from '@/api'
import { SourceReview } from '@/components/security/source-review'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { Button } from '@/components/ui/button'
import { useSecurityOS } from '@/hooks/use-security-os'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, formatTime, notifyOperationsChanged } from '@/lib/operations'
import type { EngineSource, Mission } from '../../shared/security-engine'

const labels: Record<Mission['status'], string> = {
  'pending-approval': 'Awaiting approval',
  active: 'In progress',
  completed: 'Completed',
  rejected: 'Declined',
}
export function MissionsPage() {
  const { data, error, isLoading } = useSecurityOS()
  const { session } = useAuth()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [source, setSource] = useState<EngineSource | null>(null)
  if (isLoading && !data) return <LoadingPanel />
  if (!data || error) return <ErrorPanel message={error ?? 'Unable to load missions.'} />
  const filtered = data.missions.filter((item) => filter === 'all' || item.status === filter)
  const mission = filtered.find((item) => item.id === params.get('mission')) ?? filtered[0]
  const run = data.runs.find((item) => item.id === mission?.runId)
  const canApprove = session && ['supervisor', 'admin'].includes(session.role)
  const next = mission?.steps.find((step) => step.status === 'pending')
  async function act(decision?: string) {
    if (!mission || busy || !note.trim()) return
    setBusy(true)
    setFailure('')
    try {
      if (decision) await api.decideMission(mission.id, decision, note)
      else if (next) await api.completeMissionStep(mission.id, next.id, note)
      setNote('')
      notifyOperationsChanged()
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'Mission change could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="os-page">
      <div className="os-heading">
        <div>
          <p className="eyebrow">NOVA SECURITY OS / RESPONSE</p>
          <h1>Mission control</h1>
          <p>Every response has a procedure, a decision, and an accountable outcome.</p>
        </div>
        <Link to="/command" className="os-quiet-link">
          Assess an incident <ArrowRight size={15} />
        </Link>
      </div>
      <div className="os-mission-stats">
        {(['pending-approval', 'active', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilter(status)
              setNote('')
              setFailure('')
            }}
          >
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
      <div className="os-filter-tabs" aria-label="Mission status">
        {['all', 'pending-approval', 'active', 'completed', 'rejected'].map((status) => (
          <button
            key={status}
            aria-pressed={filter === status}
            onClick={() => {
              setFilter(status)
              setNote('')
              setFailure('')
            }}
          >
            {status === 'all' ? 'All missions' : labels[status as Mission['status']]}
          </button>
        ))}
      </div>
      {failure && (
        <div className="os-error" role="alert">
          <CircleAlert size={16} />
          {failure}
        </div>
      )}
      {!filtered.length ? (
        <div className="workspace-panel os-missions-empty">
          <Workflow size={38} />
          <h2>
            {data.missions.length ? 'No missions in this view' : 'Start with an informed response'}
          </h2>
          <p>Assess an incident in Command, then prepare a mission for supervisor review.</p>
          <Link to="/command" className="text-link">
            Open Command <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="os-missions-layout">
          <aside className="workspace-panel os-mission-list">
            {filtered.map((item) => (
              <button
                key={item.id}
                aria-pressed={mission?.id === item.id}
                onClick={() => {
                  setParams({ mission: item.id })
                  setNote('')
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
                <div>
                  <small>
                    {item.steps.filter((step) => step.status === 'completed').length}/
                    {item.steps.length} steps recorded
                  </small>
                  <ArrowRight size={14} />
                </div>
              </button>
            ))}
          </aside>
          {mission && (
            <section className="workspace-panel os-mission-detail">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">RESPONSE PROCEDURE</p>
                  <h2>{mission.title}</h2>
                  <p>
                    {mission.location} · {mission.incidentId}
                  </p>
                </div>
                <span className={`os-mission-status status-${mission.status}`}>
                  {labels[mission.status]}
                </span>
              </div>
              <div className="os-mission-body">
                <p>{mission.summary}</p>
                <div className="os-mission-provenance">
                  <FileCheck2 size={15} />
                  <span>
                    Prepared by {mission.createdBy}
                    <small>
                      {formatShiftDate(mission.createdAt)} · {formatTime(mission.createdAt)} EAT ·
                      sample assessment
                    </small>
                  </span>
                </div>
                <div className="os-procedure">
                  {mission.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={
                        step.status === 'completed'
                          ? 'done'
                          : mission.status === 'active' && step.id === next?.id
                            ? 'current'
                            : ''
                      }
                    >
                      <span className="os-step-number">
                        {step.status === 'completed' ? (
                          <Check size={16} />
                        ) : (
                          String(index + 1).padStart(2, '0')
                        )}
                      </span>
                      <div>
                        <h3>{step.title}</h3>
                        <p>{step.detail}</p>
                        <small>{step.owner}</small>
                        {step.status === 'completed' && (
                          <blockquote>
                            <strong>Recorded outcome</strong>
                            {step.note}
                            <small>
                              {step.completedBy} · {formatTime(step.completedAt)} EAT
                            </small>
                          </blockquote>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {mission.decisionBy && (
                  <div className="os-decision-record">
                    <ShieldCheck size={18} />
                    <div>
                      <strong>
                        {mission.status === 'rejected' ? 'Declined' : 'Approved'} by{' '}
                        {mission.decisionBy}
                      </strong>
                      <p>{mission.decisionNote}</p>
                      <small>
                        {formatShiftDate(mission.decidedAt)} · {formatTime(mission.decidedAt)} EAT
                      </small>
                    </div>
                  </div>
                )}
                {(mission.status === 'pending-approval' || mission.status === 'active') && (
                  <div className="os-mission-action">
                    {mission.status === 'pending-approval' ? (
                      <>
                        <h3>Supervisor decision</h3>
                        <p>
                          Review the source records and procedure. Approval enables outcome
                          recording; teams coordinate through existing campus channels.
                        </p>
                        {!canApprove && (
                          <div className="notice-panel">
                            A supervisor or admin must approve this mission before any step can be
                            recorded.
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <h3>
                          Record step {mission.steps.indexOf(next!) + 1}: {next?.title}
                        </h3>
                        <p>Perform the human-led procedure, then document what happened.</p>
                      </>
                    )}
                    {(mission.status === 'active' || canApprove) && (
                      <>
                        <label htmlFor="mission-note">
                          {mission.status === 'pending-approval'
                            ? 'Decision note'
                            : 'Observed outcome'}
                        </label>
                        <textarea
                          id="mission-note"
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder={
                            mission.status === 'pending-approval'
                              ? 'Why is this procedure appropriate, and what needs verification?'
                              : 'What was checked, who confirmed it, and what remains open?'
                          }
                          disabled={busy}
                        />
                        <div className="os-decision-buttons">
                          {mission.status === 'pending-approval' ? (
                            <>
                              <Button
                                onClick={() => act('approve')}
                                disabled={busy || !note.trim()}
                              >
                                <ShieldCheck size={15} />
                                {busy ? 'Saving…' : 'Approve mission'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => act('reject')}
                                disabled={busy || !note.trim()}
                              >
                                Decline
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => act()} disabled={busy || !note.trim()}>
                              <Check size={15} />
                              {busy ? 'Saving…' : 'Record outcome & continue'}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {mission.status === 'completed' && (
                  <div className="os-completion">
                    <CheckCheck size={24} />
                    <div>
                      <strong>Procedure completed</strong>
                      <p>
                        All outcomes are recorded. Incident and case status remain separate operator
                        decisions.
                      </p>
                    </div>
                  </div>
                )}
                {run && (
                  <div className="os-mission-sources">
                    <p className="section-label">ASSESSMENT SOURCES</p>
                    {run.context.sources.map((item) => (
                      <button key={item.id} onClick={() => setSource(item)}>
                        {item.id} · {item.title}
                        <ArrowRight size={13} />
                      </button>
                    ))}
                    <div className="os-uncertainty">
                      <CircleAlert size={15} />
                      <div>
                        {run.assessment.uncertainties.map((item) => (
                          <p key={item}>{item}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
      <SourceReview source={source} onClose={() => setSource(null)} />
    </div>
  )
}
