import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react'
import { canAccessRoute, getAllowedNavigation, getDefaultRoute, roleLabels } from '@/app/access'
import { AlertDetail } from '@/components/ops/alert-detail'
import { NovaLogo } from '@/components/shared/nova-logo'
import { WorkspaceDialog } from '@/components/shared/workspace-dialog'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useOperations } from '@/hooks/use-operations'
import { useAuth } from '@/lib/auth'
import { isActiveAlert, sortAlerts } from '@/lib/operations'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types/domain'

const navigationLabels: Record<string, string> = {
  intelligence: 'Intelligence',
  command: 'Command',
  missions: 'Missions',
  playbooks: 'Playbooks',
  systems: 'Systems',
  ops: 'Overview',
  queue: 'Live queue',
  alerts: 'Alerts',
  cases: 'Case management',
  search: 'Evidence search',
  reports: 'Incident reports',
  vehicles: 'Vehicle search',
  traffic: 'Parking & traffic',
  zones: 'Zones & cameras',
  events: 'Campus events',
  exports: 'Evidence exports',
  audit: 'Audit log',
  users: 'Team & access',
}

export function AppShell() {
  const { session, logout } = useAuth()
  const location = useLocation()
  const { data } = useOperations()
  const [navOpen, setNavOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!navOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const navigation = navigationRef.current
    const menuButton = menuButtonRef.current
    navigation?.querySelector<HTMLButtonElement>('.mobile-nav-close')?.focus()
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !navigation) return
      const elements = [
        ...navigation.querySelectorAll<HTMLElement>('a[href],button:not([disabled])'),
      ].filter((element) => element.getClientRects().length > 0)
      const first = elements[0],
        last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', trapFocus)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', trapFocus)
      menuButton?.focus()
    }
  }, [navOpen])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((value) => !value)
      }
      if (event.key === 'Escape') {
        setNavOpen(false)
        setUserOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  if (!session) return null
  const groups = getAllowedNavigation(session.role)
  const navigation = groups.flatMap((group) => group.items)
  const activeAlerts = data?.alerts.filter(isActiveAlert) ?? []
  const newAlerts = sortAlerts(activeAlerts.filter((alert) => alert.status === 'new'))
  const current = navigation.find((item) => location.pathname.startsWith(item.to))
  const searchTerm = query.trim().toLowerCase()
  const matchingRoutes = navigation.filter((item) =>
    `${navigationLabels[item.id]} ${item.description}`.toLowerCase().includes(searchTerm),
  )
  const matchingAlerts = sortAlerts(
    data?.alerts.filter((alert) =>
      `${alert.title} ${alert.zone} ${alert.id}`.toLowerCase().includes(searchTerm),
    ) ?? [],
  ).slice(0, 5)
  const initials = session.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
  function closeNavigation() {
    setNavOpen(false)
    setUserOpen(false)
    setSearchOpen(false)
  }
  return (
    <div className="nova-workspace">
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>
      {navOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      )}
      <aside
        ref={navigationRef}
        id="workspace-navigation"
        className={cn('nova-sidebar', navOpen && 'is-open')}
        aria-label="Main navigation"
      >
        <Link
          to={getDefaultRoute(session.role)}
          className="nova-wordmark"
          onClick={closeNavigation}
        >
          <span className="nova-brand-asset">
            <NovaLogo className="nova-brand-image" />
          </span>
          <small>SECURITY OS</small>
        </Link>
        <button
          className="icon-button mobile-nav-close"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        >
          <X size={18} />
        </button>
        <div className="workspace-switcher">
          <span className="workspace-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>Strathmore University</strong>
            <span>Campus workspace</span>
          </div>
          <ShieldCheck size={15} />
        </div>
        <div className="sidebar-navigation">
          {groups.map((group) => (
            <section key={group.label}>
              <p className="nav-group-label">
                {group.label === 'Incidents' ? 'Incident management' : group.label}
              </p>
              <nav aria-label={group.label}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    onClick={closeNavigation}
                    className={({ isActive }) => cn('nova-nav-link', isActive && 'active')}
                  >
                    <item.icon className="nav-icon" />
                    <span>{navigationLabels[item.id] ?? item.label}</span>
                    {item.id === 'queue' && !!activeAlerts.length && (
                      <span className="nav-count">{activeAlerts.length}</span>
                    )}
                    {item.id === 'alerts' && !!newAlerts.length && (
                      <span className="nav-count alert-count">{newAlerts.length}</span>
                    )}
                  </NavLink>
                ))}
              </nav>
            </section>
          ))}
        </div>
        <div className="sidebar-bottom">
          {canAccessRoute(session.role, 'settings') && (
            <NavLink to="/settings" className="nova-nav-link" onClick={closeNavigation}>
              <Settings2 size={18} />
              <span>Settings</span>
            </NavLink>
          )}
          <button
            className="nova-nav-link"
            onClick={() => {
              setNavOpen(false)
              setHelpOpen(true)
            }}
          >
            <CircleHelp size={18} />
            <span>Help & shortcuts</span>
            <ChevronRight size={14} />
          </button>
          <div className="sidebar-system">
            <span className="status-dot" />
            <span>YOLOv8n placeholder</span>
            <span className="mono">OS</span>
          </div>
          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{session.name}</strong>
              <span>{roleLabels[session.role]}</span>
            </div>
            <button className="icon-button" onClick={logout} aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-content">
        <header className="nova-topbar">
          <button
            ref={menuButtonRef}
            className="icon-button mobile-menu-button"
            aria-label="Open navigation"
            aria-controls="workspace-navigation"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <span>Security OS</span>
            <ChevronRight size={13} />
            <strong>
              {location.pathname.startsWith('/settings')
                ? 'Settings'
                : navigationLabels[current?.id ?? 'ops']}
            </strong>
          </div>
          <div className="topbar-tools">
            <button
              className="global-search"
              aria-label="Search workspace"
              onClick={() => {
                setQuery('')
                setSearchOpen(true)
              }}
            >
              <Search size={16} />
              <span>Search workspace</span>
              <kbd>Ctrl K</kbd>
            </button>
            <span className="topbar-divider" />
            <ThemeToggle compact className="topbar-theme" />
            <button
              className="icon-button notification-button"
              aria-label={`Notifications, ${newAlerts.length} incidents need review`}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={18} />
              {!!newAlerts.length && <span />}
            </button>
            <div className="topbar-profile">
              <button
                className="profile-button"
                aria-label="Account menu"
                aria-expanded={userOpen}
                onClick={() => setUserOpen((value) => !value)}
              >
                <span className="avatar avatar-small">{initials}</span>
                <ChevronDown size={13} />
              </button>
              {userOpen && (
                <>
                  <button
                    className="profile-scrim"
                    aria-label="Close account menu"
                    onClick={() => setUserOpen(false)}
                  />
                  <div className="profile-menu">
                    <strong>{session.name}</strong>
                    <small>{session.email}</small>
                    <button onClick={logout}>
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="nova-main" id="workspace-main">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>
            <ShieldCheck size={13} />
            Human-reviewed operations · Snapshots & metadata
          </span>
          <span>
            NOVA by DAMA<span> / </span>Sample data
          </span>
        </footer>
      </div>
      <WorkspaceDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search workspace"
        description="Find a page, incident, or campus zone."
      >
        <div className="command-search">
          <Search size={20} />
          <input
            aria-label="Search workspace"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search incidents, zones, pages…"
          />
          <kbd>ESC</kbd>
        </div>
        <div className="command-results">
          <p className="section-label">Navigate</p>
          {matchingRoutes.slice(0, searchTerm ? 8 : 4).map((item) => (
            <Link key={item.id} to={item.to} onClick={closeNavigation}>
              <item.icon className="h-4 w-4" />
              <span>{navigationLabels[item.id]}</span>
              <ChevronRight size={15} />
            </Link>
          ))}
          <p className="section-label">Incidents</p>
          {matchingAlerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                setSearchOpen(false)
                setSelectedAlert(alert)
              }}
            >
              <span className={`severity-dot ${alert.severity}`} />
              <div>
                <strong>{alert.title}</strong>
                <small>{alert.zone}</small>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
          {!matchingRoutes.length && !matchingAlerts.length && (
            <div className="empty-state">
              No results for “{query}”. Try a zone or incident name.
            </div>
          )}
        </div>
        <div className="command-footer">
          <Command size={13} />
          Ctrl K to open · Escape to close
        </div>
      </WorkspaceDialog>
      <WorkspaceDialog
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        title="Needs your attention"
        description={`${newAlerts.length} incidents awaiting review.`}
        drawer
      >
        <div className="notification-list">
          {newAlerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                setNotificationsOpen(false)
                setSelectedAlert(alert)
              }}
            >
              <span className={`signal-badge signal-${alert.severity}`}>{alert.severity}</span>
              <strong>{alert.title}</strong>
              <small>{alert.zone}</small>
              <span className="text-link">
                Review incident <ChevronRight size={14} />
              </span>
            </button>
          ))}
          {!newAlerts.length && (
            <div className="empty-state">
              <ShieldCheck size={30} />
              <strong>You’re all caught up</strong>
              <p>No incidents are awaiting acknowledgement.</p>
            </div>
          )}
        </div>
      </WorkspaceDialog>
      <WorkspaceDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Your operations workspace"
        description="A few useful things to know."
      >
        <div className="help-content">
          <div>
            <kbd>Ctrl K</kbd>
            <p>Find any workspace page or incident.</p>
          </div>
          <div>
            <kbd>Esc</kbd>
            <p>Close incident review, search, or a dialog.</p>
          </div>
          <h3>Explore → assess → approve → record</h3>
          <p>
            Use Intelligence to trace record connections, inspect evidence, and ask source-cited
            questions. Use Command to assemble a response procedure. Prepare a mission for
            supervisor approval, then record each human-led step in order. Use cases for
            investigation context.
          </p>
          <h3>About this workspace</h3>
          <p>
            YOLOv8n inference and live cameras are placeholders. Sample detections illustrate the
            workflow. Browser mode saves operations locally; API mode uses verified server accounts
            and durable local records. Campus integrations are still disconnected.
          </p>
        </div>
      </WorkspaceDialog>
      <AlertDetail
        alert={
          selectedAlert
            ? (data?.alerts.find((item) => item.id === selectedAlert.id) ?? selectedAlert)
            : null
        }
        evidence={data?.evidence}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  )
}
