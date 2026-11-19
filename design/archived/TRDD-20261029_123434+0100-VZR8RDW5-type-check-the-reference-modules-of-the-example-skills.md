---
trdd-id: VZR8RDW5
title: Type-check the reference modules of the example skills
column: complete
status: archived
created: 2026-10-29T12:34:34+0100
updated: 2026-10-29T16:47:52+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-29T12:34:34+0100
parent-trdd: 2XFV601A
derived: true
implementation-commits: [f4e8084]
---

# Type-check the reference modules of the example skills

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-29

CURRENT STATE 2026-10-29: todo. NEXT ACTION: tests first. NPT of TRDD-2XFV601A.

### Design

A heading grammar "### Reference module, <name>, MIT (this plugin)" accepted by unclaimed() in scripts/excerpt_lock.py; a new test extracts every such block, writes its own temporary tsconfig (strict true) whose includes cover the extracted files and .claude-plugin/types, and runs tsc --noEmit; a block that does not compile fails. The test forbids @ts-nocheck, @ts-ignore and @ts-expect-error inside those blocks, and fails when a reference file that declares modules has zero blocks (count derived from the files, never hard-coded). The generated types are gitignored and CI runs no tsc (measured), so the test skips loudly where .claude-plugin/types is absent; the developer-tree run is the gate of record. Benefit to record: regenerated types for a newer Claude Code break stale modules, so the test catches API drift.
CURRENT STATE 2026-10-29: tests committed (f7f093f, 20f00be, plus this round). The real-module compile test skips until the first reference module exists; the first module written in TRDD-2XFV601A I7 must turn it from skip to pass in the developer tree, and that commit records it. This card does not move to complete before that pass is recorded. The 150-line cap is a starting value, to be revisited after the first ten modules.
CURRENT STATE 2026-10-29: f4e8084 (the first reference module, in TRDD-2XFV601A I7b) turned the compile test from skip to pass: tests/test_reference_modules.py::test_reference_modules_compile_under_strict_tsc passes in the developer tree, and the behaviour tests pass under claude plugin test. The condition for complete is met.

## Approval log

- 2026-10-29T12:34:34+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-29T16:47:52+0100 — COMPLETE by main-agent@emasoft-mods-expert-developer. All nine acceptance boxes ticked with evidence: vzr-check.txt (20 passed, no skips), vzr-full-suite.txt (579 passed at a02dfa1), commits f7f093f, 20f00be, 148d488, f4e8084..

## Acceptance checklist

- [x] Heading and fence grammar is tested (commits f7f093f, 20f00be, 148d488). Evidence: tests/test_reference_modules.py, test_reference_module_headings_all_yield_a_block and test_malformed_module_heading_is_reported, passing in reports_dev/mod-examples-2/vzr-check.txt (20 passed, no skips).
- [x] Strict tsc runs on every reference module. Evidence: test_reference_modules_compile_under_strict_tsc passes, not skipped, in reports_dev/mod-examples-2/vzr-check.txt.
- [x] Reference modules may not contain @ts-nocheck, @ts-ignore or @ts-expect-error. Evidence: test_reference_modules_have_no_suppression_directives passes in reports_dev/mod-examples-2/vzr-check.txt.
- [x] A module block is at most 150 lines (a starting value, to be revisited after ten modules). Evidence: test_module_block_size_cap passes in reports_dev/mod-examples-2/vzr-check.txt.
- [x] The real-module compile test passes on a real module, added by commit f4e8084 (skills/mods-example-account-switching). Evidence: reports_dev/mod-examples-2/vzr-check.txt shows 20 passed, no skips.
- [x] The suite is green (579 passed at a02dfa1). Evidence: reports_dev/mod-examples-2/vzr-full-suite.txt, 579 passed, exit 0.
- [x] Behaviour tests pass under claude plugin test (STATE 2026-10-29). Evidence: test_reference_module_behaviour_tests_pass_under_claude_plugin_test passes in tests/test_reference_modules.py (20 passed, 0 skipped at a02dfa1, reports_dev/mod-examples-2/vzr-check.txt).
- [x] The test skips loudly where .claude-plugin/types is absent (Design). Evidence: verified by reading the code, not by running it, because the types exist in this tree. SKIP_TYPES at tests/test_reference_modules.py:48-51 begins SKIPPED, NOT VERIFIED, and each compile test calls pytest.skip(SKIP_TYPES), for example at lines 179-180.
- [x] A reference file that declares Reference module headings but yields zero blocks fails (Design). Evidence: test_reference_module_headings_all_yield_a_block, test_unclosed_module_fence_yields_no_block_and_is_reported and test_fence_must_follow_the_heading_with_only_blank_lines all pass in reports_dev/mod-examples-2/vzr-check.txt.
