import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoadingPanel({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <Card className={`bg-panel ${className}`.trim()}>
      <CardContent className="space-y-3 pt-5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse bg-muted"
            style={{ width: `${100 - index * 12}%` }}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function ErrorPanel({
  title = 'Unable to load data',
  message,
}: {
  title?: string
  message: string
}) {
  return (
    <Card className="bg-panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}
