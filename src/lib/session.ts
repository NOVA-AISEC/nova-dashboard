import {
  getDefaultRoute,
  routeAccess,
  routePaths,
  type AppRouteId,
  type UserRole,
} from '@/app/access'

export const SESSION_STORAGE_KEY = 'nova.session'
export const DEMO_SESSION_MS = 8 * 60 * 60 * 1000
export interface SessionUser {
  name: string
  email: string
  role: UserRole
  shift: string
  expiresAt: number
  csrfToken?: string
}

export function validSession(value: unknown, now = Date.now()): value is SessionUser {
  if (!value || typeof value !== 'object') return false
  const item = value as SessionUser
  return (
    ['guard', 'analyst', 'supervisor', 'admin'].includes(item.role) &&
    [item.name, item.email, item.shift].every(
      (field) => typeof field === 'string' && field.length > 0 && field.length <= 254,
    ) &&
    Number.isSafeInteger(item.expiresAt) &&
    item.expiresAt > now &&
    item.expiresAt <= now + 24 * 60 * 60 * 1000
  )
}

export function readDemoSession() {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null')
    return validSession(saved) ? saved : null
  } catch {
    return null
  }
}

export function safeReturnRoute(value: unknown, role: UserRole) {
  if (typeof value !== 'string' || !/^\/[a-z0-9/_-]+$/i.test(value)) return getDefaultRoute(role)
  const route = Object.keys(routePaths).find(
    (key) =>
      value === routePaths[key as AppRouteId] ||
      (key === 'cases' && /^\/cases\/[a-z0-9_-]+$/i.test(value)),
  ) as AppRouteId | undefined
  return route && routeAccess[route].includes(role) ? value : getDefaultRoute(role)
}
