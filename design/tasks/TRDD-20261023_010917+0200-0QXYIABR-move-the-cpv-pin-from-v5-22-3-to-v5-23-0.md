---
trdd-id: 0QXYIABR
title: Move the CPV pin from v5.22.3 to v5.23.0
column: backburner
status: tasked
created: 2026-10-23T01:09:17+0200
updated: 2026-10-23T01:45:36+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: infra
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-23T01:09:17+0200
---

# Move the CPV pin from v5.22.3 to v5.23.0

## Why
publish.py, .github/workflows/ci.yml and release.yml pin claude-plugins-validation v5.22.3. A strict v5.23.0 run on a clean clone of 694d70d (2026-10-23) reports CRITICAL 0, MAJOR 5, MINOR 1, WARNING 29, where the pinned v5.22.3 reported MAJOR 0, MINOR 0, WARNING 25 on the 0.4.0 publish, so moving the pin today would block the next publish. Owner policy forbids suppressing or waiving any of them.
## Findings to resolve
- MINOR: skills/mods-the-skills-menu/SKILL.md embeds 1 of the 8 headings of references/skills-catalog.md after its link; v5.23.0 requires the full TOC of a referenced file after the link, or a smaller TOC in the reference file.
- MAJOR x5: absolute example paths inside copied Anthropic doc chapters: mods-doc-automate-actions-with-hooks chapter.md:586, mods-doc-cc-permissions-modes chapter.md:716, mods-doc-hooks-reference chapter.md:1429 and :3080, mods-doc-troubleshooting-cc-setup chapter.md:954. The chapters are preserved verbatim, so these are documentation examples, not paths this plugin uses; first file a detector-precision issue on Emasoft/claude-plugins-validation (an example path in documentation prose is not a path the plugin uses); a chapter-text change is only the fallback, because it breaks the verbatim copy of the Anthropic docs; never a waiver.
- MINOR REGEX_DOS on new-mod.sh no longer applies, measured: a clone with the old pattern reported MINOR 2, while the 694d70d clone reports MINOR 1 and no REGEX_DOS, since the pattern was rewritten in e8c9347; the detector false positive is reported as Emasoft/claude-plugins-validation issue 264.
- WARNING x5, new in v5.23.0 (v5.22.3 reported none): RC-PIPELINE-DRIFT-001 says ci.yml, release.yml and .mega-linter.yml differ from the current CPV template (the pinned version, the release ruff command, the old exclude lists) and that .ruff.toml and .bandit.yml are missing.
## Steps
- [ ] Fix the skills-menu TOC finding in this plugin's own files.
- [ ] Decide and act on the five chapter example paths (file the CPV issue first if it is a detector question).
- [ ] Bring the pipeline up to the v5.23.0 template: the release ruff command (the template also widens it from scripts/ to the whole repo), the .mega-linter.yml config keys and exclude lists, and new .ruff.toml and .bandit.yml files. Moving the pin itself clears the version-string drift in ci.yml and release.yml, so leave that to the last step. Expect new lint findings: MegaLinter's cspell starts checking JSON files, and the ruff and bandit rule files apply in CI for the first time. Review the standardize diff by hand, since it rewrites files.
- [ ] Re-run v5.23.0 strict on a clean clone until CRITICAL, MAJOR and MINOR are all 0 and the only RC-PIPELINE-DRIFT-001 warnings left are the version-string ones the last step clears. Also run the new ruff config over the whole repo and MegaLinter's cspell scope on the JSON files locally, and fix what they find without any waiver; CPV strict does not report those.
- [ ] Grep scripts/ and .github/workflows/ for 5.22.3 and move every match there in one commit (a snapshot at 694d70d found 9: scripts/publish.py lines 867, 1373, 2386, 2406, 2476; .github/workflows/ci.yml 171 and 197; release.yml 67 and 95). Leave CHANGELOG.md, DELEGATION.md, archived cards and evidence lines unchanged: they record past runs. Grep design/tasks for 5.22.3 too, open (non-terminal) cards only: for each one that names it (at 694d70d: TRDD-GF5UDFWI, TRDD-03IIDGPP, TRDD-J4HRAQF0, TRDD-BDY6ZNDZ, TRDD-N9M0FOKO) decide whether to rewrite the version or add a note beside it, since a box may record a past run at v5.22.3. Then publish.

## Approval log

- 2026-10-23T01:09:17+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
