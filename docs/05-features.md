# Features

NOVA is designed around a control-room operator's sequence: understand campus conditions, review an incident, acknowledge ownership, and coordinate through a case.

- **Overview:** derived incident/case counts, sample camera availability, interactive schematic campus map, prioritized review cards, compact queue, team ownership, recorded activity, and camera inventory.
- **Queue:** priority ordering, search, status/severity filters, list and board layouts, incident review, and direct case navigation.
- **Alerts:** full history, camera/date/status/priority filters, snapshot context, and acknowledgement of new incidents. Acknowledgement does not mean human validation, containment, or closure.
- **Cases:** searchable case list, creation form, investigation summary, timeline, linked alerts, evidence, and downloadable case brief.
- **Reports:** validated local intake, saved observations, default location preference, and visible save errors. Saving a report does not dispatch a team or automatically create a queue alert.
- **Evidence search:** description, camera and date filters, snapshot preview, provenance, and linked case navigation.
- **Mobility:** vehicle attributes, recorded dates, zones, linked incident review, and filtered traffic advisories.
- **Campus:** searchable sample camera inventory and event coverage context.
- **Administration:** JSON evidence manifests, searchable/downloadable audit log, read-only team roster, theme and table preferences.
- **Workspace:** role-aware navigation and search, notifications, keyboard shortcuts, responsive shell, light/dark themes, and printable HTML shift handovers.

In default mock mode, acknowledgements, newly created cases, and associated audit events persist under `nova.operations.v2`. Shift notes, reports, and preferences use the existing `dama-sentinel.*` browser keys. Views refresh after operational changes; same-origin tabs receive storage-change events. The cache is local to the browser, uses last-write-wins behavior, and is not a multi-user database.

Seed operational records describe 28 February 2026 and remain labeled as sample data. The map is schematic, camera status is seeded, and evidence images are sample snapshots. Mock login and frontend role gates are for preview use; production identity, server authorization, campus integrations, and durable shared storage remain to be implemented.
