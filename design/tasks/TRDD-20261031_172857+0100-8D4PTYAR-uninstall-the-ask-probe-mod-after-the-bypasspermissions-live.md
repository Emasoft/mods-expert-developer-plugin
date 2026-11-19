---
trdd-id: 8D4PTYAR
title: Uninstall the ask probe mod after the bypassPermissions live check
column: backburner
status: tasked
created: 2026-10-31T17:28:57+0100
updated: 2026-10-31T17:28:57+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:57+0100
---

# Uninstall the ask probe mod after the bypassPermissions live check

Effect handled for TRDD-ZFGRYOU1. A probe mod left installed adds its tool.check hook to every tool call of every session and answers ask whenever its marker command runs; harmless otherwise, but it is a live hook nobody maintains. After the live check, uninstall it at user scope on every surface it was installed on and confirm the plugin list no longer shows it. Done when claude plugin list shows no probe mod and the marker command runs without a prompt.

## Approval log

- 2026-10-31T17:28:57+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
