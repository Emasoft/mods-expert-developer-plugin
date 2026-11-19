---
trdd-id: 0M2WY8KD
title: Pin token-optimizer 5.13.63 in the no-copy lock
column: todo
status: tasked
created: 2026-11-03T20:59:16+0100
updated: 2026-11-04T21:19:28+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T20:59:16+0100
implementation-commits: [6fbdbe1]
---

# Pin token-optimizer 5.13.63 in the no-copy lock

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

CURRENT STATE 2026-11-04: fixed on the 0.7.0 release line as 6fbdbe1 in the release clone (mods-expert-developer-release), not yet on this branch. The fix is a new NoCopySource entry for 5.13.63 (commit 3f29392d, checked with gh) in NO_COPY_SOURCES of scripts/excerpt_lock.py; update_excerpt_lock.py, which the Facts name, refreshes the licensed excerpt lock and does not touch that table. Checks there: fetch_no_copy_sources.py exit 0, tests/test_no_copy_unlicensed.py plus tests/test_fetch_no_copy_sources.py 177 passed. NEXT ACTION: merge the release line back into dev main (branch main, worktree emasoft-mods-expert-developer-main-merge) and into this branch, requirements/integrated-mod-controls; this card is not on dev main. On each branch, re-run the same two test files, then move the card to complete.
PLAN 2026-11-04 (M4a, orchestrator addendum): 6fbdbe1 reaches dev main and requirements/integrated-mod-controls in the merge-back that follows the M5 publish of 0.7.0, not before. The card stays in todo until then, and closes in that merge-back once the two test files pass on each branch.
RULING 2026-11-04 (gate 2 of the Deck and Tokensaver ports, TRDD-RD1ISPMN and TRDD-71KVH9PA), as re-keyed by the second
correction: the three markup idioms the no-copy scan finds against the token-optimizer pins get one exemption entry per
destination file in tests/test_no_copy_unlicensed.py (path, normalized phrase, exact occurrence count; section No-copy markup
idioms ruling). The pin itself is unchanged. Per correction 3, point 4: the entries name shipped code files only; the
phrase table and its tests live in tests/test_no_copy_unlicensed.py, which the scan leaves out like design/; the test
states its normalization rule, and its failure message says how to update an entry and that a new entry needs a
provenance note.
DISPOSITIONS 2026-11-04: the orchestrator's rulings 1 to 6 on the base commit 8106df2 are applied in follow-up fba28a7 (branch feat/deck-tokensaver) and recorded in the section Orchestrator review of the base commit 8106df2; the full run on the merged tree with the follow-up is green. The pin itself is unchanged; the NEXT ACTION above stands.
READ ORDER 2026-11-04: in the section Orchestrator review of the base commit 8106df2, the two correction blocks at its end (6005643, 03cbd87) supersede the lines above them that they name; the first block alone overstates the licence-text check (markers, not the full text), the shipped TypeScript count (19, not 20) and the markup test's reach.

## Facts

- tests/test_no_copy_unlicensed.py::test_every_cached_version_of_a_forbidden_plugin_is_pinned fails on this machine because the plugin cache holds token-optimizer 5.13.63.
- scripts/excerpt_lock.py does not pin token-optimizer 5.13.63, so that version's text is never compared by the no-copy scan.
- Fix with scripts/update_excerpt_lock.py, then re-run the test. Corrected 2026-11-04: that script does not reference NO_COPY_SOURCES; the fix is a new entry in that table of scripts/excerpt_lock.py (see STATE).

## No-copy markup idioms ruling (verbatim, 2026-11-04; the orchestrator's decision under the owner's autonomy grant of
2026-11-04, the owner may veto it)

