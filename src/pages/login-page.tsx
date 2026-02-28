import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, ShieldBan } from 'lucide-react'
import { getDefaultRoute, roleLabels, type UserRole } from '@/app/access'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'

const roleOptions: UserRole[] = ['guard', 'analyst', 'supervisor', 'admin']

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('supervisor@strathmore.local')
  const [password, setPassword] = useState('nova123')
  const [role, setRole] = useState<UserRole>('supervisor')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const session = await signIn({ email, password, role })
      const from = typeof location.state === 'object' ? location.state?.from : undefined
      navigate(typeof from === 'string' ? from : getDefaultRoute(session.role), {
        replace: true,
      })
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-primaryDark px-4 py-8 text-surfaceLight sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_28rem]">
        <section className="brand-hero relative overflow-hidden border border-surfaceMuted/20 p-8 text-surfaceLight sm:p-10">
          <div className="brand-hero-overlay absolute inset-0" />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div className="space-y-5">
              <Badge className="brand-hero-chip">
                <LockKeyhole className="h-3.5 w-3.5" />
                NOVA / Strathmore Security Operations
              </Badge>
              <div className="space-y-4">
                <p className="brand-hero-muted eyebrow">Strathmore Security Operations by DAMA LTD</p>
                <h1 className="max-w-2xl font-display text-4xl font-bold tracking-[-0.05em] sm:text-5xl">
                  NOVA keeps Strathmore security operations evidence-first across gates,
                  hostels, lecture blocks, and perimeter patrol.
                </h1>
                <p className="brand-hero-muted max-w-2xl text-base">
                  Login is local-only for now. NOVA preserves snapshots plus metadata,
                  keeps biometrics disabled, and requires human-in-the-loop validation
                  before action.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="brand-hero-card border p-4">
                <p className="brand-hero-muted eyebrow">Operational Modes</p>
                <div className="brand-hero-muted mt-3 space-y-2 text-sm">
                  <div>Triage queue and guard dispatch</div>
                  <div>Incident desk and lost &amp; found</div>
                  <div>Vehicle search by time and zone</div>
                </div>
              </div>
              <div className="brand-hero-card border p-4">
                <p className="brand-hero-muted eyebrow">Compliance</p>
                <div className="brand-hero-muted mt-3 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <ShieldBan className="mt-0.5 h-4 w-4 text-accentGlow" />
                    <span>Biometrics disabled, no facial recognition, no identity inference.</span>
                  </div>
                  <div>Snapshots + metadata only, human validation required.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Card className="self-center bg-primaryDeep">
          <CardHeader className="border-b border-surfaceMuted/20">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Use a local NOVA operator account. Role selection is shown in development
              mode only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="eyebrow text-[10px]">Email</span>
                <Input
                  autoComplete="email"
                  value={email}
                  placeholder="supervisor@strathmore.local"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="eyebrow text-[10px]">Password</span>
                <Input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  placeholder="Minimum 6 characters"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>

              {import.meta.env.DEV ? (
                <label className="block space-y-2">
                  <span className="eyebrow text-[10px]">Role</span>
                  <Select
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole)}
                  >
                    {roleOptions.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleLabels[roleOption]}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : null}

              {error ? (
                <div className="border border-danger bg-primaryDark px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Open NOVA workspace'}
              </Button>
            </form>

            <div className="space-y-3 border-t border-surfaceMuted/20 pt-4 text-sm text-textSecondary">
              <div>Suggested local emails: `guard@`, `analyst@`, `supervisor@`, `admin@`.</div>
              <div>Role is inferred from the email prefix outside development mode.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
