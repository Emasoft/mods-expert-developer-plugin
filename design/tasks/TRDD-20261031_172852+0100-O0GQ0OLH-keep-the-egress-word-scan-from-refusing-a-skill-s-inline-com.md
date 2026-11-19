---
trdd-id: O0GQ0OLH
title: Keep the egress word scan from refusing a skill's inline command on a word-only match
column: backburner
status: tasked
created: 2026-10-31T17:28:52+0100
updated: 2026-10-31T17:28:52+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:52+0100
---

# Keep the egress word scan from refusing a skill's inline command on a word-only match

Effect handled for TRDD-3762ORXI. decideEgress refuses a skill's inline command that has any egress class, whatever the session holds (egress-classes.md; the gate passes the flag at tool-check-verdict-layer.md, e.tool_use_id empty). Once the word scan counts a download program's name anywhere in a line, a skill whose inline command only mentions one (grep curl notes.txt) would be refused in a clean session. Done when that rule is decided (refuse only on a program-position class, or keep the strict reading and document it), and a test pins the choice.

## Approval log

- 2026-10-31T17:28:52+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
