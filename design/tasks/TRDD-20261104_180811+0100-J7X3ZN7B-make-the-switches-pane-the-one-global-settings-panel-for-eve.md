---
trdd-id: J7X3ZN7B
title: Make the switches pane the one global settings panel for every integrated mod
column: design
status: tasked
created: 2026-11-04T18:08:11+0100
updated: 2026-11-04T21:57:42+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-04T18:08:11+0100
npt: []
relevant-rules: [3.1, 7.1, 9.2, 13.1]
---

# Make the switches pane the one global settings panel for every integrated mod

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-04

Column design, no implementation. Minted by the tenth mods expert (DT) on the owner request below. The switch registry, the
typed agent tool and the /mods-switches pane are built by M4c under TRDD-5IK59SQ2: on release main as 150a6f6 and its review
round 0ec4570 (2026-11-04), that card still open (column todo) and its API may still change. This card does not build a
second panel. It owns what turns that pane into the one global settings panel the owner asked for, and only what
TRDD-5IK59SQ2 does not already deliver. No file set gets two writers (REVIEW rounds 1 and 2, 2026-11-04): while
TRDD-5IK59SQ2 is open, no edit of hooks/switches/ is made under this card, and while TRDD-GSR975M8 is open, the link from the
Mods pane (hooks/mod-manager/) is made through that card's owner; otherwise the edit waits for the owning card to close.
Publishing is out of scope for this card (PRRD G7.1 release hold; the orchestrator owns publish and install). NEXT ACTION:
when TRDD-5IK59SQ2 closes, read its pane and tool, tick here whatever it already meets (citing its commit), and plan the rest.

## Owner directive (verbatim, 2026-11-04, typos kept; the text is cut in the source)

> "you should integrate the Deck plugin mod and the Tokensaver plugin mod into this plugin. so the user only need to install the mods-expert-deeloper plugin and it has automatically the 2 other mods installed as well. of course both must have a on/off switch as a skill and as buttons on the general configuration panel of the mods-expert-developer plugin. and since we are on this, create a TRDDs to make a global setting panel that includes all the on/off switches of all mods integrated into the plugin. so the user has a unique panel to see the configuration of t   proceedlycomplete the integration asap and publidh and install the plugish and install the plugin. proceed autonomously now. decide by yourself. just base all your decisions on verified facts and tests. do not assume anything. ask the advisor."

<!-- cspell:ignore deeloper proceedlycomplete publidh plugish toggleable -->

## Overlap check (2026-11-04, read in full before minting)

- TRDD-5IK59SQ2 (todo, M4c): one registry of function switches under hooks/switches/, a signed store envelope, the /mods-switches
  pane, the typed tool switches (status, on, off), one validation for both writers. Orchestrator addendum on that card: the
  registry is open, so present and future integrated mods register "without a change to the switch code". That is the base of
  this card: the global panel IS that pane, enumerating that registry.
- TRDD-UYD6T358 (todo): the dev-tools activation switch and its default-on flip; it is one entry of the registry, shown here.
- TRDD-GSR975M8 (dev): the mod-manager "Mods" pane (hooks/mod-manager/pane.ts:127 open, :139 render) enables and disables
  installed plugins and keeps profiles; it is about plugins, not integrated-mod functions. It stays a separate pane; this card
  adds at most a link between the two.
- Other panes on release main: self-command "Slash commands" (hooks/self-command/pane.ts:123, :127), the requirements-drafts
  picker (hooks/requirements-drafts/register.ts:340, :344). Neither shows switches.
- RWD5PW76 (todo): each mod debug-log switch is a registry entry; it shows here like any other.

## Scope (only what TRDD-5IK59SQ2 does not deliver)

- One panel: every integrated mod (requirements-drafts, self-command, probe-runner, mod-manager, dev tools, Deck, Tokensaver
  and any later one) grouped under its own heading, master switch first, then its function switches, then its debug-log switch;
  built from the registry only, so a new mod appears by registering (a test proves no mod is hard-coded in the pane).
- Readiness beside each switch (PRRD G3.1): on, off, inert because a standalone copy is enabled (Deck, Tokensaver), or
  waiting for the next session (a tool switched on registers at the next session).
  The inert state is the pause notice of the double-running guard of TRDD-RD1ISPMN and TRDD-71KVH9PA, drawn by the
  per-mod notice line of TRDD-AXE8CUWR (note 2026-11-04).
- One entry point: a skill that opens the panel and explains each switch, listed in the skills menu and in
  tests/test_skills_menu.py (PRRD G9.2 "discoverable in the skills menu"), the existing per-mod commands kept as shortcuts
  writing the same state, and a link from the Mods pane.
- Settings that are values, not switches (Deck bar style, size, city; Tokensaver trim level, line cap, auto-compact
  percentage, cache lifetime): shown and set in the same panel and the same typed tool, with one validation (PRRD G9.2
  "configurable and toggleable at runtime ... equivalent nonvisual typed agent tools sharing one state and validation"), if
  the registry does not cover values already.
- (Orchestrator, 2026-11-04.) The readiness or pause column reads each mod's notice getter (TRDD-AXE8CUWR), the single source, and never words the state itself.

## Acceptance checklist

- [ ] The /mods-switches pane lists every registered mod, grouped, from the registry alone: a kit test registers a fake
  extra mod and finds it under its own heading with no pane change.
- [ ] Each row shows its readiness truthfully (PRRD G3.1): a kit test renders on, off, inert because of a standalone copy,
  and waiting for the next session.
- [ ] The person (pane, skill, shortcut commands) and the agent (typed tool) read and write the same state: a kit test writes
  through the tool and reads through the pane model, and an invalid value is refused by both writers with the same reason.
- [ ] Value settings of integrated mods are set in the same panel and typed tool: a kit test sets one value of Deck and one
  of Tokensaver through the tool and reads each in the pane model.
- [ ] No second competing panel: a kit test lists every pane this plugin registers and finds exactly one that draws switch
  rows; the Mods pane links to it (a kit test follows the link).
- [ ] The panel skill is in the skills menu: a test fails when it is not declared in the agent's skills menu
  (tests/test_skills_menu.py: its DOC_SKILLS list leaves out some skill categories, :251-254, so the test is extended
  when the new skill falls in one of them).
- [ ] Every new guard is mutation-checked (break the line, the named test goes red); all repo checks clean.

## Related

Prerequisite TRDD-5IK59SQ2 (an independent card, so not an npt). The per-mod notice line is TRDD-AXE8CUWR. The Deck (TRDD-RD1ISPMN) and Tokensaver (TRDD-71KVH9PA) cards minted with this one register their functions into the same registry.

## Approval log

- 2026-11-04T18:08:11+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
