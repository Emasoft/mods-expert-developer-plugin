---
trdd-id: 07W10I9D
title: Rewrite the twelve guard-coverage commit subjects to cite PRHYQEVK, and re-record the chain
column: todo
status: tasked
created: 2026-10-20T14:32:09+0200
updated: 2026-10-20T14:49:26+0200
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

WHAT THE REWRITE COVERS. Twelve commits of the guard-coverage series carry (TRDD-XV6QOEK1) in their SUBJECT LINE, where XV6QOEK1 is a card about the publish pipeline's CHANGELOG migration rather than this work. The correct citation is PRHYQEVK, the card the work belongs to.

MEASURED, SO THE SCOPE IS UNAMBIGUOUS: in each of the twelve, the string TRDD-XV6QOEK1 occurs EXACTLY ONCE, and that occurrence is in the subject line. The commit BODY - everything after the first line - contains ZERO occurrences in all twelve. An earlier draft of this card said the twelve carry the id 'in their subjects, and in their bodies'; that was WRONG about the bodies, and it is corrected here. The consequence is that the rewrite is a subject-line replacement in all twelve, with no body occurrence to judge and no case where replacing one would make a body assert something false.

WHAT THE REWRITE CHANGES BEYOND THE TWELVE. A rewritten commit changes the SHA of every commit after it, so the rewrite changes the SHA of EVERY COMMIT FROM 0464a58 ONWARD IN THE WHOLE REPO - including the commits made since (the consent registry, the card filings, the marketplace work), not only the twelve and their descendants within the series. The old-to-new SHA mapping therefore covers most of this repository's history, and every SHA reference in the corpus has to be re-recorded against it. The first ten of the series (d1c4cd0 ... 41e833f, listed below) carry no TRDD id at all, so their own messages do not change and their SHAs do not change - but their DESCENDANTS' do.

THE SCOPE IS TWELVE, NOT TWENTY-TWO. The series window d1c4cd0..040ea53 holds 22 commits, but only the last twelve carry the wrong citation. The first ten - d1c4cd0, 6705842, 0f4f707, 12446de, 5362f6c, eae55ed, 0e88651, 5f1f8e5, ec3f3d4, 41e833f - carry no TRDD id at all and their SHAs do not change. The commit 1050ffe legitimately cites XV6QOEK1 because it created that card, and it is not part of the rewrite. DO NOT TOUCH 1050ffe AT ALL, and CONFIRM AFTER THE REWRITE that the surviving occurrence of XV6QOEK1 in the whole history is exactly 1050ffe and nothing else - that turns a judgement into a check.

THE BOOKKEEPING PROBLEM, WHICH THE OWNER WAS TOLD ABOUT AND ACCEPTED. PRHYQEVK's implementation-commits field lists the twelve SHAs, and PRHYQEVK IS ARCHIVED: no verb can amend it, which is filed upstream as ai-maestro#181. A rewritten history therefore leaves that list wrong, and the correction has to live on a card that supersedes it rather than on the archived card itself. The chain blame -> commit -> TRDD is restored in the SUBJECT, and the authoritative list lives on the superseding card.

PRHYQEVK's list must be recorded as KNOWN-STALE, not merely wrong, so a future reader who lands on it is told it is superseded rather than believing it. The superseding card carries that statement. The remedy necessarily creates the list in two places - the stale one on the archived card and the correct one on its successor - which is the shape the original mis-citation had; the difference is that the successor is reachable by `supersedes:`, and that gap is filed upstream as ai-maestro#182.

THE 22-COMMIT WINDOW IS A CHOICE, NOT A FACT ANYTHING CHECKS. d1c4cd0 is the commit that derived the figure and created the series, so it is a defensible start, but it is a start this card CHOSE; other windows were defensible and would give different totals. NO CHECK BINDS ANY COUNT HERE - no test or script would fail if a thirteenth commit appeared carrying the wrong id, or if the count drifted. The counts are stated because they are derived and reproducible, not because anything enforces them.

WHAT ELSE THE OWNER ASKED TO BE FIXED, all confirmed by adversarial review and not yet done: the 36 bucket-A consent reasons understate the risk by ending 'Not executed by the plugin' when the chapters are agent-facing and the agent may act on them; the 72 consent reasons assert context that the line hash does not pin, with no test binding them; DELEGATION.md's three lines about the NIT blocker, the open bucket-A disposition and CPV #243 are now false; the plugin's first CI run showed MAJOR=4 because the agent preloads four user-scope skills the plugin does not ship, and 24 tests failing because a required validator capture was never a tracked fixture; and the plugin CI is red for both reasons.

## Approval log

- 2026-10-20T14:32:09+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20 — THE OWNER RULED IN CONVERSATION, NOT THROUGH THIS TOOL: the message was 'rewrite all, and fix all', which chose option (b). The MANDATE line above is the tool's own generated text for a self-approved mandate, and it records the tool's view of authority, not the provenance of the ruling. The ruling itself arrived as the owner's own words in conversation, and the agent recorded it as a mandate issued on the owner's instruction. This is stated plainly because this repository already carries one approval line that asserted a decision the owner never made (TRDD-LVED6ZUU), and a second line that blurs the same distinction in a card about a history rewrite would be worth getting wrong.

## The push, which is the only irreversible part

THE REWRITE ITSELF IS REVERSIBLE. It is a local operation on a clone; the original history survives in the local reflog and on the remote until the push. THE PUSH IS WHERE IRREVERSIBILITY BEGINS: applying the rewrite to the public repository means a FORCE-PUSH to main, which rewrites published history for every clone.
THE BLAST RADIUS IS SMALL, AND THAT IS A FACT TO RECORD RATHER THAN AN ASSUMPTION. The repository was created on 2026-10-20, has NO TAGS, NO RELEASES and no dependent clones, so the force-push affects one public branch and its own history. That smallness is a large part of why (b) was a reasonable choice, and it is what would change if the plugin had already been released.
THE ORDER MATTERS, BECAUSE TWO OF THE THREE CARDS CANNOT BE FIXED AFTERWARDS. The three cards that reference the old SHAs are PRHYQEVK (archived, holds the authoritative implementation-commits list, CANNOT be amended - filed upstream as ai-maestro#181), 8BXXNOPQ (archived, also cannot be amended) and LVED6ZUU (editable, in design/proposals/). THE SHA REFERENCES MUST BE RE-RECORDED IN THE SAME OPERATION AS THE PUSH, because after it the old SHAs no longer resolve on the remote and the two archived cards can never be corrected in place. The push is the point of no return.

## Acceptance

- [ ] The twelve rewritten subjects cite PRHYQEVK, and the only surviving occurrence of XV6QOEK1 in the whole history is 1050ffe.
- [ ] No commit's file content changed: git diff between each old and new SHA is empty.
- [ ] The old-to-new SHA mapping covers EVERY commit whose SHA changed, not only the twelve.
- [ ] A card superseding PRHYQEVK carries the authoritative list of all TWENTY-TWO series commits in order, and records that PRHYQEVK's own list is stale as of the rewrite.
- [ ] Every SHA reference in the corpus names the rewritten commits, and the two archived cards' references are recorded as describing the pre-rewrite state.
- [ ] The force-push to main has been reviewed, and the SHA re-recording happens in the same operation as the push.
