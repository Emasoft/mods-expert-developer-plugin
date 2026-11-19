---
trdd-id: TR37CWQ7
title: Harden the release workflows and run example-mod tests and tsc in CI
column: todo
status: tasked
created: 2026-10-27T19:23:18+0100
updated: 2026-11-04T03:56:59+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T19:23:18+0100
implementation-commits: [2bddb4e, 4506b63, a62fc62, d7ff67b, 1fa9e4c, d2f6a06, 4adfd51, c4dd1df, 651ff89, 71a0ee2, 036079b, 88a74b8, c9c1953]
---

# Harden the release workflows and run example-mod tests and tsc in CI

## STATE

- 2026-10-27: zizmor shows 3 HIGH cache-poisoning findings (release.yml:47,157,172) at the regular persona; the '11 suppressed' in its summary are persona-filtered, not ignored: no inline ignore comment and no zizmor config exist, so (d3) has nothing to list or justify beyond that (reports/zizmor/20261027_193810+0100-regular.txt, -noignores.txt). The auditor persona adds 4 template-injection hits (ci.yml:305,342,346 and release.yml:201), all trusted values (matrix.group literal [1, 2]; needs.test.result), plus low/medium findings (reports/zizmor/20261027_193810+0100-auditor.txt). The action pins in release.yml and notify-marketplace.yml are mostly behind latest releases and same as ci.yml's (docs_dev/20261027-tr37cwq7-audit.md); publish.py waits on all runs of the released commit, advisory only.
- NEXT ACTION: remaining open boxes are (c) (ticks after the next release's green release.yml), (c3) (partial: cache and zizmor-action bumped in c9c1953, only the MegaLinter v10 bump remains), (e2) (owner decision on a types snapshot).
- 2026-10-27: At the next release, record the validate and test job durations of release.yml (gh run view <id> --json jobs) on this card; the main agent watches that run, since publish.py's stage_verify_ci_green is advisory and may not see release.yml. If validate exceeds about 20 of its 30 minutes, switch setup-uv to a release-only cache-suffix and record the accepted zizmor finding with its reason here (no suppression comment). ci.yml keeps its caches: its PR runs write to refs/pull/N/merge, which a tag-push run cannot restore, and release jobs no longer restore any cache.
- 2026-10-27: CLI bump recipe: edit the version in .github/claude-cli/package.json, run `npm install --package-lock-only` in .github/claude-cli, check the linux-x64 platform entry in package-lock.json has an integrity hash, commit both files. Dependabot decision: bumps are manual and deliberate; no dependabot entry (.github/dependabot.yml does not exist). Self-command test finding: hooks/tests/self-command.test.ts:738 uses 2.1.310 only as a fixture string for newestVersion, not compared against the installed CLI, so a CLI bump needs no test change. CPV strict must run before the next publish. The next-release measurement also covers the test shard npm ci time.
- 2026-10-27: the next release first-runs five unexercised release.yml changes (checkout v7, caches off, lockfile npm ci, setup-uv v10, the minor bumps). Gate: publish.py pushes commit and tag in ONE atomic push (scripts/publish.py:3324, git push --atomic origin <refs>), so the tag-triggered release.yml starts together with ci.yml on that commit; a "ci green before the tag" gate cannot be had through publish.py without changing it (not done here). Watch release.yml after the release and record job durations. c2b: setup-uv had no version input, no .tool-versions/uv.toml/required-version, so v10.3.2 floats to latest uv; pinned version "0.13.6" (current latest) in all 4 setup-uv steps (ci.yml x2, release.yml x2). attest-build-provenance v4.1.1..v4.2.2 and attest v4.1.0..v4.2.1 release notes list no permission changes; artifact-metadata: write is only needed for storage records, which require push-to-registry (unused here), so release.yml permissions (contents, id-token, attestations) are unchanged. New tests/test_workflow_pins.py guards the pins (megalinter @v8 is its known exception until c3).
- 2026-10-27: box (e) split. (e1) done in tests/test_mod_tests.py (uncommitted): the claude plugin test helper is parametrized over the 8 skills/*/examples/* mods. (e2) tsc in CI is blocked on the owner's decision whether to commit a snapshot of the generated types (CI cannot generate them; tsc today: 0 errors on hooks/, 46 in 3 examples' tests). NEXT ACTION: commit e1; then the 46 example tsc errors (a separate card if they are real defects); (e2) waits on the owner.
- 2026-10-27 (e1 follow-up): tests/test_mod_tests.py stages each example from its own root with its own .claude-plugin/plugin.json (shutil.copytree(example, stage), line ~90); nothing reads .claude-plugin/types or another gitignored path; a missing claude CLI fails (pytest.fail), never skips; ids are the full relative path; per-case timeout 600 s; the hooks/ case behaves as before (only the failure message text changed). A fresh git clone without .claude-plugin/types ran tests/test_mod_tests.py: 9 passed in 22.4 s (10 passed with the new discovery check). Added test_discovery_finds_every_example_mod (>= 8 examples, equals the plugin.json-marked set). The release shard now also runs these 9 cases: add them to the next-release measurement.
- 2026-10-27: the next ordinary ci.yml push is the first runner proof of the env-variable shapes (SHARD_GROUP in the shard step, TEST_RESULT in the CI gate), which release.yml repeats; tests/test_workflow_pins.py now forbids ${{ inside run:.
Owner question 7 (the 42 example-mod tests that fail when check-mod.sh runs on the plugin root), 2026-11-04, verbatim choice: "Fix in 0.7.0" (option text: The mods expert fixes the example mods' tests before publishing.) (owner answers relayed by the orchestrator 2026-11-04 in reports_dev/goal/20261104_035250+0100-owner-answers-q3-q4-q5-q7-q8-q11.md; the choice in quotes is the owner's, the option text in parentheses is the orchestrator's)

## Goal

Harden the release workflows and make CI run the example-mod tests and tsc on hooks/. Found while reviewing TRDD-O5LUMKPW on 2026-10-27; a standalone pipeline card, not a consequence of that mod.

## Scope

- (c) release.yml:38,152,231 and notify-marketplace.yml:56 pin actions/checkout v6.0.3 while ci.yml and the latest release are v7.0.1; move them to the ci.yml SHA.
- (d) Run zizmor on .github/workflows and fix the LOW finding on the npm install of the claude CLI (ci.yml:290, release.yml:183) if confirmed.
- (e) No CI job runs the skills/*/examples mod tests or tsc on hooks/; needs a design choice on how CI obtains the generated types folder (gitignored).
Order: (c) done, then (d)/(d2)/(d3)/(d4), (c2), then (e).
min-approval none: reversible edits to the repo's own CI files; a pushed workflow change takes effect on its next run and is undone by a revert.

## Acceptance checklist

- [ ] (c) release.yml and notify-marketplace.yml pin actions/checkout to the ci.yml v7.0.1 SHA, and a release dry run (scripts/publish.py dry-run mode or the equivalent workflow_dispatch) is green — AMENDED 2026-10-27: done in 2bddb4e (actionlint clean); release.yml has no workflow_dispatch and publish.py --dry-run does not run it, so this box ticks only after the next real release's release.yml run is green; no workflow_dispatch will be added to a release workflow (it would let a write-access user run release steps on any ref, bypassing publish.py's gates). publish.py stage_verify_ci_green (scripts/publish.py:3712) waits for no workflow by name: it polls 'gh run list --commit HEAD' and reports every run on that commit (so a release.yml run registered by then is included), but it is advisory, never aborts, and is skipped in dry-run
- [x] (d) zizmor run on .github/workflows with its output saved under reports/zizmor/; the LOW finding on the claude CLI npm install fixed if confirmed — AMENDED 2026-10-27: no finding on the CLI npm install at the default persona (2bddb4e review); ticks after the suppressed list (A1) is read — done in 1fa9e4c: CLI installed with npm ci from .github/claude-cli/package-lock.json (sha512 for the wrapper and each platform package); zizmor 1.30.1 clean; macOS npm ci + claude --version = 2.1.310 with scripts enabled for that command; Linux: first exercised by the next CI run (docker unavailable on the build machine)
- [x] (d2) release.yml caching off in release jobs: setup-uv enable-cache: false at :47 and :157, setup-node caching off at :172; zizmor re-run shows no cache-poisoning finding (3 HIGH in reports/zizmor/20261027_193507+0100-zizmor.txt) — done in a62fc62 (+ this follow-up); zizmor clean (reports/zizmor/20261027_194127+0100-after-d2.txt), actionlint clean
- [x] (d3) every zizmor suppression listed with its location and a written reason; a suppression without a reason is fixed, not kept — no suppression exists: the 11 'suppressed' findings were hidden by the default persona, not by ignore comments or a config (audit A1); nothing to justify
- [x] (d4) auditor-persona template-injection hits resolved: all expressions moved to env: variables, none of them user-controlled — done in 036079b: expressions moved to env: in 3 steps; zizmor auditor persona reports no template-injection (reports/zizmor/20261027_212921+0100-after-d4-auditor.txt)
- [x] (c2) every other action pinned in release.yml and notify-marketplace.yml checked against its latest release and ci.yml's pin; outdated ones updated — done in 4adfd51 (setup-uv v10.3.2, upload-artifact v7.0.2, download-artifact v8.0.2, sbom-action v0.24.3, attest-build-provenance v4.2.2, repository-dispatch v4.0.1)
- [x] (e1) pytest runs `claude plugin test` on every skills/*/examples/* mod (tests/test_mod_tests.py), so CI runs them through its existing pytest step — 2026-10-27: 8 examples parametrized, 9 passed in 6.5 s locally (483 passed in tests), a broken dice-tool expectation fails its case (local evidence: macOS, and a git clone without the generated types; first Linux proof is the next ci.yml run)
- [ ] (e2) tsc on hooks/ and the examples in CI: blocked on the owner's decision whether to commit a snapshot of the generated types (CI cannot generate them: only an interactive load writes .claude-plugin/types); tsc today: 0 errors on hooks/, 46 errors in 3 examples' tests (see docs_dev/20261027-tr37cwq7-e-options.md)
- [ ] (c3) ci.yml-only actions: actions/cache v5.0.5 -> v6.1.0, zizmor-action v0.5.7 -> v0.8.0, megalinter v8 -> v10.1.0, commitlint v6.2.1, actionlint (re-check); deferred from c2 because majors need their own review — PARTIAL 2026-10-27: actions/cache v6.1.0 and zizmor-action v0.8.0 done in c9c1953 (cache v6: same node24 runtime and inputs; v6.1.0 only changes the warning on a read-only cache token; zizmor-action defaults unchanged); comment fix in the follow-up commit; commitlint v6.2.1 and actionlint v1.7.12 already latest. OPEN: MegaLinter v8 -> v10.1.0 (SHA 9949bad031045f366be2467e00e8371a7328a2e2) deferred: v10 stops each linter after 300 s (LINTER_TIMEOUT_SECONDS, exit 124) and cold Checkov/Trivy/cspell/mypy times cannot be measured locally — needs a CI run or a raised timeout. GITLEAKS removal in v10 is no blocker (REPOSITORY_GITLEAKS is deliberately off in .mega-linter.yml). The cache step is untested until the first CI run after push.

## Approval log

- 2026-10-27T19:23:18+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
