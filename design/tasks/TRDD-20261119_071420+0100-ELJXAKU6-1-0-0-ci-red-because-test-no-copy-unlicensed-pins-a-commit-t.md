---
trdd-id: ELJXAKU6
title: 1.0.0 CI red because test_no_copy_unlicensed pins a commit the squash removed
column: dev
status: tasked
created: 2026-11-19T07:14:20+0100
updated: 2026-11-19T07:14:39+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-19T07:14:20+0100
---

# 1.0.0 CI red because test_no_copy_unlicensed pins a commit the squash removed

## Problem

CI run 44468101825 and Release run 44468101351 on the 1.0.0 commit 0da5761 fail: 16 cases of tests/test_no_copy_unlicensed.py::test_shipped_files_copy_nothing_from_forbidden_source run `git ls-tree -r --name-only e7b7df2`, which exits 128. The Release job was skipped, so the v1.0.0 GitHub release has no assets (v0.6.2 had sbom.spdx.json, SHA256SUMS, validation-report.txt).

## Cause

The test reads its prior art (the Anthropic-adapted mods-doc chapters) at BASELINE = e7b7df2. The 1.0.0 release was squashed to one commit on top of v0.6.2 (USER decision 2026-11-19, "Squash to one commit (Recommended)"), so e7b7df2 is on no public ref: GitHub answers HTTP 422 for it, and none of the 50 refs origin advertises reaches it. The local publish gates passed only because the local repository still holds e7b7df2.

## Fix

Pin the 60 baseline chapters by blob hash in tests/fixtures/no-copy-baseline-chapters.txt, generated once from e7b7df2, and read each blob with git cat-file. All 60 blobs are in public history (identical at 0da5761). BASELINE stays as provenance text. It is not moved to a public commit: the coordinator ruled that this would widen the prior art once a chapter changes. Never push e7b7df2 or any backup branch: that would republish the squashed history, which carries private paths.

## Acceptance

- [ ] In a fresh clone of origin/main, `git ls-tree -r --name-only e7b7df2` exits 128, and the fixed test file passes.
- [ ] A changed blob hash in the manifest turns the test red.
- [ ] 1.0.1 is published and CI and Release are green on its commit.

## Approval log

- 2026-11-19T07:14:20+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
