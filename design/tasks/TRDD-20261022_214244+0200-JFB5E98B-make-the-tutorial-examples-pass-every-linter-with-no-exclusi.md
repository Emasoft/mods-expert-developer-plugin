---
trdd-id: JFB5E98B
title: Make the tutorial examples pass every linter with no exclusion
column: todo
status: tasked
created: 2026-10-22T21:42:44+0200
updated: 2026-10-22T21:59:22+0200
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
---

# Make the tutorial examples pass every linter with no exclusion

## STATE
CURRENT STATE 2026-10-22: proposed and reviewed; not started. NEXT ACTION: box 1 (run jscpd with the example exclusions removed and record the duplicate list). Order: this card first, then TRDD-BNBDNR2V (its new scripts are written lint-clean), then TRDD-H26OG8AP.

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
<!-- cspell:ignore aestetically seamlessy precius techniues -->

## Acceptance checklist
- [ ] jscpd run with the example exclusions removed; duplicate list saved under reports/measure/.
- [ ] No lint, spell or duplicate-check config anywhere in the repo excludes skills/mods-tutorial-*/examples/ (checked with a grep across every config file).
- [ ] Tests that pinned the exclusions (MEGALINTER_EXAMPLES_EXCLUDES, the path-form regex test) now assert the exclusion is absent.
- [ ] TypeScript/JavaScript example files: either a TS/JS linter is enabled for them, or the card records why none applies.
- [ ] NOTICE lists every modified example file with its change.
- [ ] uv run pytest, the CI-parity preflight (cpv-remote-validate plugin . --strict) and CI MegaLinter pass with no exclusion and no waiver.
- [ ] BDY6ZNDZ's Approval log records that its box 7 is superseded by this card.

## Approval log

- 2026-10-22T21:42:44+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-22 orchestrator: approved by the main agent under the owner's 'decide yourself' instruction; it reverses TRDD-BDY6ZNDZ box 7; the owner may veto. The policy quote was copied from Emasoft/claude-plugins-validation issue 257's body as read on 2026-10-22.
