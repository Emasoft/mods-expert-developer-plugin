---
trdd-id: 1G0Z86R7
title: The Tokensaver debug-log switch writes no file because Tokensaver logs only through maskedLog
column: todo
status: tasked
created: 2026-11-19T04:40:17+0100
updated: 2026-11-19T04:40:17+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-19T04:40:17+0100
---

# The Tokensaver debug-log switch writes no file because Tokensaver logs only through maskedLog

Found 2026-11-19 while removing the requirements-drafts mod (TRDD-051NBQJ8). hooks/tokensaver/switches.ts:41 defines debugLogSwitch('tokensaver'), so /mods-switches lists 'Debug log of errors and warnings' for Tokensaver, but hooks/tokensaver/mod.ts sends its lines only through maskedLog (lines 51, 62, 68, 128), which writes to Claude Code's log and never to the mod's debug file; only logEvent (hooks/debug-log/register.ts:77) writes the file. So turning the switch on writes nothing (PRRD G14.1). The README debug-log paragraph now names only self-command, probe-runner and Deck as keeping one. Fix: send Tokensaver's own error lines through logEvent with mod 'tokensaver', or drop the switch; add a kit test that an event raised while the switch is on reaches tokensaver.log.

## Approval log

- 2026-11-19T04:40:17+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
