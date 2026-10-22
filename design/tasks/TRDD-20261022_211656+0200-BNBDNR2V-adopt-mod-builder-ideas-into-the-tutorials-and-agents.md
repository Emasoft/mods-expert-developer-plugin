---
trdd-id: BNBDNR2V
title: Adopt mod-builder ideas into the tutorials and agents
column: dev
status: tasked
created: 2026-10-22T21:16:56+0200
updated: 2026-10-22T23:01:53+0200
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
implementation-commits: [7c3a79e, 19ad443, 79515d5, c31a84b, 5b0ff02]
---

# Adopt mod-builder ideas into the tutorials and agents

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-22

CURRENT STATE 2026-10-22: increment 1a committed as 7c3a79e, 19ad443, 79515d5, c31a84b, 5b0ff02; increment 1b (item C, review fixes applied) written and uncommitted, pending the orchestrator commit; next increment 2 (item B, three examples), then 3 (D+E+F); 0.4.0 after increment 3.

## User directive

"examine this mod creation plugin and compare to our plugin. see what it has that we missed and copy the ideas, implementing the good things in our plugin too: https://github.com/B314-N03/plugin-marketplace/tree/main/plugins/mod-builder"

## Evidence

reports/mod-builder-comparison/20261022_210944+0200-comparison.md. The source has NO licence, so only ideas are reused: every script, example and sentence is rewritten independently, and NOTICE gains one idea-credit line only (no licence text, nothing copied).

## Decisions

- (1) the three scripts ship under skills/mods-tutorial-quickstart/scripts/ as TOOLS an agent runs, not as examples — the placement rule is extended for exactly that folder (decision by the orchestrator under the owner's standing "decide everything yourself"; the user's read-only requirement applies to example mods, which stay under examples/).
- (2) check-mod.sh uses the `npx -y -p typescript@5 tsc` form from the source material; the mods-doc-mods-development chapter documents only `tsc -p ./first-mod`, and a comment in the script says so.
- BLOCKED detection: check-mod.sh puts the login-expired detection in one function matching the real CLI message. Capture that message NOW from the real `claude plugin test` (login is expired) into tests/fixtures/, and unit-test the detection function against the fixture. The live run is reported, not asserted.
- NO PATH shim at all. The PASS path of `claude plugin test` is an owner-run acceptance box on the TRDD.
- No-copy proof: grep for their exact identifiers with word boundaries (`\bparseToggle\b`, `\bpaneAction\b`, `\bchangesBetween\b`, `CLAUDE_MODS_HOME`, `tpl-`), jscpd as above, AND a prose check: no run of 8+ consecutive words shared between house-conventions.md (and every new SKILL.md paragraph) and their conventions.md/SKILL.md (write the n-gram check as a scratch script in the session scratchpad; report the result).

## Acceptance

- [ ] A: check-mod.sh, new-mod.sh and keep-mod.sh under skills/mods-tutorial-quickstart/scripts/, shellcheck clean, pytest on tmp dirs, placement rule extended to that folder only
- [ ] B: three new examples (turn-timer, git-poller, protect-files) with their tests, every API use verified against the mods-doc chapters
- [x] C: house-conventions.md reference linked from the quickstart, with the UNVERIFIED table and the five proposal questions
- [ ] D: notes-pane and branch-band notes in the interface tutorial SKILL.md, pointing to git-poller and turn-timer; their code unchanged
- [ ] E: mods-forge-agent and mods-expert-developer-agent verification sections gain check-mod.sh as the mod gate and mutation checks
- [ ] F: menu, catalog and README tutorial rows and entries updated for the scripts, new examples and conventions reference
- [ ] Owner-run: check-mod.sh PASS path on a real logged-in build
- [ ] Owner-run: check-mod.sh prints == PASS on hello-mod after one load; capture the real expired-login text when it next occurs and add the BLOCKED branch
- [ ] No-copy proof (identifier grep, jscpd, 8-word prose check) recorded for each increment
- [ ] check-mod.sh gains a BLOCKED branch once the real login-expired message is captured

## Approval log

- 2026-10-22T21:16:56+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — NO-COPY PROOF increment 1a: grep -rnwE parseToggle|paneAction|changesBetween|CLAUDE_MODS_HOME and grep -rn tpl- over skills, tests, agents gave zero hits; jscpd --min-lines 5 with an empty config over the mod-builder source and skills/mods-tutorial-quickstart/scripts found 4 clones, all inside the source's own templates, none between the two trees (0 clones in bash). The 8-word prose check applies from increment 1b.
- 2026-10-22 — increment 1a follow-up: the PASS capture moved to samples_dev/claude-plugin-test-pass.txt (no test uses it); check-mod.sh now fails early with a load-once hint when the types folder is absent; no-copy proof above is unchanged.
- 2026-10-22 orchestrator: 7c3a79e (increment 1a). Untested: the BLOCKED (login expired) path, since the live claude plugin test passed and no real message was seen, so check-mod.sh has no BLOCKED branch yet; the PASS line of check-mod.sh on a loaded mod has not been observed. Review finding 'run validate before tsc' declined: tsc first keeps the tsc failure paths testable in CI, which has no claude CLI. The captured PASS output is in gitignored samples_dev/, not a durable artifact.
- 2026-10-22 orchestrator: follow-up from TRDD-JFB5E98B. CI lints changed files only, so increment 2 (three new examples) is the first CI run of SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT on example files of each type; read that run's MegaLinter log and record that those three ran and passed.
- 2026-10-22 — NO-COPY PROOF increment 1b: identifier grep (parseToggle|paneAction|changesBetween|CLAUDE_MODS_HOME over skills, tests, agents; tpl- over skills) 0 hits; 8-word n-gram check (scratchpad ngram.py, house-conventions.md plus new SKILL.md lines vs their conventions.md and SKILL.md) 0 shared runs, 6-word 0 after rewording 3 spots. Box C ticked. Box A left open: its keep-mod.sh is being fixed by another worker and the shellcheck/pytest evidence is not re-run here. CPV strict 0/0/0/0.