> 1. Gate 2, no-copy markup idioms: a narrow scoping. I verified each phrase twice.
> - In token-optimizer 5.13.63, each phrase occurs only in docs-site markup: the font stack in docs-site/src/styles/theme.css; the stroke attributes in docs-site/public/images/*.svg; the opacity animate in docs-site/public/images/*.svg and skills/token-optimizer/assets/status-bar.svg.
> - Each also occurs in sources independent of both plugins:
>   - the font stack: [local project]/node_modules/@vitest/ui/dist/client/assets/index-DlhE0rqZ.css;
>   - the stroke attributes: [local project]/node_modules/@reown/appkit-ui/dist/esm/src/assets/visual/pencil.js;
>   - the opacity animate: [local path]/terminal-motherlode.svg.
> Change tests/test_no_copy_unlicensed.py as follows:
> - Add an exemption list of exactly these three normalized phrases. Each entry records its independent source as proof that it is an idiom.
> - Add a test that the list is closed: a fourth phrase still fails. Prove it with a mutant.
> - Record the ruling on TRDD-0M2WY8KD, which owns the 5.13.63 pin.

### Correction 1, ruling 1 (verbatim, 2026-11-04; replaces the ruling above)

> Ruling 1 (no-copy markup idioms), corrected:
> - Limit each exemption entry to the exact files where the phrase occurs now: tokensaver src/ui/band.ts lines 95 and 174, tokensaver src/ui/clawd.ts line 85, deck hooks/styles-desktop.js lines 55-56. An exemption must not cover any other file. Since ruling 3 removes the whole Clawd figure, drop the clawd.ts entry if that file is not ported, and say so on the card.
> - My earlier claim "token-optimizer hits are docs-site markup only" was wrong. A full grep (no head) of token-optimizer 5.13.63 measured: the stroke-attribute phrase is in 18 files, and two of them sit outside docs-site and outside any .svg: desktop/token-optimizer-desktop/src/icons.ts and desktop/token-optimizer-desktop/src/clawd.ts. The font-stack phrase is in 1 file and the opacity-animate phrase in 12 files, all inside docs-site or .svg files. Re-run the grep yourself without head and record every hit on the card.
> - Provenance of the opacity-animate phrase: [local folder]/terminal-motherlode.svg is not in any git history and its origin is unknown (file date 2026-02-07). A 120-second search of the node_modules folders under the local volume found no third-party copy, which does not prove none exists. Either find a verifiable third-party source, or record its provenance as unknown on the card and carry it to the owner veto list. Do not cite that SVG as an independent source.

### Correction 2, ruling 1 (verbatim, 2026-11-04; supersedes both texts above)

> Ruling 1, re-keyed:
> - No line numbers and no upstream paths. Each exemption entry is: the destination path inside this plugin, the normalized phrase, and the exact number of occurrences in that file. The no-copy test asserts all three, so a new occurrence or a new file fails it. The header from ruling 2 and the new paths no longer break it.
> - The whole-file copying question is settled by my measurement, record it on TRDD-0M2WY8KD as written here: after stripping leading whitespace, tokensaver 0.5.1 src/ui/clawd.ts and token-optimizer 5.13.63 desktop/token-optimizer-desktop/src/clawd.ts share zero identical lines of 25 or more characters; tokensaver src/ui/band.ts and token-optimizer src/icons.ts share zero as well. That rules out verbatim block copying; it does not rule out reformatted copying.
> - Opacity-animate provenance, measured: terminal-motherlode.svg is untracked in its [local folder] repository and has no history on any branch. Origin unknown. My node_modules search was bounded ([local volume]/*/node_modules, one level, .svg/.js/.css, 120 s) and its completion was not confirmed, so it proves nothing. Record the provenance as unknown.

Local paths in the quoted messages are replaced by bracketed placeholders, because this card is PROJECT scope; the
messages as received are kept in the gitignored reports_dev/mods-expert/dt/rulings-*.md (note 2026-11-04).

Note 2026-11-04: correction 2 is in force; the two earlier texts are kept as issued. Measured 2026-11-04 by the tenth mods
expert with the test's own readers (whole text of every file at the pin, no cap; reports_dev/mods-expert/dt/idiom-hits.log):
at 5.13.63 the font stack "ui sans serif system ui apple system segoe" is in 1 file (docs-site/src/styles/theme.css); the
6-word "stroke linecap round stroke linejoin round" is in 24 files, 8 of them outside .svg files (3 copies of
skills/token-optimizer/assets/dashboard.html, desktop/token-optimizer-desktop/src/clawd.ts and src/icons.ts,
openclaw/dist/dashboard.js, openclaw/src/dashboard.ts, opencode/src/dashboard/generator.ts); "animate attributename opacity
values 0 1 dur 0" is in 12 files, all .svg. The same hits (115 per pin, the ported files among them) come from each of the
five pins 5.13.58 to 5.13.63. Reconciled: the 24 files hold the 6-word core; correction 1's 18 came from a search whose
method is not recorded here. The run the test compares is 8 words (the core plus "text x" of the next element), in 8
source files. Of the 115 hits per pin, 82 come from files the ports ship (deck hooks/styles-desktop.js 8, tokensaver
src/ui/band.ts 73, src/ui/clawd.ts 1); deck assets/make-banner.mjs (32) is not ported, and tokensaver's
package-lock.json (1) is a lock file the scan never reads.

