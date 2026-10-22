---
trdd-id: BNBDNR2V
title: Adopt mod-builder ideas into the tutorials and agents
column: dev
status: tasked
created: 2026-10-22T21:16:56+0200
updated: 2026-10-22T22:39:08+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T21:16:56+0200
---

# Adopt mod-builder ideas into the tutorials and agents

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-22

CURRENT STATE 2026-10-22: increment 1a (item A, scripts) written, uncommitted; next 1b (item C), then 2 (B), then 3 (D+E+F); 0.4.0 after increment 3.

## User directive

"examine this mod creation plugin and compare to our plugin. see what it has that we missed and copy the ideas, implementing the good things in our plugin too: https://github.com/B314-N03/plugin-marketplace/tree/main/plugins/mod-builder"

## Evidence

reports/mod-builder-comparison/20261022_210944+0200-comparison.md. The source has NO licence, so only ideas are reused: every script, example and sentence is rewritten independently, and NOTICE gains one idea-credit line only (no licence text, nothing copied).

## Decisions

- (1) the three scripts ship under skills/mods-tutorial-quickstart/scripts/ as TOOLS an agent runs, not as examples — the placement rule is extended for exactly that folder (decision by the orchestrator under the owner's standing "decide everything yourself"; the user's read-only requirement applies to example mods, which stay under examples/).
- (2) check-mod.sh uses the same `npx -y -p typescript@5 tsc` form the mods-doc-mods-development chapter documents, and says so in a comment.
- BLOCKED detection: check-mod.sh puts the login-expired detection in one function matching the real CLI message. Capture that message NOW from the real `claude plugin test` (login is expired) into tests/fixtures/, and unit-test the detection function against the fixture. The live run is reported, not asserted.
- NO PATH shim at all. The PASS path of `claude plugin test` is an owner-run acceptance box on the TRDD.
- No-copy proof: grep for their exact identifiers with word boundaries (`\bparseToggle\b`, `\bpaneAction\b`, `\bchangesBetween\b`, `CLAUDE_MODS_HOME`, `tpl-`), jscpd as above, AND a prose check: no run of 8+ consecutive words shared between house-conventions.md (and every new SKILL.md paragraph) and their conventions.md/SKILL.md (write the n-gram check as a scratch script in the session scratchpad; report the result).

## Acceptance

- [ ] A: check-mod.sh, new-mod.sh and keep-mod.sh under skills/mods-tutorial-quickstart/scripts/, shellcheck clean, pytest on tmp dirs, placement rule extended to that folder only
- [ ] B: three new examples (turn-timer, git-poller, protect-files) with their tests, every API use verified against the mods-doc chapters
- [ ] C: house-conventions.md reference linked from the quickstart, with the UNVERIFIED table and the five proposal questions
- [ ] D: notes-pane and branch-band notes in the interface tutorial SKILL.md, pointing to git-poller and turn-timer; their code unchanged
- [ ] E: mods-forge-agent and mods-expert-developer-agent verification sections gain check-mod.sh as the mod gate and mutation checks
- [ ] F: menu, catalog and README tutorial rows and entries updated for the scripts, new examples and conventions reference
- [ ] Owner-run: check-mod.sh PASS path on a real logged-in build
- [ ] No-copy proof (identifier grep, jscpd, 8-word prose check) recorded for each increment

## Approval log

- 2026-10-22T21:16:56+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — NO-COPY PROOF increment 1a: grep -rnwE parseToggle|paneAction|changesBetween|CLAUDE_MODS_HOME and grep -rn tpl- over skills, tests, agents gave zero hits; jscpd --min-lines 5 with an empty config over the mod-builder source and skills/mods-tutorial-quickstart/scripts found 4 clones, all inside the source's own templates, none between the two trees (0 clones in bash). The 8-word prose check applies from increment 1b.
- 2026-10-22 — increment 1a follow-up: the PASS capture moved to samples_dev/claude-plugin-test-pass.txt (no test uses it); check-mod.sh now fails early with a load-once hint when the types folder is absent; no-copy proof above is unchanged.
