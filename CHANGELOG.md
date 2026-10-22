# Changelog

All notable changes to this project will be documented in this file.

## [0.3.2] — 2026-10-22

### Bug Fixes

- **lint:** Lint the tutorial examples like every other file (TRDD-JFB5E98B) (daa20cf)
- **lint:** Unblock 0.3.2 and tighten the example guards (TRDD-JFB5E98B) (e397753)

### Documentation

- Apply the review fixes to five cards, scope spell ignores per card (b792cd1)
- Record the passing 0.3.1 post-install check (TRDD-N9M0FOKO) (c1885ed)

### Testing

- **lint:** Probe every tutorial example file in the no-exclusion guards (TRDD-JFB5E98B) (d4760f2)
## [0.3.1] — 2026-10-22

### Bug Fixes

- **agents:** Rename the skills menu so the forge agent preloads ours (TRDD-N9M0FOKO) (cf3b7de)
- **release:** Spell-check the givememod card's verbatim quote (68aa496)

### Documentation

- Record the 0.3.0 release on two cards, reword NOTICE (TRDD-BDY6ZNDZ) (563524d)
- Add TRDD-JFB5E98B to drop the tutorial-example lint exclusions (c824ae4)
- Add TRDD-H26OG8AP to integrate the givememod harvest (88f78b2)

### Miscellaneous Tasks

- Bump version to 0.3.1 (5e62111)
## [0.3.0] — 2026-10-22

### Bug Fixes

- **agents:** Unfakeable menu self-check, optional tool skills (TRDD-N9M0FOKO) (f5e0779)
- **agents:** Round 2 of the forge-agent review fixes (TRDD-N9M0FOKO) (ca81806)
- **skills:** Narrow tutorial lint exclusion, ship licence with examples (TRDD-BDY6ZNDZ) (48589fd)
- **tests:** Satisfy mypy in the menu namespace helper (TRDD-N9M0FOKO) (92e99d5)
- **release:** Pass the CI-parity preflight (card names, shfmt example) (114609b)

### Documentation

- Close TRDD-NFCRIY58 as complete (v0.2.1 published) (6465d27)
- Add TRDD-GF5UDFWI, TRDD-03IIDGPP, TRDD-J4HRAQF0 for the mods port (5280190)
- Queue TRDD-BDY6ZNDZ - mods tutorial skills from claude-mods-skill (0d787a5)
- Amend TRDD-BDY6ZNDZ with the review's findings (58a4257)
- Rewrite TRDD-BDY6ZNDZ's superseded lines in place (7bda898)
- Add TRDD-BNBDNR2V for the mod-builder ideas; log BDY6ZNDZ review (7c2b527)

### Features

- **agents:** Add mods-forge-agent with the skills-menu preload (TRDD-N9M0FOKO) (dd4e8e1)
- **skills:** Add mods tutorial skills from claude-mods-skill (TRDD-BDY6ZNDZ) (ed3dc13)

### Miscellaneous Tasks

- Bump version to 0.3.0 (44fd88a)
## [0.2.1] — 2026-10-22

### Documentation

- **skills:** Spell the SendMessage tool name correctly in the smoke-test prompt (9751e42)

### Miscellaneous Tasks

- **cspell:** Keep sendmessage - the generated CHANGELOG quotes it (70d0670)
- Bump version to 0.2.1 (3d45127)
## [0.2.0] — 2026-10-22

### Bug Fixes

- **skills:** Read only the token line in the background-sessions how-to (6891472)
- **skills:** Run the background launch in a subshell and report a missing token (c15499a)

### Documentation

