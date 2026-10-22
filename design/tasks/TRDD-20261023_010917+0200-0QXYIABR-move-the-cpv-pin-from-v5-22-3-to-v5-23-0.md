---
trdd-id: 0QXYIABR
title: Move the CPV pin from v5.22.3 to v5.23.0
column: backburner
status: tasked
created: 2026-10-23T01:09:17+0200
updated: 2026-10-23T01:13:44+0200
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
- [ ] Re-run v5.23.0 strict on a clean clone until CRITICAL, MAJOR and MINOR are all 0.
- [ ] Move the pin in publish.py (both occurrences), ci.yml and release.yml in one commit, and publish.
- [ ] Before moving the pin, bring ci.yml, release.yml and .mega-linter.yml up to the v5.23.0 template and add .ruff.toml and .bandit.yml; review the standardize diff by hand, since it rewrites files.

## Approval log

- 2026-10-23T01:09:17+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
