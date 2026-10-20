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

THE SUBJECT OF THIS CARD IS THE SECTION-STRUCTURE AND VERSION-LABEL BEHAVIOUR, measured on clones of this repository while the
repository had NO REMOTE and NO TAG. The question it asks is not "what does cliff do" but "what did cliff do, AND WHAT DID THE
MEASUREMENT NOT SETTLE" — because the second half is the half that decides the owner's open question below.

MEASURED, IN FIVE CASES, ALL ON CLONES PINNED AT ONE COMMIT so that the only variable is where the tag sits.

THE MECHANISM: a pre-existing tag OPENS A SECTION for the commits up to and including the tagged commit, dated by THE TAGGED COMMIT'S
OWN COMMIT DATE, and the top section is dated by the release date under the SUPPLIED version. The tag changes neither WHICH COMMITS are
rendered nor HOW MANY — the same 90 commits appear in every case.

| case | tag position | top heading | top bullets | second section | 2nd bullets | cliff's "already a tag" warning |
|---|---|---|---|---|---|---|
| (a) | no tag at all | ## [0.9.9] | 90 | (none) | 0 | (none) |
| (b) | root commit (2026-10-15) | ## [0.9.9] | 89 | ## [0.0.1] — 2026-10-15 | 1 | (none) |
| (c) | 82c693d (2026-10-20) | ## [0.9.9] | 6 | ## [0.0.1] — 2026-10-20 | 84 | (none) |
| (d) | HEAD, the labelled commit | ## [0.0.1] | 90 | (none) | 0 | There is already a tag (v0.0.1) |
| (e) | 82c693d on a separate branch | ## [0.9.9] | 6 | ## [0.0.1] — 2026-10-20 | 84 | (none) |

THE THREE MEASURED FACTS: (1) the same 90 commits appear in every case — the tag changes neither which commits are rendered nor their
count; (2) the release-section COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets, each row's two counts
summing to 90, which is how the table reproduces; (3) the top heading's VERSION varies in exactly one case, (d), and only there.

**THE LABEL-SELECTION OBSERVATION — WHAT WAS SEEN, NOT THE RULE THAT GOVERNS IT.** In every case where the pre-existing tag was NOT at
the labelled commit, the SUPPLIED tag was used; in the one case where it was, the EXISTING tag was used. **THAT IS WHAT WAS OBSERVED. IT
IS NOT THE RULE THAT GOVERNS, AND THIS CARD DOES NOT CLAIM TO KNOW WHAT GOVERNS.** The readings the cases do not separate are enumerated
ONCE, in the next section; the paragraphs after it refer there rather than restating it.

**THE FRAME, STATED ONCE, BECAUSE IT DECIDES HOW THE ITEMS BELOW ARE WORDED.** The question is WHICH PRE-EXISTING TAG, IF ANY, CLIFF
PREFERS TO THE SUPPLIED ONE, and every candidate rule is a rule about the RELATIONSHIP between a pre-existing tag and the supplied one.
**"THE LABELLED COMMIT" IS THIS CARD'S SHORTHAND FOR THE COMMIT THE SUPPLIED TAG POINTS AT — WHICH IS ALSO THE COMMIT THE RENDER
LABELS. IT IS A SHORTHAND, NOT A CLAIM about what cliff looks for.** An earlier draft of this card pivoted on "the commit being released",
which named the position-reading as a fact; that term is gone, and this one is used in a relational frame throughout.

**THE ONE INVENTORY: WHAT THE CASES EXCLUDE, WHAT THEY LEAVE OPEN, AND WHAT A RE-RUN MUST VARY.** This is the single place in this card
where the rule space is enumerated.

*WHAT THE CASES EXCLUDE.* Any reading that would have selected the tag actually present in case (b) — the root commit's — or in case (c) —
the ancestor's. In (b) there is exactly ONE tag in the repository, so "the nearest", "the only", "the sole pre-existing" and "the ancestor of
HEAD" all select that same tag and are ruled out by that same observation. **AN EARLIER DRAFT LISTED "THE NEAREST TAG" AMONG THE OPEN
RULES; IT IS NOW EXCLUDED — not withdrawn as a hypothesis, but ruled out at the scope stated here. That list change and the withdrawal of
the survivors-partition below are two separate moves, and both are recorded.**

*WHAT THE CASES DO NOT SEPARATE — this is what a re-run would have to discriminate.* "A tag at the labelled commit" and "a tag on HEAD" are
the same reading in case (d), which IS HEAD in that run, and no other case puts a tag on HEAD that is not also at the labelled commit.
"The highest-version tag" is untested, because no case had two tags with different versions. Any rule keyed to the RELATIONSHIP between the
existing tag and the supplied one — a version comparison, a distance comparison — is likewise untested, because in every case that HAS an
existing tag its version was v0.0.1 while the supplied one was v0.9.9, so the two never varied independently. "The most recent tag" is
untested too, because no case had a tag that was both older and present, so most-recent was never separated from the readings the cases
exclude.

