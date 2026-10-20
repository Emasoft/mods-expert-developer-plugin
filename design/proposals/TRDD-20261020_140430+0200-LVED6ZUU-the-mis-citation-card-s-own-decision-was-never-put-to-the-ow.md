---
trdd-id: LVED6ZUU
title: The mis-citation card's decision was never put to the owner - the owner is asked to rule on (a), (b) or (c)
column: proposal
status: proposed
created: 2026-10-20T14:04:30+0200
updated: 2026-10-20T14:26:40+0200
current-owner: user
created-by: user
task-type: docs
min-approval-requirement: user
assignee: user
approved: false
supersedes: 8BXXNOPQ
---

# The mis-citation card's own decision was never put to the owner, and the archived card records a ruling that was not given

## What this card is, and what it does not do

THIS CARD SUPERSEDES TRDD-8BXXNOPQ, WHICH IS ARCHIVED AND THEREFORE IMMUTABLE. The correction cannot be written into the archived card, so it is recorded here, and the reason it exists is a governance defect, not a content change.

IT DOES NOT FIX THE ARCHIVED CARD. The archived card's Approval log still reads as though the owner ruled, and it still will: the archive is a one-way door and no verb can amend it. THIS CARD'S REACH IS LIMITED TO READERS WHO REACH THIS CARD - the bare search matches it, and the board surfaces it, but a reader who opens the archived card directly is not pointed here. The forward pointer that would close that gap is filed upstream as ai-maestro#182.

The honest description of this card's effect is: IT PUTS THE DECISION IN FRONT OF THE OWNER. It is a record of a defect and a request for a ruling, not a repair of the record.

## The defect

The archived card 8BXXNOPQ's Approval log contains a line reading '2026-10-20 - OWNER RULED (a): leave the commit subjects as they are.' THAT RULING WAS NEVER GIVEN.

The owner answered three questions on 2026-10-20 - ship Anthropic's instructions as documented, create the plugin repo and list it in the marketplace, and let the agent load the skill it wants. None of them was a question about this card. The options (a) leave the subjects, (b) rewrite all twelve subjects and re-record the SHAs, (c) something else - were never put to the owner, and the card's own body reserves the rewrite to them.

A reader of the archived card would conclude the rewrite question was settled. It was not. The false assertion persists in this repository's history unless the owner chooses (b), which rewrites it out along with everything else.

## The decision that is actually open

The twelve commit subjects of the guard-coverage series cite TRDD-XV6QOEK1, a card about the publish pipeline's CHANGELOG migration, which is not this work.

THE PLUGIN'S POSITION IS (a): leave the subjects as they are. The reasoning is on the archived card - rewriting published history changes every SHA, invalidates the implementation-commits list on PRHYQEVK, and is forbidden without the owner's explicit approval. But the position is the plugin's, and (b) REMAINS OPEN and is reserved to the owner. Nothing about the twenty-four review rounds bears on it.

## What the owner is asked to choose

(a) Leave the subjects, with this card and PRHYQEVK's implementation-commits making both directions resolvable - the plugin's position. (b) Rewrite the twelve subjects to cite PRHYQEVK, which changes every SHA and means re-recording the implementation-commits list, and is a history rewrite on a published repository. (c) Something else.

## The count, and what binds it

The count is twelve. It is DERIVED rather than remembered - the series window d1c4cd0..040ea53 holds 22 commits, of which exactly twelve carry the wrong citation and the other ten carry no TRDD id at all, and the twelve mis-cited commits are the last twelve of the twenty-two. The derivation is reproducible from the stated git commands, and NO CHECK BINDS IT: no test or script would fail if the count drifted. The archived card's own body names PRHYQEVK as the card the work belongs to, and PRHYQEVK's implementation-commits lists the last twelve of the series, omitting the first ten - among them d1c4cd0, which created the series, and 12446de, which removed the covered count.

## Approval log

## Acceptance

- [x] The defect is stated plainly and with the evidence: the archived card's Approval log records an owner ruling that was never given, and the owner's three actual answers are named.
- [x] The card says what it does NOT do: it does not repair the archived card, its reach is limited to readers who reach this card, and the missing forward pointer is filed upstream as ai-maestro#182.
- [x] The unverifiable completeness claim is gone, and 'permanent' is now scoped to the option not yet chosen - the false assertion persists unless the owner chooses (b), which rewrites it out.
- [x] The count is stated as derived AND unverified: reproducible from the stated git commands, with no test or script that would fail if it drifted.
- [x] The body is section-structured, so trddgrep append and check-box address this card's parts rather than a single pipe-separated paragraph.
