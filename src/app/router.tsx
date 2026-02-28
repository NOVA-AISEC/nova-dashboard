import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { AlertsPage } from '@/pages/alerts-page'
import { CaseDetailPage } from '@/pages/case-detail-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OpsPage } from '@/pages/ops-page'
import { SearchPage } from '@/pages/search-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate replace to="/ops" /> },
      {
        path: 'ops',
        element: <OpsPage />,
        handle: { eyebrow: 'Shift Overview', title: 'Operations Command' },
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
        handle: { eyebrow: 'Event Queue', title: 'Alert Review' },
      },
      {
        path: 'cases/:id',
        element: <CaseDetailPage />,
        handle: { eyebrow: 'Case Workspace', title: 'Case File' },
      },
      {
        path: 'search',
        element: <SearchPage />,
        handle: { eyebrow: 'Evidence Search', title: 'Snapshot Index' },
      },
      {
        path: '*',
        element: <NotFoundPage />,
        handle: { eyebrow: 'Fallback Route', title: 'Surface Not Found' },
      },
    ],
  },
])
