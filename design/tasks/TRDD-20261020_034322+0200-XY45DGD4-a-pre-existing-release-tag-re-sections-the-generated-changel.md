---
trdd-id: XY45DGD4
title: A pre-existing release tag re-sections the generated changelog and can relabel its top heading
column: approval
status: tasked
created: 2026-10-20T03:43:22+0200
updated: 2026-10-20T03:43:22+0200
current-owner: user
created-by: user
task-type: infra
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: none
approved: true
approval-judge: user
approval-datetime: 2026-10-20T03:43:22+0200
---

# A pre-existing release tag re-sections the generated changelog and can relabel its top heading

THE SUBJECT OF THIS CARD IS THE SECTION-STRUCTURE AND VERSION-LABEL BEHAVIOUR, measured on clones of this repository while the publish-path finding (TRDD-XV6QOEK1) was being established. It was separated out of that card because it is a DIFFERENT SUBJECT, and because eleven rounds of review had grown it inside a card whose title names something else.

MEASURED, IN FIVE CASES, ALL ON CLONES PINNED AT ONE COMMIT so that the only variable is where the tag sits.

THE MECHANISM: a pre-existing tag OPENS A SECTION for the commits up to and including the tagged commit, dated by THE TAGGED COMMIT'S OWN COMMIT DATE; the commits AFTER the tag stay in the top section, dated today, under the SUPPLIED version.

| case | tag position | top heading | top bullets | second section | 2nd bullets | cliff's "already a tag" warning |
|---|---|---|---|---|---|---|
| (a) | no tag at all | ## [0.9.9] | 90 | (none) | 0 | (none) |
| (b) | root commit (2026-10-15) | ## [0.9.9] | 89 | ## [0.0.1] — 2026-10-15 | 1 | (none) |
| (c) | 82c693d (2026-10-20) | ## [0.9.9] | 6 | ## [0.0.1] — 2026-10-20 | 84 | (none) |
| (d) | HEAD, the commit being released | ## [0.0.1] | 90 | (none) | 0 | There is already a tag (v0.0.1) |
| (e) | 82c693d on a separate branch | ## [0.9.9] | 6 | ## [0.0.1] — 2026-10-20 | 84 | (none) |

THE THREE MEASURED FACTS: (1) the same 90 commits appear in every case — the tag changes neither which commits are rendered nor their count; (2) the RELEASE-SECTION COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets; (3) the top heading's VERSION varies in exactly one case, (d), and only there. Case (e) is numerically IDENTICAL to (c) and therefore tested nothing new, because 82c693d is an ancestor of HEAD either way.

THE OPEN QUESTION, which is the owner's and not the plugin's: SHOULD A PRE-EXISTING TAG BE ALLOWED TO RE-SECTION THE CHANGELOG, AND TO RELABEL ITS TOP HEADING? The plugin states the measurement and does not classify its significance.

THE INFERENCE THE WARNING COLUMN SUPPORTS BUT DOES NOT ESTABLISH: cliff prints 'There is already a tag' in exactly the one case where the tag sits on the commit being released, and in no other. What that supports is that cliff reports a pre-existing tag only when that tag is on the commit it is labelling. What it does NOT establish is WHY — it may report only for a tag on the labelled commit, or only when the existing tag's version differs from the supplied one, and the measurement does not separate the two.

EVERY MEASUREMENT HERE IS OF THE PRE-TAG, NO-REMOTE STATE. Creating the first release tag changes the tag set, and giving the repository a remote changes the version baseline, so these are the renders BEFORE that action, not after.

## Approval log

- 2026-10-20T03:43:22+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

---

**PROVENANCE — WHERE THIS EVIDENCE WAS TAKEN, so a future session can re-check it rather than re-derive it.** The measurement was made
on CLONES of this repository, in /tmp, never on the working tree. All five cases were run on five SEPARATE CLONES PINNED AT ONE
COMMIT — 8052a3c, "docs: pin the version's baseline, and add the case that fails to discriminate" — so that the only variable is where
the tag sits. The command in every case was the pipeline's own: "git cliff --bump --tag v0.9.9 -o CHANGELOG.md". The first record of
these runs is TRDD-XV6QOEK1, the card they were taken while investigating; that card now carries only the format migration.

**THE ANCESTOR FACT, WHICH IS WHY CASE (e) DUPLICATES CASE (c) AND IS THE ONE PROVENANCE ITEM THAT HAD LIVED ONLY IN A COMMIT
MESSAGE: 82c693d IS AN ANCESTOR OF HEAD. Check it with "git merge-base --is-ancestor 82c693d HEAD" on any clone at the pinned commit
— it returns 0. That is why placing the tag on a branch that `main` also contains changes nothing cliff can see, and it is the fact a
future session must re-check to understand why the table has five rows and the finding has four cases.**

**HOW MANY CASES THIS FINDING RESTS ON: FOUR, not five.** The table has five rows because case (e) was run to try to discriminate a rule
that case (c) could not, and it turned out NUMERICALLY IDENTICAL to case (c) — because 82c693d is an ancestor of HEAD either way, so
placing the tag on a branch that main also contains changes nothing cliff can see. So the distinct cases are: (a) the no-tag CONTROL;
(b) the tag at the first commit; (c) the tag at an ancestor of the released commit; (d) the tag at the released commit. (e) is (c) again.

**THE CLAUSE THAT ONE CASE SEPARATES, AND WHICH CASE SEPARATES IT.** The rule says the second section is dated by THE TAGGED COMMIT'S OWN
COMMIT DATE and the top section is dated by the release date. Case (b) is the case that separates those two dates — the root commit is
dated 2026-10-15 and the top section is dated 2026-10-20. In cases (c) and (e) the two dates COINCIDE (both 2026-10-20), so those
cases do not test that clause. Case (d) has no second section at all, and (a) has no tag.

**THE THREE MEASURED FACTS, RESTATED.** (1) The same 90 commits appear in every case — the tag changes neither which commits are
rendered nor their count. (2) The release-section COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets;
each row's two counts sum to 90, which is how the table reproduces. (3) The top heading's VERSION varies in exactly one case, (d), and
only there.