*THE SURVIVORS-PARTITION IS WITHDRAWN.* An earlier draft named the survivors as "the position-based ones and the version-based one". THAT
PARTITION IS WITHDRAWN, because it singled out one reading from a family the cases ruled out together, and it read as a settled partition of
the rule space in a card whose whole point is that the measurement settles nothing. The exclusions the cases DO support are the ones above,
and the rule space beyond them is not enumerated here.

*WHAT A RE-RUN MUST VARY: a second tag at a different position, or with a different version.* The table above says which cases were run;
the list above says which hypotheses they left open.

**THE REASSURING CASE, reduced to a reference to the list above.** On the FIRST release — the one with no pre-existing tag — the render labels
the window from the SUPPLIED tag, which is what case (a) shows: the top heading is the supplied version. **IN THE REAL PIPELINE THE
SUPPLIED TAG IS THE COMPUTED VERSION, so the two agree BY CONSTRUCTION**; in the experiment the supplied tag was v0.9.9, chosen to stand
out from the computed 0.1.1, and case (a) confirms the label follows the supplied tag rather than the computed one. Once a tag exists,
whether the label and the version agree again depends on which of the UNTESTED READINGS above governs — and the cases do not say.
**"THE MOST RECENT TAG" IS ONE OF THOSE UNTESTED READINGS, SO THIS CARD DOES NOT ASSERT THE AGREEMENT.** The reassuring case is one of the
four measured cases; it is not a claim about ordinary releases.

**AND WHY THAT DOES NOT CONFLICT WITH CASE (d): THE SOURCE OF THE LABEL, NOT A TIMELINE.** The five cases are five CONFIGURATIONS OF ONE
HISTORY at one pinned commit, not a sequence of releases; all five render the same 90 commits at the same commit. The first-release
statement concerns a label taken from the SUPPLIED tag; case (d) concerns a label taken from an EXISTING TAG AT THE LABELLED COMMIT. The
two statements are ABOUT DIFFERENT SOURCES, so they DO NOT BEAR ON EACH OTHER. Case (d) is also the narrow case the owner's question is
about.

THE OPEN QUESTION, which is the owner's and not the plugin's: SHOULD A PRE-EXISTING TAG BE ALLOWED TO RE-SECTION THE CHANGELOG, AND TO
RELABEL ITS TOP HEADING? The plugin states the measurement and does not classify its significance.

**A NOTE ON THE REASSURING CASE'S PLACE HERE, so its presence is not mistaken for an answer.** It is stated in this card because the card
records the MEASUREMENT, and the measurement includes the case where the label agrees. **Its presence is not a recommendation that the
behaviour is fine**: the open question above is the owner's, and the reassuring case is one of the four measured cases, not a verdict on
the question. A reader who wants the finding without the reassurance has the table and the three measured facts above.

THE INFERENCE THE WARNING COLUMN SUPPORTS BUT DOES NOT ESTABLISH: cliff prints 'There is already a tag' in exactly the one case where
the tag sits at the labelled commit, and in no other. What that supports is that cliff reports a pre-existing tag only when that tag is on
the commit it is labelling. What it does NOT establish is WHY — it may report only for a tag at the labelled commit, or only when the
existing tag's version differs from the supplied one, and the measurement does not separate the two. The readings this leaves open are in the
inventory above.

EVERY MEASUREMENT HERE IS OF THE PRE-TAG, NO-REMOTE STATE. Creating the first release tag changes the tag set, and giving the repository a
remote changes the version baseline, so a measurement taken after either would not be a measurement of the state this card describes.

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
(b) the tag at the first commit; (c) the tag at an ancestor of the labelled commit; (d) the tag at the labelled commit. (e) is (c) again.

**THE CLAUSE THAT ONE CASE SEPARATES, AND WHICH CASE SEPARATES IT.** The rule says the second section is dated by THE TAGGED COMMIT'S OWN
COMMIT DATE and the top section is dated by the release date. Case (b) is the case that separates those two dates — the root commit is
dated 2026-10-15 and the top section is dated 2026-10-20. In cases (c) and (e) the two dates COINCIDE (both 2026-10-20), so those
cases do not test that clause. Case (d) has no second section at all, and (a) has no tag.

**THE THREE MEASURED FACTS, RESTATED.** (1) The same 90 commits appear in every case — the tag changes neither which commits are
rendered nor their count. (2) The release-section COUNT varies 1, 2, 2, 1, 2, and the top section holds 90, 89, 6, 90 and 6 bullets;
each row's two counts sum to 90, which is how the table reproduces. (3) The top heading's VERSION varies in exactly one case, (d), and
only there.
