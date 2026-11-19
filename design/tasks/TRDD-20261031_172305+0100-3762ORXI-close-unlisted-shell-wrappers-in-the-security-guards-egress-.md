---
trdd-id: 3762ORXI
title: Close unlisted shell wrappers in the security-guards egress gate by a word scan
column: design
status: tasked
created: 2026-10-31T17:23:05+0100
updated: 2026-10-31T17:34:51+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:05+0100
eht: [TRDD-L2RVH9RT, TRDD-O0GQ0OLH]
---

# Close unlisted shell wrappers in the security-guards egress gate by a word scan

Follow-up of TRDD-R2GILGKU (prose link only: this card has derived cards of its own, so it is not a derived card of R2GILGKU). The splitter's wrapper list (RUNS_NEXT) is a denylist, and two wrappers cannot be named in the plugin because the validator flags their names as critical. Close them, and every other unlisted wrapper, by a word scan: in every segment, a word equal to a name in the download, socket or remote-login sets counts. Done when a test with an unlisted made-up wrapper name followed by curl x is classed network-transfer, the cost (grep curl notes.txt counts) is pinned and documented, and the kit and pytest pass.

## Approval log

- 2026-10-31T17:23:05+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-31T17:30:03+0100 — column → todo by main-agent@emasoft-mods-expert-developer. a known hole in a security example; keep it on the workable board
- 2026-10-31T17:34:51+0100 — column → design by main-agent@emasoft-mods-expert-developer. its design is open (marking, the inline-skill rule, the costs to pin); design comes before todo in 3.0.0

## Derived tasks

EHT TRDD-L2RVH9RT (the session marking reads classifyCommand) and TRDD-O0GQ0OLH (a skill's inline command with any class is refused); both surfaces read in tool-check-verdict-layer.md and egress-classes.md. Done condition widened by the review of 41a929f: a word holding a space after an unlisted wrapper (wrapper -c "curl x") is also split and classed; the costs pinned include grep curl notes.txt, git log --grep curl and git commit -m "fix curl"; and the two real wrappers are checked in a scratch test outside the repository (their names cannot be written in the plugin) and the result recorded here.
