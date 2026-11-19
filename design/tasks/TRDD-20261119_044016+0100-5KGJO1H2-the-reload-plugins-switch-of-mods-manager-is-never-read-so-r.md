---
trdd-id: 5KGJO1H2
title: The Reload plugins switch of mods-manager is never read so Reload runs while it is off
column: todo
status: tasked
created: 2026-11-19T04:40:16+0100
updated: 2026-11-19T04:40:16+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-19T04:40:16+0100
---

# The Reload plugins switch of mods-manager is never read so Reload runs while it is off

Found 2026-11-19 while removing the requirements-drafts mod (TRDD-051NBQJ8), by a worker review and then read by the mods expert. hooks/mod-manager/switches.ts:25 and :47 define mods-manager.reload ('Reload plugins', on by default), and nothing else reads it: the Reload button (hooks/mod-manager/pane.ts:256) calls reloadPlugins (hooks/mod-manager/state.ts:786), which takes a busy claim and runs /reload-plugins from a timer (runReload, :810) without reading any switch. So the function switch shows in /mods-switches and the switches tool but has no effect, against PRRD G13.1. Fix: check FN.reload where the other pane functions check theirs (refusedWhileOff) and draw the button only while it is on, with a test that an off Reload runs no command, mutation-checked.

## Approval log

- 2026-11-19T04:40:16+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
