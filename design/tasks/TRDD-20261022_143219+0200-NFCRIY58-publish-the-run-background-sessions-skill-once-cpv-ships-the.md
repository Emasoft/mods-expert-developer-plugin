---
trdd-id: NFCRIY58
title: Publish the run-background-sessions skill once CPV ships the issue 260 fix
column: blocked
status: tasked
created: 2026-10-22T14:32:19+0200
updated: 2026-10-22T15:03:37+0200
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
blocked-by: [gh:Emasoft/claude-plugins-validation#260, decision:owner-confirms-CPV-tag-with-260-fix-exists]
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
NEXT on the tag: (1) a worker bumps the CPV pin v5.22.1 -> the new tag in scripts/publish.py lines 867, 1373, 2386, 2406, 2476, .github/workflows/ci.yml 171 and 197, .github/workflows/release.yml 67 and 95, then commit; (2) run remote_validation.py plugin on the REAL repo with --strict under the new version, gate: no CRITICAL/MAJOR/MINOR/NIT finding; (3) uv run python scripts/publish.py --dry-run, then publish; (4) reinstall the plugin at user scope and confirm the mods-doc-run-background-sessions skill appears after /reload-plugins.
Owner rules: no consent entries in .cpv-audit-consent.json, no rewording to dodge the scanner, no bypass.
Correction 2026-10-22: the CPV fix commits 3eaa6553 and aab9b092 are REPORTED by the CPV session, not verified here (GitHub returns 422 for both). Step (2) gate condition: the strict run under the new tag has no CRITICAL/MAJOR/MINOR/NIT finding.
Note: scripts/publish.py:3928 CANON_VERSION = "5.22.0" is the canon-template version, not the validator pin; leave it to the CPV upgrade flow.
Blocker form (verified in lib/trdd-doctor.ts ~1340-1390): validate drops gh: entries before its release check, so a gh:-only blocked-by reads as released (BLOCKER-RELEASED, a doctor bug, not yet reported upstream; follow-up for the owner). The decision: entry is the designed human-gated form: WARN BLOCKER-DECISION-PENDING keeps the card blocked, and WARN GRAPH-DECISION-BLOCKER plus GRAPH-EXTERNAL-BLOCKER are expected graph notes, mapped to the decision and gh: entries by inference (emitter not read). Who clears the decision: the main agent, after the CPV session names a tag AND `gh release view <tag> --repo Emasoft/claude-plugins-validation` shows it exists AND under that tag the CLAUDE_CLI_TOKEN_THEFT finding at skills/mods-doc-run-background-sessions/references/chapter.md (the claude setup-token block) is a WARNING or no longer reported, which is the direct proof the #260 fix shipped (a clean strict run is the publish gate in NEXT step 2, not a condition for clearing this decision). Then remove the decision: entry from both blocked-by and unblock-when together. Do NOT move this card to todo on any fix, drift or lint pass before that. blocker-probe hard-codes v5.22.4; if CPV ships the fix under another tag the probe stays "holds" and is stale, so update it to the real tag. If the token finding is a WARNING but the strict run fails on an unrelated new finding, the decision is still cleared and that finding is ordinary publish work, fixed before publishing.
Update 2026-10-22: no CPV release carries the #260 fix yet (latest v5.22.3, issue 260 OPEN). The CPV pin moved v5.22.1 -> v5.22.3 at the same 9 sites (commit 8783882) to clear 2 RC-PIPELINE-DRIFT warnings; NEXT step (1) now reads v5.22.3 -> the fix tag. Strict from the repo root under 5.22.3: CRITICAL=0 MAJOR=0 MINOR=0 NIT=1 (only chapter.md:36). Run CPV with cwd = repo root: .cpv-audit-consent.json is resolved from cwd, and a run from another cwd reports 73 NITs. pyproject now sets pytest testpaths = [tests] (commit 739cd60) so bare pytest matches the publish gate. Card stays blocked; not published.
