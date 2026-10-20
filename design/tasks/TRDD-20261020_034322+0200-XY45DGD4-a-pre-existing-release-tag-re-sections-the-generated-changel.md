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
| (d) | HEAD, the commit the render labels | ## [0.0.1] | 90 | (none) | 0 | There is already a tag (v0.0.1) |
| (e) | 82c693d on a separate branch | ## [0.9.9] | 6 | ## [0.0.1] — 2026-10-20 | 84 | (none) |

THE THREE MEASURED FACTS: (1) the same 90 commits appear in every case — the tag changes neither which commits are rendered nor their count; (2) the RELEASE-SECTION COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets; (3) the top heading's VERSION varies in exactly one case, (d), and only there. Case (e) is numerically IDENTICAL to (c) and therefore tested nothing new, because 82c693d is an ancestor of HEAD either way.

**THE LABELLING BEHAVIOUR, AS MEASURED — AND THE RETRACTION THAT TRAVELS WITH IT, so this card does not contain a claim its own table
refutes.** What the four cases show, AS AN OBSERVATION AND NOT AS THE MECHANISM: IN EVERY CASE WHERE THE PRE-EXISTING TAG WAS NOT ON
THE COMMIT THE RENDER LABELS, THE SUPPLIED TAG WAS USED; IN THE ONE CASE WHERE IT WAS, THE EXISTING TAG WAS USED. **THAT IS WHAT WAS
OBSERVED, NOT THE RULE THAT GOVERNS IT. THE RULES THIS MEASUREMENT LEAVES OPEN ARE SEVERAL, AND THE "TAG ON THE COMMIT THE RENDER
LABELS" READING IS ONE OF THEM, NOT THE ESTABLISHED ONE** — the cases are equally consistent with "a tag on HEAD" (case (d) IS HEAD in
that run) and with "the highest-version tag", and this card's own warning-column paragraph is where that limit is stated in the file's
own voice. **"THE COMMIT THE RENDER LABELS" IS A NEUTRAL PIVOT, NOT A MECHANISM** — it names the commit the render was asked to label,
which is observable in the command line, and it does not say what cliff looks for when it decides which tag supplies the label.

**AND WHAT THE CASES EXCLUDE, STATED AT THE SCOPE THE CASES REACH.** Cases (b) and (c) show that the SUPPLIED tag was used even
when a pre-existing tag was present — in (b) the root commit's tag, in (c) the ancestor's. **THAT EXCLUDES EVERY READING THAT WOULD
HAVE SELECTED THE TAG ACTUALLY PRESENT IN THOSE CASES** — the root in (b), the ancestor in (c) — and it excludes them TOGETHER, because in
(b) there is exactly ONE tag in the repository, so "the nearest", "the only", "the sole pre-existing" and "the ancestor of HEAD" all
select that same tag and are ruled out by that same observation. **AND IT DOES NOT ENUMERATE WHAT REMAINS.** An earlier draft of this
card listed "the nearest tag" among the open rules and named the survivors as "the position-based ones and the version-based one"; THAT
PARTITION IS WITHDRAWN, because it singled out one reading from a family the cases ruled out together, and it read as a settled
partition of the rule space in a paragraph whose whole point is that the measurement settles nothing. The exclusions the cases DO
support are the two above, and the rule space beyond them is not enumerated here.
support are the two above, and the rule space beyond them is not enumerated here. **AND THE "NEAREST TAG" LIST CHANGE IS ITS OWN
MOVE, recorded here so a reader does not have to infer it: an earlier draft listed "the nearest tag" among the OPEN rules; it is now
EXCLUDED — not withdrawn as a hypothesis, but ruled out by cases (b) and (c) at the scope stated above. The separate move, the
withdrawal of the survivors-partition, is recorded in the sentence before this one.**

