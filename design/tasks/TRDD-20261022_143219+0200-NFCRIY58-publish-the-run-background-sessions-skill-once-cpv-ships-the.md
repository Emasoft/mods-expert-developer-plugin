---
trdd-id: NFCRIY58
title: Publish the run-background-sessions skill once CPV ships the issue 260 fix
column: blocked
status: tasked
created: 2026-10-22T14:32:19+0200
updated: 2026-10-22T14:34:49+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-22T14:32:19+0200
pre-block-column: todo
blocked-by: [Emasoft/claude-plugins-validation#260]
blocker-probe: [gh, release, view, v5.22.4, --repo, Emasoft/claude-plugins-validation, --json, tagName, --jq, .tagName]
blocker-holds-if: not-match:^v5\.22\.4$
implementation-commits: [a523c7c, 6891472, c15499a, 1f3c287, 890e4a1]
unblock-when: [decision:owner-confirms-CPV-tag-with-260-fix-exists]
---

# Publish the run-background-sessions skill once CPV ships the issue 260 fix

## Approval log

- 2026-10-22T14:32:19+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## STATE

STATE 2026-10-22: skill commits a523c7c, 6891472, c15499a, 1f3c287, 890e4a1 are local on main, unpushed. Blocked by CPV issue Emasoft/claude-plugins-validation#260 (token-minting fence + audit-consent sentence -> WARNING); fix implemented in the CPV session (commits 3eaa6553, aab9b092, not pushed), expected in CPV v5.22.4, waiting on the owner's approval in that session. The CPV session promised to SendMessage the tag.
Verified 2026-10-22: CPV 5.22.3 strict on the real tree exits 4 only on CLAUDE_CLI_TOKEN_THEFT at chapter.md:36; SHELL_EXEC is a non-blocking WARNING; publish.py passes WARNINGs (blocks only CRITICAL/MAJOR/MINOR/NIT); ruff scripts/ clean; pytest 232 passed.
NEXT on the tag: (1) a worker bumps the CPV pin v5.22.1 -> the new tag in scripts/publish.py lines 867, 1373, 2386, 2406, 2476, .github/workflows/ci.yml 171 and 197, .github/workflows/release.yml 67 and 95, then commit; (2) run remote_validation.py plugin on the REAL repo with --strict under the new version, expect exit 0; (3) uv run python scripts/publish.py --dry-run, then publish; (4) reinstall the plugin at user scope and confirm the mods-doc-run-background-sessions skill appears after /reload-plugins.
Owner rules: no consent entries in .cpv-audit-consent.json, no rewording to dodge the scanner, no bypass.
Correction 2026-10-22: the CPV fix commits 3eaa6553 and aab9b092 are REPORTED by the CPV session, not verified here (GitHub returns 422 for both). Step (2) gate condition: the strict run under the new tag has no CRITICAL/MAJOR/MINOR/NIT finding.
Note: scripts/publish.py:3928 CANON_VERSION = "5.22.0" is the canon-template version, not the validator pin; leave it to the CPV upgrade flow.
Known lint ERROR GRAPH-UNKNOWN-BLOCKER: blocked-by names an external GitHub issue; trddgrep has no external-blocker form (every token must resolve to a card). Kept deliberately rather than inventing a stub card; blocker-probe and unblock-when carry the real check.
