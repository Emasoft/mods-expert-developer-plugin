---
trdd-id: ZFGRYOU1
title: Live check whether a mod tool.check ask reaches a person in bypassPermissions mode
column: backburner
status: tasked
created: 2026-10-31T17:23:08+0100
updated: 2026-10-31T17:30:01+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:08+0100
npt: [TRDD-9CXJCAD4]
eht: [TRDD-9V9074H5, TRDD-8D4PTYAR]
---

# Live check whether a mod tool.check ask reaches a person in bypassPermissions mode

Follow-up of TRDD-R2GILGKU (prose link only: this card has derived cards of its own, so it is not a derived card of R2GILGKU). The bundled docs say bypassPermissions disables permission prompts and do not say what becomes of a mod's tool.check ask. Install a minimal mod whose tool.check answers ask for one Bash command, run that command in a bypassPermissions session on the terminal and on Desktop, and record whether a prompt appears, the call runs, or it is refused. Needs the owner. The answer settles ask against deny for the opener, web-request and connector-write classes in the security-guards skill.

## Approval log

- 2026-10-31T17:23:08+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Derived tasks

NPT TRDD-9CXJCAD4 (a probe mod that answers ask; none exists in the plugin). EHT TRDD-9V9074H5 (apply the finding to the security-guards classes) and TRDD-8D4PTYAR (uninstall the probe mod). The check also logs whether the engine sets an approver on a plugin's tool.check query, since the guard refuses an ask when none is set, so a prompt from a bare probe alone does not prove the guard's own ask path.
