---
trdd-id: LVED6ZUU
title: The mis-citation card's decision was never put to the owner, who has now ruled (b) - rewrite all twelve subjects
column: proposal
status: proposed
created: 2026-10-20T14:04:30+0200
updated: 2026-10-20T17:23:43+0200
current-owner: user
created-by: user
task-type: docs
min-approval-requirement: user
assignee: user
approved: false
supersedes: 8BXXNOPQ
---

# The mis-citation card's decision was never put to the owner, who has now ruled (b) - rewrite all twelve subjects

## What this card is, and what it does not do

THIS CARD SUPERSEDES TRDD-8BXXNOPQ, WHICH IS ARCHIVED AND THEREFORE IMMUTABLE. The correction cannot be written into the archived card, so it is recorded here, and the reason it exists is a governance defect, not a content change.

IT DOES NOT FIX THE ARCHIVED CARD. The archived card's Approval log still reads as though the owner ruled, and it still will: the archive is a one-way door and no verb can amend it. THIS CARD'S REACH IS LIMITED TO READERS WHO REACH THIS CARD - the bare search matches it ONLY BECAUSE THIS CARD'S BODY NAMES THE ID, and NOT because the `supersedes:` field is indexed for search: it is not indexed, so the discoverability is a body-text accident and not a structural link, which is the same gap ai-maestro#182 describes. The board surfaces the card, but a reader who opens the archived card directly is not pointed here, and the forward pointer that would close that gap is filed upstream.

The honest description of this card's effect is: IT RECORDS THE DEFECT AND THE RULING THE OWNER MADE ON IT. The owner ruled on 2026-10-20 - option (b), rewrite all twelve mis-cited commit subjects - and this card is where that ruling, and the caveat disclosed with it, are recorded. It is not a repair of the archived record; the rewrite it calls for is filed as TRDD-07W10I9D.

## The defect

The archived card 8BXXNOPQ's Approval log contains a line reading '2026-10-20 - OWNER RULED (a): leave the commit subjects as they are.' THAT RULING WAS NEVER GIVEN.

The owner answered three questions on 2026-10-20 - ship Anthropic's instructions as documented, create the plugin repo and list it in the marketplace, and let the agent load the skill it wants. None of them was a question about this card. The options (a) leave the subjects, (b) rewrite all twelve subjects and re-record the SHAs, (c) something else - were never put to the owner before the archived card recorded a ruling, and the card's own body reserves the rewrite to them. This card is what put them to the owner, and the ruling the owner made on 2026-10-20 is recorded below.

A reader of the archived card would conclude the rewrite question was settled. It was not. The false assertion persists in this repository's history until the owner's ruling of 2026-10-20 - option (b), rewrite all twelve - lands as a rewrite, which rewrites it out along with everything else.

## The decision the owner made, and the caveat disclosed with it

The twelve commit subjects of the guard-coverage series cite TRDD-XV6QOEK1, a card about the publish pipeline's CHANGELOG migration, which is not this work. That is what the ruling of 2026-10-20 rewrites.

THE OWNER RULED (b) ON 2026-10-20: rewrite all twelve mis-cited commit subjects, and re-record the SHAs. The plugin's own position had been (a), leave the subjects as they are - the reasoning is on the archived card - but that position is the plugin's, and the rewrite was reserved to the owner. Nothing about the twenty-four review rounds bears on it.

## The caveat the owner chose (b) with

THE BOOKKEEPING PROBLEM, WHICH WAS DISCLOSED TO THE OWNER BEFORE THE RULING AND ACCEPTED WITH IT. PRHYQEVK carries the authoritative implementation-commits list, and PRHYQEVK IS ARCHIVED: no verb can amend it. A rewritten history therefore leaves that list wrong, so the authoritative list moves to a card that supersedes PRHYQEVK rather than to the archived card itself. The card filed for the rewrite is TRDD-07W10I9D, whose own acceptance list carries the box for that superseding card. The gap is filed upstream as ai-maestro#181.

## The options as they were put, and the ruling made

(a) Leave the subjects, with this card and PRHYQEVK's implementation-commits making both directions resolvable - the plugin's position. (b) Rewrite the twelve subjects to cite PRHYQEVK, which changes every SHA and means re-recording the implementation-commits list, and is a history rewrite on a published repository. (c) Something else. THE OWNER CHOSE (b) ON 2026-10-20, WITH THE CAVEAT RECORDED IN THE SECTION ABOVE.

## The count, and what binds it

The count is twelve. It is DERIVED rather than remembered - the series window d1c4cd0^..0c5cb79 holds 22 commits, of which exactly twelve carry the wrong citation (the window's END boundary was 040ea53 before the 2026-10-20 rewrite and is 0c5cb79 after it; the start boundary d1c4cd0 is unchanged, because it predates the rewrite and so kept its SHA) and the other ten carry no TRDD id at all, and the twelve mis-cited commits are the last twelve of the twenty-two. The derivation is reproducible from the stated git commands, and NO CHECK BINDS IT: no test or script would fail if the count drifted. The archived card's own body names PRHYQEVK as the card the work belongs to, and PRHYQEVK's implementation-commits lists the last twelve of the series, omitting the first ten - among them d1c4cd0, which created the series, and 12446de, which removed the covered count.

## Acceptance

THE BOXES BELOW ARE WHAT THE OWNER'S RULING AND THE REWRITE MUST SETTLE. They are not claims about this card's own prose: a checklist of claims about the card's own wording proves nothing, because a later edit to the body would leave the boxes asserting things that had stopped being true.

- [ ] The owner's ruling of 2026-10-20 - option (b), rewrite all twelve - is recorded in this card's Approval log.
- [ ] The twelve rewritten subjects cite PRHYQEVK, and no commit other than 1050ffe cites XV6QOEK1.
- [ ] The authoritative implementation-commits list lives on a card that supersedes PRHYQEVK, because PRHYQEVK is archived and no verb can amend it, and that list names all TWENTY-TWO series commits in order, not only the last twelve.
- [ ] Every SHA reference in the corpus names the rewritten commits, and the 8BXXNOPQ archived card's references are recorded as describing the pre-rewrite state.

## Approval log
- 2026-10-20 — OWNER RULED (b): rewrite all twelve mis-cited commit subjects to cite PRHYQEVK, and re-record the SHAs. The ruling recorded in 8BXXNOPQ's Approval log as '(a): leave the commit subjects as they are' WAS NEVER GIVEN; this entry is the ruling the owner actually made.
