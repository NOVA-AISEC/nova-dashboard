# ADR 0004: Single authenticated shell with role-gated routes

## Status

Accepted

## Context

The dashboard spans many modules, but the current product is a single operator workspace rather than separate applications.

## Decision

Use one shared authenticated shell (`AppShell`) and gate route access centrally through `src/app/access.tsx` plus `RequireRole`.

## Consequences

- Navigation, branding, compliance copy, and logout behavior stay consistent across modules.
- Role access rules are centralized and easy to inspect.
- Module pages can focus on content rather than shell concerns.
- The shell itself now has some cross-cutting data-fetch responsibility for nav badges.
