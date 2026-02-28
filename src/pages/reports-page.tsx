import { useState } from 'react'
import { campusAlertCategories, campusZones } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDateTime } from '@/lib/formatters'
import {
  readIncidentReports,
  writeIncidentReports,
  type IncidentReportRecord,
} from '@/lib/operator-storage'
import { useAuth } from '@/lib/auth'

export function ReportsPage() {
  const { session } = useAuth()
  const [category, setCategory] = useState<string>(campusAlertCategories[0])
  const [zone, setZone] = useState<string>(campusZones[0]?.name ?? 'Main Gate  Lane 1')
  const [priority, setPriority] = useState('medium')
  const [summary, setSummary] = useState('')
  const [reports, setReports] = useState<IncidentReportRecord[]>(() => readIncidentReports())

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!summary.trim()) {
      return
    }

    const nextReport: IncidentReportRecord = {
      id: `rep-${Date.now()}`,
      reporter: session?.name ?? 'Operator',
      category,
      zone,
      priority,
      summary: summary.trim(),
      createdAt: new Date().toISOString(),
    }

    const nextReports = [nextReport, ...reports]
    setReports(nextReports)
    writeIncidentReports(nextReports)
    setSummary('')
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Manual Intake"
        title="Reports"
        description="Capture guard notes, lost & found handoffs, and suspicious-item reports for the incident desk. Every report remains human-reviewed."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
        <Card className="bg-panel">
          <CardHeader className="border-b border-border">
            <CardTitle>Create manual report</CardTitle>
            <CardDescription>
              Use this when a guard, hostel desk, or library desk needs to log an
              incident outside the automated queue.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="eyebrow text-[10px]">Category</span>
                  <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                    {campusAlertCategories.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll('-', ' ')}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="eyebrow text-[10px]">Zone</span>
                  <Select value={zone} onChange={(event) => setZone(event.target.value)}>
                    {campusZones.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="eyebrow text-[10px]">Priority</span>
                  <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="eyebrow text-[10px]">Reporter</span>
                  <Input value={session?.name ?? 'Operator'} readOnly />
                </label>
              </div>

              <label className="space-y-2">
                <span className="eyebrow text-[10px]">Summary</span>
                <Textarea
                  value={summary}
                  placeholder="Describe what the guard observed, what was checked manually, and whether admin or Student Affairs follow-up may be needed."
                  onChange={(event) => setSummary(event.target.value)}
                />
              </label>

              <div className="flex items-center justify-between gap-4">
                <Badge className="badge-compliance">
                  Human-in-the-loop validation required
                </Badge>
                <Button type="submit">Save report</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-panel">
          <CardHeader className="border-b border-border">
            <CardTitle>Recent reports</CardTitle>
            <CardDescription>
              Locally stored manual submissions for the current operator session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {reports.length ? (
              reports.map((report) => (
                <div key={report.id} className="space-y-2 border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge className="badge-high">{report.priority}</Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {formatDateTime(report.createdAt)}
                    </span>
                  </div>
                  <div className="font-display text-lg font-bold">{report.zone}</div>
                  <div className="text-sm text-muted-foreground">{report.summary}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {report.category.replaceAll('-', ' ')} / {report.reporter}
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
                No manual reports yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