### Correction 3, points 4 and 5 (verbatim, 2026-11-04; add to correction 2 and replace it where they conflict)

> 4. Ruling 1, details:
>    - The no-copy scan covers shipped code paths only. Exclude the exemption registry, its test, docs and design/ cards.
>    - Write the normalization rule into the test.
>    - The failure message says how to update an entry, and that a new entry needs a provenance note.
>    - The opacity-animate phrase sits in tokensaver src/ui/band.ts:174 (measured: a one-shot 0.35 s fade with fill="freeze"), not in Clawd. Keep it exempt, with its provenance recorded as unknown. It goes on the owner's list.
>
> 5. Replace my overlap sentence for TRDD-0M2WY8KD with this text: "No identical line of 25 or more characters after stripping leading spaces (sed 's/^ *//', sort -u, comm -12) in two file pairs: tokensaver 0.5.1 src/ui/clawd.ts versus token-optimizer 5.13.63 desktop/token-optimizer-desktop/src/clawd.ts, and tokensaver src/ui/band.ts versus desktop/token-optimizer-desktop/src/icons.ts. Tabs, CRLF and trailing whitespace were not normalized; lines under 25 characters and the other file pairs were not compared. This rules out verbatim copying of long lines in these two pairs only."

Overlap fact, as correction 3 point 5 words it (it replaces the overlap sentence of correction 2, which stays quoted above
as issued): No identical line of 25 or more characters after stripping leading spaces (sed 's/^ *//', sort -u, comm -12) in two file pairs: tokensaver 0.5.1 src/ui/clawd.ts versus token-optimizer 5.13.63 desktop/token-optimizer-desktop/src/clawd.ts, and tokensaver src/ui/band.ts versus desktop/token-optimizer-desktop/src/icons.ts. Tabs, CRLF and trailing whitespace were not normalized; lines under 25 characters and the other file pairs were not compared. This rules out verbatim copying of long lines in these two pairs only.

<!-- cspell:ignore appkit motherlode reown -->
<!-- cspell:ignore attributename openclaw opencode pathspec segoe -->

## Approval log

- 2026-11-03T20:59:16+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## Orchestrator review of the base commit 8106df2, rulings 1 to 6, and their dispositions (2026-11-04)

