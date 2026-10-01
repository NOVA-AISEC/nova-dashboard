/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDefaultRoute, roleShifts, type UserRole } from '@/app/access'
import { HttpError, request, SESSION_EXPIRED, setCsrfToken } from '@/api/transport'
import { useMockApi } from '@/lib/env'
import {
  DEMO_SESSION_MS,
  readDemoSession,
  safeReturnRoute,
  SESSION_STORAGE_KEY,
  validSession,
  type SessionUser,
} from '@/lib/session'
export type { SessionUser } from '@/lib/session'

interface SignInPayload {
  email: string
  password: string
  role?: UserRole
}
interface AuthContextValue {
  session: SessionUser | null
  isLoading: boolean
  error: string
  signIn: (payload: SignInPayload) => Promise<SessionUser>
  logout: () => void
}
const AuthContext = createContext<AuthContextValue | null>(null)
function inferRole(email: string): UserRole {
  return (
    (['guard', 'admin', 'supervisor'] as const).find((role) => email.startsWith(role)) ?? 'analyst'
  )
}
function displayName(email: string) {
  return email
    .split('@')[0]
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(() =>
    useMockApi ? readDemoSession() : null,
  )
  const [isLoading, setLoading] = useState(!useMockApi)
  const [error, setError] = useState('')
  useEffect(() => {
    if (useMockApi) return
    let cancelled = false
    request<unknown>('/api/auth/session', undefined, false)
      .then((saved) => {
        if (
          !validSession(saved) ||
          typeof saved.csrfToken !== 'string' ||
          !/^[a-f0-9]{64}$/.test(saved.csrfToken)
        )
          throw new Error('The server returned an invalid session.')
        if (!cancelled) {
          setCsrfToken(saved.csrfToken)
          setSession(saved)
        }
      })
      .catch((failure: unknown) => {
        if (!cancelled && !(failure instanceof HttpError && failure.status === 401))
          setError(failure instanceof Error ? failure.message : 'Unable to verify your session.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    const expire = () => {
      setCsrfToken('')
      setSession(null)
      setError('Your session has expired. Please sign in again.')
    }
    const sync = (event: StorageEvent) => {
      if (useMockApi && (event.key === SESSION_STORAGE_KEY || event.key === null))
        setSession(readDemoSession())
    }
    window.addEventListener(SESSION_EXPIRED, expire)
    window.addEventListener('storage', sync)
    const timer = session
      ? window.setTimeout(expire, Math.max(0, session.expiresAt - Date.now()))
      : undefined
    return () => {
      window.removeEventListener(SESSION_EXPIRED, expire)
      window.removeEventListener('storage', sync)
      window.clearTimeout(timer)
    }
  }, [session])
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      error,
      async signIn({ email, password, role }) {
        const normalized = email.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254)
          throw new Error('Enter a valid work email address.')
        if (!password || password.length > 256 || (useMockApi && password.trim().length < 6))
          throw new Error('Enter a valid password.')
        let next: SessionUser
        setError('')
        if (useMockApi) {
          const resolvedRole = import.meta.env.DEV && role ? role : inferRole(normalized)
          next = {
            name: displayName(normalized),
            email: normalized,
            role: resolvedRole,
            shift: roleShifts[resolvedRole],
            expiresAt: Date.now() + DEMO_SESSION_MS,
          }
          try {
            window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next))
          } catch {
            setError(
              'Browser storage is unavailable. Demo sign-in will last until this page is closed.',
            )
          }
        } else {
          const saved = await request<unknown>(
            '/api/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ email: normalized, password }),
            },
            false,
          )
          if (
            !validSession(saved) ||
            typeof saved.csrfToken !== 'string' ||
            !/^[a-f0-9]{64}$/.test(saved.csrfToken)
          )
            throw new Error('The server returned an invalid session.')
          next = saved
          setCsrfToken(saved.csrfToken)
        }
        setSession(next)
        return next
      },
      logout() {
        setError('')
        if (useMockApi) {
          try {
            window.localStorage.removeItem(SESSION_STORAGE_KEY)
          } catch {
            setError(
              'Browser storage could not be cleared. Clear site storage before using a shared device.',
            )
          }
          setSession(null)
          return
        }
        void request('/api/auth/logout', { method: 'POST' })
          .then(() => {
            setCsrfToken('')
            setSession(null)
          })
          .catch((failure: unknown) => {
            setError(
              failure instanceof Error ? failure.message : 'Sign-out failed. Please try again.',
            )
          })
      },
    }),
    [session, isLoading, error],
  )
  return (
    <AuthContext.Provider value={value}>
      {error && session && (
        <div className="action-error" role="alert">
          {error}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading)
    return (
      <div className="empty-state" role="status">
        Verifying your session…
      </div>
    )
  if (session) return <Navigate replace to={safeReturnRoute(location.state?.from, session.role)} />
  return <Outlet />
}
export function RequireAuth() {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  if (isLoading)
    return (
      <div className="empty-state" role="status">
        Verifying your session…
      </div>
    )
  if (!session) return <Navigate replace to="/login" state={{ from: location.pathname }} />
  // A new login/account/role must not inherit cached records, dialogs or action drafts.
  return <Outlet key={JSON.stringify([session.email, session.role, session.expiresAt])} />
}
export function RequireRole({ allowed, children }: { allowed: UserRole[]; children: ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate replace to="/login" />
  if (!allowed.includes(session.role))
    return <Navigate replace to={getDefaultRoute(session.role)} />
  return <>{children}</>
}
