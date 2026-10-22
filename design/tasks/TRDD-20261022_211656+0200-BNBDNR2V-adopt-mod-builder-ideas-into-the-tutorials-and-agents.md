---
trdd-id: BNBDNR2V
title: Adopt mod-builder ideas into the tutorials and agents
column: dev
status: tasked
created: 2026-10-22T21:16:56+0200
updated: 2026-10-22T23:39:30+0200
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
implementation-commits: [7c3a79e, 19ad443, 79515d5, c31a84b, 5b0ff02, 5076bbf, 233b5ab]
---

# Adopt mod-builder ideas into the tutorials and agents

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-22

CURRENT STATE 2026-10-22: increment 1a committed as 7c3a79e, 19ad443, 79515d5, c31a84b, 5b0ff02; increment 1b (item C) as 5076bbf; increment 2 (item B, three examples plus the review fixes) as 233b5ab; boxes A, B and C ticked; next is increment 3 (D+E+F), then 0.4.0; the type-check of the three examples is an owner-run box (login expired).

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

- [x] A: check-mod.sh, new-mod.sh and keep-mod.sh under skills/mods-tutorial-quickstart/scripts/, shellcheck clean, pytest on tmp dirs, placement rule extended to that folder only (evidence: commits 7c3a79e 19ad443 79515d5 c31a84b 5b0ff02, shellcheck clean, tests/test_mod_scripts.py on tmp dirs, placement rule)
- [x] B: three new examples (turn-timer, git-poller, protect-files) with their tests, every API use verified against the mods-doc chapters
- [x] C: house-conventions.md reference linked from the quickstart, with the UNVERIFIED table and the five proposal questions
- [ ] D: notes-pane and branch-band notes in the interface tutorial SKILL.md, pointing to git-poller and turn-timer; their code unchanged
- [ ] E: mods-forge-agent and mods-expert-developer-agent verification sections gain check-mod.sh as the mod gate and mutation checks
- [ ] F: menu, catalog and README tutorial rows and entries updated for the scripts, new examples and conventions reference
- [ ] Owner-run: check-mod.sh prints == PASS on hello-mod on a real logged-in build after one load
Merged into the owner-run check-mod.sh box above; no separate task.
- [ ] No-copy proof (identifier grep, jscpd, 8-word prose check) recorded for each increment
- [x] check-mod.sh login handling: claude plugin test passed with the login expired (observed 2026-10-22), so no BLOCKED branch is needed there; the only login-bound step is the first load that writes .claude-plugin/types/, which check-mod.sh already reports as FAIL: tsc with the load instruction
- [ ] Owner-run: type-check turn-timer, git-poller and protect-files with check-mod.sh after one live load (types folder) — not run: login expired

## Approval log

