import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  ChevronDown,
  FolderOpenDot,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldBan,
  UserRound,
  X,
} from 'lucide-react'
import {
  canAccessRoute,
  getAllowedNavigation,
  roleLabels,
  routePaths,
} from '@/app/access'
import { api } from '@/api'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button-variants'
import { Button } from '@/components/ui/button'
import { NovaLogo } from '@/components/shared/nova-logo'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useAsyncData } from '@/hooks/use-async-data'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const complianceChips = ['Biometrics disabled', 'Snapshots', 'Metadata only'] as const

function countByStatus(values: string[], status: string) {
  return values.filter((value) => value === status).length
}

export function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { session, logout } = useAuth()
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
    <div className="min-h-screen bg-surface text-ink">
      <div
        className={cn(
          'fixed inset-0 z-40 bg-brandBlack/45 transition-opacity lg:hidden',
          isNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsNavOpen(false)}
      />
      <div
        className={cn(
          'fixed inset-0 z-20 transition-opacity',
          isUserMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsUserMenuOpen(false)}
      />

      <aside
        className={cn(
          'sidebar-shell fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-surfaceMuted/20 transition-transform lg:translate-x-0',
          isNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-surfaceMuted/20 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4">
              <Link
                className="block max-w-[18.5rem] rounded-2xl bg-white px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
                to={routePaths.ops}
              >
                <NovaLogo className="max-h-24" />
              </Link>
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
                      onClick={() => {
                        setIsNavOpen(false)
                        setIsUserMenuOpen(false)
                      }}
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
                <ShieldBan className="sidebar-panel-icon mt-0.5 h-4 w-4" />
                <span>No facial recognition or identity inference.</span>
              </div>
              <div className="flex items-start gap-3">
                <FolderOpenDot className="sidebar-panel-icon mt-0.5 h-4 w-4" />
                <span>Human validation is required before action.</span>
              </div>
            </div>
            <ThemeToggle className="sidebar-theme-toggle w-full justify-center" />
          </div>
        </div>

        <div className="sidebar-footer border-t px-5 py-4">
          <div className="sidebar-footer-copy text-xs uppercase tracking-[0.2em]">
            {session.name} / {roleLabels[session.role]}
          </div>
          <div className="sidebar-footer-meta mt-2 text-[10px] uppercase tracking-[0.22em]">
            DAMA LTD
          </div>
          <Button
            className="sidebar-footer-action mt-4 w-full"
            size="sm"
            variant="outline"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="lg:pl-80">
        <header className="sticky top-0 z-30 border-b border-surfaceMuted/20 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex min-h-[68px] max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <Button
                className="lg:hidden"
                variant="outline"
                size="icon"
                onClick={() => setIsNavOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <Link
                className="header-brand-lockup min-w-0 max-w-[12.5rem] sm:max-w-[15.5rem]"
                to={routePaths.ops}
              >
                <NovaLogo className="header-brand-image max-h-12 sm:max-h-14" />
              </Link>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Badge className="badge-panel">
                {roleLabels[session.role]} / {session.shift}
              </Badge>
              {canAccessRoute(session.role, 'settings') ? (
                <Link
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  to={routePaths.settings}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
              ) : null}
              {canAccessRoute(session.role, 'search') ? (
                <Link
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  to={routePaths.search}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Snapshot Search</span>
                </Link>
              ) : null}
              <ThemeToggle compact />
              <div className="relative">
                <Button
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsUserMenuOpen((value) => !value)}
                >
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">{session.name}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <div
                  className={cn(
                    'absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 border border-surfaceMuted/20 bg-primaryDeep p-2 shadow-lg transition-all',
                    isUserMenuOpen
                      ? 'translate-y-0 opacity-100'
                      : 'pointer-events-none -translate-y-1 opacity-0',
                  )}
                  role="menu"
                >
                  <div className="border-b border-surfaceMuted/20 px-2.5 pb-2 pt-1">
                    <div className="text-sm font-semibold text-ink">{session.name}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                      {roleLabels[session.role]}
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      className="flex w-full items-center gap-2 border border-transparent px-2.5 py-2 text-left text-sm text-ink transition-colors hover:border-surfaceMuted/20 hover:bg-primaryDark"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                      }}
                      role="menuitem"
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
          <Outlet />
          <footer className="mt-8 border-t border-surfaceMuted/20 pt-4 text-sm text-textSecondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="footer-brand-lockup w-full max-w-[11rem] px-3 py-2">
                <NovaLogo className="max-h-12" />
              </div>
              <div>
                DAMA LTD / Powered by NOVA. Campus evidence remains limited to
                snapshots plus metadata, and operational action requires human
                validation.
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
