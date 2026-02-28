/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  getDefaultRoute,
  roleShifts,
  type UserRole,
} from '@/app/access'

const SESSION_STORAGE_KEY = 'nova.session'

export interface SessionUser {
  token: string
  name: string
  email: string
  role: UserRole
  shift: string
}

interface SignInPayload {
  email: string
  password: string
  role?: UserRole
}

interface AuthContextValue {
  session: SessionUser | null
  signIn: (payload: SignInPayload) => Promise<SessionUser>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function persistSession(session: SessionUser | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function inferRoleFromEmail(email: string) {
  const localPart = email.trim().toLowerCase().split('@')[0] ?? ''

  if (localPart.startsWith('guard')) {
    return 'guard' as const
  }

  if (localPart.startsWith('admin')) {
    return 'admin' as const
  }

  if (localPart.startsWith('supervisor')) {
    return 'supervisor' as const
  }

  return 'analyst' as const
}

function toDisplayName(email: string) {
  const localPart = email.split('@')[0] ?? 'campus.operator'
  return localPart
    .split(/[.\-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(() => readStoredSession())

  useEffect(() => {
    persistSession(session)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      async signIn({ email, password, role }) {
        const normalizedEmail = email.trim().toLowerCase()

        if (!normalizedEmail || !normalizedEmail.includes('@')) {
          throw new Error('Enter a valid university email address.')
        }

        if (password.trim().length < 6) {
          throw new Error('Password must be at least 6 characters in local mode.')
        }

        const resolvedRole = import.meta.env.DEV && role ? role : inferRoleFromEmail(email)
        const nextSession: SessionUser = {
          token: `local-${Date.now()}`,
          email: normalizedEmail,
          role: resolvedRole,
          name: toDisplayName(normalizedEmail),
          shift: roleShifts[resolvedRole],
        }

        setSession(nextSession)
        return nextSession
      },
      logout() {
        setSession(null)
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export function PublicOnlyRoute() {
  const { session } = useAuth()
  const location = useLocation()
  const from = typeof location.state === 'object' ? location.state?.from : undefined

  if (session) {
    return <Navigate replace to={typeof from === 'string' ? from : getDefaultRoute(session.role)} />
  }

  return <Outlet />
}

export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate replace to="/login" state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function RequireRole({
  allowed,
  children,
}: {
  allowed: UserRole[]
  children: ReactNode
}) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate replace to="/login" />
  }

  if (!allowed.includes(session.role)) {
    return <Navigate replace to={getDefaultRoute(session.role)} />
  }

  return <>{children}</>
}
