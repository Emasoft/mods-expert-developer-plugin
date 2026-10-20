---
trdd-id: 07W10I9D
title: Rewrite the twelve guard-coverage commit subjects to cite PRHYQEVK, and re-record the chain
column: todo
status: tasked
created: 2026-10-20T14:32:09+0200
updated: 2026-10-20T14:32:09+0200
current-owner: user
created-by: user
task-type: infra
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-10-20T14:32:09+0200
---

# Rewrite the twelve guard-coverage commit subjects to cite PRHYQEVK, and re-record the chain

THE OWNER'S RULING OF 2026-10-20: option (b). Rewrite all twelve mis-cited commit subjects, and fix everything else the reviews found.

WHAT THE REWRITE COVERS. Twelve commits of the guard-coverage series carry (TRDD-XV6QOEK1) in their subjects, and in their bodies, where XV6QOEK1 is a card about the publish pipeline's CHANGELOG migration rather than this work. The correct citation is PRHYQEVK, the card the work belongs to. Rewriting those twelve subjects changes every SHA from 0464a58 onward, and the 040ea53 endpoint, so every SHA reference in the corpus moves with them.

THE SCOPE IS TWELVE, NOT TWENTY-TWO. The series window d1c4cd0..040ea53 holds 22 commits, but only the last twelve carry the wrong citation. The first ten - d1c4cd0, 6705842, 0f4f707, 12446de, 5362f6c, eae55ed, 0e88651, 5f1f8e5, ec3f3d4, 41e833f - carry no TRDD id at all and their SHAs do not change. The commit 1050ffe legitimately cites XV6QOEK1 because it created that card, and it is not part of the rewrite.

THE BOOKKEEPING PROBLEM, WHICH THE OWNER WAS TOLD ABOUT AND ACCEPTED. PRHYQEVK's implementation-commits field lists the twelve SHAs, and PRHYQEVK IS ARCHIVED: no verb can amend it, which is filed upstream as ai-maestro#181. A rewritten history therefore leaves that list wrong, and the correction has to live on a card that supersedes it rather than on the archived card itself. The chain blame -> commit -> TRDD is restored in the SUBJECT, and the authoritative list lives on the superseding card.

WHAT ELSE THE OWNER ASKED TO BE FIXED, all confirmed by adversarial review and not yet done: the 36 bucket-A consent reasons understate the risk by ending 'Not executed by the plugin' when the chapters are agent-facing and the agent may act on them; the 72 consent reasons assert context that the line hash does not pin, with no test binding them; DELEGATION.md's three lines about the NIT blocker, the open bucket-A disposition and CPV #243 are now false; the plugin's first CI run showed MAJOR=4 because the agent preloads four user-scope skills the plugin does not ship, and 24 tests failing because a required validator capture was never a tracked fixture; and the plugin CI is red for both reasons.

## Approval log

- 2026-10-20T14:32:09+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
