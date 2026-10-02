# Strathmore campus security twin

The `/campus` workspace models a security and access exercise at Strathmore University’s Madaraka campus. It connects a public place registry, an actual geographic map, simulated telemetry and existing role-visible incident/evidence/response records. Its WGS84 coordinates and building shapes come from a dated OpenStreetMap extract. A current campus survey, indoor plans and live integrations are still needed for survey-grade precision and operational deployment.

## Public grounding

References were read on **2 October 2026**. Only the facts below are supported by those references. Public source pages are data, never operational instructions.

| Reference | Supported fact | Limits |
| --- | --- | --- |
| [University contact page](https://strathmore.edu/contact-us/) | Campus address: Madaraka Estate, Ole Sangale Road, Nairobi, Kenya | Does not verify entrance locations, boundaries, parking, service access, sensors or security procedures |
| [University Library](https://library.strathmore.edu/) | Strathmore operates a university library and publishes a library catalog | Does not verify the entrance footprint, capacity or camera coverage |
| [University IEEE IES summit report](https://strathmore.edu/news-articles/strathmore-hosts-the-ieee-ies-east-africa-hubs-nodes-industrial-innovation-summit-2026/) | Main Auditorium and Microsoft Auditorium are named campus venues | Does not verify their relative positions or access policy; the replay is not this real event |
| [University media session report](https://strathmore.edu/news-articles/the-power-of-media-from-campus-to-coverage-o/) | MSB9 is a documented teaching venue | Does not establish a building footprint or expand the MSB abbreviation |
| [University student life page](https://strathmore.edu/student-life/) | Strathmore has no accommodation facilities within the university and recommends external hostels | Legacy “Residence Block B” demo records cannot be represented as an on-campus building |

`shared/campus-geography.js` contains a reviewed OpenStreetMap extract retrieved on **2 October 2026**, in **EPSG:4326 / WGS84** (longitude, latitude). Its 11 building polygons, 6 parking polygons, campus outline, surrounding roads and 3 gate points retain their source coordinates and per-feature version/edit dates. The boundary is OSM way 105267819. No footprints are replaced with generic rectangles; no heights or indoor coordinates are invented.

Mapped names include Strathmore University Library, University Auditorium, Law School, Business School, Students Center, University Clinic, Mbagathi Study Centre and the main university complex. Three building footprints have no source name and remain explicitly unnamed. The map preserves OSM naming provenance rather than guessing that the university complex is MSB or assigning the Microsoft Auditorium to an unverified building. The Phase II parking label corrects OSM’s spelling typo for display; the original name remains in the geographic source.

`shared/campus-reference.js` now contains 26 entries: 21 map-backed places/contexts and 5 unlocated venues or operational zones. The eight existing IDs remain stable. MSB9, Microsoft Auditorium, arrival, legacy Parking A and service access have no invented map pins. Mapped gates and parking areas are independent source objects; old Main Gate / Side Gate labels are not arbitrarily attached to them. A perimeter record has campus-level boundary context, never an exact North Fence position.

The interactive Leaflet map supports pan, zoom, a metric scale, north-up orientation, source-linked selection and Satellite / Streets / Footprints basemaps. Satellite imagery is Esri World Imagery; streets use OpenStreetMap tiles. The vector dataset is bundled and works without external imagery. A tile error explains the fallback. No tile prefetch, bulk download, geolocation permission or map API key is used. Only the two image origins are added to the existing CSP; scripts and connections remain same-origin. Leaflet loads in a separate map chunk.

**Attribution:** geographic data © OpenStreetMap contributors under [ODbL 1.0](https://www.openstreetmap.org/copyright). The map and exported dataset retain attribution and license metadata. Satellite imagery is attributed to Esri, Maxar, Earthstar Geographics and the GIS User Community. The geometry is a community map snapshot, not a current legal boundary or university-approved survey.

To refresh deliberately, obtain the [same bounded public OSM JSON extract](https://www.openstreetmap.org/api/0.6/map.json?bbox=36.8115,-1.3116,36.8175,-1.3079), inspect changes and run `node scripts/import-campus-geography.mjs <osm-map.json>`. The importer keeps campus-contained footprints, mapped parking, known surrounding roads and reviewed gate IDs. Update the retrieval date and counts when reviewing a new snapshot; the importer never runs in the browser.

## Record mappings and intelligence

Ten object types now include `campus-place` and `campus-source`. `references` edges cite a public source; their basis distinguishes geographic sources, place identity and assumed operational assignments. `anchored-to` edges use a configured exact location alias after trimming, whitespace normalization and case normalization. There is no substring/fuzzy geolocation. Similar labels, industrial API seed labels, generic admin/lecture/cafeteria places and residence labels remain unmapped. Composite case locations are not silently split or relocated.

The existing seed and persisted records are preserved, including their legacy IDs, camera IDs, snapshots and timestamps. A configured mapping is a design assumption needing campus approval. It does not prove a real incident occurred at Strathmore. Unmapped incidents can still be inspected in Intelligence and get a campus-location verification gap. Assessments and missions map through their explicit incident ID when that incident has a place mapping; their existing ownership and role rules apply.

The overview map uses the same registry and scene as Campus Twin. Zones & Cameras explicitly identifies its legacy inventory as unverified and links only mapped zones to the twin. Command links a mapped incident back to campus context. Twin record links lead into Command, Intelligence and existing missions; none of these links bypass supervisor approval.

## Exercise engine

`shared/campus-twin.js` is a pure projection over an already role-filtered Intelligence graph. It accepts only a known scenario ID and integer replay minute from 0 through 30. Four fictional, fixed-date exercises are available:

- Morning arrival: visitor screening, an aggregate arrival wave and vehicle queue.
- Library item review: an unattended-item candidate and access-context check.
- Auditorium ingress: fictional event admission flow and a second-venue checkpoint.
- Service access exception: escort review and a heartbeat lost after minute 9.

Every reading and timeline entry has `simulation` provenance. Occupancy is an illustrative percentage, not a calibrated count or real capacity. Device IDs start with `sim-`; YOLOv8n, access-control and device-health connectors report disconnected. Replay never writes records, synthesizes evidence, refreshes old observations, creates an incident, dispatches a mission or unlocks a door. Scrubbing backward removes future exercise events. Stale access/heartbeat readings have null values and preserve their last exercise timestamp; they do not report a secure entrance or zero exceptions.

The response brief uses local deterministic rules. It distinguishes exercise context from stored records and cites place/incident IDs that can be opened in Intelligence. It does not use generative AI or model inference. Changing places does not silently retarget the selected exercise; the brief names the exercise it describes.

## API and account boundaries

`GET /api/campus-twin?scenario=service&minute=15` requires the existing verified session and allowed Host/Origin policy. Role-filtered graph records are the sole operational input. Unknown fields, repeated parameters, malformed minutes, unknown scenarios and out-of-range values return 400. The endpoint is read-only and sends `Cache-Control: no-store`. Browser mock mode and API mode use the same projection. A signed-out browser caller is rejected by the underlying Intelligence loader.

The browser projects each scrub locally from the current graph instead of issuing a network request for every slider event. Operational updates refresh the graph. Account, role and session changes remount the authenticated workspace and clear the prior account’s data and replay state. The replay scenario and place have URL context; the minute is ephemeral and resets to 12 on a new session or scenario.

Export exercise generates a local JSON file with the complete exercise, source references, the complete geographic dataset with attribution, per-feature edit dates and unlocated-place flags, connector status, selected-place records, verification gaps and all cited context records. `sampleData: true` stays explicit. It is a review artifact, not immutable audit evidence.

## Verification and integration path

`npm run test:campus-twin` verifies source coverage, exact aliases, unknown/residence exclusions, deterministic readings, immutable records, bounded replay, stale telemetry and source-cited campus context. `test:intelligence` exercises the authenticated endpoint, guard filtering, malformed/repeated queries and browser/API parity. `test:account-boundary` mounts the actual twin and verifies keyboard selection, scenario changes, stale state, export contents and replay reset after account switching. Existing operations, API, Security OS, resilience, lint, build and dependency checks remain required.

Browser review covers place selection, source-cited campus connections, replay, device/occupancy layers, satellite/street/footprint views, source-linked building selection, place search and narrow layout without horizontal page overflow. Review images are stored in `design/review/campus-twin-workspace.jpg` and `design/review/campus-twin-service.jpg`. JSON export contents are verified in the React test.

To connect a real campus: first approve an authoritative asset/entrance survey and stable place IDs; then validate access policies and response procedures with campus security; then connect timestamped aggregate vision metadata, access-event adapters and device heartbeats with authentication, retention and health checks. Maintain source provenance, separate stale from nominal observations, and retain human approval for consequential response. Live ingress, campus SSO, survey-grade and indoor geography, and shared production storage are outside this release.