Applied in follow-up fba28a7 on branch feat/deck-tokensaver, one commit before the first port, as ruled; nothing was rejected. Full run on the merged tree with the follow-up: 994 passed, 9 skipped; jscpd 4.37%; ruff and cspell clean on the four changed files.
- Ruling 1 (MAJOR, stays MAJOR): the existing tests ship licence texts only for the example excerpts and the tutorial source, never per adapted file; NOTICE already holds the Deck and Tokensaver MIT copyright lines with the MIT text, and nothing ships Caveman's Apache text yet. Each ADAPTED_FILES entry now names its upstream copyright line, a licence_file holding that line with the full licence text, and for Apache-2.0 a notice_file whose text NOTICE also carries (section 4(d)). Both files must be tracked, published and named without a .. segment. Negative tests for each missing piece.
- Ruling 2a: the claim scan catches //, /*, *, #, <!--, a Markdown dash and a quote mark; ADAPTED_HEADER and ADAPTED_CHANGE accept a one-line /* ... */ and <!-- ... --> with their closers. Tests added.
- Ruling 2b, measured on the full upstream trees against each card's Scope: the Deck port ships four JavaScript files and five verbatim .wav sounds; the Tokensaver port ships register.tsx, 20 TypeScript files (clawd.ts removed) and the third_party/caveman LICENSE, LICENSE-MIT and NOTICE texts. The upstream SVG and PNG files (deck assets/, tokensaver docs/) are outside both Scopes. The three idiom phrases land in styles-desktop.js and band.ts only, both code, so IDIOM_CODE_EXTENSIONS stays and no ruling is needed. New test: a markup ADAPTED_FILES entry fails anywhere, and so does a CSS, SCSS, LESS, SVG, HTML or HTM file under hooks/deck/ or hooks/tokensaver/.
- Ruling 2b, the Caveman file: tokensaver src/core/caveman.ts is TypeScript and Apache-2.0 (adapted from Caveman 4.0.1, commit 2e068f7). The Tokensaver port registers it with a LICENCES key for Caveman as source, a licence_file holding "Copyright 2026 Julius Brussee" with the full Apache text (the upstream LICENSE has no copyright line), and the shipped Caveman NOTICE as notice_file, in the port's own commit.
- Ruling 3: _repo_key unifies http and https, www., ssh://git@ and git@host:owner/repo, besides case, .git and a trailing slash. Tests added.
- Ruling 4: notice_names anchors the repository on both sides, so github.com/a/bc and github.com/a/b.c no longer credit github.com/a/b. Tests added.
- Ruling 5: the current tree passes test_every_adapted_file_is_registered_and_credited, in the full run above.
- Ruling 6: the comments on ADAPTED_FILES and IDIOM_EXEMPTIONS say each port adds its entries in the same commit as its files. Mutation evidence is kept with the DT report's raw logs: 18 mutants on 8106df2 and 42 on the follow-up, all red, the unchanged copies green.
- Beyond the rulings, from two review rounds of the branch: an entry names its source (a LICENCES key) and must carry that key's licence, and the obligations follow it; a licence with no known full text fails; markup kinds include SCSS, LESS and HTM; claim markers include a Markdown dash, a quote mark and ##; MIT_PERMISSION_SENTENCES and NOT_SCANNED_TOP moved into scripts/excerpt_lock.py, one copy each. The copyright line and the licence text are checked per file, not per block. The check demands a notice_file for every Apache-2.0 entry, while section 4(d) applies only when upstream has a NOTICE file; Caveman has one, and an Apache source without one needs a ruling before its entry can pass.
<!-- cspell:ignore Brussee -->
- Corrections after the review of the lines above (2026-11-04):
  - The licence text is checked by fixed markers, not in full: the three MIT permission sentences, or four landmark lines of the Apache 2.0 text. A truncated Apache text that keeps those four lines passes, so the check is a proxy for ruling 1's "full licence text", not proof of it. The commit message of fba28a7 says "full licence text" and overclaims the same way; it is not amended.
  - The Tokensaver port ships 19 of the 20 upstream TypeScript files; clawd.ts is removed.
  - The markup test covers registered entries and the two port folders only. An unregistered markup file placed elsewhere, for example under sounds/deck/, is not caught.
  - The Caveman registration is planned and untested: whether a new LICENCES key leaves test_example_excerpts, test_plugin_structure and test_no_copy_unlicensed green is unmeasured; the Tokensaver port finds out.
  - Deck's THIRD_PARTY_NOTICES.md says portions of hooks/styles-desktop.js and hooks/register.js are adapted from plan-progress (zycck/claude-mods, MIT, "Copyright (c) 2026 Kirill Serditov"). The gate checks one upstream copyright line per entry, so this second obligation is enforced only by the NOTICE test the Deck card plans. The notices do not mention the .wav sounds; their provenance beyond Deck's MIT licence was not checked.
  - Also in fba28a7, from the review rounds: *_dev is detected at any depth (tests/ counts as published for an entry, while the claim scan still skips tests/ and design/), and a test covers each forbidden mod's repositories. The files adapted before ruling 2 stay outside the registry, so the ruling-1 obligations check does not cover them. The commit message's "in any spelling" means the listed spellings only.
  - "The existing tests ship licence texts" means the existing tests check that licence texts ship.
<!-- cspell:ignore Serditov zycck -->
- Second corrections, after a review of the corrections above (2026-11-04); they replace the matching lines above:
  - Replaces the "Also in fba28a7" line: 8106df2 already refused an entry in a *_dev folder at any depth. What fba28a7 changed is that entries under tests/ and design/ are no longer refused, because those folders are published; the claim scan still skips tests/ and design/ (NOT_SCANNED_TOP). 8106df2 already checked every forbidden mod's repository but tested only token-optimizer's; fba28a7 adds a test for each. The rest of that line stands.
  - Replaces the plan-progress sentence on enforcement: nothing enforces this second obligation today; the NOTICE test the Deck card plans is meant to.
  - Replaces the markup-boundary line: the markup-kind check covers registered entries and the two port folders only. An unregistered markup file elsewhere, for example under sounds/deck/, is caught only if it labels itself adapted (reported as UNREGISTERED); an unlabelled one is not caught.
  - Corrects the Ruling 2b Caveman line: the upstream LICENSE has no holder's copyright line, only the Apache appendix placeholder "Copyright [yyyy] [name of copyright owner]" at line 190.
