import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { api } from '@/api'
import { PageHeader } from '@/components/page-header'
import { ErrorPanel, LoadingPanel } from '@/components/shared/async-state'
import { SeverityBadge } from '@/components/shared/severity-badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAsyncData } from '@/hooks/use-async-data'
import { getCasePriorityTone, getCaseStatusTone } from '@/lib/action-gradient'
import { formatDateTime, titleCase } from '@/lib/formatters'

export function CasesPage() {
  const { data, error, isLoading } = useAsyncData(() => api.search(''), [])

  if (isLoading && !data) {
    return <LoadingPanel lines={10} />
  }

  if (error || !data) {
    return <ErrorPanel message={error ?? 'Cases are unavailable.'} />
  }

  const caseList = [...data.cases].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Incident Desk"
        title="Cases"
        subtitle="Case files combine triage, shift handoff, and evidence-backed decision notes for campus operations."
        actions={
          <>
            <Link className={buttonVariants({ variant: 'outline' })} to="/reports">
              Add note
            </Link>
            <Link className={buttonVariants({ variant: 'action' })} to="/exports">
              Export case brief
            </Link>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {caseList.map((caseItem) => (
          <Card key={caseItem.id} className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{caseItem.title}</CardTitle>
                  <CardDescription>{caseItem.location}</CardDescription>
                </div>
                <SeverityBadge tone={getCasePriorityTone(caseItem.priority)}>
                  {titleCase(caseItem.priority)}
                </SeverityBadge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <p className="text-sm text-textSecondary">{caseItem.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border border-surfaceMuted/20 bg-primaryDark p-3">
                  <div className="eyebrow text-[10px]">Lead analyst</div>
                  <div className="mt-1 text-sm">{caseItem.leadAnalyst}</div>
                </div>
                <div className="border border-surfaceMuted/20 bg-primaryDark p-3">
                  <div className="eyebrow text-[10px]">Updated</div>
                  <div className="mt-1 text-sm">{formatDateTime(caseItem.updatedAt)}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <SeverityBadge tone={getCaseStatusTone(caseItem.status)}>
                  {caseItem.status}
                </SeverityBadge>
                <Link to={`/cases/${caseItem.id}`} className="brand-link">
                  Open case
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
