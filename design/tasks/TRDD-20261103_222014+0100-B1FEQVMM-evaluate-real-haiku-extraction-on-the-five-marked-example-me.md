---
trdd-id: B1FEQVMM
title: Evaluate real Haiku extraction on the five marked example messages
column: todo
status: tasked
created: 2026-11-03T22:20:14+0100
updated: 2026-11-03T22:44:43+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T22:20:14+0100
relevant-rules: [6, 7]
---

# Evaluate real Haiku extraction on the five marked example messages

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. EHT of TRDD-IG2K6DUY (extract requirements from saved messages and add them to the PRRD); that card cannot reach complete until this one is terminal, and its extract switch does not ship on before this eval passes (Q11 of that card). It runs after increments I4 (the extraction prompt exists) and I6 (the merge prompt exists). Nothing run yet.
- Rule served: directives 4, 5, 6 and 10 of TRDD-IG2K6DUY (find the rules among other text, split compound ones, use the context, short rules) and the owner standing rule that tests are real. The unit tests of that card stub $.model.complete, so they cannot show that a real model finds a buried rule; this eval calls the real model. PRRD G6 (measured assumptions) and G7 (release only after validation).
- NEXT ACTION: after I4 and I6, run the real extraction prompt of the mod with the real model (extractModel, default haiku) on the five-message fixture of TRDD-IG2K6DUY (its worked example), three runs, from a scratch script or a probe mod outside the plugin.

## Method

- Input: the five message texts, marked in the marking order of the worked example, each with the context the mod builds for it, and the copy of the 14-rule PRRD. Jev is not called; each candidate takes the label the worked example expects (designer's proposal, for owner confirmation), because Jev accuracy is measured by the calibration card 9J5JFR5V, not here.
- Scored by the script, per run: the candidate count of each mark (expected 3, 4, 0, 1, 1; designer's proposal, for owner confirmation); zero candidates for Mark 3; every span passes the span check of the mod (as the owner answers Q19); every candidate cites the NEW message; every rule text is one line within maxRuleChars.
- Scored by a person reading side by side, per run: each candidate text against the expected rule text of the worked example (designer's proposal, for owner confirmation) (same requirement or not), and every extra or missing requirement.
- Mark 4 merge: the real merge prompt on G19.1 and the Mark 4 candidate; the person checks that the G19.1 wording is kept and only the new content (measures) is added.
- Cost: the input and output tokens of every call and the total, for the cost line of the hand-over.

## Done when

Three runs are recorded with their raw replies under reports_dev/requirements-drafts/, and the result is written into TRDD-IG2K6DUY. Pass: every run finds every expected requirement (designer's proposal, for owner confirmation) of the five marks, adds none a person judges is no requirement, and gives Mark 3 zero candidates. A miss sends the extraction prompt back to I4 (or the owner picks a larger model, Q10 of that card), and the eval runs again.

## Approval log

- 2026-11-03T22:20:14+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