- **card:** Close TRDD-XV6QOEK1 - v0.1.1 shipped the generated changelog (c09b4db)
- **skills:** Mark the Python launcher with the CPV audit-consent warning (1f3c287)
- **skills:** Put the token-minting command in its own fenced block (890e4a1)
- Add TRDD-NFCRIY58 - publish the background-sessions skill once CPV ships the #260 fix (0ed43fe)
- **card:** TRDD-NFCRIY58 - use the gh: external blocker form, record the doctor bug (2074bd8)
- **card:** TRDD-NFCRIY58 - add a decision blocker so the card stays blocked (7a0af21)
- **card:** TRDD-NFCRIY58 - say who clears the decision blocker and on what evidence (c841ea3)
- **card:** TRDD-NFCRIY58 - require direct proof the #260 fix shipped (f8632ed)
- **card:** TRDD-NFCRIY58 - separate clearing the decision from the publish gate (543f56c)
- **card:** TRDD-NFCRIY58 - record the v5.22.3 pin and that publishing still waits on CPV 260 (2280518)
- **card:** TRDD-NFCRIY58 - NEXT step 1 starts from the v5.22.3 pin (f88bef5)
- **skills:** Pass strict CPV with no consent file (TRDD-NFCRIY58) (4b41493)
- **card:** TRDD-NFCRIY58 - ledger and card match the no-exceptions state (114af5e)
- **card:** TRDD-NFCRIY58 - mark the NIT specs superseded, sweep references (b4947a1)

### Features

- **skills:** Add the run-background-sessions how-to skill (draft checkpoint) (a523c7c)

### Miscellaneous Tasks

- Pin CPV to v5.22.3 to clear the canonical pipeline drift (TRDD-NFCRIY58) (8783882)
- Delete the CPV audit-consent registry - no exceptions allowed (9c623ea)
- Remove the orphaned consent-findings fixture (51ddb08)
- Retire the NIT-adjudication spec self-check (owner ruled no exceptions) (0028f8a)
- **cspell:** Accept lstrip, sendmessage, testpaths (a0e6767)
- Bump version to 0.2.0 (6333eb1)

### Build

- Make bare pytest collect only tests/ (739cd60)
## [0.1.1] — 2026-10-21

### Bug Fixes

- Clear CPV strict MINOR findings and consent reviewed doc-example flags (66fe8d4)
- Pass CPV strict with zero blocking findings (3115f4c)
- Redact the example Postgres DSN password in the MCP chapter (c5c1baa)
- **tests:** Type the chapter TOC tuples explicitly for mypy (3fb163a)
- Stop excluding the 60 chapters from CPV, cspell, jscpd and Mega-Linter (06dadde)
- Spell-check the chapters for real, add 177 technical terms, fix one typo (18d7133)
- Remove the CPV audit-consent file and correct misspelled anchor ids (474c16b)
- Clear the CPV absolute-path MAJORs by adopting the chapters' own elision form (0a8e531)
- Use the corpus's own concrete home-path form, and record the real blockers (eb18c47)
- Make every adapted payload OS-coherent, and guard the adaptation (bbb08f3)
- Converge on each chapter's own convention, and guard the plugin's own rule (bfeaf5c)
- Split the 72 by class, match a backslash home path, and stop the ledger quoting commands (0bebc08)
- Dispose the 72 by what the rule is about, not by where the text is written (179384b)
- **docs:** The chapters are adapted, not verbatim — the release note said otherwise (cb5a1d8)
- **docs:** Revert the CHANGELOG hand-edit — that file is generated (9404d9e)
- Keep the scan at MAJOR=0, and make the perturbation tests discriminating (df7366f)
- Tie the digest's chapter list to the table, and cover every guard (e23851b)
- Read the prose rule set from the headings, and cover the total baseline (abcb2bb)
- Derive the guard-coverage figure instead of restating it (d1c4cd0)
- Put the guard-coverage measurement in a tracked path (6705842)
- Protect the covered half too, and keep the scan at MAJOR=0 (0f4f707)
- Drop the figure no check can enforce (12446de)
- Make the ledger's guard-coverage passage true of the tree (5362f6c)
- Remove the last two figures no check owned (eae55ed)
- The docstring, the identity claim, and an unreachable branch (0e88651)
- The passage ends where it says, and the scope reads all of it (5f1f8e5)
- A figure removed by arithmetic returns in another form (ec3f3d4)
- Point at the gap figures instead of restating them, and enforce it (41e833f)
- Point at the gap rules instead of naming them, and enforce the absence (TRDD-PRHYQEVK) (af9b4fd)
- The passage points at the spec's table, and stops claiming what no check reads (TRDD-PRHYQEVK) (200abfd)
- The covered-count check is bound to the code's own guard total (TRDD-PRHYQEVK) (132eeac)
- The passage stops claiming what it does not check, and stops guessing the spec's sets (TRDD-PRHYQEVK) (3007a76)
- The covered-count ban is bound to a clause, and a guard count past twenty says so (TRDD-PRHYQEVK) (6628f4c)
- The sentence that disclaims a set claim stops making one (TRDD-PRHYQEVK) (94f0f12)
- The comment says what the pattern does, and a guard count past twenty degrades (TRDD-PRHYQEVK) (988bd4e)
- The ban's properties are asserted, and the comment stops counting them (TRDD-PRHYQEVK) (9643916)
- The property test derives the guard total, and pins the two shapes it missed (TRDD-PRHYQEVK) (feb9ba7)
- The property test writes no total of its own, and the separator loop is no longer vacuous (TRDD-PRHYQEVK) (51e02f1)
- The degrade rule has one owner, and the test writes no total of its own (TRDD-PRHYQEVK) (6e8073e)
- The denominator alternation does not repeat itself, and the helper states the rule (TRDD-PRHYQEVK) (0c5cb79)
- **consent:** State the residual risk in the registry, and bind it with tests (57f41d0)
- **consent:** Name what each flagged line does, and require the reasons to distinguish their sites (e9ecdba)
- **ci:** Drop the four user-scope tool skills from the preload, and make the suite's baseline a tracked file (b9e387e)
- **notify:** Check the repository out before reading the plugin manifest (a81576e)
- **gate:** Tell a validator ABORT from a finding (TRDD-UD8EC4FK) (0349b1b)
- **gate:** Match the abort and verdict tokens LINE-SHAPED, not as bare substrings (TRDD-UD8EC4FK) (3a143e6)
- **gate:** Match CPV's verdict line by its EXACT shape, and strip ANSI (TRDD-UD8EC4FK) (0a86fc6)
- **gate:** Read CPV's verdict from its SUMMARY counters, not one token (TRDD-UD8EC4FK) (b286335)
- **privacy:** Replace a local machine path with <repo-root> in two tracked files (af810bd)

