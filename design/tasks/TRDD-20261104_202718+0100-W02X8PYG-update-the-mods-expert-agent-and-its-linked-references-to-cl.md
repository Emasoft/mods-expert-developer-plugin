---
trdd-id: W02X8PYG
title: Update the mods expert agent and its linked references to Claude Code 2.1.287 to 2.1.318
column: blocked
status: tasked
created: 2026-11-04T20:27:18+0100
updated: 2026-11-04T20:52:22+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: docs
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T20:27:18+0100
blocked-by: [HAK91K6S]
pre-block-column: todo
unblock-when: [trdd:HAK91K6S]
blocker-probe: t=$(trddgrep --design-dir design show HAK91K6S --porcelain | cut -f3); case $t in complete|completed|published|live) echo CLOSED;; *) echo OPEN;; esac
blocker-probe-canary: match:^(OPEN|CLOSED)$
blocker-holds-if: match:^OPEN$
relevant-rules: [6, 7, 12]
---

# Update the mods expert agent and its linked references to Claude Code 2.1.287 to 2.1.318

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

Column blocked (pre-block-column todo), nothing done. Minted 2026-11-04 by the eleventh mods expert from orchestrator state
13, section 3, with the orchestrator's review corrections (reports_dev/goal/20261104_201814+0100-orchestrator-state-13.md,
local to the developer machine). The owner sequenced this work after the publish, the install, the uninstall of the
standalone Deck and Tokensaver plugins and the enabling of the integrated mods.

Blocker: TRDD-HAK91K6S (the M6 swap, which also holds the merge-back to dev main and to this branch, because this card edits
sources on the merged main). None of the four cards the orchestrator named owns publish, install, uninstall or enable: the
TRDD-RD1ISPMN and TRDD-71KVH9PA STATE blocks put publishing out of their scope and give the publish and install step to the orchestrator, and their Owner directive 2 sections give the uninstall to the orchestrator as
M6, and the owner's 'enable the integrated version' is met by the on-by-default master switches (orchestrator correction 2 of
ruling 4); no separate enable step. TRDD-O5LUMKPW shipped in 0.6.0 and 0.6.1 and waits on owner rulings; TRDD-0M2WY8KD closes in the merge-back after the
publish. So TRDD-HAK91K6S was minted to own M6, and this card is blocked on it (unblock-when trdd:HAK91K6S).
NEXT ACTION: when unblocked, Plan step 1. One writer per file set: TRDD-4Z36WCEV and TRDD-MPJTMO51 may also touch the agent file (inferred from their titles, cards not read; check before starting).

## Owner directive (verbatim, 2026-11-04)

> after you publish the plugin and install it successfully, and uninstall those two other plugins, and enable the 2 mods integrated in their place, you must take the time to update the mods-expert-developer-agent (both the main md file and the reference files and skills linked) to be up to date to the following changes:

The directive continues with the pasted Claude Code CHANGELOG, 2.1.318 down to 2.1.287.

## Source

- Canonical: the public upstream Claude Code CHANGELOG, versions 2.1.287 to 2.1.318 (28 version headers in the local paste).
- Local evidence, on the developer machine only (gitignored):
  reports_dev/goal/20261104_201449+0100-owner-directive-agent-update-cc-changelog-verbatim.md (2013 lines, directive on
  line 1). Measured by the orchestrator: the paste equals the local Claude Code changelog cache for 2.1.318 through 2.1.287;
  the diff shows only the two wrapper lines at the paste's end. No bulk copy of the changelog into design/.

## Scope

- In scope: the link graph rooted at agents/mods-expert-developer-agent.md: the main md, the reference files it links, and
  the skills it links (the owner's words: "both the main md file and the reference files and skills linked").
- Out of scope, candidate follow-up: agents/mods-forge-agent.md, which the owner does not name.

## Plan

1. Step 1 deliverable: the enumerated link list (file, what it links, which mod surface it describes), recorded on this card.
2. Filter the changelog to mods-relevant items (mod API, hooks module, `$.*`, panes and bands, plugin CLI validate, test,
   eval, install and marketplace, plugin options, hot reload) with quicksilver or llm-ext, then read the hits. Record the
   kept list and the dropped count; spot-check 10 dropped items.
3. For each kept item, find where the docs describe that surface and record match, stale or missing, with file:line.
4. Cross-check against the engine's generated types file on the installed 2.1.318.
5. Fix each stale or missing item, or defer it with a reason in a follow-up card; each deferral needs an orchestrator or owner
   approval line.
6. If the host has updated past 2.1.318 when this card is worked, record the version and put the extra range in a follow-up card.

The method is item-driven, not version-driven: a version mention is not evidence of coverage (the agents and skills already
name versions up to 2.1.317).

## Acceptance checklist

- [ ] The step-1 link list exists on this card (file, what it links, which mod surface it describes).
- [ ] The kept item list and the dropped count are recorded.
- [ ] 10 dropped items are spot-checked and the result is recorded.
- [ ] Every mods-relevant changelog item has a match, stale or missing record, with the doc file:line (for a missing item, the file and section where it belongs).
- [ ] Every stale or missing item is fixed, or deferred with a reason.
- [ ] Each deferral is listed in a follow-up card, never as prose only, and carries an orchestrator or owner approval line.
- [ ] Every changed claim about runtime behavior is cited to a changelog line or probe-verified on the installed 2.1.318.
- [ ] The generated-types cross-check is recorded.
- [ ] The host version is recorded; if it is past 2.1.318, the extra range is in a follow-up card.
- [ ] pytest, cspell and markdownlint are clean on the touched files.

## Related

TRDD-HAK91K6S (the blocker: the M6 swap and the merge-back), TRDD-RZBQIM54 (the pre-publish behavior audit derived from the
same changelog), TRDD-4Z36WCEV and TRDD-MPJTMO51 (other work on the agent file).

## Approval log

- 2026-11-04T20:27:18+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
