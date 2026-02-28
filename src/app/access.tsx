import type { ComponentType } from 'react'
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  CarFront,
  FileArchive,
  FileText,
  LayoutDashboard,
  Map,
  RadioTower,
  ScrollText,
  Settings2,
  ShieldAlert,
  TrafficCone,
  Users,
} from 'lucide-react'

export type UserRole = 'guard' | 'analyst' | 'supervisor' | 'admin'

export type AppRouteId =
  | 'ops'
  | 'queue'
  | 'alerts'
  | 'cases'
  | 'reports'
  | 'vehicles'
  | 'traffic'
  | 'zones'
  | 'events'
  | 'exports'
  | 'audit'
  | 'users'
  | 'settings'
  | 'search'

export interface NavigationItem {
  id: AppRouteId
  to: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export const roleLabels: Record<UserRole, string> = {
  guard: 'Guard',
  analyst: 'Analyst',
  supervisor: 'Supervisor',
  admin: 'Admin',
}

export const roleShifts: Record<UserRole, string> = {
  guard: 'Shift ALPHA',
  analyst: 'Shift CHARLIE',
  supervisor: 'Shift BRAVO',
  admin: 'Campus Admin',
}

export const routePaths: Record<AppRouteId, string> = {
  ops: '/ops',
  queue: '/queue',
  alerts: '/alerts',
  cases: '/cases',
  reports: '/reports',
  vehicles: '/vehicles',
  traffic: '/traffic',
  zones: '/zones',
  events: '/events',
  exports: '/exports',
  audit: '/audit',
  users: '/users',
  settings: '/settings',
  search: '/search',
}

export const routeAccess: Record<AppRouteId, UserRole[]> = {
  ops: ['guard', 'analyst', 'supervisor', 'admin'],
  queue: ['guard', 'supervisor', 'admin'],
  alerts: ['guard', 'analyst', 'supervisor', 'admin'],
  cases: ['analyst', 'supervisor', 'admin'],
  reports: ['guard', 'supervisor', 'admin'],
  vehicles: ['analyst', 'supervisor', 'admin'],
  traffic: ['supervisor', 'admin'],
  zones: ['supervisor', 'admin'],
  events: ['supervisor', 'admin'],
  exports: ['supervisor', 'admin'],
  audit: ['analyst', 'supervisor', 'admin'],
  users: ['admin'],
  settings: ['supervisor', 'admin'],
  search: ['analyst', 'supervisor', 'admin'],
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: 'Operations',
    items: [
      {
        id: 'ops',
        to: routePaths.ops,
        label: 'Ops Command',
        description: 'Campus command center',
        icon: LayoutDashboard,
      },
      {
        id: 'queue',
        to: routePaths.queue,
        label: 'Live Queue',
        description: 'Dispatch and triage board',
        icon: Activity,
      },
    ],
  },
  {
    label: 'Incidents',
    items: [
      {
        id: 'alerts',
        to: routePaths.alerts,
        label: 'Alerts',
        description: 'Priority alert desk',
        icon: ShieldAlert,
      },
      {
        id: 'cases',
        to: routePaths.cases,
        label: 'Cases',
        description: 'Incident case workspace',
        icon: BriefcaseBusiness,
      },
      {
        id: 'reports',
        to: routePaths.reports,
        label: 'Reports',
        description: 'Manual incident intake',
        icon: FileText,
      },
    ],
  },
  {
    label: 'Mobility',
    items: [
      {
        id: 'vehicles',
        to: routePaths.vehicles,
        label: 'Vehicles',
        description: 'Time and zone search',
        icon: CarFront,
      },
      {
        id: 'traffic',
        to: routePaths.traffic,
        label: 'Parking / Traffic',
        description: 'Lane and congestion watch',
        icon: TrafficCone,
      },
    ],
  },
  {
    label: 'Campus',
    items: [
      {
        id: 'zones',
        to: routePaths.zones,
        label: 'Zones & Cameras',
        description: 'Coverage and health status',
        icon: Map,
      },
      {
        id: 'events',
        to: routePaths.events,
        label: 'Events',
        description: 'Crowd and schedule watch',
        icon: RadioTower,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        id: 'exports',
        to: routePaths.exports,
        label: 'Evidence Exports',
        description: 'Chain-of-custody packs',
        icon: FileArchive,
      },
      {
        id: 'audit',
        to: routePaths.audit,
        label: 'Audit Log',
        description: 'Operator activity trail',
        icon: ScrollText,
      },
    ],
  },
  {
    label: 'Settings',
    items: [
      {
        id: 'users',
        to: routePaths.users,
        label: 'Users & Roles',
        description: 'RBAC roster view',
        icon: Users,
      },
      {
        id: 'settings',
        to: routePaths.settings,
        label: 'Preferences',
        description: 'Local operator defaults',
        icon: Settings2,
      },
    ],
  },
]

export function canAccessRoute(role: UserRole, routeId: AppRouteId) {
  return routeAccess[routeId].includes(role)
}

export function getDefaultRoute(role: UserRole) {
  const firstAllowed = Object.entries(routeAccess).find(([, roles]) => roles.includes(role))
  return firstAllowed ? routePaths[firstAllowed[0] as AppRouteId] : routePaths.ops
}

export function getAllowedNavigation(role: UserRole) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAccessRoute(role, item.id)),
    }))
    .filter((group) => group.items.length > 0)
}

export const quickActionRouteId: AppRouteId = 'search'

export const quickAction = {
  id: quickActionRouteId,
  label: 'Snapshot Search',
  to: routePaths.search,
  icon: BadgeCheck,
}
