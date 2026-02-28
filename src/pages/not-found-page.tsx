import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-xl bg-panel">
        <CardHeader>
          <p className="eyebrow">404</p>
          <CardTitle className="text-3xl">Requested surface is unavailable</CardTitle>
          <CardDescription>
            The route does not map to a NOVA workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link className={buttonVariants({ variant: 'outline' })} to="/ops">
            Return to operations
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