### DELEGATION

- Mark units 6-7 done (security invariants clean, 6 publication blockers recorded) (4840d96)
- Restore acceptance criteria in done rows 6-7 (review finding 4) (5d2598b)
- Replace cohort-D dead reference with its report path (df69583)
- Restore lost acceptance criteria in rows 3-5, fix row 4 status (25583d9)
- Tighten row 3-4 wording, record convention reconciliation (c1e94ac)
- Merge Evidence sections, state cell convention, add open items (45a3d34)
- Close the skills-menu open item (ada79f5) (8913164)
- Record the pinned preload roster (4f8b0af) (1158813)
- Point at the correction to ada79f5's overstated claim (b348588)
- The frontmatter is authoritative for the preload window (1559d47)

### Documentation

- Scope MIT license to Emasoft's own files, add NOTICE for Anthropic chapters (1f57a97)
- Record 5 janitor injection proposals as refused (false positives) (55b1820)
- Trim chapter TOCs to section level, reword reader-facing passages for the agent (fa1395b)
- Broaden section titles in 7 chapters so they cover their subsections (batch 1) (2339314)
- Broaden section titles in the remaining chapters, restore exact chmod commands (8f6d9f6)
- Restore the full .claude directory explorer content in agent-readable form (357ef20)
- Make section titles single broad scopes, promote "Generate visual output" (b944576)
- Ground 12 section titles in their real subsections (4b439d9)
- Keep the external Monitor tool link text matching Anthropic's page (365aeea)
- Describe all chapter adaptations in NOTICE and the agent index; broaden one title (076adfb)
- State the guard's principle, not its file count, and record its reopen triggers (5f42e23)
- Ask the owner about 7 contents, not 36 findings, and mark the buckets as criteria (d58289c)
- Count sites, not findings, and ask the owner a concrete question (f97a370)
- Enumerate the 30 sites so the owner's question is actionable as written (9a04351)
- File the 30-site enumeration where the repository carries it (5e18f5b)
- File the enumeration where the conventions sanction it, and give it content (ceeb482)
- Describe each site from the passage, group by content, and detect staleness by digest (d99e4c3)
- Add the stance the ruling turns on, and one copy of the grouping (037a83a)
- Mark the register, and say procedure or instruction per content (2cfddac)
- State the plugin's position once, and define the procedure criterion (2b7e0e9)
- Take the recommendation back out, and say why the file does not answer (ac98ad9)
- Cite the premise instead of paraphrasing it, and put the marking where it is read (89c951c)
- Record the check instead of asserting it, cite the adaptation, and put the note back above the table (5424242)
- Make the search reproducible, drop the unsupported feasibility claim, fix the register (024678c)
- Bound the search's coverage, and correct a "verbatim" claim the check exposed (55018b2)
- Record what the next CHANGELOG will say, verified rather than predicted (8d6cd10)
- Measure the CHANGELOG rendering, and correct a false claim about its provenance (bee832c)
- Run the pipeline's own changelog command, and drop an unearned authority claim (29088ea)
- Distinguish the render from the bump, and correct the adaptation evidence (f8a4d64)
- Exhibit a reworded title, and state what withdrawing the structural argument cost (7b21d2e)
- Consult the vendor's own pages — the reference the owner's question names (2700cc9)
- State the vendor comparison in the register its method earns, and make it re-checkable (2b6bc55)
- Qualify the derived claims to the comparison performed, and record its procedure (82c693d)
- Measure the publish-path hazard, and file it as its own card (TRDD-XV6QOEK1) (1050ffe)
- Reframe the publish-path finding as the format migration it is (e7e458a)
- Measure what tagging would do, and clear the last three stale framings (f23de5a)
- State the tag rule precisely, and record the scope fact it produced (5fa20ee)
- Correct the tag rule, the version, and the release at which it fires (1b3002d)
- Pin the version's baseline, and add the case that fails to discriminate (8052a3c)
- Re-run the five cases as a controlled experiment, and correct the table (74f21ed)
- Diff the rendered files, and find that the section structure changes (be1f6d3)
- Correct the section mechanism, and split the second finding into its own card (1190f69)
- Finish the split — move the material, not just the title (63ebb83)
- Finish the split — the places it left behind, closed (3bebae9)
- Name the second card's subject, and close the cross-references it left (bd0472c)
- Restore the retraction that travelled without its caveat (83bf81d)
- Align the rule's standing with the file's own standard, and drop the timeline (52bf674)
- Pull the exclusion back to the scope the cases reach (16c1cd3)
- Restore a paragraph the last commit dropped, and give the card a handle (ca12ca4)
- Make the reassurance conditional, and make the two lists the same list (3363c96)
- Consolidate the card into one inventory, and stop correcting sentences (409a6c1)
- Mark the two senses of the supplied tag, and drop the word "confirms" (1b4dbde)
- Split the ledger's findings bullet, and close the two sentences it left (d0411a7)
- Name what is under ruling, and point the pipeline fact at its owner (c656348)
- Pull the ledger's clause back to a pointer, and drop the duplicated list (13e85ee)
- Name the spec's section, and use its word for what the groups are (4870430)
- Remove the sentence riding on the pointer, and re-aim its purpose (735ee07)
- Let the clause do one job, and assert nothing of the spec's data (e0f8864)
- Quote the spec's own label with its scope, and drop the third gloss (40e34da)
- Name the group the quoted label belongs to, and drop the synonym (915020b)
- Declare the ledger's role, and restore the contrast it dropped (1bb05ad)
- Adjudicate the 72 NIT findings rule by rule and site by site (556f716)
- Point the NIT bullet at the completed per-rule pass (20fc096)
- Fix the five defects the two review forks found in the per-rule pass (5d30a01)
- Re-base the gap on normalised text, and carry the per-site evidence (9dc0348)
- State the scope of the invariance, and where the evidence comes from (f4ee4df)
- Reconcile the per-rule prose with the table, and check it in the script (2426f12)
- Make the file's own instrument report its coverage, and fail when blind (b394e85)
- Check the spec's table against baselines that are not the spec (345acc2)
- Make the scan a required baseline, and certify the rule set from it (3f6513c)
- Certify both halves of the file, and detect a moved corpus by content (c32f8cd)
- Catch a duplicated rule block, and cover the script with a perturbation test (9fb4893)
- Record the duplicate guard's scope in the ledger (d395e52)
- Record the digest's chapter-list check and the guard coverage in the ledger (d7d4043)
- Correct two ledger claims the last commit left standing (94e6740)
- Name both exclusions in the guard-count derivation, and mark it a snapshot (0851dfa)
- Close the guard-coverage card, with the series' own acceptance checklist (TRDD-PRHYQEVK) (3706162)
- Record the mis-citation in the series' commit subjects (TRDD-8BXXNOPQ) (d50d961)
- File the two open owner decisions as cards, so they outlive this session (TRDD-FM80HTRT, TRDD-BDQ9GY12) (047c48a)
- File the owner's runtime-load decision for the chapter skills (TRDD-CO536FX9) (714f317)
- Close the two owner decisions, and correct the mis-citation card's count (f179e0a)
- Archive the mis-citation card, with the owner's ruling on the subjects (b57888e)
- Correct a fabricated owner ruling, on a card that supersedes an immutable one (50e2aad)
- Rebuild the correction card's body as sections, and name its limits (389f72f)
- Lead the correction card's title with the request, not the defect (4797af3)
- File the owner's ruling to rewrite the twelve mis-cited subjects (TRDD-07W10I9D) (132258a)
- Correct the rewrite card's scope, and name the push and the window (04d14f7)
- Fix a reversed reference and a duplicated sentence in the rewrite card (afd8ac1)
- Give the rewrite card real sections, and add the checks the review found missing (f56a202)
- Remove the three paragraphs the section headings left duplicated (daa2212)
- Add the stale-clone box, and state what the force-push actually buys (1b69b7f)
- File the missing trddgrep verb, with the invariant that proves it missing (49ce4de)
- Repair the rewrite card's blank-line run, and its duplicated paragraphs (62c8187)
- Tick the four rewrite boxes the verified run already satisfies (43a3232)
- Correct two false pointers, one premature tick, and an overstated claim (17fe628)
- **card:** Record the measurement that disproves the mandated preload design (4ec4e1a)
- **card:** File the marketplace-notify workflow's missing checkout step (cc1b3b8)
- **card:** Carry the rewritten series' SHA list, and correct two claims the review found (bdfacc8)
- **card:** Record the applied rewrite and close the card's acceptance list (d1f748d)
- **card:** Replace the planned rewrite sequence with the one that was executed (ba4eb79)
- **card:** Close the three finished cards, each against its own checklist (e9cd9f2)
- **card:** Record the spliced Approval-log line in the archived card 07W10I9D (TRDD-QARM420U) (9547d6e)
- **card:** Give CO536FX9 an acceptance checklist, and put it on the board as a decision (TRDD-CO536FX9) (c7e7e13)
- **card:** Correct three measured claims, and scope the blank-line claim to HEAD (TRDD-CO536FX9, TRDD-PII6Z5NS) (66701bd)
- **card:** Fix a false pointer this change introduced, and answer the title's question in the first paragraph (TRDD-PII6Z5NS, TRDD-CO536FX9) (7c21eae)
- **card:** Close four false pointers and three precision gaps the reviews found (TRDD-CO536FX9, TRDD-PII6Z5NS) (0192f3f)
- **card:** Fix a false pointer the review found, and drop the self-narration (TRDD-PII6Z5NS, TRDD-CO536FX9) (46bf1a5)
- **card:** Close a contradiction between two paragraphs, and attach each byte factor to the total it belongs to (TRDD-PII6Z5NS, TRDD-CO536FX9) (f385866)
- **card:** State the preload cost as a range, and anchor both locators to one phrase (TRDD-PII6Z5NS, TRDD-CO536FX9) (0997ccb)
- **card:** Fix the misattribution the review found, and state the cost as two cases (TRDD-PII6Z5NS, TRDD-CO536FX9) (6dd97b1)
- **card:** Correct the strict-scan verdict the previous commit understated (TRDD-PII6Z5NS, TRDD-CO536FX9) (4836106)
- **card:** Carry the cost's conditional into the sections that restate it, and open a card for the gate's mislabel (TRDD-PII6Z5NS, TRDD-CO536FX9, TRDD-UD8EC4FK) (83fa603)
- **card:** Make the gate's abort fix implementable, and state the abort's exit code at the measured strength (TRDD-UD8EC4FK, TRDD-CO536FX9) (f11edd6)
- **card:** Name the stream each marker is on, and the fix's capture (TRDD-UD8EC4FK, TRDD-CO536FX9) (7f737b1)
- **card:** Make the both-streams rule survive a CPV release (TRDD-UD8EC4FK, TRDD-CO536FX9) (f724bcb)
- **card:** Put the premise-free rule first, and the observations as its evidence (TRDD-UD8EC4FK, TRDD-CO536FX9) (5e7c353)
- **card:** Make fix (a) capture both streams, and name (b) as the adopted option (TRDD-UD8EC4FK, TRDD-CO536FX9) (08cf7fd)
- **card:** Name both streams in the fix's own words, and drop the false choice (TRDD-UD8EC4FK) (c15eb2e)
- **card:** Fold the two options into one requirement, and stop the review loop (TRDD-UD8EC4FK) (fe1f4ae)
- **card:** Close TRDD-UD8EC4FK - the gate now tells an abort from a finding (925e0e0)
- **card:** Retitle TRDD-PII6Z5NS - the upstream fix has landed (5dd963d)
- **card:** Record the second review's findings in TRDD-UNWAW14S (c89b6b2)
- **card:** Record the floor gap and the narrowed one-SUMMARY claim from b286335 (TRDD-UNWAW14S) (8b9d5c5)

