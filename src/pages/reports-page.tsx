import { useState } from 'react'
import { Check, FileText, MapPin, Send } from 'lucide-react'
import { campusAlertCategories, campusZones } from '@/data/mock-data'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  readIncidentReports,
  writeIncidentReports,
  readOperatorPreferences,
  type IncidentReportRecord,
} from '@/lib/operator-storage'
import { useAuth } from '@/lib/auth'
import { formatShiftDate, formatTime } from '@/lib/operations'

export function ReportsPage() {
  const { session } = useAuth()
  const [category, setCategory] = useState<string>(campusAlertCategories[0])
  const [zone, setZone] = useState(() => readOperatorPreferences().defaultZone)
  const [priority, setPriority] = useState('medium')
  const [summary, setSummary] = useState('')
  const [reports, setReports] = useState(readIncidentReports)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!summary.trim()) return
    setError('')
    const record: IncidentReportRecord = {
      id: `rep-${Date.now()}`,
      reporter: session?.name ?? 'Operator',
      category,
      zone,
      priority,
      summary: summary.trim(),
      createdAt: new Date().toISOString(),
    }
    try {
      const next = [record, ...reports]
      writeIncidentReports(next)
      setReports(next)
      setSummary('')
      setSaved(true)
    } catch {
      setError('This report could not be saved. Check browser storage and try again.')
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Incident management"
        title="Incident reports"
        subtitle="Log what you observed and give the incident desk a clear starting point."
      />
      <div className="reports-layout">
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>Log an incident</h2>
              <p>Capture the location, priority, and what happened.</p>
            </div>
            <FileText size={18} className="muted" />
          </div>
          <form className="product-form" onSubmit={submit}>
            <div className="form-row">
              <label>
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  {campusAlertCategories.map((category) => (
                    <option key={category} value={category}>
                      {category.replaceAll('-', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Campus zone
                <select value={zone} onChange={(event) => setZone(event.target.value)}>
                  {campusZones.map((zone) => (
                    <option key={zone.id}>{zone.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Priority
                <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  {['low', 'medium', 'high', 'critical'].map((value) => (
                    <option value={value} key={value}>
                      {value[0].toUpperCase() + value.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reported by
                <input value={session?.name ?? 'Operator'} readOnly />
              </label>
            </div>
            <label>
              What happened?
              <textarea
                required
                rows={7}
                maxLength={4000}
                value={summary}
                onChange={(event) => {
                  setSummary(event.target.value)
                  setSaved(false)
                }}
                placeholder="Describe what you observed, any action taken, and what requires follow-up."
              />
            </label>
            {error && (
              <p className="action-error" role="alert">
                {error}
              </p>
            )}
            {saved && (
              <p className="action-success" role="status">
                <Check size={15} />
                Report saved to this workspace.
              </p>
            )}
            <div className="form-actions">
              <Button type="submit" disabled={!summary.trim()}>
                <Send size={15} />
                Save report
              </Button>
            </div>
            <p className="muted report-note">
              This report is stored in your browser. It requires human review and does not send an external
              dispatch.
            </p>
          </form>
        </section>
        <section className="workspace-panel">
          <div className="panel-header">
            <div>
              <h2>
                Recent reports <span className="count-pill">{reports.length}</span>
              </h2>
              <p>Your locally recorded observations.</p>
            </div>
          </div>
          <div className="reports-list">
            {reports.map((report) => (
              <article key={report.id}>
                <div>
                  <span className={`signal-badge signal-${report.priority}`}>{report.priority}</span>
                  <time>
                    {formatShiftDate(report.createdAt)} · {formatTime(report.createdAt)}
                  </time>
                </div>
                <h3>
                  <MapPin size={13} />
                  {report.zone}
                </h3>
                <p>{report.summary}</p>
                <small>
                  {report.category.replaceAll('-', ' ')} · {report.reporter}
                </small>
              </article>
            ))}
            {!reports.length && (
              <div className="empty-state">
                <FileText size={30} />
                <strong>A clear record starts here</strong>
                <p>Your incident reports will appear after you save them.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
