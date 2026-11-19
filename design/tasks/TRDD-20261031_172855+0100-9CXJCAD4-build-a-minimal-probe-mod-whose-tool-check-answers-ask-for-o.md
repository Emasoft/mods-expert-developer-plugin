---
trdd-id: 9CXJCAD4
title: Build a minimal probe mod whose tool.check answers ask for one command
column: backburner
status: tasked
created: 2026-10-31T17:28:55+0100
updated: 2026-10-31T17:30:03+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:28:55+0100
---

# Build a minimal probe mod whose tool.check answers ask for one command

Prerequisite of TRDD-ZFGRYOU1. No example or tutorial in this plugin has a tool.check hook that answers ask (checked: only the security-guards egress gate does, and it refuses an ask when no approver is set). Build it under builds_dev/ or scripts_dev/ (gitignored), never in a path the plugin ships, since a shipped copy would answer ask for its users; the terminal half of the check may run through the existing probe runner (TRDD-03IIDGPP). Build a mod of a few lines whose tool.check answers ask with a fixed reason for one harmless marker command (for example echo ask-probe) and passes every other call, installable at user scope on the terminal and on Desktop, with its own uninstall steps. Done when the mod passes check-mod and its behaviour test, its install and uninstall commands are written down with the local marketplace or folder it installs from, and it logs whether its tool.check query arrives with an approver set (the security-guards gate refuses an ask when none is set).

## Approval log

- 2026-10-31T17:28:55+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-31T17:30:02+0100 — NOTE: done condition widened in the body (approver logging), review of 41a929f.