### Features

- Package mods-expert-developer agent and 60 doc skills as emasoft-mods-development-plugin (b2643d3)
- Embed chapter TOCs in SKILL.md, rename reserved-word skills, add canonical pipeline (e25b03e)
- Record the 72 reviewed NIT findings in the CPV audit-consent registry (4353dd1)

### Miscellaneous Tasks

- Declare repository, scope vendored chapters out of linters, ignore key files (2c0e096)
- Rename plugin to mods-expert-developer-plugin (748622a)
- Add 71 technical terms to the cspell dictionary (4cfa0c9)
- **plugin:** Keep the customized release gate out of CPV canon upgrades, and give the floor gap its own card (TRDD-1Y56FYZW) (b0108eb)
- **spell:** Accept British spelling, ignore TRDD card ids, and add genuine project words (de9834f)
- **ci:** Pin CPV to v5.22.1, which fixes its self-integrity check (abcfa87)
- Bump version to 0.1.1 (02b62f3)

### TRDD-ledger-fix

- Repair cohort rows 2-5 in DELEGATION.md (a53428f)

### Testing

- Pin cpv.exclude_paths to the chapter files, anchor Mega-Linter exclude (b7367a1)
- Describe the chapters as adapted, not verbatim (b6fa202)
- Guard every lint config against re-adding the chapter exclusions (6ea4265)
- Pin the lint ignore lists exactly instead of matching substrings (2ebf99a)
- Name the pinned ignore lists as pinned, not allowed (49b09a3)
- Pin the skills-menu invariants and the agent's preload budget (ada79f5)
- Correct the preload claim and drop three overreaching checks (75cffeb)
- Pin the preload roster owner-side, closing the window gap (4f8b0af)
- Make the frontmatter authoritative for the preload window (50c93cd)
- State the mirror's real reason, and make the procedure discoverable (f9eda79)
- Mirror the preload window as a set, and document the skill workflow (64ae292)
- Record why the window is mirrored as a set, and fix the workflow count (ee9c406)
- Hedge the order claim, name the real relationships, record the broken demo (46684a3)
- Fix the pinned-set wording, and let the caveat travel with the claim (146ca87)
- Make the name guard discriminate by shape, and fix two ledger errors (f828bc8)
- Replace the three scoped guards with one rule over the tracked tree (41f60fc)
- State the rule honestly, scan every tracked file, and close the series (0df4f5f)
- Scope the rule to the shipped documentation, and match the wording to the code (3fd4502)
- Drop the file list, so the guard has one list and the rule one scope (ff37f28)
- Catch a name behind any home-path shape, and record what the 72 findings are (160f440)
---
*Generated by [git-cliff](https://git-cliff.org)*
