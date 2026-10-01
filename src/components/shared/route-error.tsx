import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

export function RouteError() {
  const error = useRouteError()
  const missing = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="empty-state min-h-screen" role="alert">
      <strong>{missing ? 'Page unavailable' : 'This workspace could not be displayed'}</strong>
      <p>
        {missing
          ? 'The requested page could not be found.'
          : 'Reload the page to recover your workspace. Saved records will remain available.'}
      </p>
      <div className="flex gap-3">
        <button className="quiet-button" onClick={() => window.location.reload()}>
          Reload workspace
        </button>
        <a className="text-link" href="/ops">
          Return to operations
        </a>
      </div>
    </main>
  )
}
