import type { Alert, Case } from '@/types/domain'
import { formatShiftDate, formatTime } from '@/lib/operations'

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  )
}
export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10000)
}
export function exportShiftBrief({
  generatedBy,
  notes,
  alerts,
  cases,
}: {
  generatedBy: string
  notes: string
  alerts: Alert[]
  cases: Case[]
}) {
  const now = new Date().toISOString()
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NOVA Shift Handover</title><style>body{font:14px/1.8 system-ui,sans-serif;color:#252a34;max-width:850px;padding:40px;margin:auto}h1{font-size:32px;letter-spacing:-1px}h2{margin-top:35px;font-size:20px}header{border-bottom:2px solid #eb743b;padding-bottom:20px}.meta{font-size:12px;color:#777e8b}.card{border:1px solid #e8e9ed;border-radius:8px;padding:18px;margin:12px 0;break-inside:avoid}.tag{background:#fff0e6;color:#b5582d;padding:4px 8px;border-radius:4px;font-size:11px}.notes{white-space:pre-wrap}@media print{body{padding:0}}</style></head><body><header><span class="tag">NOVA · SAMPLE WORKSPACE</span><h1>Shift handover brief</h1><p class="meta">Prepared by ${escapeHtml(generatedBy)} · ${formatShiftDate(now)} ${formatTime(now)} EAT</p><p>${alerts.length} active incidents · ${cases.length} active cases</p></header><h2>Shift notes</h2><div class="card notes">${escapeHtml(notes.trim() || 'No shift notes recorded.')}</div><h2>Active incidents</h2>${alerts.map((alert) => `<article class="card"><strong>${escapeHtml(alert.title)}</strong><p class="meta">${escapeHtml(alert.id)} · ${escapeHtml(alert.zone)} · ${alert.severity} · ${alert.status}</p><p>${escapeHtml(alert.summary)}</p><p class="meta">Assigned: ${escapeHtml(alert.assignee)} · Recorded ${formatShiftDate(alert.createdAt)} ${formatTime(alert.createdAt)} EAT</p></article>`).join('') || '<p>No active incidents.</p>'}<h2>Active cases</h2>${cases.map((item) => `<article class="card"><strong>${escapeHtml(item.title)}</strong><p class="meta">${escapeHtml(item.location)} · ${item.status} · ${escapeHtml(item.leadAnalyst)}</p><p>${escapeHtml(item.protocol)}</p></article>`).join('') || '<p>No active cases.</p>'}<footer class="meta">NOVA by DAMA LTD · Sample data · Snapshots and metadata only. Human validation required before escalation.</footer></body></html>`
  downloadFile(`nova-shift-brief-${now.slice(0, 10)}.html`, html, 'text/html;charset=utf-8')
}
