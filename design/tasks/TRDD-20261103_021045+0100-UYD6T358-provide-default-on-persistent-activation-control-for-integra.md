---
trdd-id: UYD6T358
title: Provide default-on persistent activation control for integrated dev tools
column: todo
status: tasked
created: 2026-11-03T02:10:45+0100
updated: 2026-11-19T04:47:58+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T02:10:45+0100
relevant-rules: [3.1,8.2,9.2]
npt: []
eht: []
---

# Provide default-on persistent activation control for integrated dev tools

## Scope

Implement the first activation increment only, governed by PRRD G3.1, PRRD G8.2 and PRRD G9.2. Share persistent on/off/status between the user command and an always-callable bounded typed agent control. Unset activation defaults true; preserve saved false until explicitly changed. Register worker tools and their commands at session startup regardless of activation, retain runtime gates, and recheck activation before deferred command and probe execution. Status distinguishes persisted activation, acknowledged registration and actual capability limitations; do not claim registration proves dependencies or permissions are ready. No generic run call is required to activate. Do not promise cancellation after a command has already been dispatched.

## Ownership

Scopes are reserved in design/DELEGATION.md, all pending and unassigned. Runtime owners are hooks/dev-tools.ts, hooks/self-command/register.ts, hooks/probe-runner/register.ts and direct hook tests. Update activation wording in README.md, install/uninstall skills and tests/test_skills_menu.py as the same behavior requires. Manager operations and broader configuration are outside this increment. No release authorization is implied; the existing release hold remains.

## Acceptance checklist

- [ ] Unset activation defaults on without overwriting saved false; explicit state persists across sessions.
- [ ] User and typed agent on/off/status share state and validation; control remains callable while off.
- [ ] Worker tools and commands register at startup while off; runtime calls refuse while off and work after on without another startup, subject to host permissions and next-prompt visibility.
- [ ] Deferred command and probe execution recheck activation before dispatch; rejected work is reported and does not leave stale queue state.
- [ ] Status reports partial startup failures and distinguishes activation from readiness without invented success.
- [ ] Direct hook tests cover defaults, persistence, off-to-on activation, invalid control input, partial failure and queued-work denial on both supported test surfaces.
- [ ] Staged hook kit and scoped skill reload acceptance pass; documentation no longer promises next-session-only activation or disappearing tools.

## Evidence

No implementation evidence yet. Coordinator-reported baseline passes are not acceptance of this increment.

## Approval log

- 2026-11-03T02:10:45+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-11-03T02:14:39+0100 — column → dev by main-agent@emasoft-mods-expert-developer. Coordinator assigned worker a2993a0a81d9d474d the integrated activation runtime and docs/tests increment; baseline checked, implementation acceptance pending.
- 2026-11-03T16:29:39+0100 — column → todo. queued 2026-11-03 while the mod-manager release runs (owner directive on TRDD-J4HRAQF0); its work is checkpointed in commit on branch requirements/integrated-mod-controls

## STATE

Current 2026-11-03: metadata checkpoint 83204eb verified by coordinator; implementation not completed. Sole upcoming implementation worker a2993a0a81d9d474d owns activation runtime and docs/tests as one increment. Coordinator verified baseline commands: uv run --project <code-root>/emasoft-mods-expert-developer --extra dev pytest <code-root>/emasoft-mods-expert-developer/tests/test_mod_tests.py::test_the_mod_kit_tests_pass_under_claude_plugin_test -q; uv run --project <code-root>/emasoft-mods-expert-developer --extra dev pytest <code-root>/emasoft-mods-expert-developer/tests/test_skills_menu.py::test_plugin_tool_skills_reload_through_the_run_tool -q. Those baseline passes are not implementation acceptance. NEXT ACTION: assigned worker implements shared persistent default-on activation, always-registered runtime-gated tools, deferred execution rechecks, truthful readiness, and matching docs/tests; preserve saved false. No separate prerequisite or effects tasks: directly resulting docs/test changes are inside this atomic acceptance. Existing release hold remains; no completion or release claim.
2026-11-04, mods expert, M4c: the reservation in design/DELEGATION.md of hooks/dev-tools.ts, hooks/self-command/register.ts, hooks/probe-runner/register.ts and their tests for worker a2993a0a81d9d474d is released (orchestrator, 2026-11-04): that worker's transcript (session f020c529, subagents/agent-a2993a0a81d9d474d.jsonl) was last written on 2026-11-03 at 04:17:16, about 37 hours before, checked by the mods expert from the file's modification time. M4c (TRDD-5IK59SQ2) edits those files only as far as the G13 switch semantics need; the default-on flip and the rest of this card stay here. This card's "Register worker tools and their commands at session startup regardless of activation" is superseded by the zero-cost ruling of TRDD-BE6YBBP9 (a function that is off registers nothing).
2026-11-19, mods expert (TRDD-051NBQJ8): the activation build of this card (b827e15..d1d0e27, on branch requirements/integrated-mod-controls) did not reach main. Merge ffbf94c took main's per-function registry (TRDD-5IK59SQ2, built in 01cc4d8) in every conflicted hunk, and dropped the branch's non-conflicting UYD6T358 additions (the mods-dev-tools skill, its menu and catalog rows, the agent line), on the recorded decisions of this card's own line of 2026-11-04 (superseded by the zero-cost ruling of TRDD-BE6YBBP9) and of 5IK59SQ2 ("the four dev tools stay off, and TRDD-UYD6T358 decides their default"). Open, for the USER and not settled here: PRRD G9.2 (tool access on by default) against main's defaultOn false for the four dev tools (run, list_commands, the /self-command pane, probe).
