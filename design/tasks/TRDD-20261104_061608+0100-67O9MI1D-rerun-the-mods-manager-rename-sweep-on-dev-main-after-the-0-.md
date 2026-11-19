---
trdd-id: 67O9MI1D
title: Rerun the mods-manager rename sweep on dev main after the 0.7.0 merge
column: todo
status: tasked
created: 2026-11-04T06:16:08+0100
updated: 2026-11-04T06:39:25+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T06:16:08+0100
---

# Rerun the mods-manager rename sweep on dev main after the 0.7.0 merge

Derived (EHT) task of TRDD-ZQ0S5X07, recorded 2026-11-04 by the mods expert (M3b). The rename of /mod-manager to /mods-manager ran on the release clone before the dev main merge. After that merge, dev main's own mod-manager edits (files.ts, installed.ts and profiles.ts, per the M3 plan, not read in M3b) arrive with the old /mod-manager and 'mod-manager: ' texts, and the merge conflicts are expected to include renamed lines. Run git grep mod-manager on the merged tree with ZQ0S5X07's keep rules (pane id, requestId, store keys, mm- keys, the folder and its paths, identifiers, upstream paths, module comments), rename the rest, resolve the conflicts toward /mods-manager, and run tsc, the kit on a fresh stage with an empty HOME, pytest (including tests/test_readme_command_name.py), ruff and cspell. Lines that name the old name ON PURPOSE and must stay (from the review of 8665b32): the why comment above COMMAND in hooks/mod-manager/logic.ts (it names the plugin mod-manager@claude-mod-manager), the session-start kit test's title ('and no mod-manager') and its assertion expect(w.commands).not.toContain('mod-manager'), and tests/test_readme_command_name.py (its pieces assemble the old name for the pattern); NOTICE line 15 and README line 132 keep their folder paths.

## Approval log

- 2026-11-04T06:16:08+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-11-04T06:39:25+0100 — column → todo. EHT of ZQ0S5X07, runs after the dev main merge; backburner was the default of new
