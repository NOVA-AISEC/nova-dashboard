import { useState } from 'react'
import { Check, MoonStar, Monitor, Sun } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { campusZones } from '@/data/mock-data'
import { useThemeMode } from '@/hooks/use-theme-mode'
import { readOperatorPreferences, writeOperatorPreferences } from '@/lib/operator-storage'

export function SettingsPage() {
  const [preferences, setPreferences] = useState(readOperatorPreferences)
  const { themeMode, setThemeMode } = useThemeMode()
  const [saveError, setSaveError] = useState('')
  function update<K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) {
    const next = { ...preferences, [key]: value }
    try {
      writeOperatorPreferences(next)
      setPreferences(next)
      setSaveError('')
    } catch {
      setSaveError('Preferences could not be saved. Check browser storage and try again.')
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Make the workspace work for your shift. Preferences are saved in this browser."
      />
      {saveError && (
        <p className="action-error" role="alert">
          {saveError}
        </p>
      )}
      <section className="workspace-panel settings-panel">
        <div className="panel-header">
          <h2>
            <Monitor size={17} />
            Appearance
          </h2>
          <span className="settings-saved">
            <Check size={13} />
            Saved automatically
          </span>
        </div>
        <div className="settings-content">
          <div className="settings-description">
            <h3>Workspace theme</h3>
            <p>Choose a comfortable view for your environment.</p>
          </div>
          <div className="theme-options">
            {[
              { id: 'light' as const, label: 'Light', icon: Sun },
              { id: 'dark' as const, label: 'Dark', icon: MoonStar },
            ].map((mode) => (
              <button
                key={mode.id}
                aria-pressed={themeMode === mode.id}
                className={themeMode === mode.id ? 'selected' : ''}
                onClick={() => setThemeMode(mode.id)}
              >
                <mode.icon size={21} />
                <span>{mode.label}</span>
                {themeMode === mode.id && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>
      </section>
      {saveError && (
        <p className="action-error" role="alert">
          {saveError}
        </p>
      )}
      <section className="workspace-panel settings-panel">
        <div className="panel-header">
          <h2>Operator defaults</h2>
        </div>
        <div className="settings-content">
          <div className="settings-description">
            <h3>Default reporting zone</h3>
            <p>Preselect this location when you log an incident.</p>
          </div>
          <select
            aria-label="Default reporting zone"
            value={preferences.defaultZone}
            onChange={(event) => update('defaultZone', event.target.value)}
          >
            {campusZones.map((zone) => (
              <option key={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>
        <div className="settings-content">
          <div className="settings-description">
            <h3>Compact incident tables</h3>
            <p>Reduce row spacing to see more incidents at once.</p>
          </div>
          <button
            role="switch"
            aria-checked={preferences.compactTables}
            aria-label="Compact incident tables"
            className={`toggle-switch ${preferences.compactTables ? 'on' : ''}`}
            onClick={() => update('compactTables', !preferences.compactTables)}
          >
            <span />
          </button>
        </div>
      </section>
      <div className="notice-panel">
        <Check size={17} />
        <p>
          Evidence uses snapshots and metadata. Human validation remains required for operational decisions.
        </p>
      </div>
    </div>
  )
}
