# NOVA intelligence workspace

Intelligence is the default landing for an authenticated operator. It connects existing records into an ontology rather than adding a separate collection of simulated intelligence. The eight object types are incidents, evidence, cases, cameras, locations, teams, assessments, and missions. The Nova Sentinel brand stays intact.

## Explore and decide

The object explorer filters by type or text. Selecting an entity reveals a one-hop graph; two hops expand the neighborhood. Nodes support keyboard selection, and the Details/Links/Gaps inspector remains available alongside the graph. Each link describes its recorded basis. Evidence and Timeline views use the same selected context; timestamped events retain their source references. The graph canvas displays at most 21 entities at once, while the inspector and object list let the operator navigate the full bounded graph.

An incident can create a saved sample assessment through the existing API. Open decision workspace carries the incident into Command; mission and case objects link to their existing records. Assessment, supervisor approval and mission progression retain the current authorization, freshness, revision and audit rules.

## Query engine

Ask NOVA supports five retrieval modes: connections, evidence, verification gaps, timeline and response. Suggested questions select an explicit mode; typed questions select a supported mode by keywords. Without a selected entity, text retrieval ranks visible record IDs, titles and descriptions. No match returns an explicit empty result. Unsupported questions return supported-query guidance without inventing an answer.

The provider is `local-rules`: this is deterministic source retrieval, not generative inference. YOLOv8n remains a placeholder reading sample metadata; no weights, cameras, hosted LLM, or free-form agent tools are introduced. This release establishes the ontology/query boundary for a future model while keeping present capabilities visible in the product.

Queries start at the selected entity, include its immediate links, and expand once through incident, case, assessment or mission records. They do not expand through a shared team, camera or location alone. Camera/location queries can directly retrieve their associated records, but identical values do not assert causation. Every returned claim cites an entity that is visible in the query context; no source-less claim is accepted. Results are limited to 30 claims.

Missing snapshots and mismatched camera IDs produce source-cited verification gaps. Open incidents carry a separate current-conditions gap; stored observations cannot prove present conditions or intent. Historical assessment text remains a saved assessment, with its provider, actor and timestamp visible. It does not become a new verified fact.

## Access, refresh and capacity

The shared engine applies role filtering in both modes. Guards have no case nodes, case links or case timeline, and receive only their own case-free assessments and associated missions. The API derives identity from verified sessions. Query POSTs require CSRF, exact Origin/Host, and bounded JSON; body role/tool fields are rejected. Queries do not mutate records or execute actions.

Each graph includes at most 600 incidents, 600 snapshots, 300 cases, 200 visible assessments and 200 associated missions, capped at 2,000 entities and 6,000 links. Timeline and gap collections are capped at 6,000 and 2,000 entries. The `omitted` field and UI notice identify a partial view. Normal record workspaces retain full records; graph absence cannot establish that a record never existed. This bounded projection is intended for the current local service; a production-scale graph needs server-side indexing and pagination.

Operational changes and security-workspace storage events refresh the graph. Refreshes invalidate prior answers; entity selection cancels display of stale in-flight results. Account, role and new-session changes remount the complete authenticated workspace, clearing prior data, queries, source selection and action drafts.

Export brief downloads a JSON snapshot containing the selected entity, graph neighborhood/depth, source metadata, verification gaps, query result when still current, all cited source records even if they fall outside the displayed graph depth, and explicit sample/engine provenance. It remains a local file. Query history is ephemeral; it is not a durable investigation note or immutable audit record.

## Verification

`npm run test:intelligence` covers exact relationship bases, source citations, isolated records, invalid requests, camera mismatches, unavailable evidence, graph limits, HTTP session/CSRF boundaries, guard filtering, and browser API parity. `npm run test:account-boundary` mounts the actual Intelligence page, retrieves a gap answer, follows a citation, checks exported JSON, and verifies that switching to a guard clears the previous answer and removes case context. The existing Security OS, operations, API, resilience, lint and production-build checks remain required.

Browser review checked the graph, explicit two-hop expansion, keyboard entity selection, source-cited camera mismatch, linked snapshot view, mission/case timeline, light/dark appearance, and mobile layout without page overflow. Viewport overrides were reset after verification. Review images are in `design/review/intelligence-workspace.jpg` and `design/review/intelligence-citations.jpg`. Export generation and its downloaded file payload are verified by the React test; a browser download was initiated, but the browser's saved-file location was not confirmed.
