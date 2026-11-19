---
trdd-id: L2RVH9RT
title: Keep the egress word scan from marking a session on a word-only match
column: backburner
status: tasked
created: 2026-10-31T17:28:51+0100
updated: 2026-10-31T17:28:51+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:51+0100
---

# Keep the egress word scan from marking a session on a word-only match

Effect handled for TRDD-3762ORXI. The gate's tool.call hook (tool-check-verdict-layer.md, READS_OUTSIDE) marks the session as holding outside text after a shell command classed as a download, runner, socket, remote login or inline network code ran. Once the word scan counts a download program's name anywhere in a line, a local command such as grep curl notes.txt would mark a clean session, after which every later outward action asks or is refused. Done when the marking uses only programs found in program position (or the word-scan match is a class the marking ignores), a test shows grep curl notes.txt in a clean session marks nothing, and a real download still marks.

## Approval log

- 2026-10-31T17:28:51+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
