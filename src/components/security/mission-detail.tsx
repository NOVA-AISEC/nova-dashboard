import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCheck,
  CircleAlert,
  Download,
  FileCheck2,
  History,
  Pause,
  Play,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { api } from '@/api'
import { SourceReview } from '@/components/security/source-review'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { activityLabels, buildMissionBrief, missionLabels as labels } from '@/lib/mission-brief'
import { formatShiftDate, formatTime, notifyOperationsChanged } from '@/lib/operations'
import { downloadFile } from '@/lib/shift-brief'
import type { SearchResults } from '@/types/domain'
import {
  assertFreshRun,
  type EngineRun,
  type EngineSource,
  type Mission,
} from '../../../shared/security-engine'

export function MissionDetail({
  mission,
  run,
  records,
  recordsLoading,
  onFailure,
}: {
  mission: Mission
  run: EngineRun
  records: SearchResults | null
  recordsLoading: boolean
  onFailure: (message: string) => void
}) {
  const { session } = useAuth()
  const [note, setNote] = useState('')
  const [coordination, setCoordination] = useState('')
  const [team, setTeam] = useState(mission.assignedTeam)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [source, setSource] = useState<EngineSource | null>(null)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])
  const canCoordinate = !!session && ['supervisor', 'admin'].includes(session.role)
  const open = ['pending-approval', 'active', 'paused'].includes(mission.status)
  const next = mission.steps.find((step) => step.status === 'pending')
  const incident = records?.alerts.find((item) => item.id === mission.incidentId)
  const canProgress =
    !recordsLoading && !!incident && !['closed', 'contained'].includes(incident.status)
  let freshness = ''
  if (mission.status === 'pending-approval') {
    if (!records || recordsLoading) freshness = 'Current source records must load before approval.'
    else {
      try {
        assertFreshRun(run, records, now)
      } catch (error) {
        freshness = error instanceof Error ? error.message : 'Assessment needs review.'
      }
    }
  }
  async function save(action: string) {
    if (busy) return
    setBusy(true)
    onFailure('')
    try {
      if (action === 'approve' || action === 'reject')
        await api.decideMission(mission.id, action, note, mission.revision)
      else if (action === 'step' && next)
        await api.completeMissionStep(mission.id, next.id, note, mission.revision)
      else
        await api.coordinateMission(
          mission.id,
          action,
          reason,
          mission.revision,
          action === 'assign' ? team : undefined,
        )
      notifyOperationsChanged()
    } catch (error) {
      onFailure(error instanceof Error ? error.message : 'Mission change could not be saved.')
    } finally {
      setBusy(false)
    }
  }
  function exportBrief() {
    try {
      downloadFile(
        `nova-mission-${mission.incidentId}-r${mission.revision}.html`,
        buildMissionBrief(mission, run, session?.email ?? 'Operator'),
        'text/html;charset=utf-8',
      )
      setDownloaded(true)
    } catch {
      onFailure('The handover could not be downloaded. Try again from this mission record.')
    }
  }
  return (
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
        {open && mission.revision >= 199 && (
          <div className="notice-panel">
            Mission history is nearly full. A supervisor can stop or decline this procedure,
            preserving its outcomes for the next response.
          </div>
        )}
        <div className="os-mission-owner">
          <div>
            <Users size={17} />
            <span>
              <small>RESPONSIBLE TEAM</small>
              <strong>{mission.assignedTeam}</strong>
            </span>
          </div>
          <Button variant="outline" onClick={exportBrief}>
            <Download size={14} />
            Download handover
          </Button>
        </div>
        {downloaded && (
          <p className="os-handover-confirmation" role="status">
            Handover downloaded with this revision’s outcomes, history, and source records.
          </p>
        )}
        <div className="os-mission-provenance">
          <FileCheck2 size={15} />
          <span>
            Prepared by {mission.createdBy}
            <small>
              {formatShiftDate(mission.createdAt)} · {formatTime(mission.createdAt)} EAT · sample
              assessment
            </small>
            <small>
              Revision {mission.revision} · Updated {formatShiftDate(mission.updatedAt)} ·{' '}
              {formatTime(mission.updatedAt)} EAT
            </small>
          </span>
        </div>
        {open && canCoordinate && (
          <div className="os-coordination">
            <div className="os-coordination-heading">
              <h3>Coordinate response</h3>
              <span>Supervisor controls</span>
            </div>
            <div className="os-coordination-buttons">
              <Button
                variant="outline"
                disabled={busy}
                aria-pressed={coordination === 'assign'}
                onClick={() => {
                  setCoordination('assign')
                  setReason('')
                }}
              >
                <Users size={14} />
                Change team
              </Button>
              {mission.status === 'active' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  aria-pressed={coordination === 'pause'}
                  onClick={() => {
                    setCoordination('pause')
                    setReason('')
                  }}
                >
                  <Pause size={14} />
                  Put on hold
                </Button>
              )}
              {mission.status === 'paused' && (
                <Button
                  variant="outline"
                  disabled={busy || !canProgress}
                  aria-pressed={coordination === 'resume'}
                  onClick={() => {
                    setCoordination('resume')
                    setReason('')
                  }}
                >
                  <Play size={14} />
                  Resume
                </Button>
              )}
              {mission.status !== 'pending-approval' && (
                <Button
                  variant="outline"
                  disabled={busy}
                  aria-pressed={coordination === 'cancel'}
                  onClick={() => {
                    setCoordination('cancel')
                    setReason('')
                  }}
                >
                  Stop mission
                </Button>
              )}
            </div>
            {coordination && (
              <form
                className="os-coordination-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  void save(coordination)
                }}
              >
                {coordination === 'assign' && (
                  <>
                    <label htmlFor="mission-team">Responsible team</label>
                    <input
                      id="mission-team"
                      value={team}
                      onChange={(event) => setTeam(event.target.value)}
                      maxLength={100}
                      required
                      disabled={busy}
                    />
                  </>
                )}
                <label htmlFor="coordination-reason">
                  {coordination === 'assign'
                    ? 'Handover note'
                    : coordination === 'cancel'
                      ? 'Reason for stopping'
                      : 'Coordination note'}
                </label>
                <textarea
                  id="coordination-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  required
                  disabled={busy}
                  placeholder="Explain the change and what the next operator needs to know."
                />
                {coordination === 'cancel' && (
                  <p>
                    Stopping preserves recorded outcomes and ends this procedure. Incident status
                    stays unchanged.
                  </p>
                )}
                <div className="os-decision-buttons">
                  <Button
                    type="submit"
                    disabled={
                      busy ||
                      !reason.trim() ||
                      (coordination === 'assign' &&
                        (!team.trim() || team.trim() === mission.assignedTeam)) ||
                      (coordination === 'resume' && !canProgress)
                    }
                  >
                    {busy
                      ? 'Saving…'
                      : coordination === 'assign'
                        ? 'Save team & handover'
                        : coordination === 'pause'
                          ? 'Confirm hold'
                          : coordination === 'resume'
                            ? 'Confirm resume'
                            : 'Confirm stop'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setCoordination('')}
                  >
                    Close
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
        {mission.status === 'paused' && (
          <div className="notice-panel">
            <Pause size={17} />
            This mission is on hold. A supervisor must resume it before outcomes can be recorded.
          </div>
        )}
        {open && !canProgress && !recordsLoading && (
          <div className="notice-panel">
            {records
              ? 'The linked incident is missing or resolved. Review its status before continuing.'
              : 'Current incident records are unavailable. Refresh records before continuing.'}
          </div>
        )}
        <p>{mission.summary}</p>
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
                {mission.status === 'rejected' ? 'Declined' : 'Approved'} by {mission.decisionBy}
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
            <h3>
              {mission.status === 'pending-approval'
                ? 'Supervisor decision'
                : `Record step ${mission.steps.indexOf(next!) + 1}: ${next?.title}`}
            </h3>
            <p>
              {mission.status === 'pending-approval'
                ? 'Review the sources and procedure. Teams coordinate through existing campus channels.'
                : 'Perform the human-led procedure, then document what happened.'}
            </p>
            {freshness && (
              <div className="notice-panel">
                <CircleAlert size={16} />
                <span>
                  {freshness}{' '}
                  {!recordsLoading && records && (
                    <>
                      Decline this proposal with a reason, then{' '}
                      <Link to={`/command?incident=${encodeURIComponent(mission.incidentId)}`}>
                        reassess in Command
                      </Link>
                      .
                    </>
                  )}
                </span>
              </div>
            )}
            {mission.status === 'pending-approval' && !canCoordinate && (
              <div className="notice-panel">
                A supervisor or admin must approve this mission before outcomes can be recorded.
              </div>
            )}
            {(mission.status === 'active' || canCoordinate) && (
              <>
                <label htmlFor="mission-note">
                  {mission.status === 'pending-approval' ? 'Decision note' : 'Observed outcome'}
                </label>
                <textarea
                  id="mission-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  disabled={busy}
                  placeholder={
                    mission.status === 'pending-approval'
                      ? 'Why is this procedure appropriate, and what needs verification?'
                      : 'What was checked, who confirmed it, and what remains open?'
                  }
                />
                <div className="os-decision-buttons">
                  {mission.status === 'pending-approval' ? (
                    <>
                      <Button
                        onClick={() => save('approve')}
                        disabled={busy || !note.trim() || !!freshness}
                      >
                        <ShieldCheck size={15} />
                        {busy ? 'Saving…' : 'Approve mission'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => save('reject')}
                        disabled={busy || !note.trim()}
                      >
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => save('step')}
                      disabled={busy || !note.trim() || !canProgress}
                    >
                      <Check size={15} />
                      {busy ? 'Saving…' : 'Record outcome & continue'}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {['completed', 'cancelled'].includes(mission.status) && (
          <div className="os-completion">
            <CheckCheck size={24} />
            <div>
              <strong>
                {mission.status === 'completed' ? 'Procedure completed' : 'Mission stopped'}
              </strong>
              <p>
                Recorded outcomes are preserved. Incident and case status remain separate operator
                decisions.
              </p>
            </div>
          </div>
        )}
        <details className="os-mission-history">
          <summary>
            <History size={17} />
            Mission history <span>{mission.activity.length} records</span>
          </summary>
          <ol>
            {[...mission.activity].reverse().map((event) => (
              <li key={event.revision}>
                <div>
                  <strong>{activityLabels[event.action]}</strong>
                  <small>
                    R{event.revision} · {formatShiftDate(event.at)} · {formatTime(event.at)} EAT
                  </small>
                </div>
                <p>{event.note}</p>
                {event.team && <p className="os-history-team">Responsible team: {event.team}</p>}
                {event.stepId && (
                  <p className="os-history-team">
                    {mission.steps.find((step) => step.id === event.stepId)?.title}
                  </p>
                )}
                <small>{event.actor}</small>
              </li>
            ))}
          </ol>
        </details>
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
      </div>
      <SourceReview source={source} onClose={() => setSource(null)} />
    </section>
  )
}
