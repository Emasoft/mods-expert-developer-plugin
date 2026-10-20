---
trdd-id: UD8EC4FK
title: The release gate reports a validator abort as a MAJOR finding because the abort exits inside the verdict range
column: todo
status: tasked
created: 2026-10-21T01:11:06+0200
updated: 2026-10-21T01:11:06+0200
current-owner: user
created-by: user
task-type: bugfix
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-10-21T01:11:06+0200
---

# The release gate reports a validator abort as a MAJOR finding because the abort exits inside the verdict range

THE DEFECT. The release gate's validator step in scripts/publish.py (stage G3, the `ve = subprocess.run(...)` block) maps the validator's exit code to a verdict with a 0..4 vocabulary: 0 = pass, 1 = CRITICAL, 2 = MAJOR, 3 = MINOR, 4 = NIT, and >= 5 = "the validator FAILED TO RUN". The gate's own comment says the >= 5 branch exists so that "anything >= 5 is not a verdict at all - the validator FAILING TO RUN (127 = entrypoint missing, 137 = OOM-kill, ...)" and that the old `ve != 0 and ve < 5` test "let every one of those fall through and print 'Validation passed', which is the exact RC-8 fail-open the CI workflows were fixed for".

THE GAP. That reasoning assumes a 1..4 exit code always means a completed validation. It does not. CPV's GitHub-integrity check ABORTS the run before any validation happens, and it exits INSIDE the 1..4 range - measured 2 - so the abort is indistinguishable from a genuine MAJOR finding. The gate therefore blocks (exit 2 is in the blocking range), which is the safe outcome, but it PRINTS "BLOCKED: MAJOR issues found", a claim that is false: no finding exists, because nothing was validated. The gate's fail-closed property survives; its DIAGNOSIS does not.

MEASURED, 2026-10-21, in this repository at commit 6dd97b1, with the validator's OWN exit code and not a pipe's (the previous turn's reading of "exit 0" was the exit code of `tail` at the end of a pipe, not of the validator): the unbypassed invocation exits 2, prints the CPV integrity-error block, and produces NO "SUMMARY:" line. The same invocation with PLUGIN_SKIP_GITHUB_INTEGRITY=1 - the bypass the integrity error message itself prescribes - exits 0 and prints SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=72.

WHY THIS IS ITS OWN CARD. It is a defect in the release gate, not in either of the two chapter-preload cards it was found while working on, and it is not a documentation defect at all: it is a wrong label on a release-blocking verdict. A reader of the gate's output is told a MAJOR finding exists when the true state is that the validator did not run, which sends the next person hunting for a MAJOR finding that is not there. It is also the SECOND instance of the same shape this project has already hit once - a validator outcome that cannot run is not a clean outcome - and the first instance (the MD012 blank-line NIT, tracked by TRDD-PII6Z5NS) is about the release gate's response to a finding rather than to an abort.

THE FIX, and it is small. The gate needs to distinguish "the validator ran and found something" from "the validator aborted". Two ways, both sufficient: (a) treat the integrity abort as a distinct outcome - the abort prints a recognisable block, so the gate can detect it and refuse with "BLOCKED: the validator could not run (integrity check aborted) - UNKNOWN is not clean", which is the wording the >= 5 branch already uses for the same situation; or (b) require a SUMMARY line in the validator's stdout as the precondition for accepting a 0..4 exit code, so an aborted run can never be read as a finding of any severity. Either way the gate's fail-closed property must be preserved: the abort must still block, and must be reported as an abort.

THE UNRELATED DEFECT THIS IS NOT. The upstream CPV integrity failure itself (Emasoft/claude-plugins-validation issue #243) is not this card's subject and is not fixable here: it is a released-version problem in another repository. This card is about how THIS repository's gate RESPONDS to a validator that did not run, which is fixable here and matters independently of whether issue #243 is ever fixed.

## Approval log

- 2026-10-21T01:11:06+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
