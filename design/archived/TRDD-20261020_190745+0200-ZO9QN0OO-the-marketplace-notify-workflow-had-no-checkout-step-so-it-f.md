---
trdd-id: ZO9QN0OO
title: The marketplace-notify workflow had no checkout step, so it failed on its first ever run
column: complete
status: archived
created: 2026-10-20T19:07:45+0200
updated: 2026-10-20T20:06:00+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: bugfix
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-20T19:07:45+0200
---

# The marketplace-notify workflow had no checkout step, so it failed on its first ever run

THE DEFECT. .github/workflows/notify-marketplace.yml had NO checkout step. Its 'Get plugin info' step reads .claude-plugin/plugin.json out of the workspace, and the workspace was never populated, so the step failed with 'plugin.json not found in mods-expert-developer-plugin - cannot determine the marketplace entry name.'

WHY THE ERROR MESSAGE MISLED. It reads like a missing file or a wrong repository name. The real cause is a missing checkout, which is a different bug with a different fix, and the guard it tripped (D9, TRDD-DFRPRZYD, added to stop the marketplace being notified under a WRONG plugin name) is indistinguishable from a real D9 violation by its message alone.

THE WORKFLOW HAD NEVER RUN BEFORE THIS. Its paths: filter fires on pushes touching .claude-plugin/plugin.json, hooks/**, commands/**, agents/**, skills/** or scripts/**. The first push that matched it was 8538202, which removed the four tool skills from the agent's frontmatter - a change to agents/**. So the failure is NOT a regression from that commit: the workflow was broken from its first run and the push merely exposed it. The commit that exposed it also fixed it (e443549), so the marketplace notification for that push was LOST and the push itself was never notified.

THE FIX. One checkout step, pinned to the same full commit SHA ci.yml and release.yml use (actions/checkout v6.0.3), with persist-credentials: false so the checkout token is not written to .git/config (zizmor artipacked, issue #151). fetch-depth: 0 is deliberately NOT set: this workflow needs one file at one ref, not history, and the default shallow fetch is the right cost for it.

VERIFIED. actionlint passes on the file and on the whole .github/workflows directory. The step order is now: checkout, Check marketplace secret, Get plugin info, Trigger marketplace update, Summary.

WHY THIS IS A CARD AND NOT A COMMIT MESSAGE. The marketplace notification is a real distribution step, and the workflow that performs it was never exercised until a push happened to match its path filter. A guard that has never run is not a guard. The card records that the notification for 8538202 was LOST, so a reader knows the marketplace did not see that push.

## Approval log

- 2026-10-20T19:07:45+0200 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-10-20T20:06:00+0200 — COMPLETE by main-agent@emasoft-mods-expert-developer. The notify workflow's missing checkout step is fixed (e443549) and the workflow has since run and succeeded end to end..

## Acceptance

WHAT THIS CARD PROMISED, AND WHETHER IT DELIVERED.
- [x] The notify workflow checks the repository out before the step that reads .claude-plugin/plugin.json.
- [x] The checkout is pinned to the same full commit SHA the other workflows use, with persist-credentials: false.
- [x] The workflow's documented no-op behaviour is preserved: with MARKETPLACE_PAT absent the job still ends green.
- [x] actionlint passes on the file and on the whole .github/workflows directory.
- [x] The workflow has actually RUN to success, which is the only proof that the fix works end to end.
