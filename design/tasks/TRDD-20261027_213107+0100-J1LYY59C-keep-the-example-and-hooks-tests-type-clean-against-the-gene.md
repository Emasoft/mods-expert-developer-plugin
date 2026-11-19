---
trdd-id: J1LYY59C
title: Keep the example and hooks tests type-clean against the generated types
column: backburner
status: tasked
created: 2026-10-27T21:31:07+0100
updated: 2026-10-27T21:31:14+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T21:31:07+0100
---

# Keep the example and hooks tests type-clean against the generated types

## Context

Supersedes the line-number citations of the archived TRDD-1QK0FJ55: the quickstart trap row now cites declaration names (CommandRunInput, TurnCompleteInput, TurnCompleteFields, OpValueOf command.register), not index.d.ts line numbers.

tsc flags used (from .claude-plugin/types/tsconfig.json, extended by the example tsconfig): strict true (so strictNullChecks on), noUncheckedIndexedAccess true, noEmit, skipLibCheck, es2023, moduleResolution bundler. Invocation: example copied to scratch with the root .claude-plugin/types, `npx -y -p typescript@5 tsc --noEmit -p .`.

No check keeps the examples type-clean today. Running tsc in CI waits on the owner's types-snapshot decision (TRDD-TR37CWQ7 e2), because the snapshot is gitignored.

This card owns option A: a local scripts/ tsc check run before publish, independent of the owner. The CI path is TRDD-TR37CWQ7 e2 and is not duplicated here.

## Checklist

- [ ] Implement option A, the local scripts/ tsc check run before publish
- [ ] Re-check the quickstart trap row on each CLI version bump
- [ ] Re-run tsc on all example mods and hooks/ after each types-snapshot refresh
- [ ] Re-check the version tags of the other quickstart rows (e.g. UNVERIFIED (2.1.309)) for consistency
- [x] Measured 2026-10-27: mods-tutorial-quickstart SKILL.md is 148 lines and 16926 chars, about 4231 tokens at chars/4 (CPV limits: under 500 lines, about 5000 tokens)
- [x] Confirm the other five example mods and hooks/ are 0 under the same invocation (see below)
Measured 2026-10-27 (typescript@5, 2.1.310 snapshot): dice-tool 0, hello-mod 0, redact-output 0, branch-band 0, notes-pane 0, hooks/ 0 errors, all exit 0. Output: reports/tsc/20261027_213014+0100-others.txt

## Approval log

- 2026-10-27T21:31:07+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