**AND HERE IS THE HANDLE FOR A RE-RUN, so "not enumerated here" is a deferral with a grip and not a blank.** These readings are EXCLUDED
by the cases as they stand: any reading that would have selected the tag present in case (b) — the root commit's — or in case (c) — the
ancestor's. These readings are NOT SEPARATED by the cases, and are what a re-run would have to discriminate: "a tag on the commit the
render labels" and "a tag on HEAD" are the same reading in case (d), which IS HEAD in that run, and no other case puts a tag on HEAD that
is not also on the commit the render labels; "the highest-version tag" is untested, because no case had two tags with different
versions; and any rule keyed to the RELATIONSHIP between the existing tag and the supplied one — a version comparison, a distance
comparison — is likewise untested, because in every case the existing tag's version was v0.0.1 and the supplied one was v0.9.9, so the
two never varied independently. **A RE-RUN THAT PLACES A SECOND TAG AT A DIFFERENT POSITION, OR WITH A DIFFERENT VERSION, WOULD SEPARATE
THESE; the table above says which cases were run, and this paragraph says which hypotheses they left open.

**THE REASSURING CASE, and why it does not conflict with case (d).** On the FIRST release — the one with no pre-existing tag to label
from — the render labels the window from the SUPPLIED tag, which is built from the version the pipeline computed, so the two agree BY
CONSTRUCTION. Once a tag exists, the computed version is derived FROM a tag and the label is taken FROM a tag — so they agree again
IN THE ORDINARY CASE, WHERE THE TAG THE RENDER LABELS IS ALSO THE MOST RECENT TAG. **"THE MOST RECENT TAG" IS A READING LIKE THE
OTHERS, NOT ONE THE CASES ESTABLISH** — no case had a tag that was both older and present, so most-recent was never separated from the
readings the cases do exclude. That uniqueness is not guaranteed: a stale tag on the commit the render labels, alongside a newer tag
elsewhere, would put the label and the version on DIFFERENT tags, and they would disagree. **AND HERE IS WHY THAT DOES NOT CONFLICT WITH
CASE (d) — THE REASON IS THE SOURCE OF THE LABEL, NOT A TIMELINE. The five cases are five CONFIGURATIONS OF ONE HISTORY at one pinned
commit, not a sequence of releases; all five render the same 90 commits at the same commit.** The first-release statement concerns a
label taken from the SUPPLIED tag; case (d) concerns a label taken from an EXISTING TAG ON THE COMMIT THE RENDER LABELS. The two
statements are ABOUT DIFFERENT SOURCES, so they DO NOT BEAR ON EACH OTHER. Case (d) is also the narrow case the owner's question is
about.

THE OPEN QUESTION, which is the owner's and not the plugin's: SHOULD A PRE-EXISTING TAG BE ALLOWED TO RE-SECTION THE CHANGELOG, AND TO RELABEL ITS TOP HEADING? The plugin states the measurement and does not classify its significance.

**A NOTE ON THE REASSURING CASE'S PLACE HERE, so its presence is not mistaken for an answer.** It is stated in this card because the card
records the MEASUREMENT, and the measurement includes the case where the label agrees. **Its presence is not a recommendation that the
behaviour is fine**: the open question above is the owner's, and the reassuring case is one of the four measured cases, not a verdict on
the question. A reader who wants the finding without the reassurance has the table and the three measured facts above.

THE INFERENCE THE WARNING COLUMN SUPPORTS BUT DOES NOT ESTABLISH: cliff prints 'There is already a tag' in exactly the one case where the tag sits on the commit the render labels, and in no other. What that supports is that cliff reports a pre-existing tag only when that tag is on the commit it is labelling. What it does NOT establish is WHY — it may report only for a tag on the labelled commit, or only when the existing tag's version differs from the supplied one, and the measurement does not separate the two.

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
(b) the tag at the first commit; (c) the tag at an ancestor of the commit the render labels; (d) the tag at that commit. (e) is (c) again.

**THE CLAUSE THAT ONE CASE SEPARATES, AND WHICH CASE SEPARATES IT.** The rule says the second section is dated by THE TAGGED COMMIT'S OWN
COMMIT DATE and the top section is dated by the release date. Case (b) is the case that separates those two dates — the root commit is
dated 2026-10-15 and the top section is dated 2026-10-20. In cases (c) and (e) the two dates COINCIDE (both 2026-10-20), so those
cases do not test that clause. Case (d) has no second section at all, and (a) has no tag.

**THE THREE MEASURED FACTS, RESTATED.** (1) The same 90 commits appear in every case — the tag changes neither which commits are
rendered nor their count. (2) The release-section COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets;
each row's two counts sum to 90, which is how the table reproduces. (3) The top heading's VERSION varies in exactly one case, (d), and
only there.
