---
trdd-id: JTX0H03Y
title: Build an API index from the types file of a running Claude Code build
column: backburner
status: tasked
created: 2026-10-23T04:19:27+0200
updated: 2026-10-23T04:19:27+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-23T04:19:27+0200
---

# Build an API index from the types file of a running Claude Code build

Deferred from TRDD-H26OG8AP (givememod harvest row H63): a script (scripts/api-index.sh, bash and awk like plan-diff.sh) that reads .claude-plugin/types/claude-code/index.d.ts written after an interactive load and prints one-line tables of events, $ methods and next fields, exiting non-zero when a pattern matches nothing; a fixture types file under tests/fixtures/ and tests in tests/test_mod_scripts.py. Blocked until the owner supplies a types file from a logged-in build. Write it independently; givememod's scripts/api_index.py (MIT) is not copied.

## Approval log

- 2026-10-23T04:19:27+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
