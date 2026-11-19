---
trdd-id: ONYAD975
title: Prove the prrdgrep rule insert, update and stamp lines on a scratch PRRD
column: todo
status: tasked
created: 2026-11-03T21:50:42+0100
updated: 2026-11-03T22:23:13+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:50:42+0100
relevant-rules: [6]
---

# Prove the prrdgrep rule insert, update and stamp lines on a scratch PRRD

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. NPT of TRDD-IG2K6DUY (extract requirements from saved messages and add them to the PRRD); it must be done before that card reaches dev. Nothing run yet.
- Rule served: directive 8 (two datetime stamps per rule) and point 6 of TRDD-IG2K6DUY (writes go through prrdgrep, never by hand); PRRD G6 (measured assumptions between increments) on branch requirements/integrated-mod-controls.
- Step 5 blocks every write path: the mod never passes --user (point 6 of TRDD-IG2K6DUY), so if an edit of a golden rule needs --user, the pipeline cannot write or update golden rules, and that result goes to the owner with Q3 and Q16 of TRDD-IG2K6DUY before increment I7 is built.
- NEXT ACTION: copy the 14-rule PRRD into a temporary directory outside the project, then run the steps below against the copy only.

## What to measure (each a command with its exit code and output kept under reports_dev/requirements-drafts/)

1. prrdgrep lint and validate exit 0 on the copy after a stamp sub-line ("  - created <datetime> · changed <datetime>") and source sub-lines are added under a rule (the source read says yes: kinds.ts:288 matches only the bold id prefix; edit-guard.ts:65 and 453 fire only on a bold bullet with a digit).
2. One edit batch anchored on the last line of the last golden rule inserts a whole new block (declaration plus sub-lines) and exits 0; the same with --replace holding newlines through $.process.run argv (no shell).
3. A second insert with a number already taken is refused (edit-guard.ts:219-228) with a stable message the mod can recognise.
4. An update batch (declaration with version +1 and new text, plus the stamp line) exits 0; the same text change without the bump is refused (edit-guard.ts:239-266).
5. Whether edit on a golden rule needs --user, as add golden does (cli.ts, the add case): run the edit without --user on a golden rule of the copy; exit 0 means it does not, and a refusal means the mod cannot write golden rules, because it never passes --user.
6. The write gate: AIM_PILLAR_ALLOW_WRITE=1 passed only in the env of that one call lifts it; without it the write is refused outside the ai-maestro checkout.
7. Exit codes and timing under the 30 s default of $.process.run.

## Upstream findings to report (outward-facing: file only with the owner approval, on the Emasoft ai-maestro repository)

- prrdgrep --help does not list the add verb that cli.ts:356 implements.
- add takes one line only, so a rule with stamp and source lines needs a second, non-atomic edit; ask for add with body lines.
- add computes the next number from the current records only (cli.ts:389-395), so it can reuse a deleted top number, against the never-reused rule of the PRRD format.

## Done when

Each step above has its raw result recorded, and TRDD-IG2K6DUY point 6 is confirmed or corrected from those results.

## Approval log

- 2026-11-03T21:50:42+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
