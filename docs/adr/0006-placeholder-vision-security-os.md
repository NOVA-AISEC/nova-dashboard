# ADR 0006: YOLOv8n placeholder and human-led mission orchestration

Status: Accepted

NOVA needs a vision-centered security operating workflow before live cameras or model infrastructure are connected. The selected foundation is open-source YOLOv8n, with placeholders for this release.

Use a shared, provider-independent engine for bounded source context, deterministic sample assessments, a fixed playbook catalog, and the mission lifecycle. Keep vision frames behind a validated metadata contract. Every sample frame records `inferencePerformed: false` and `provenance: sample-metadata`; connection status remains disconnected. No cloud provider or inference dependency is introduced.

Persist an immutable assessment before mission proposal. Require supervisor approval of fresh source context, then record human outcomes in procedure order. Arbitrary commands and physical integrations are outside the engine's authority. Share lifecycle functions between browser preview and authenticated API, while enforcing API identity and permissions on the server.

This supports reviewable product workflows now and a future local vision adapter without presenting placeholder output as real inference. It adds bounded workflow storage and validation work; archival, managed storage, camera ingestion, real detection, and campus policy integration remain separate implementation steps.
