import { useState } from 'react'
import { Link, NavLink, Outlet, useMatches } from 'react-router-dom'
import { Command, FolderOpenDot, LogOut, Menu, ShieldBan, X } from 'lucide-react'
import {
  canAccessRoute,
  getAllowedNavigation,
  quickAction,
  roleLabels,
} from '@/app/access'
import { api } from '@/api'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Button } from '@/components/ui/button'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const complianceChips = ['Biometrics disabled', 'Snapshots', 'Metadata only'] as const

function countByStatus(values: string[], status: string) {
  return values.filter((value) => value === status).length
}

export function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const { session, logout } = useAuth()
  const matches = useMatches()
  const handle = matches.at(-1)?.handle as
    | {
        eyebrow?: string
        title?: string
      }
    | undefined
  const role = session?.role ?? 'guard'
  const navGroups = getAllowedNavigation(role)
  const navData = useAsyncData(
    async () => {
      const [searchResults, auditResults] = await Promise.all([
        api.search(''),
        api.listAudit({ page: 1, pageSize: 25 }),
      ])

      return { searchResults, auditResults }
    },
    [],
  )

  const openAlerts =
    navData.data?.searchResults.alerts.filter((alert) => alert.status !== 'closed') ?? []
  const openCases =
    navData.data?.searchResults.cases.filter((caseItem) => caseItem.status !== 'closed') ?? []
  const navBadges: Record<string, string | undefined> = {
    queue: openAlerts.length ? String(openAlerts.length) : undefined,
    alerts: countByStatus(
      openAlerts.map((alert) => alert.severity),
      'critical',
    )
      ? `${countByStatus(openAlerts.map((alert) => alert.severity), 'critical')} hot`
      : undefined,
    cases: openCases.length ? String(openCases.length) : undefined,
    vehicles: navData.data?.searchResults.evidence.filter((item) =>
      item.metadata.classes.includes('vehicle'),
    ).length
      ? String(
          navData.data.searchResults.evidence.filter((item) =>
            item.metadata.classes.includes('vehicle'),
          ).length,
        )
      : undefined,
    exports: openCases.filter((item) => item.humanValidationRequired).length
      ? `${openCases.filter((item) => item.humanValidationRequired).length} pending`
      : undefined,
    audit: navData.data?.auditResults.total
      ? String(navData.data.auditResults.total)
      : undefined,
    users: role === 'admin' ? 'RBAC' : undefined,
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-primaryDark text-surfaceLight">
      <div
        className={cn(
          'fixed inset-0 z-40 bg-primaryDark/70 transition-opacity lg:hidden',
          isNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsNavOpen(false)}
      />

      <aside
        className={cn(
          'sidebar-shell fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-surfaceMuted/20 bg-primaryDark text-surfaceLight transition-transform lg:translate-x-0',
          isNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-surfaceMuted/20 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <div className="sidebar-logo-mark flex h-11 w-11 items-center justify-center border">
                  <Command className="h-5 w-5" />
                </div>
                <div>
                  <div className="sidebar-title font-display text-lg font-bold uppercase tracking-[0.18em]">
                    NOVA
                  </div>
                  <div className="sidebar-subtitle text-xs uppercase tracking-[0.22em]">
                    Strathmore Security Operations
                  </div>
                  <div className="sidebar-attribution mt-1 text-[10px] uppercase tracking-[0.22em]">
                    by DAMA LTD
                  </div>
                </div>
              </div>
              <p className="sidebar-copy max-w-xs text-sm leading-relaxed">
                NOVA coordinates triage queue, guard dispatch, incident desk review,
                traffic response, and evidence exports for Strathmore teams.
              </p>
            </div>

            <Button
              className="lg:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setIsNavOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {navGroups.map((group) => (
            <section key={group.label} className="space-y-2.5">
              <div className="sidebar-section-heading border-b pb-2">
                <p className="eyebrow">{group.label}</p>
              </div>
              <nav className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) =>
                        cn(
                          'sidebar-link group relative flex items-start gap-3 border px-4 py-3 transition-colors',
                          isActive && 'sidebar-link-active',
                        )
                      }
                      onClick={() => setIsNavOpen(false)}
                      to={item.to}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'sidebar-link-indicator absolute bottom-0 left-0 top-0 w-1 transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <Icon className="sidebar-link-icon mt-0.5 h-5 w-5 shrink-0" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-display text-sm font-bold uppercase tracking-[0.16em]">
                                {item.label}
                              </div>
                              {navBadges[item.id] ? (
                                <span className="sidebar-link-badge border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]">
                                  {navBadges[item.id]}
                                </span>
                              ) : null}
                            </div>
                            <div className="sidebar-link-copy text-sm leading-relaxed">
                              {item.description}
                            </div>
                          </div>
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </section>
          ))}

          <div className="sidebar-panel space-y-3 border p-4">
            <p className="eyebrow text-textSecondary">Compliance Guardrails</p>
            <div className="flex flex-wrap gap-2">
              {complianceChips.map((label) => (
                <Badge key={label} className="chip-compliance-inverse">
                  {label}
                </Badge>
              ))}
            </div>
            <div className="space-y-3 text-sm text-surfaceMuted">
              <div className="flex items-start gap-3">
                <ShieldBan className="mt-0.5 h-4 w-4 text-accentGlow" />
                <span>No facial recognition or identity inference.</span>
              </div>
              <div className="flex items-start gap-3">
                <FolderOpenDot className="mt-0.5 h-4 w-4 text-accentGlow" />
                <span>Human validation is required before action.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-surfaceMuted/20 px-6 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-textSecondary">
            {session.name} / {roleLabels[session.role]}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-textSecondary">
            DAMA LTD
          </div>
        </div>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-0 z-30 border-b border-surfaceMuted/20 bg-primaryDark/95 backdrop-blur">
          <div className="flex min-h-[92px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-4">
              <Button
                className="lg:hidden"
                variant="outline"
                size="icon"
                onClick={() => setIsNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <p className="eyebrow">NOVA / Strathmore Security Operations</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-textSecondary">
                  {handle?.eyebrow ?? 'Operations'}
                </p>
                <h2 className="truncate font-display text-2xl font-bold tracking-[-0.04em]">
                  {handle?.title ?? 'Operations'}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                  {complianceChips.map((label) => (
                    <Badge key={label} className="chip-compliance">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden flex-wrap items-center justify-end gap-3 md:flex">
              <Badge className="badge-panel">
                {roleLabels[session.role]} / {session.shift}
              </Badge>
              {complianceChips.map((label) => (
                <Badge key={label} className="chip-compliance">
                  {label}
                </Badge>
              ))}
              {canAccessRoute(session.role, quickAction.id) ? (
                <Link
                  className={buttonVariants({ variant: 'outline', size: 'default' })}
                  to={quickAction.to}
                >
                  {quickAction.label}
                </Link>
              ) : null}
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-10">
          <Outlet />
          <footer className="mt-10 border-t border-surfaceMuted/20 pt-4 text-sm text-textSecondary">
            DAMA LTD / Powered by NOVA. Campus evidence remains limited to snapshots
            plus metadata, and operational action requires human validation.
          </footer>
        </main>
      </div>
    </div>
  )
}
