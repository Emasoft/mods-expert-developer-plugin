---
trdd-id: QARM420U
title: An archived card carries a spliced Approval-log line that no verb can repair
column: complete
status: archived
created: 2026-10-20T20:14:41+0200
updated: 2026-10-20T20:28:02+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-20T20:14:41+0200
---

# An archived card carries a spliced Approval-log line that no verb can repair

A CORRUPTED LINE IN THE ARCHIVED CARD TRDD-07W10I9D, WHICH NO VERB CAN NOW REPAIR.

THE DEFECT. The archived card 07W10I9D's Approval log carries ONE entry line that is CORRUPTED: a splice. It reads "- 2026-10-20 - BOXES 2, 3 AND 9 TICKED, on the rewrite worker's verified run, ... the box is unticked for that reason, not because the list is wrong." and then, WITHOUT ANY BREAK, the tail of an EARLIER VERSION OF THE SAME LINE resumes mid-word: "ile content changed) - the parent ran 'git diff --stat' over EVERY changed pair, all 28, and got ZERO content diffs; ...". The line is 2717 characters long where it should be 1571. The text is not gibberish - both halves are individually coherent English about the same subject - but they are two different versions of one entry spliced together, and the second half contradicts the first (the first says boxes 2, 3 and 9 were ticked and box 4 was un-ticked; the spliced tail describes the state before that un-ticking).

HOW IT GOT THERE. The corruption was introduced by commit 17fe628, "docs: correct two false pointers, one premature tick, and one overstated claim", which is this repository's own earlier repair of this same card. It has been in the tree since, and it survived the history rewrite, because a rewrite of COMMIT MESSAGES does not touch FILE CONTENT.

WHY IT CANNOT BE REPAIRED IN PLACE. 07W10I9D IS ARCHIVED, AND ARCHIVED CARDS ARE IMMUTABLE. The one exception the rule allows is a body line that FALSELY and MACHINE-VERIFIABLY contradicts the card's own column, and this line does not qualify: it carries no pipeline-state claim about the card's own column. trddgrep refuses the edit with that reason, and a card already in archived/ cannot even be moved back to tasks. So the corruption is permanent in that file, and this card is the record of it.

THE TWO THINGS THAT ARE ACTUALLY WRONG IN THE LINE, both of which this card corrects.
(1) The ENTRY NAMES THE WRONG SUCCESSOR CARD. It says "TRDD-57DEBIZ2 - which does carry it, and whose list the parent verified commit for commit against git in the clone". TRDD-57DEBIZ2 WAS NEVER CREATED. The successor is TRDD-SUCA1A1A, which carries the twenty-two series commits in order with their post-rewrite SHAs and supersedes the archived PRHYQEVK. The name 57DEBIZ2 came from a draft of the rewrite card's sequence, and it was never minted.
(2) THE LINE PREDATES THE REWRITE AND SAYS SO IN THE PAST TENSE, in a card that is now archived as complete. It describes a state - the boxes ticked, the clone at base e7aa5fe, the list verified inside the clone - that is no longer the state of anything. THE REWRITE IS APPLIED, the successor card EXISTS IN THE LIVE CORPUS, and all ten boxes are ticked.

WHAT THE CORRECTED ENTRY SAYS, for a reader who needs the entry rather than the splice. The rewrite was computed against the final live base (0fd48bf), the scope was re-derived to thirteen hits with twelve rewritten, 38 commits took new SHAs and 140 kept theirs, the content diffs were empty over every changed pair, and exactly twelve subjects changed. The successor is TRDD-SUCA1A1A, not TRDD-57DEBIZ2. The rewrite was applied to the LIVE TREE by fetching the rewritten branch into the live repo and moving main there, not by force-pushing from a stale clone, and it was pushed with --force-with-lease after the adversarial review. The corpus was re-recorded in the same commit the push carried, so the partial-failure case could not arise.

THE LESSON, WHICH IS THE POINT OF RECORDING IT. A trddgrep edit writes only to the line it names, but a PREFIX match on a very long line can splice one version of that line onto another, and nothing in the write gate notices: the result is a well-formed line in a well-formed card, and it read as coherent prose on every read. The only reason it was caught is that the file was read WHOLE, after the fact, rather than skimmed. That is the reading discipline this card exists to record, and it is the same class of defect as the false pointer the 17fe628 commit was repairing: a line that says something that is not what the file means.

## Approval log

- 2026-10-20T20:14:41+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20T20:28:02+0200 — COMPLETE by main-agent@emasoft-mods-expert-developer. archived as complete (from column todo).

## THE UPSTREAM REPORTS FOR THE DEFECTS THIS CARD RECORDS

Four new issues were filed on 2026-10-20 against Emasoft/ai-maestro, alongside the four already open: #184 - trddgrep edit can SPLICE two versions of a line into one, corrupting a card silently. That is the mechanism behind the corrupted line this card is about, and the reason it became permanent. #185 - trddgrep edit accepts an --expect identical to --replace and reports a successful edit that changed nothing, so a green 'edited' does not mean a change landed. #186 - trddgrep edit reports a MISSING --at-line only after the whole edit has been assembled and validated, so the caller does the expensive work before being told what it needed. #187 - trddgrep move refuses to archive a card with no acceptance checklist, but a card can reach that state, and the refusal does not name the remedy - which is what a card whose checklist was damaged by #184 actually needs. ALREADY OPEN AND STILL RELEVANT: #179 (no verb can amend an archived card), #181 (a card archived with approved: false can never be corrected), #182 (supersedes: is a backward pointer only, so a correction filed against an archived card never reaches a reader of that card), and #183 (edit cannot remove a line). ALL EIGHT ARE OPEN ON 2026-10-20.

## ACCEPTANCE CHECKLIST

- [x] 1. The corrupted line in the archived card 07W10I9D is identified, with its two content errors stated: the wrong successor card (57DEBIZ2, never created, where the real one is SUCA1A1A) and the past-tense description of a state that the completed rewrite superseded.
- [x] 2. The reason it cannot be repaired in place is stated, and the fact that archived cards are immutable is named as the cause, with the rule's one exception checked against this line and found not to apply.
- [x] 3. The introducing commit is named (17fe628), and the reason the corruption survived the history rewrite is stated: a rewrite of commit MESSAGES does not touch file CONTENT.
- [x] 4. The corrected entry is written out, so a reader who needs the entry rather than the splice does not have to reconstruct it.
- [x] 5. The reading lesson is recorded: a prefix match on a very long line can splice one version of that line onto another, nothing in the write gate notices, and only a whole-file read catches it.
- [x] 6. Every defect this card records is reported upstream on Emasoft/ai-maestro, and each issue number is listed on the card.
