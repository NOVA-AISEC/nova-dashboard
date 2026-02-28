import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function LoadingPanel({
  lines = 3,
  className = '',
}: {
  lines?: number
  className?: string
}) {
  return (
    <Card className={`bg-primaryDeep ${className}`.trim()}>
      <CardContent className="space-y-3 pt-5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse bg-surfaceMuted"
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
    <Card className="bg-primaryDeep">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-textSecondary">{message}</CardContent>
    </Card>
  )
}
