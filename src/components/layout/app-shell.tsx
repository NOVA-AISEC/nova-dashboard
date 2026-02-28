import { useState } from 'react'
import { Link, NavLink, Outlet, useMatches } from 'react-router-dom'
import {
  Command,
  FolderOpenDot,
  Menu,
  Radar,
  Search,
  ShieldBan,
  Siren,
  X,
} from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  {
    to: '/ops',
    label: 'Ops',
    description: 'Shift command surface',
    icon: Radar,
  },
  {
    to: '/alerts',
    label: 'Alerts',
    description: 'Priority review queue',
    icon: Siren,
  },
  {
    to: '/search',
    label: 'Search',
    description: 'Snapshot metadata index',
    icon: Search,
  },
]

export function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const matches = useMatches()
  const handle = matches.at(-1)?.handle as
    | {
        eyebrow?: string
        title?: string
      }
    | undefined

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden',
          isNavOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setIsNavOpen(false)}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0',
          isNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="border-b border-sidebar-border px-6 py-7">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-bold uppercase tracking-[0.2em]">
                    DAMA LTD
                  </div>
                </div>
              </div>
              <p className="max-w-xs text-sm text-sidebar-foreground/70">
                DAMA LTD keeps operations evidence-first with snapshots plus metadata only.
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

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="space-y-3">
            <p className="eyebrow text-sidebar-foreground/60">Modules</p>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-start gap-3 border border-transparent px-4 py-3 transition-colors',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                          : 'text-sidebar-foreground/75 hover:border-sidebar-border hover:bg-sidebar-accent',
                      )
                    }
                    onClick={() => setIsNavOpen(false)}
                    to={item.to}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <div className="font-display text-sm font-bold uppercase tracking-[0.18em]">
                        {item.label}
                      </div>
                      <div className="text-sm leading-relaxed">{item.description}</div>
                    </div>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="space-y-3 border border-sidebar-border bg-sidebar-accent p-4">
            <p className="eyebrow text-sidebar-foreground/60">Guardrails</p>
            <div className="space-y-3 text-sm text-sidebar-foreground/80">
              <div className="flex items-start gap-3">
                <ShieldBan className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>No facial recognition, identity resolution, or biometric search.</span>
              </div>
              <div className="flex items-start gap-3">
                <FolderOpenDot className="mt-0.5 h-4 w-4 text-sidebar-primary" />
                <span>Exports preserve chain-of-custody records and require human review.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sidebar-border px-6 py-5 text-xs uppercase tracking-[0.2em] text-sidebar-foreground/55">
          DAMA LTD
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex min-h-[88px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
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
                <p className="eyebrow">DAMA LTD</p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {handle?.eyebrow ?? 'Operations'}
                </p>
                <h2 className="truncate font-display text-2xl font-bold tracking-[-0.04em]">
                  {handle?.title ?? 'Operations'}
                </h2>
              </div>
            </div>

            <div className="hidden flex-wrap items-center gap-3 md:flex">
              <div className="border border-border bg-panel px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Biometrics disabled
              </div>
              <div className="border border-border bg-panel px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Snapshots + metadata only
              </div>
              <Link
                className={buttonVariants({ variant: 'outline', size: 'default' })}
                to="/search"
              >
                Open search
              </Link>
            </div>
          </div>
        </header>

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-10">
          <Outlet />
          <footer className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
            DAMA LTD. Evidence is limited to snapshots and metadata. Human validation is
            required for operational action.
          </footer>
        </main>
      </div>
    </div>
  )
}