- 2026-10-22T21:16:56+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 — NO-COPY PROOF increment 1a: grep -rnwE parseToggle|paneAction|changesBetween|CLAUDE_MODS_HOME and grep -rn tpl- over skills, tests, agents gave zero hits; jscpd --min-lines 5 with an empty config over the mod-builder source and skills/mods-tutorial-quickstart/scripts found 4 clones, all inside the source's own templates, none between the two trees (0 clones in bash). The 8-word prose check applies from increment 1b.
- 2026-10-22 — increment 1a follow-up: the PASS capture moved to samples_dev/claude-plugin-test-pass.txt (no test uses it); check-mod.sh now fails early with a load-once hint when the types folder is absent; no-copy proof above is unchanged.
- 2026-10-22 orchestrator: 7c3a79e (increment 1a). Untested: the BLOCKED (login expired) path, since the live claude plugin test passed and no real message was seen, so check-mod.sh has no BLOCKED branch yet; the PASS line of check-mod.sh on a loaded mod has not been observed. Review finding 'run validate before tsc' declined: tsc first keeps the tsc failure paths testable in CI, which has no claude CLI. The captured PASS output is in gitignored samples_dev/, not a durable artifact.
- 2026-10-22 orchestrator: follow-up from TRDD-JFB5E98B. CI lints changed files only, so increment 2 (three new examples) is the first CI run of SPELL_CSPELL, MARKDOWN_MARKDOWNLINT and BASH_SHFMT on example files of each type; read that run's MegaLinter log and record that those three ran and passed.
- 2026-10-22 — NO-COPY PROOF increment 1b: identifier grep (parseToggle|paneAction|changesBetween|CLAUDE_MODS_HOME over skills, tests, agents; tpl- over skills) 0 hits; 8-word n-gram check (scratchpad ngram.py, house-conventions.md plus new SKILL.md lines vs their conventions.md and SKILL.md) 0 shared runs, 6-word 0 after rewording 3 spots. Box C ticked. Box A left open: its keep-mod.sh is being fixed by another worker and the shellcheck/pytest evidence is not re-run here. CPV strict 0/0/0/0.
- 2026-10-22 correction: the earlier line saying box A was left open because keep-mod.sh was being fixed is superseded; that fix is 5b0ff02 and box A is ticked.
- 2026-10-22 decision (2) was corrected in 5076bbf: it originally said check-mod.sh uses "the same npx -y -p typescript@5 tsc form the mods-doc-mods-development chapter documents"; that was false, the chapter documents only tsc -p.
- 2026-10-22 a real expired-login message was captured from `claude -p` (not from `claude plugin test`): "Failed to authenticate: OAuth session expired and could not be refreshed".
- 2026-10-22 owner boxes merged: the two overlapping Owner-run check-mod.sh PASS boxes are now one. The second box was reworded to a merged-into-the-box-above pointer (trddgrep cannot delete a line). The first box had earlier been edited in place; its old text was "Owner-run: check-mod.sh prints == PASS on hello-mod after one load; capture the real expired-login text when it next occurs and add the BLOCKED branch".
- 2026-10-22 box A evidence: test_mod_scripts 30 passed at 5b0ff02; full suite 274 passed at 5076bbf.
- 2026-10-22 box B evidence: claude plugin test turn-timer 14, git-poller 20, protect-files 16 pass; validate passes in each; mutation checks recorded in reports_dev/20261022-bnb-inc2-fixes-A.md; tsc not run (login expired: 'Failed to authenticate: OAuth session expired and could not be refreshed' on a live load), tracked by the owner-run type-check box.
- 2026-10-22 — NO-COPY PROOF increment 2: identifier grep (parseToggle|paneAction|changesBetween) 0 hits and CLAUDE_MODS_HOME|tpl- 0 hits over the three example folders; jscpd --min-lines 5 over the mod-builder source and the three folders found 6 clones, all inside one tree (4 in the source templates, 2 inside our test file), 0 between the trees; 6-word and 8-word prose check over the .md files: 0 and 0 shared runs; over .md+.ts+.tsx the shared runs are 61 (6-word) and 28 (8-word), all public-API boilerplate in code (import lines, register/onSession signatures, UI props shape), not prose.
- 2026-10-22 decision on the increment-2 review: no BLOCKED branch in check-mod.sh (claude plugin test passed with the login expired). Fixed: protect-files refuses to add a `..` entry; git-poller runs git with -C in the session cwd and skips git without one; NOTICE scope names skills/*/examples/LICENSE; turn.complete no longer waits for git; the off switch is in the view atom so ui.render does not read the store. Rejected: the `.catch` re-entry finding (mods-doc-mods-and-events chapter.md:331-337 shows the `if (next.called) return next(e)` pattern). Answered: the hot-reload finding (mods-doc-mods-reference chapter.md:136, session.start fires again after a reload, so the null timer restarts it).
- 2026-10-22 — NO-COPY PROOF increment 2 (8-word runs): the 28 shared 8-word runs in code are all public API boilerplate (imports, hook signatures, the AbovePrompt prop set, the documented .catch pattern); 0 runs in prose.
- 2026-10-22 box B evidence after the review fixes (supersedes the earlier box B evidence line): committed as 233b5ab; claude plugin test turn-timer 14, git-poller 26, protect-files 17 pass; mutation checks in reports_dev/20261022-bnb-inc2-fixes-A.md and -E.md; tsc still not run (login expired).
- 2026-10-22 no-copy proof precision: each of the 28 shared 8-word runs was inspected by the orchestrator; all are code tokens (imports, hook signatures, the AbovePrompt prop set from the reference chapter, the documented .catch line); none is in a comment or an .md file. The 61 shared 6-word runs were not inspected one by one.
- 2026-10-22 round-2 review of 233b5ab: Fixed: the syncEnabled stale-write race (command.run is the only writer of view.enabled after start); /git-poller on no longer waits for git; the invalidate removal is cited to interfaces:798; protect-files list no longer rewrites the store; stored relative entries starting with .. now count as a damaged list. Recorded: the 233b5ab message's 'every API use cites its chapter line' was over-broad; the citations are added in the follow-up commit. Moved: the turn.complete enabled gate moved into the poll. Rejected: 'NOTICE may not name the LICENSE copies' (NOTICE line 4 names skills/*/examples/LICENSE). Declined: refusing `/..` (it normalises to `/`, which the README documents as protecting everything, fail-closed).
