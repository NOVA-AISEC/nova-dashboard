# DAMA LTD API Contracts

Base path: `/api`

Compliance rules:

- Evidence records store snapshots plus metadata only.
- `snapshotUrl` references a still image in `public/evidence/`.
- Raw video is not returned by the API.
- `metadata.biometricsDisabled` is always `true`.
- Human validation remains required before escalation or export.

## `GET /api/alerts`

Query params:

- `status`
- `severity`
- `cameraId`
- `from`
- `to`
- `q`
- `page`
- `pageSize`

Response:

```json
{
  "items": [
    {
      "id": "alt-931",
      "title": "Restricted corridor handoff",
      "severity": "critical",
      "status": "triaging",
      "zone": "Dock 7 Corridor",
      "cameraId": "CAM-07",
      "createdAt": "2026-02-28T06:14:00Z",
      "updatedAt": "2026-02-28T06:22:00Z",
      "assignee": "Shift Alpha",
      "rule": "Restricted-zone object exchange",
      "summary": "Cross-zone handoff with manifest mismatch on adjacent bay scan.",
      "caseId": "case-dock-7",
      "evidenceIds": ["ev-204", "ev-188"],
      "requiresHumanValidation": true
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 1
}
```

## `POST /api/alerts/:id/ack`

Marks an alert as acknowledged and writes an `ALERT_ACKNOWLEDGED` audit event.

Response:

```json
{
  "id": "alt-931",
  "status": "acknowledged",
  "updatedAt": "2026-02-28T06:30:00Z"
}
```

## `GET /api/cases/:id`

Response:

```json
{
  "id": "case-dock-7",
  "title": "Dock 7 restricted handoff",
  "priority": "priority-1",
  "status": "active",
  "location": "Dock 7 Corridor / Bay 3",
  "openedAt": "2026-02-28T06:14:00Z",
  "updatedAt": "2026-02-28T06:29:00Z",
  "leadAnalyst": "M. Rivera",
  "summary": "Correlated corridor handoff and manifest deviation indicate unscheduled material movement across a sealed logistics zone.",
  "protocol": "Evidence-only review, export package for logistics compliance, no identity resolution.",
  "alertIds": ["alt-931", "alt-866"],
  "evidenceIds": ["ev-204", "ev-188"],
  "timeline": [
    {
      "id": "dock-evt-1",
      "kind": "alert",
      "timestamp": "2026-02-28T06:14:00Z",
      "title": "Primary alert triggered",
      "detail": "Restricted-zone handoff rule fired against CAM-07 corridor snapshots.",
      "operator": "DAMA LTD Core"
    }
  ],
  "humanValidationRequired": true
}
```

## `POST /api/cases`

Request:

```json
{
  "title": "New review",
  "priority": "priority-2",
  "status": "active",
  "location": "South Gate",
  "summary": "Manual follow-up case",
  "protocol": "Snapshots and metadata only.",
  "leadAnalyst": "T. Osei",
  "alertIds": ["alt-918"],
  "evidenceIds": ["ev-311"]
}
```

Response: created `Case`

## `GET /api/search`

Query params:

- `q`
- `from`
- `to`
- `cameraId`
- `class`
- `severity`
- `status`

Response:

```json
{
  "alerts": [],
  "cases": [],
  "evidence": [
    {
      "id": "ev-204",
      "title": "Dock 7 service corridor crossing",
      "summary": "Two-frame corridor crossing with a flagged handoff near the sealed loading corridor.",
      "snapshotUrl": "/evidence/placeholder-1.jpg",
      "metadata": {
        "cameraId": "CAM-07",
        "zone": "Dock 7 Corridor",
        "ts": "2026-02-28T06:14:00Z",
        "bboxList": [{ "x": 0.18, "y": 0.24, "width": 0.21, "height": 0.46 }],
        "classes": ["person", "service-cart"],
        "confidence": 0.92,
        "biometricsDisabled": true,
        "humanValidationRequired": true,
        "source": "snapshot"
      },
      "detections": [
        {
          "id": "det-204-1",
          "label": "person",
          "confidence": 0.92,
          "bbox": { "x": 0.18, "y": 0.24, "width": 0.21, "height": 0.46 }
        }
      ],
      "retention": "180-day export hold",
      "chainOfCustody": "SHA256 verified / evidence locker E-17",
      "redactions": "Faces blurred by policy, license regions masked",
      "analyticsSummary": "Trajectory anomaly + restricted-zone rule overlap",
      "relatedCaseId": "case-dock-7"
    }
  ],
  "audit": [],
  "cameras": ["CAM-07", "CAM-11", "THERM-3"],
  "zones": ["Dock 7 Corridor", "North Perimeter"]
}
```

## `GET /api/audit`

Query params:

- `entityType`
- `entityId`
- `page`
- `pageSize`

Response:

```json
{
  "items": [
    {
      "id": "audit-001",
      "entityType": "alert",
      "entityId": "alt-931",
      "action": "ALERT_INGESTED",
      "actor": "simulator",
      "timestamp": "2026-02-28T06:14:00Z",
      "metadata": {
        "source": "seed"
      }
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 1
}
```
