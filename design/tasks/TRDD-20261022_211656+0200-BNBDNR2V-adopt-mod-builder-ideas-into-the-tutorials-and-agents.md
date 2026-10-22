---
trdd-id: BNBDNR2V
title: Adopt mod-builder ideas into the tutorials and agents
column: todo
status: tasked
created: 2026-10-22T21:16:56+0200
updated: 2026-10-22T21:16:56+0200
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

Queued; runs after 0.3.0 ships, as three increments (A+C, B, D+E+F), released as 0.4.0. Spec: docs_dev/20261022-mod-builder-adoption-spec.md (scratch copy; this card is authoritative).

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
