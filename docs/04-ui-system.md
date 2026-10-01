# UI system

The operator workspace uses warm neutral content surfaces, charcoal navigation, and orange primary actions. Critical, high, medium, and low incident priorities have separate labeled colors; status is distinct from severity.

`src/index.css` defines theme tokens and shared primitives. `workspace.css` owns the shell; `dashboard.css` and `campus-map.css` own operations; `dialogs.css` owns modal and review surfaces; `product-pages.css` covers supporting modules; `responsive.css` contains final viewport overrides. Theme tokens are applied by `src/theme/strathmore.ts`.

Use concise page headings, bordered panels, clear empty states, labeled inputs, and action feedback. Avoid decorative compliance blocks inside normal workflows. Evidence provenance belongs alongside evidence; the shell identifies sample data.

Incident review and global search use Radix dialogs with focus trapping and Escape handling. Overview tabs support arrow keys, Home, and End. The mobile navigation restores focus on close and hides off-screen links. Tables scroll within their panel on small screens. Motion respects the reduced-motion preference.

The original `design/design.pen` is retained as a historical mockup. The implemented React workspace is the current design reference. See `product-redesign.md` for product decisions and remaining backend work.
