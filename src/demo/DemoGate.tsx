import { LockKeyhole } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { NovaLogo } from '@/components/shared/nova-logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { demoPassword, isDemoGateEnabled } from '@/lib/env'

const DEMO_UNLOCK_KEY = 'demo_unlocked'

function readSessionUnlockedState() {
  try {
    return window.sessionStorage.getItem(DEMO_UNLOCK_KEY) === 'true'
  } catch {
    return false
  }
}

function readUnlockedState() {
  if (!isDemoGateEnabled || typeof window === 'undefined') {
    return !isDemoGateEnabled
  }

  return readSessionUnlockedState()
}

function persistUnlockedState() {
  try {
    window.sessionStorage.setItem(DEMO_UNLOCK_KEY, 'true')
  } catch {
    // Ignore storage failures and keep access in memory for the current render.
  }
}

export function DemoGate({ children }: { children: ReactNode }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(() => readUnlockedState())

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isDemoGateEnabled) {
      setIsUnlocked(true)
      return
    }

    if (password === demoPassword) {
      persistUnlockedState()
      setIsUnlocked(true)
      setError(null)
      setPassword('')
      return
    }

    setError('Incorrect demo password.')
  }

  if (!isDemoGateEnabled || isUnlocked) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-surface px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden">
          <CardHeader className="space-y-4 border-b border-surfaceMuted/20">
            <div className="inline-flex max-w-fit rounded-[1.25rem] bg-white px-4 py-3 shadow-[0_18px_36px_rgba(2,51,141,0.12)]">
              <NovaLogo className="w-40 max-w-full" />
            </div>
            <div className="space-y-2">
              <div className="eyebrow flex items-center gap-2 text-[10px]">
                <LockKeyhole className="h-3.5 w-3.5" />
                Stakeholder Demo Access
              </div>
              <CardTitle>Unlock this preview</CardTitle>
              <CardDescription>
                This password gate is optional and only active for builds that define
                `VITE_DEMO_PASSWORD`.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="eyebrow text-[10px]">Demo password</span>
                <Input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  placeholder="Enter stakeholder password"
                  onChange={(event) => {
                    setPassword(event.target.value)
                    if (error) {
                      setError(null)
                    }
                  }}
                />
              </label>

              {error ? (
                <div className="border border-danger bg-primaryDeep px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" type="submit">
                Unlock demo
              </Button>
            </form>

            <p className="text-sm text-textSecondary">
              Access is stored in `sessionStorage` under `demo_unlocked` and resets when
              this tab closes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
