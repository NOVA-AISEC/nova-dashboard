import { Navigate, createBrowserRouter } from 'react-router-dom'
import { routeAccess } from '@/app/access'
import { AppShell } from '@/components/layout/app-shell'
import { AlertsPage } from '@/pages/alerts-page'
import { AuditPage } from '@/pages/audit-page'
import { CaseDetailPage } from '@/pages/case-detail-page'
import { CasesPage } from '@/pages/cases-page'
import { EventsPage } from '@/pages/events-page'
import { ExportsPage } from '@/pages/exports-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OpsPage } from '@/pages/ops-page'
import { QueuePage } from '@/pages/queue-page'
import { ReportsPage } from '@/pages/reports-page'
import { SearchPage } from '@/pages/search-page'
import { SettingsPage } from '@/pages/settings-page'
import { TrafficPage } from '@/pages/traffic-page'
import { UsersPage } from '@/pages/users-page'
import { VehiclesPage } from '@/pages/vehicles-page'
import { ZonesPage } from '@/pages/zones-page'
import { PublicOnlyRoute, RequireAuth, RequireRole } from '@/lib/auth'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate replace to="/ops" /> },
          {
            path: 'ops',
            element: (
              <RequireRole allowed={routeAccess.ops}>
                <OpsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Shift Overview', title: 'Ops Command' },
          },
          {
            path: 'queue',
            element: (
              <RequireRole allowed={routeAccess.queue}>
                <QueuePage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Guard Dispatch', title: 'Live Queue' },
          },
          {
            path: 'alerts',
            element: (
              <RequireRole allowed={routeAccess.alerts}>
                <AlertsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Incident Desk', title: 'Alerts' },
          },
          {
            path: 'cases',
            element: (
              <RequireRole allowed={routeAccess.cases}>
                <CasesPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Incident Desk', title: 'Cases' },
          },
          {
            path: 'cases/:id',
            element: (
              <RequireRole allowed={routeAccess.cases}>
                <CaseDetailPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Case Workspace', title: 'Case File' },
          },
          {
            path: 'reports',
            element: (
              <RequireRole allowed={routeAccess.reports}>
                <ReportsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Manual Intake', title: 'Reports' },
          },
          {
            path: 'vehicles',
            element: (
              <RequireRole allowed={routeAccess.vehicles}>
                <VehiclesPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Mobility Search', title: 'Vehicles' },
          },
          {
            path: 'traffic',
            element: (
              <RequireRole allowed={routeAccess.traffic}>
                <TrafficPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Mobility Control', title: 'Parking / Traffic' },
          },
          {
            path: 'zones',
            element: (
              <RequireRole allowed={routeAccess.zones}>
                <ZonesPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Campus Coverage', title: 'Zones & Cameras' },
          },
          {
            path: 'events',
            element: (
              <RequireRole allowed={routeAccess.events}>
                <EventsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Campus Scheduling', title: 'Events' },
          },
          {
            path: 'exports',
            element: (
              <RequireRole allowed={routeAccess.exports}>
                <ExportsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Chain Of Custody', title: 'Evidence Exports' },
          },
          {
            path: 'audit',
            element: (
              <RequireRole allowed={routeAccess.audit}>
                <AuditPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Operator Trace', title: 'Audit Log' },
          },
          {
            path: 'users',
            element: (
              <RequireRole allowed={routeAccess.users}>
                <UsersPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'RBAC View', title: 'Users & Roles' },
          },
          {
            path: 'settings',
            element: (
              <RequireRole allowed={routeAccess.settings}>
                <SettingsPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Local Preferences', title: 'Preferences' },
          },
          {
            path: 'search',
            element: (
              <RequireRole allowed={routeAccess.search}>
                <SearchPage />
              </RequireRole>
            ),
            handle: { eyebrow: 'Evidence Search', title: 'Snapshot Index' },
          },
          {
            path: '*',
            element: <NotFoundPage />,
            handle: { eyebrow: 'Fallback Route', title: 'Surface Not Found' },
          },
        ],
      },
    ],
  },
])
