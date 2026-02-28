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
    alerts: countByStatus(openAlerts.map((alert) => alert.severity), 'critical') ? `${countByStatus(openAlerts.map((alert) => alert.severity), 'critical')} hot` : undefined,
    cases: openCases.length ? String(openCases.length) : undefined,
    vehicles: navData.data?.searchResults.evidence.filter((item) => item.metadata.classes.includes('vehicle')).length
      ? String(navData.data.searchResults.evidence.filter((item) => item.metadata.classes.includes('vehicle')).length)
      : undefined,
    exports: openCases.filter((item) => item.humanValidationRequired).length ? `${openCases.filter((item) => item.humanValidationRequired).length} pending` : undefined,
    audit: navData.data?.auditResults.total ? String(navData.data.auditResults.total) : undefined,
    users: role === 'admin' ? 'RBAC' : undefined,
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/45 transition-opacity lg:hidden',
          isNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsNavOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0',
          isNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-sidebar-border px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold uppercase tracking-[0.18em]">
                    DAMA Sentinel
                  </div>
                  <div className="text-xs uppercase tracking-[0.22em] text-sidebar-foreground/55">
                    Strathmore University
                  </div>
                </div>
              </div>
              <p className="max-w-xs text-sm leading-relaxed text-sidebar-foreground/70">
                Campus command center for triage queue, guard dispatch, incident desk, traffic, and evidence exports.
              </p>
            </div>

            <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setIsNavOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {navGroups.map((group) => (
            <section key={group.label} className="space-y-2.5">
              <div className="border-b border-sidebar-border/75 pb-2">
                <p className="eyebrow text-sidebar-foreground/45">{group.label}</p>
              </div>
              <nav className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.to}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-start gap-3 border border-transparent px-4 py-3 transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-foreground'
                            : 'text-sidebar-foreground/72 hover:border-sidebar-border hover:bg-sidebar-accent/60',
                        )
                      }
                      onClick={() => setIsNavOpen(false)}
                      to={item.to}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute bottom-0 left-0 top-0 w-1 bg-sidebar-primary transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-sidebar-primary" />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-display text-sm font-bold uppercase tracking-[0.16em]">
                                {item.label}
                              </div>
                              {navBadges[item.id] ? (
                                <span className="border border-sidebar-border bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/72">
                                  {navBadges[item.id]}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm leading-relaxed text-sidebar-foreground/60">
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

          <div className="space-y-3 border border-sidebar-border bg-sidebar-accent p-4">
            <p className="eyebrow text-sidebar-foreground/50">Compliance Guardrails</p>
            <div className="space-y-3 text-sm text-sidebar-foreground/78">
              <div className="flex items-start gap-3">
                <ShieldBan className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>Biometrics disabled. No facial recognition and no identity inference.</span>
              </div>
              <div className="flex items-start gap-3">
                <FolderOpenDot className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>Snapshots + metadata only. Human validation is required before action.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border px-6 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-sidebar-foreground/55">
            {session.name} · {roleLabels[session.role]}
          </div>
        </div>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-[92px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-4">
              <Button className="lg:hidden" variant="outline" size="icon" onClick={() => setIsNavOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>

              <div className="min-w-0">
                <p className="eyebrow">DAMA Sentinel for Strathmore University</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {handle?.eyebrow ?? 'Operations'}
                </p>
                <h2 className="truncate font-display text-2xl font-bold tracking-[-0.04em]">
                  {handle?.title ?? 'Operations'}
                </h2>
              </div>
            </div>

            <div className="hidden flex-wrap items-center justify-end gap-3 md:flex">
              <Badge className="border-border bg-panel text-foreground">
                {roleLabels[session.role]} · {session.shift}
              </Badge>
              <Badge className="border-border bg-panel text-foreground">Biometrics disabled</Badge>
              <Badge className="border-border bg-panel text-foreground">Snapshots + metadata only</Badge>
              {canAccessRoute(session.role, quickAction.id) ? (
                <Link className={buttonVariants({ variant: 'outline', size: 'default' })} to={quickAction.to}>
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
          <footer className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
            DAMA Sentinel keeps campus evidence limited to snapshots and metadata. Operational action requires human validation.
          </footer>
        </main>
      </div>
    </div>
  )
}
