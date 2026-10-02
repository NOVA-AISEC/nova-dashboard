# Routing and layout

All authenticated pages render within `AppShell`. `RequireAuth` sends signed-out users to `/login`; `RequireRole` redirects disallowed routes to the role's default overview. Local role gates support preview use and require server-side equivalents for production.

| Route | Roles | Screen |
| --- | --- | --- |
| `/intelligence`, `/command`, `/missions`, `/playbooks` | All | Intelligence, assessment, response, procedures |
| `/systems` | Supervisor, admin | Engine and integration readiness |
| `/ops`, `/alerts` | All | Overview, incident inbox |
| `/queue`, `/reports` | Guard, supervisor, admin | Queue and incident intake |
| `/cases`, `/cases/:id`, `/search`, `/vehicles`, `/audit` | Analyst, supervisor, admin | Investigation tools |
| `/traffic`, `/zones`, `/events`, `/exports`, `/settings` | Supervisor, admin | Campus coordination and preferences |
| `/users` | Admin | Team and access roster |
| `/login` | Signed out | Local demo sign-in |
| `*` | Authenticated | Not found |

Navigation is grouped and filtered by `getAllowedNavigation` in `src/app/access.tsx`. The shell displays the selected page, global search, review notifications, theme controls, account actions, and sample workspace context. Queue and review counts come from `useOperations`, which refreshes after operational changes.

The default landing is `/intelligence`. Entity selection uses a namespaced `entity` query parameter, such as `incident:alt-705`, so incidents and evidence cannot collide. The view, depth, entity filters and questions remain local interaction state. Account/role/session changes remount the authenticated workspace; graph refreshes invalidate old query answers. Intelligence links into Command and Missions with their existing incident/mission selection parameters.

Desktop uses fixed charcoal navigation and a sticky header. Smaller screens use a slide-out navigation panel with Escape handling, focus cycling, and focus restoration. Off-screen navigation is hidden from keyboard and accessibility access. Global search and incident review use Radix dialogs.

The overview has sections for campus conditions, recorded activity, and camera coverage. Other pages use the shared panel, filter, form, table, and empty-state patterns documented in `04-ui-system.md` and `05-features.md`.
