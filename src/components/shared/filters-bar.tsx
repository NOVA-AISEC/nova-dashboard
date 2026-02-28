import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterGroup {
  id: string
  label: string
  value: string
  options: FilterOption[]
}

interface FiltersBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  groups: FilterGroup[]
  onGroupChange: (groupId: string, value: string) => void
  rightSlot?: ReactNode
  className?: string
}

export function FiltersBar({
  searchValue,
  onSearchChange,
  placeholder = 'Search snapshots, cameras, zones, or tags',
  groups,
  onGroupChange,
  rightSlot,
  className,
}: FiltersBarProps) {
  return (
    <Card className={cn('bg-panel', className)}>
      <CardContent className="space-y-5 pt-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              value={searchValue}
              placeholder={placeholder}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          {rightSlot ? <div className="flex flex-wrap gap-3">{rightSlot}</div> : null}
        </div>

        <div className="flex flex-wrap gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex flex-wrap items-center gap-2 border border-border bg-background px-3 py-2"
            >
              <span className="eyebrow text-[10px]">{group.label}</span>
              {group.options.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={group.value === option.value ? 'default' : 'ghost'}
                  className={cn(
                    'h-8 px-2.5',
                    group.value === option.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-transparent bg-transparent',
                  )}
                  onClick={() => onGroupChange(group.id, option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
