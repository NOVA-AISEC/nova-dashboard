import { useMemo, useState } from 'react'
import { campusZones, vehicleSightings } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDateTime } from '@/lib/formatters'

export function VehiclesPage() {
  const [zone, setZone] = useState('all')
  const [vehicleType, setVehicleType] = useState('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(
    () =>
      vehicleSightings.filter((item) => {
        const matchesZone = zone === 'all' || item.zone === zone
        const matchesType = vehicleType === 'all' || item.type === vehicleType
        const matchesQuery =
          !query.trim() ||
          [item.color, item.type, item.direction, item.zone, item.attributes.join(' ')].join(' ').toLowerCase().includes(query.trim().toLowerCase())

        return matchesZone && matchesType && matchesQuery
      }),
    [query, vehicleType, zone],
  )

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Mobility Search"
        title="Vehicles"
        description="Search vehicle sightings by time, zone, color, type, and directional attributes. No biometrics, no facial recognition, and no plate OCR are used."
      />

      <Card className="bg-primaryDeep">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-3">
          <label className="space-y-2">
            <span className="eyebrow text-[10px]">Zone</span>
            <Select value={zone} onChange={(event) => setZone(event.target.value)}>
              <option value="all">All zones</option>
              {campusZones.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow text-[10px]">Type</span>
            <Select value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
              <option value="all">All types</option>
              {Array.from(new Set(vehicleSightings.map((item) => item.type))).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2">
            <span className="eyebrow text-[10px]">Search</span>
            <Input value={query} placeholder="Color, direction, or attribute" onChange={(event) => setQuery(event.target.value)} />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.id} className="bg-primaryDeep">
            <CardHeader className="border-b border-surfaceMuted/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.color} {item.type}</CardTitle>
                  <CardDescription>{item.zone}</CardDescription>
                </div>
                <Badge className="badge-panel">{item.direction}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="text-sm text-textSecondary">{formatDateTime(item.timestamp)}</div>
              <div className="flex flex-wrap gap-2">
                {item.attributes.map((attribute) => (
                  <Badge key={attribute} className="badge-panel">{attribute}</Badge>
                ))}
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-textSecondary">
                Human validation required · {item.linkedAlertId ? `linked alert ${item.linkedAlertId}` : 'no linked alert'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
