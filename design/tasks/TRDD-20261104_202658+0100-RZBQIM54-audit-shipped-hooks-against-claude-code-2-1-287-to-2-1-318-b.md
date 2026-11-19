---
trdd-id: RZBQIM54
title: Audit shipped hooks against Claude Code 2.1.287 to 2.1.318 behavior changes before 0.7.0
column: todo
status: tasked
created: 2026-11-04T20:26:58+0100
updated: 2026-11-05T03:02:42+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: audit
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T20:26:58+0100
relevant-rules: [1, 6, 7, 13, 14]
---

# Audit shipped hooks against Claude Code 2.1.287 to 2.1.318 behavior changes before 0.7.0

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

Column todo, nothing done. Do not start before the DT merge commit lands in release main. No agent starts this card by draining the board. Minted 2026-11-04 by the eleventh
mods expert from orchestrator state 13, section 4, with the orchestrator's review corrections
(reports_dev/goal/20261104_201814+0100-orchestrator-state-13.md, local to the developer machine). The orchestrator added
this pre-publish gate, and it is on the owner's veto list. Timing: after the DT merge (branch feat/deck-tokensaver) into
release main, before publish.py runs.

Why todo and not blocked on TRDD-RD1ISPMN and TRDD-71KVH9PA: the first box of each acceptance checklist holds a Desktop
check by a person ("On Desktop (human-checked): the person disables the standalone ... for the check and re-enables it
after"), which can close those cards only after the publish, so blocking on them would hold this pre-publish gate past the
publish. No unblock-when predicate either: the DT merge lands in the release repository, which a repo-relative file: or
log: predicate of this project cannot see, and unblock-when acts only on a blocked card.
NEXT ACTION: once the DT merge commit is in release main, re-derive the surface list (first acceptance box).
2026-11-05, mods expert M11, M4c item 7 (measure only, nothing changed): npx -y -p typescript@5 tsc --noEmit -p . --noUnusedLocals --noUnusedParameters on the release clone (head ed64cd0, and again on the item 2 tree with the same counts per file) gives 86 errors, every one TS6133 (declared but never read), where the plain tsc gives 0. 76 are in hooks/tests (self-command.test.ts 18, mod-manager.test.ts 18, probe-runner.test.ts 14, requirements-drafts.test.ts 13, mod-manager-profiles.test.ts 6, switch-world.ts 5, engine-answers.ts 2). 10 are in shipped hooks, all the unused ($, e) parameters of five handlers: probe-runner/register.ts:106 and :117, self-command/register.ts:105 and :111, switches/register.ts:295. Raw output: reports_dev/mods-expert/m11/tsc-unused.txt and tsc-unused2.txt (main checkout).

## Why

Code about to ship in 0.7.0 uses surfaces whose behavior changed between Claude Code 2.1.287 and 2.1.318. Passing tests on
2.1.318 are the evidence; this audit looks for changed behavior that no test covers. It derives from the same changelog as
TRDD-W02X8PYG, which updates the agent docs after M6; this card checks the code before the publish.

## Where

The release repository, release main after the DT merge (the DT worktree matches it). Non-test files.
Its audit tree includes hooks/deck/** and hooks/tokensaver/**: untyped JS that tsc does not read (orchestrator, 2026-11-04, review of f751a74, item 7).

## Surfaces (starting leads only)

The listed files come from a grep for each surface, paths only; the counts are leads, not findings.

- prompt.submit attachments now stay in the user's turn (2.1.318): hooks/requirements-drafts/logic.ts,
  hooks/requirements-drafts/register.ts.
- `.catch` runs only when the hook throws or times out; events raised beneath the hook's own calls skip it (2.1.301):
  hooks/switches/register.ts, hooks/self-command/register.ts, hooks/debug-log/register.ts, hooks/probe-runner/register.ts,
  hooks/requirements-drafts/register.ts, hooks/mod-manager/state.ts.
- Text `bold` deprecated in favor of `weight` (2.1.299): hooks/switches/register.ts, hooks/self-command/pane.ts,
  hooks/mod-manager/pane.ts, hooks/mod-manager/logic.ts.
- turn.start now also fires for subagents and teammates (2.1.299): not yet measurable: the ports are not in hooks/ yet.
- The plugin test changes (2.1.299): ui.render roots carry part with the plugin, and a served `$` method that has not
  answered in 10 s fails.
- The 45% width cap on docked panes, `$.model.fork` effort, and Image drawing: named by the orchestrator's review; no leads
  recorded yet.

## Acceptance checklist

- [ ] Before any verdict, the surface list is re-derived from every behavior-change item in 2.1.287 to 2.1.318, and the
  merged tree, the Deck and Tokensaver ports included, is re-grepped. The list covers at least prompt.submit attachments,
  Text bold, the 45% width cap on docked panes, `$.model.fork` effort, Image drawing, `.catch`, turn.start and the plugin
  test changes.
- [ ] Each listed surface gets a file:line verdict: "unchanged behavior", "adapted" or "test added"; a surface the code does not use gets a zero-hit grep record instead, which counts only if it records the exact pattern, the merged tree and the commit it ran on, and one positive control (the same pattern finds the term in the changelog or in a scratch file). A zero-hit result without the control is no verdict.
- [ ] `claude plugin test` and tsc pass on the merged tree on 2.1.318.
- [ ] Every new guard and test is mutation-checked (break the line, the test goes red).
- [ ] The audit is done before publish.py runs.

## Related

TRDD-W02X8PYG (the agent update from the same changelog), TRDD-HAK91K6S (the M6 swap, blocked on this card), TRDD-RD1ISPMN and TRDD-71KVH9PA (the
ports), TRDD-5IK59SQ2 (hooks/switches/), TRDD-RWD5PW76 (hooks/debug-log/).

## claude plugin validate warnings, already on the branch base (DT, 2026-11-05)
- Unknown field cpv in .claude-plugin/plugin.json (the validator: "Claude Code ignores it at load time"): present at 181daee, the base of feat/deck-tokensaver, before any DT commit. To decide before publish: it stays (CPV reads it) or moves out.
- No icon (ICON_MISSING, a plugin directory check, not part of the verdict): no icon field and no .claude-plugin/icon.png, .svg or assets/icon at 181daee. The validator asks for a square PNG or JPEG, 512 to 2048 px on each side, under 2 MB.
- No install line in README.md (validator advice: no line installs mods-expert-developer-plugin from a marketplace): none at 181daee. A release-hold item (PRRD G7.1; orchestrator, 2026-11-05): the line goes in before publish.

## Approval log

- 2026-11-04T20:26:58+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
