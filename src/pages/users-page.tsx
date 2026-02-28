import { campusUsers } from '@/data/mock-data'
import { SectionHeader } from '@/components/shared/section-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UsersPage() {
  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="RBAC View"
        title="Users & Roles"
        description="Read-only role mapping for local campus operators. Permission changes are not editable in this build."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {campusUsers.map((user) => (
          <Card key={user.id} className="bg-panel">
            <CardHeader className="border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>{user.team}</CardDescription>
                </div>
                <Badge className="badge-high">{user.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5 text-sm text-muted-foreground">{user.accessScope}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
