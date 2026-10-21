---
trdd-id: UNWAW14S
title: Two of TRDD-UD8EC4FK's own statements disagree about whether the test can catch a CPV token drift
column: todo
status: tasked
created: 2026-10-21T03:08:48+0200
updated: 2026-10-21T20:14:39+0200
current-owner: user
created-by: user
task-type: bugfix
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-10-21T03:08:48+0200
---

# Two of TRDD-UD8EC4FK's own statements disagree about whether the test can catch a CPV token drift

WHY THIS CARD EXISTS. TRDD-UD8EC4FK is ARCHIVED - it moved to `complete` and was archived into design/archived/ - and an archived card's body is FROZEN, so a correction to one of its statements cannot be written onto it. This card records that correction instead, and it is a correction the archived card's own review found necessary.

THE DISAGREEMENT, stated in the archived card's own two words. Box 4 of TRDD-UD8EC4FK says: "a CPV release that changes it must be caught by the test in box 5 rather than silently turning the gate into a pass." The card's Implementation note, appended in the SAME session, says the opposite: the unit test "hardcodes the same constant the production code uses, so it CANNOT detect that the constant has drifted from what CPV actually prints. The real detector of token drift is an INTEGRATION RUN against the real validator, not this unit test." BOTH CANNOT BE TRUE. A reader who stops at the acceptance checklist gets the wrong answer, and the checklist is the part a reader consults.

WHICH OF THE TWO IS RIGHT. The note is the correct one, and the reason is structural rather than a matter of opinion. Box 5's test constructs a CompletedProcess BY HAND and hands it to the classifier; the abort token in that hand-built object is the SAME CONSTANT the production code searches for, because the test imports the constant rather than transcribing what CPV prints. A test that asserts the code finds the token the test itself supplied proves the search runs; it cannot prove the token is the one CPV emits. Only a run against the real validator can supply that. So the drift detector is an INTEGRATION RUN, and box 4's clause overclaims.

WHAT THIS CHANGES IN THE FIX, beyond the card's wording. The same review that found the disagreement found a REAL HOLE behind it, and the hole is in the code, not only in the prose. The abort token was matched as a BARE SUBSTRING, so a run whose prose merely QUOTED the heading was reported as an abort - a false block of a release that completed. The verdict was matched as a bare substring on "SUMMARY:", which a section header or a quoted example satisfies; with exit 0 that is a FALSE PASS of a run that produced no verdict - the same class of defect the archived card exists to fix, in the opposite direction. BOTH ARE NOW MATCHED BY WHOLE LINE. The abort only when the heading is the WHOLE of a line, which is the shape CPV emits it in, with ANSI escapes stripped first so a colourised heading is not missed. The verdict only when a WHOLE line matches CPV's exact verdict shape with numeric counters - "SUMMARY: CRITICAL=<n> MAJOR=<n> MINOR=<n> NIT=<n> WARNING=<n>" - so a stray mention, a quoted partial example, and a prefixed line are all refused. The measured completed run's output still classifies as a pass and the measured abort run's output still classifies as an abort, VERIFIED AGAINST THE MEASURED BYTES (27430 bytes of stdout, 4480 bytes of stderr) rather than against a reconstruction, and twelve tests now pin the cases the bare-substring versions got wrong. The test helper that scopes the severity assertions to the gate's own verdict lines also now ASSERTS that a verdict line was found, so a regression that printed a severity name without the BLOCKED: prefix cannot make a negative assertion vacuous.

THE LIMIT THAT REMAINS, and it is a limit of the SUBSTRING APPROACH ITSELF, not of the matching. The classifier can distinguish the abort it has SEEN, not the abort in general. A CPV release that changes the heading AND still prints a verdict line would let an abort through as a finding or a pass, because the classifier has no other signal. The correct shape for this fix is a MACHINE-READABLE signal from the validator - a distinct exit code for an abort, or a verdict written to a file - and CPV offers neither today. Until it does, the gate's dependence on CPV's prose is a REAL COUPLING, and it is a stricter one than the code it replaced: the old gate was wrong about WHY it blocked but always blocked, while this one can be right about why and yet fail to block. That trade is accepted here because the alternative - labelling an abort as a MAJOR finding - sends the next person hunting for a finding that does not exist, and the card's own measurement showed the failure happening in the real repository. THE COUPLING IS NOT THEORETICAL. CPV's output format is demonstrably in flux - the same session that fixed this gate found the pillar tool's own source mid-edit and unparseable minutes earlier - so the format this gate depends on is one that is actively changing.

WHAT THIS CARD ASKS FOR, and what it does not. It asks that the two statements be reconciled in the form the corpus allows, and it records the reason the note is right. It does NOT ask to un-archive TRDD-UD8EC4FK: the archived card's implementation is correct, its five acceptance boxes are genuinely met, and the only defect is one overclaiming clause in box 4 - which a terminal column cannot be edited to fix. The reconciliation this card makes is therefore ONE-SIDED: this card states the truth, and the archived card's box 4 is corrected by REFERENCE rather than by rewrite, which is why this card exists rather than an edit.

THE REMAINING WORK, which is the owner's call. Two things a machine cannot do from here: whether the archived card's box 4 is left to stand as superseded by this card, or whether the archived card is un-archived and corrected in place; and whether the coupling to CPV's output format is worth a request to CPV for a machine-readable verdict, which is the only fix that removes the limit rather than narrowing it.

## Approval log

- 2026-10-21T03:08:48+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Follow-ups from commit b286335

OPEN GAP (2026-10-21): the docstring and comments of _cpv_verdict in scripts/publish.py describe earlier SUMMARY lines as a blocking floor, but the code applies the floor only when the FINAL summary is clean (if severity is None). An earlier CRITICAL summary followed by a final MAJOR summary with exit 2 is reported as MAJOR, and no test covers that case. Either apply the floor in every case or make the docstring match the code.
OVERCLAIM IN THE COMMIT MESSAGE (2026-10-21): b286335 says a real CPV run prints exactly one SUMMARY line. What was actually read: remote_validation.main() calls validate_plugin.main() once in-process, and validate_plugin.print_results prints one SUMMARY line. Not read: print_compact_summary and save_report_and_print_summary (cpv_validation_common.py:7625 and 7718). The narrower statement is the one supported. If the one-line claim is later proven, the multi-summary floor only guards against text CPV did not produce.
MOVED (2026-10-21): the floor gap now has its own card, TRDD-1Y56FYZW.
FROZEN-CARD CITATION (2026-10-21): commit b286335's subject cites TRDD-UD8EC4FK, which is archived and frozen, so that card's implementation-commits field cannot record it; this card is where b286335 is tracked. Also narrowing: the release gate does not pass -o/--report to CPV, so save_report_and_print_summary is not on the gate's path.
