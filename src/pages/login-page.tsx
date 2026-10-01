import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Camera, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { roleLabels, type UserRole } from '@/app/access'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useMockApi } from '@/lib/env'
import { safeReturnRoute } from '@/lib/session'

export function LoginPage() {
  const { signIn, error: sessionError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(useMockApi ? 'supervisor@strathmore.local' : '')
  const [password, setPassword] = useState(useMockApi ? 'nova123' : '')
  const [role, setRole] = useState<UserRole>('supervisor')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const session = await signIn({ email, password, role })
      const from = typeof location.state === 'object' ? location.state?.from : undefined
      navigate(safeReturnRoute(from, session.role), { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <span className="nova-symbol">n</span>
          <strong>
            NOVA<span>.</span>
          </strong>
        </div>
        <div className="login-message">
          <p>CAMPUS SECURITY, CONNECTED</p>
          <h1>
            Clarity in every
            <br />
            critical moment<span>.</span>
          </h1>
          <p>
            One workspace for your campus, your team,
            <br className="hidden sm:block" /> and the decisions that keep everyone safe.
          </p>
          <div className="login-mini-dashboard">
            <div>
              <span className="status-dot" />
              STRATHMORE CAMPUS<span>Sample workspace</span>
            </div>
            <div className="login-radar">
              <span />
              <span />
              <span />
              <i className="radar-center">
                <ShieldCheck size={30} />
              </i>
              <i className="radar-point radar-p1" />
              <i className="radar-point radar-p2" />
              <i className="radar-point radar-p3" />
            </div>
            <div className="login-mini-footer">
              <span>
                <Camera size={14} />
                Campus coverage
              </span>
              <span>
                <ShieldCheck size={14} />
                Human-led response
              </span>
            </div>
          </div>
        </div>
        <footer>
          <span>NOVA by DAMA LTD</span>
          <span>Built for better campus operations.</span>
        </footer>
      </section>
      <section className="login-form-section">
        <div className="login-topbar">
          <span className="demo-pill">{useMockApi ? 'Demo workspace' : 'API workspace'}</span>
          <ThemeToggle compact />
        </div>
        <div className="login-form-wrap">
          <span className="login-form-icon">
            <LockKeyhole size={23} />
          </span>
          <h2>Welcome back.</h2>
          <p>Sign in to your Strathmore operations workspace.</p>
          <form onSubmit={(event) => void submit(event)}>
            <label htmlFor="operator-email">Work email</label>
            <input
              id="operator-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <label htmlFor="operator-password">Password</label>
            <div className="password-input">
              <input
                id="operator-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {useMockApi && import.meta.env.DEV && (
              <>
                <label htmlFor="operator-role">Preview as</label>
                <select
                  id="operator-role"
                  value={role}
                  onChange={(event) => {
                    const nextRole = event.target.value as UserRole
                    setRole(nextRole)
                    setEmail(`${nextRole}@strathmore.local`)
                  }}
                >
                  {(['guard', 'analyst', 'supervisor', 'admin'] as const).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </>
            )}
            {(error || sessionError) && (
              <p className="action-error" role="alert">
                {error || sessionError}
              </p>
            )}
            <Button type="submit" disabled={busy}>
              {busy ? 'Opening workspace…' : 'Open workspace'}
              <ArrowRight size={16} />
            </Button>
          </form>
          <div className="login-demo-note">
            <ShieldCheck size={18} />
            <p>
              {useMockApi
                ? 'This preview uses sample data and local sign-in. The demo credentials are prefilled so you can explore the workspace.'
                : 'Use your configured operator account. Your access is verified by the server. Operational records remain sample data.'}
            </p>
          </div>
        </div>
        <footer>Strathmore University · Nairobi, Kenya</footer>
      </section>
    </div>
  )
}
