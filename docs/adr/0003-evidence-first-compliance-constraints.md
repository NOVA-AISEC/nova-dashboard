# ADR 0003: Evidence-first compliance constraints across UI and data contracts

## Status

Accepted

## Context

The product is positioned as an evidence-first operations dashboard that must avoid biometric or identity-resolution workflows.

## Decision

Represent evidence as still snapshots plus metadata only and reinforce that constraint in:

- domain types
- mock data
- API contracts
- login and page copy
- shell compliance notices

## Consequences

- The current build is safer for demos and stakeholder previews.
- Feature language consistently avoids implying facial recognition or raw-video review.
- Any future integration work must preserve or deliberately revisit this constraint.
