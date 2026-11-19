---
trdd-id: 1QK0FJ55
title: Fix or explain the 46 tsc errors in three example mods' tests
column: complete
status: archived
created: 2026-10-27T20:10:17+0100
updated: 2026-10-27T21:26:48+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T20:10:17+0100
---

# Fix or explain the 46 tsc errors in three example mods' tests

Parent: TRDD-TR37CWQ7 box (e2). Shipped teaching examples are copied by readers. tsc against the generated types (2.1.310) reports 46 errors in the tests of three examples: protect-files 13, git-poller 15, turn-timer 18. All are in tests/register.test.ts: test inputs missing origin/presentation on CommandRunInput, usage null vs TurnUsage or undefined, and a {value: undefined} result not matching OpEventResult. Source: docs_dev/20261027-tr37cwq7-e-options.md section 3. Classify each as a real defect (wrong API name or shape) or a missing-types artefact; fix real defects in the examples and their tests; record artefacts.

## Acceptance checklist
- [x] classification of every error recorded (real defect or artefact)
- [x] real defects fixed with the example's own tests passing
- [x] tsc error count after recorded

## Approval log

- 2026-10-27T20:10:17+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-27T21:26:48+0100 — COMPLETE by main-agent@emasoft-mods-expert-developer. 46 tsc errors to 0 in b41a683, reviewed; trap row and classification fix applied.

## STATE

2026-10-27 tsc after = 0 (before 46: protect-files 13, git-poller 15, turn-timer 18). All groups class (a), fixed with typed fixtures and no casts: CommandRunInput origin/presentation 26, TurnCompleteInput usage null/reason 16, command.register return shape 2, turn-timer helper typing 2. Own tests 21/28/14 pass; pytest 484 passed. Detail docs_dev/20261027-1qk0fj55-tsc.md
STATE 2026-10-27: CLASSIFICATION SUPERSEDED. The 46 tsc errors are type-strict drift in test fixtures against the 2.1.310 declarations (the mods themselves were not wrong; the chapters' short forms pass at runtime), superseding "real defect". Declarations (.claude-plugin/types/claude-code/index.d.ts): CommandRunInput :1828 (origin :1854 region, presentation), CommandPresentation :1797 {isFullscreen, columns}, PromptOrigin :9288 (kind composer = Enter at the prompt), TurnCompleteInput :14244, TurnCompleteReason :14250 (answer = the model answered), usage optional :14235, command.register returns {command} (:3177, :7436), On :6954. tsc 5.9.3 (npx -y -p typescript@5), types snapshot 2.1.310 (first line of index.d.ts). RUN and DONE constants in the three example tests already use composer and answer, unchanged. Trap-table row added to skills/mods-tutorial-quickstart/SKILL.md. Tutorial/example prose sweep found only mod-code calls (engine-command.md:20, quickstart:45), not test fires.
