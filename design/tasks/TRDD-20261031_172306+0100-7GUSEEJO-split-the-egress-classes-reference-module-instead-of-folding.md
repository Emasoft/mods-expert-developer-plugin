---
trdd-id: 7GUSEEJO
title: Split the egress-classes reference module instead of folding comments under the line cap
column: backburner
status: tasked
created: 2026-10-31T17:23:06+0100
updated: 2026-10-31T17:56:49+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-31T17:23:06+0100
unblock-when: []
---

# Split the egress-classes reference module instead of folding comments under the line cap

Follow-up of TRDD-R2GILGKU (prose link only: like its five sibling follow-ups; it has no derived cards, see Derived tasks). Commit 6f12963 folded three multi-line comments into single lines of about 230 characters to keep the egress-classes module block at 149 of the 150-line cap. Done when the folded comments are multi-line again, the module is split into two blocks (for example the runner rules or the start-file list in their own block) each under the cap, and tests/test_reference_modules.py passes with its compile test run.

## Approval log

- 2026-10-31T17:23:06+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Derived tasks

None, verified on main and on branch wt/r2gilgku-n1n2n5 (its new _module_code joins every block under a module heading with MODULE_BLOCK.finditer): excerpt_lock.reference_modules yields one block per Reference module heading and already accepts several headings in one file (tests/test_plugin_structure.py has a two-module case), so the split needs no reader change provided each part gets its own heading (a second fence under one heading is reported, not compiled). Importers of the moved symbols (tool-check-verdict-layer.md, tests/reference-modules/host-register.ts, the egress tests) change in the same commit, since the stage does not compile otherwise; nothing outside the skill and its tests imports the module. The heading check that guards a split (MODULE_PREFIX in tests/test_reference_modules.py) now fails a near-miss module heading (plural, colon, any case) on branch wt/r2gilgku-n1n2n5 in d3ff40c, so a split whose second heading is misspelled fails instead of leaving its block unchecked; a typo inside the words (Referance module) still passes. Planned order: the N1-N2-N5 branch is on main (0607d4b); the security-guards branch, which holds the module to split, merges before this card can start. Nothing blocks this card mechanically: it stays in backburner until that merge, and whoever pulls it checks that egress-classes.md is on main first. A bare heading followed by a ts fence now fails too (b5ebfc4).
