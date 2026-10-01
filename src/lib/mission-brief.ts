import type { EngineRun, Mission } from '../../shared/security-engine'
import { formatShiftDate, formatTime } from '@/lib/operations'
import { escapeHtml } from '@/lib/shift-brief'

export const missionLabels: Record<Mission['status'], string> = {
  'pending-approval': 'Awaiting approval',
  active: 'In progress',
  paused: 'On hold',
  completed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Stopped',
}
export const activityLabels: Record<Mission['activity'][number]['action'], string> = {
  proposed: 'Mission prepared',
  approved: 'Mission approved',
  rejected: 'Mission declined',
  'step-recorded': 'Outcome recorded',
  assigned: 'Responsible team changed',
  paused: 'Mission put on hold',
  resumed: 'Mission resumed',
  cancelled: 'Mission stopped',
}
const time = (value: string) => `${formatShiftDate(value)} · ${formatTime(value)} EAT`

export function buildMissionBrief(
  mission: Mission,
  run: EngineRun,
  generatedBy: string,
  now = new Date().toISOString(),
) {
  const e = escapeHtml
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOVA Mission Handover</title><style>body{font:14px/1.7 system-ui,sans-serif;color:#252a34;max-width:850px;padding:40px;margin:auto}header{border-bottom:2px solid #eb743b;padding-bottom:20px}h1{font-size:30px}h2{margin-top:32px}.card{border:1px solid #e8e9ed;border-radius:8px;padding:18px;margin:12px 0;break-inside:avoid}.meta{font-size:12px;color:#58616d}.note{white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{padding:0}}</style></head><body><header><p class="meta">NOVA SECURITY OS · SAMPLE WORKSPACE · YOLOv8n placeholder</p><h1>Mission handover</h1><p>${e(mission.title)}</p><p class="meta">${e(mission.id)} · Revision ${mission.revision} · ${e(missionLabels[mission.status])}</p><p>Responsible team: <strong>${e(mission.assignedTeam)}</strong><br>Location: ${e(mission.location)} · Incident: ${e(mission.incidentId)}</p><p class="meta">Exported by ${e(generatedBy)} · ${e(time(now))}<br>Last mission update: ${e(time(mission.updatedAt))}</p></header><h2>Assessment at preparation</h2><p>${e(mission.summary)}</p><p class="meta">${e(run.id)} · ${e(time(run.createdAt))} · Recorded source snapshot; verify current conditions.</p><h2>Procedure and recorded outcomes</h2>${mission.steps.map((step, index) => `<article class="card"><strong>${index + 1}. ${e(step.title)} · ${step.status === 'completed' ? 'Recorded' : 'Remaining'}</strong><p>${e(step.detail)}</p><p class="meta">Procedure role: ${e(step.owner)}</p>${step.status === 'completed' ? `<p class="note">${e(step.note)}</p><p class="meta">${e(step.completedBy)} · ${e(time(step.completedAt))}</p>` : '<p>Outcome has not been recorded.</p>'}</article>`).join('')}<h2>Mission history</h2>${mission.activity.map((event) => `<article class="card"><strong>${e(activityLabels[event.action])}</strong><p class="meta">Revision ${event.revision} · ${e(event.actor)} · ${e(time(event.at))}</p>${event.team ? `<p>Team: ${e(event.team)}</p>` : ''}${event.stepId ? `<p>Step: ${e(event.stepId)}</p>` : ''}<p class="note">${e(event.note)}</p></article>`).join('')}<h2>Sources and verification gaps</h2>${run.context.sources.map((source) => `<article class="card"><strong>${e(source.id)} · ${e(source.title)}</strong><p class="note">${e(source.detail)}</p><p class="meta">${e(source.kind)} · ${e(source.location)} · ${e(source.cameraId)} · ${e(time(source.recordedAt))}</p></article>`).join('')}<ul>${run.assessment.uncertainties.map((gap) => `<li>${e(gap)}</li>`).join('')}</ul><footer class="meta">Sample metadata only. No inference or live camera connection. Procedures are performed by people through existing campus channels. Completing or stopping a mission does not change incident or case status.</footer></body></html>`
}
