# Auth and Session

## Summary

Auth is mocked. There is no backend identity provider, no token exchange, and no server-side session validation.

The app stores a local session object in browser `localStorage` under:

```text
nova.session
```

## Session shape

```ts
interface SessionUser {
  token: string
  name: string
  email: string
  role: 'guard' | 'analyst' | 'supervisor' | 'admin'
  shift: string
}
```

## Login flow

```text
LoginPage submit
  -> useAuth().signIn({ email, password, role? })
      -> validate email contains "@"
      -> validate password length >= 6
      -> resolve role
      -> build session object
      -> set React state
      -> persist to localStorage via AuthProvider effect
  -> navigate to:
       location.state.from
       or getDefaultRoute(session.role)
```

## Role resolution

### In development mode

If `import.meta.env.DEV` is true and the user selected a role in the login form, `signIn()` uses the selected role.

### Outside development mode

Role is inferred from the email prefix:

- `guard...` -> `guard`
- `admin...` -> `admin`
- `supervisor...` -> `supervisor`
- anything else -> `analyst`

Example:

- `supervisor@strathmore.local` -> supervisor
- `analyst@strathmore.local` -> analyst

## Display name and shift

Display name is derived from the email local-part:

- `supervisor.ops@...` -> `Supervisor Ops`

Shift comes from `roleShifts` in `src/app/access.tsx`:

- `guard` -> `Shift ALPHA`
- `analyst` -> `Shift CHARLIE`
- `supervisor` -> `Shift BRAVO`
- `admin` -> `Campus Admin`

## Route guards

### `PublicOnlyRoute`

- Allows access to `/login` only when there is no session
- Redirects authenticated users away from `/login`

### `RequireAuth`

- Redirects unauthenticated users to `/login`
- Passes the attempted path in `location.state.from`

### `RequireRole`

- Blocks routes not listed for the current role
- Redirects to the role's default allowed route

## Logout

Logout is purely local:

- `logout()` sets session state to `null`
- the provider effect removes `nova.session` from `localStorage`

Logout is exposed in:

- sidebar footer
- header user menu

## Other browser-stored operator state

These are not auth credentials, but they are session-adjacent local state:

| Storage key | Purpose |
| --- | --- |
| `nova-theme-mode` | light/dark theme selection |
| `dama-sentinel.shift-notes` | Ops handover notes |
| `dama-sentinel.incident-reports` | Reports page submissions |
| `dama-sentinel.preferences` | Preferences page values |

The `dama-sentinel.*` prefix is currently in the codebase and should be treated as an existing implementation detail.

## Security implications

- The session token is synthetic: `local-${Date.now()}`
- Any user with browser access can create a local session
- This is acceptable only for demo/local preview purposes
- Static-host previews should explicitly state that auth is mocked

## Current assumptions

- Sessions are browser-local only
- There is no expiry logic
- There is no refresh token flow
- There is no CSRF/XSRF model because there is no real auth backend
- There is no server-side role enforcement in mock mode
