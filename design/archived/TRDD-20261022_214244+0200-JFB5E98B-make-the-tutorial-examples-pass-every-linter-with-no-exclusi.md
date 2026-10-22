---
trdd-id: JFB5E98B
title: Make the tutorial examples pass every linter with no exclusion
column: complete
status: archived
created: 2026-10-22T21:42:44+0200
updated: 2026-10-22T22:24:57+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: refactor
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T21:42:44+0200
implementation-commits: [daa20cf, d4760f2, e397753]
---

# Make the tutorial examples pass every linter with no exclusion

## STATE
CURRENT STATE 2026-10-22: complete — released in 0.3.2.

## Owner policy (verbatim, source: Emasoft/claude-plugins-validation issue 257, quoting the owner)
> never bypass or suppress any validation. if there are false positives, improve the detection code instead, to be more precise in identifying threats.
Also the owner's standing constraint in this project: no CPV consent or waiver files ("no exceptions are allowed").

## Problem
48589fd excluded skills/mods-tutorial-*/examples/** from markdownlint, cspell, shfmt and jscpd (.mega-linter.yml FILTER_REGEX_EXCLUDE entries, .cspell.json and .jscpd.json ignore entries). These files are tracked and ship in the plugin, so the exclusions are suppressions under the policy. The remote CPV preflight already ignores the .mega-linter.yml excludes (it failed on smoke.sh in the first 0.3.0 publish attempt; fixed by reformatting in 114609b).

## Decisions
- The examples stop being verbatim upstream copies; NOTICE lists each modified file and what changed (per file, not a blanket sentence). The examples/LICENSE copies stay.
- Rejected: filing a CPV issue asking the preflight to honour per-linter excludes — it would support a suppression.
- jscpd duplicates between SKILL.md snippets and example files: replace the snippet with a link to the example file (one source).
- jscpd duplicates between examples: if no example can reference another, take it to the owner; never settle it with a jscpd exclude.
- One increment per linter (cspell, markdownlint, shfmt, jscpd), each reviewed and committed separately.
- No PRRD exists, so no relevant-rules.
- Also move the four verbatim-quote misspellings (aestetically, seamlessy, precius, techniues) out of .cspell.json ignoreWords into per-card cspell:ignore comments (done 2026-10-22, see below).
<!-- cspell:ignore aestetically seamlessy precius techniues unexcluded -->
- No TypeScript/JavaScript linter is enabled for any file in this repo, so none is excluded for the examples.
- No example file was modified by this card; NOTICE's existing smoke.sh sentence stays accurate.

## Acceptance checklist
- [x] jscpd run with the example exclusions removed; duplicate list saved under reports/measure/.
- [x] No lint, spell or duplicate-check config anywhere in the repo excludes skills/mods-tutorial-*/examples/ (checked with a grep across every config file).
- [x] Tests that pinned the exclusions (MEGALINTER_EXAMPLES_EXCLUDES, the path-form regex test) now assert the exclusion is absent.
- [x] TypeScript/JavaScript example files: either a TS/JS linter is enabled for them, or the card records why none applies.
- [x] NOTICE lists every modified example file with its change.
- [x] uv run pytest, the CI-parity preflight (cpv-remote-validate plugin . --strict) and CI MegaLinter pass with no exclusion and no waiver.
- [x] BDY6ZNDZ's Approval log records that its box 7 is superseded by this card.

## Approval log

- 2026-10-22T21:42:44+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 orchestrator: approved by the main agent under the owner's 'decide yourself' instruction; it reverses TRDD-BDY6ZNDZ box 7; the owner may veto. The policy quote was copied from Emasoft/claude-plugins-validation issue 257's body as read on 2026-10-22.
- 2026-10-22 orchestrator: measurement reports/measure/20261022_220536+0200-jscpd-examples-no-exclusions.md: jscpd 0 new clones, markdownlint 0, shfmt 0, cspell 1 (AKIA, added to words); the examples stay verbatim except smoke.sh's prior shfmt reformat.
- 2026-10-22 orchestrator: review of daa20cf applied — guard tests now probe every example file in three path forms and match ignore globs; TS/JS ban dropped as beyond rationale; CPV 26->25 warnings: RC-PIPELINE-DRIFT-001 (.mega-linter.yml differs from the canonical CPV standard) disappeared. No ticked box claims CI, MegaLinter or all-linters-pass, so none was unticked. Spell-check .json files stay out of the example probe because the pinned canon skips every .json repo-wide.
- 2026-10-22 orchestrator: 0.3.2 publish blocked by cspell on a word in the report filename; report renamed to ...-no-exclusions.md. Review of d4760f2 applied: .json exemption narrowed to the canon pattern, ADDITIONAL_EXCLUDED_DIRECTORIES checked by path segment, empty-list guards; the .mega-linter.yml comment moved to the test because it re-triggered RC-PIPELINE-DRIFT-001.
- 2026-10-22 orchestrator: box 6 — pytest 241, CPV strict 0 errors/25 warnings, publish preflight PARITY-CLEAN, 0.3.2 released and CI run 39847748399 green; CI lints changed files only (VALIDATE_ALL_CODEBASE false), so whole-example evidence is local: markdownlint-cli2 exit 0, 0 issues (reports/measure/20261022_222344+0200-ex-markdownlint.txt); cspell exit 0, 16 files, 0 issues (reports/measure/20261022_222344+0200-ex-cspell.txt); shfmt -d exit 0, 0 diffs on 1 .sh file (reports/measure/20261022_222344+0200-ex-shfmt.txt); shellcheck exit 0, 0 findings (reports/measure/20261022_222344+0200-ex-shellcheck.txt); json.tool exit 0 on 15 .json files, 0 errors (reports/measure/20261022_222344+0200-ex-json.txt); jscpd 29 repo clones, 0 involve an examples path (reports/measure/20261022_222344+0200-ex-jscpd.txt).
- 2026-10-22 orchestrator: commit daa20cf's message cites the report under its pre-rename name reports/measure/20261022_220536+0200-jscpd-examples-unexcluded.md; the same report is reports/measure/20261022_220536+0200-jscpd-examples-no-exclusions.md (a copy exists under both names in gitignored reports/measure/).
- 2026-10-22T22:24:57+0200 — COMPLETE by main-agent@emasoft-mods-expert-developer. archived as complete (from column todo).
