---
trdd-id: PRHYQEVK
title: The NIT-adjudication spec's guard-coverage figures are derived, not restated
column: complete
status: archived
created: 2026-10-20T13:03:10+0200
updated: 2026-10-20T13:04:09+0200
current-owner: user
created-by: user
task-type: docs
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-10-20T13:03:10+0200
implementation-commits: 0464a58, d731e2e, 36a441e, a3c71df, 073c46d, 705c26f, 089ae10, 01ef8e4, 168175f, d9a2075, 6c76e6a, 040ea53
---

# The NIT-adjudication spec's guard-coverage figures are derived, not restated

CLOSED. The guard-coverage passage in DELEGATION.md now states only figures the code derives, and the two checks that read it enforce that as PROPERTIES rather than as prose.

WHAT THE SERIES DID. Twenty-four adversarial review rounds, each finding real defects in the previous round's fix, every finding applied rather than explained away. The method was one rule: a figure no check can enforce is worse than no figure, so every figure in the passage must be DERIVED from code and every claim in it must be true. The figures removed as unenforceable: the covered count (its complement returned it by arithmetic), the token-gap aggregates (restated from the spec, which owns them), the wide-gap rule set (named in prose), the count of exclusions as a word (unbound, and a change of the word left the test green). The false claims removed: the 'EVERY FIGURE in this sentence is enforced' overclaim, a set-membership claim about the wide-gap sites and rules that the spec's own content contradicts, a 'fallback switches to' clause false of three of the four rules, a dangling 'the sentence above' pointer, and a sentence that disclaimed making a set claim while making one.

WHAT THE CHECKS NOW ARE. tests/test_spec_selfcheck_coverage.py holds two tests. The first asserts the ledger's stated guard total against the count the embedded script yields, and binds the named conditions to the code's. The second is a PROPERTY test: it derives the guard total from the script, builds its sentences from that derived total, and asserts the covered-count ban's behaviour clause by clause - every shape of figure caught, every corpus claim missed, each of the eight window-ending characters, the dash the windows cross, the ratio form's denominator binding, the noun form's any count, and the degrade boundary. It tracks the script rather than freezing a copy of its behaviour, which was proved by neutering one guard in the embedded script and watching the test follow the total from 19 to 18.

STILL OPEN, AND THE OWNER'S TO DECIDE - NOT THIS SERIES' TO CLOSE. (1) THE EDITORIAL QUESTION: whether the plugin ships, as they appear in Anthropic's own documentation, the vendor's install one-liner, the permission-bypass CLI flag, the long-lived-token minting command and the superuser examples - the 36 bucket-A findings. (2) THE 32-SKILL PRELOAD DECISION: the plugin lists 64 skill names and 32 get their content injected; one frontmatter line, unchanged across every round of this series. Neither was touched by this work and neither can be settled by a measurement.

## Approval log

- 2026-10-20T13:03:10+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20T13:04:09+0200 — COMPLETE by user. The guard-coverage passage's figures are derived, its claims are true, and the check is a property rather than a description; the twenty-fourth review found no defect in the final commit..

## Acceptance

- [x] The guard-coverage passage in DELEGATION.md states the guard total and no other guard-count figure, and the total it states is the count the embedded script yields - checked by tests/test_spec_selfcheck_coverage.py::test_the_ledger_states_this_scripts_guard_count.
- [x] The passage carries no claim about how many guards are covered, and the check forbids the figures that would state one - asserted as a property, not described in prose.
- [x] The wide-gap site set and the wide-gap rule set are kept apart in the passage, and the passage points at the spec widest-gap table rather than naming the rules in prose.
- [x] Every claim in the passage is true of the tree it ships in, and the property test pins the check behaviour clause by clause.
- [x] The property test derives the guard total from the embedded script, so it tracks the script rather than freezing a copy of its behaviour - proved by neutering one guard and watching the derived total move from 19 to 18.
- [x] The full suite passes, ruff and markdownlint are clean on every tracked file, and the strict validator scan reads 72 NITs with CRITICAL=0 MAJOR=0 MINOR=0 WARNING=0.
