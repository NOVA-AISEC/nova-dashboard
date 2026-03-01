import { useState } from 'react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { campusZones } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { readOperatorPreferences, writeOperatorPreferences } from '@/lib/operator-storage'

export function SettingsPage() {
  const [preferences, setPreferences] = useState(() => readOperatorPreferences())

  function update<K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) {
    const nextPreferences = { ...preferences, [key]: value }
    setPreferences(nextPreferences)
    writeOperatorPreferences(nextPreferences)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Local Preferences"
        title="Preferences"
        description="Operator defaults stored in localStorage only. Compliance controls stay enforced and cannot be disabled here."
      />

      <Card className="bg-primaryDeep">
        <CardHeader className="border-b border-surfaceMuted/20">
          <CardTitle>Workspace defaults</CardTitle>
          <CardDescription>These settings tune the local view without changing policy guardrails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="flex items-center justify-between gap-4 border border-surfaceMuted/20 bg-primaryDark px-4 py-3">
            <div className="space-y-1">
              <div className="font-medium">Theme mode</div>
              <div className="text-sm text-textSecondary">Switch between Strathmore light and dark workspace modes.</div>
            </div>
            <ThemeToggle />
          </div>

          <label className="block space-y-2">
            <span className="eyebrow text-[10px]">Default zone</span>
            <Select value={preferences.defaultZone} onChange={(event) => update('defaultZone', event.target.value)}>
              {campusZones.map((zone) => (
                <option key={zone.id} value={zone.name}>{zone.name}</option>
              ))}
            </Select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <button className="flex items-center justify-between border border-surfaceMuted/20 bg-primaryDark px-4 py-3 text-left" onClick={() => update('autoPrintShiftBrief', !preferences.autoPrintShiftBrief)}>
              <span>Auto-open shift brief after export</span>
              <Badge className="badge-panel">{preferences.autoPrintShiftBrief ? 'On' : 'Off'}</Badge>
            </button>
            <button className="flex items-center justify-between border border-surfaceMuted/20 bg-primaryDark px-4 py-3 text-left" onClick={() => update('compactTables', !preferences.compactTables)}>
              <span>Compact table density</span>
              <Badge className="badge-panel">{preferences.compactTables ? 'On' : 'Off'}</Badge>
            </button>
          </div>

          <div className="notice-panel flex items-center justify-between gap-4 border border-dashed p-4 text-sm">
            <span>Biometrics disabled and snapshots + metadata only remain locked by policy.</span>
            <Button variant="outline">Local only</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
