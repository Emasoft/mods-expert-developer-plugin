---
trdd-id: INFES3JE
title: Merge the three mods' UI into one panel with one best indicator per data type and an animation switch
column: design
status: tasked
created: 2026-11-10T05:34:58+0100
updated: 2026-11-10T07:33:30+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-10T05:34:58+0100
---

# Merge the three mods' UI into one panel with one best indicator per data type and an animation switch

Owner directive 2026-11-10: 'merge and deduplicate their ui so that only the best ui indicators for each data type of the 3 are kept and showed in the panel, with option to disable pets animations'.

MEASURED (reports_dev/recon/20261110-042501-three-mod-ui.md, 47 surfaces: Deck 22, Tokensaver 13, upstream 13):

A. ONE PANEL, NOT THREE BANDS. All three register an above-prompt band today: Deck's deckView, Tokensaver's AbovePrompt, and upstream's band. Three stacked bands is a real layout risk. Decision: ONE band plus ONE pane, '/mods-panel', drawing a fixed row set; the existing per-mod panes stay reachable for their own commands and settings, but the default surface is this one.

B. OWNERSHIP PER DATA TYPE (the deduplicated set):
1. Token usage per session -> Tokensaver's per-tier live count (in memory, no subprocess). Upstream's 30-day figure is a command, not a band.
2. Context fill percent -> Tokensaver's meter, ADOPTING upstream's compact-ceiling divisor (upstream is the only one that divides by the auto-compact window; the model window overstates headroom). Deck's context row is then removed.
3. Money -> Deck's day/month spend, off by default, on for pay-per-use keys.
4. Model in use / route -> Deck's route row (asked-for vs ran). Upstream's plain model name goes to the status line's segment when no router is installed.
5. Compaction events -> Tokensaver's count + tokens freed.
6. Per-tool accounting -> Deck's activity row for 'now', plus upstream's cumulative N tools (two indicators justified: transient vs cumulative).
7. Cache warmth -> upstream's model (warm / about to drop / cold / refreshing / warming, seconds left, tokens at stake). The only mod that measures it; Tokensaver's cold flag is subsumed.
8. Project folder -> Deck's expanded header. Not on the status line.
9. Git branch -> upstream's detail row (opt-in by unfolding, so no subprocess until asked).
10. Plans / todos / tasks / needs-you -> Deck (the only parser).
11. Background agents -> Deck's strips for the roster, Tokensaver's Agent-row badge for which model the helper got.
12. Switches -> the one shared registry and pane. Nothing per-mod.
13. Clock -> keep; weather -> removed (a network call, a geocoder and a person-only switch for one word).
14. Quality and effort grades -> from TRDD-5188AMFQ, one badge, not upstream's five marks.

C. ANIMATION SWITCH (owner asked for an option to disable pets animations). There is no pet in the integration (Deck's raster mascot was removed under owner directive 2; Tokensaver has no figure; upstream's Clawd is vector SVG and is NOT being brought over). The cost that remains is the frame-driven animation, measured:
- hooks/deck/register.js:1901-1903 invalidates ui.render every 300 ms while a row animates; each repaint does deckLive + isOn(BAND|PANEL) + readPrefs = 14 store reads, each with a SHA-256 signature check (switches/logic.ts:106) ~= 47 reads/s and 47 digests/s.
- the fold timer at 1857/984 runs at 33 ms and also calls readPrefs: ~360 reads/s for the 0.5-1 s of an expand.
- styles-terminal.js animates on frame % 2 / frame % 4 / hash(seed,x,frame>>1).
Decision: add 'panel.animation' (default off: still HUD) and 'panel.reduced-motion' honoured from the existing tokensaver reduced-motion switch; when animation is off the tick must not invalidate on frame parity, the fold must not repaint per row, and the terminal bar renders its static glyph. The same commit records the measured cost before/after in the card.

D. WHY THIS IS SAFE. Every row this removes is a duplicate read of the same datum, so no information is lost; every removal is behind a switch that can bring the old surface back for one release, then the code is deleted (no legacy path, per the house rule).

E. TOKENS. Each writer keeps reading its own switches at the moment of use (rule B4); the panel reads one composed view, so the number of store reads per repaint must not grow with the number of rows.

## Approval log

- 2026-11-10T05:34:58+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## STATE

CURRENT STATE 2026-11-10: sections A-E written (the one-panel decision, the 14-entry ownership table, the animation switch, why it is safe, the token rule). NOT STARTED in code. WORKED BY mods-expert-developer-agent (session e7bc3f40-36b7-420f-b6dc-d673f6ec5deb); the owner fields stay main-agent@emasoft-mods-expert-developer because trddgrep refuses identities outside its grammar and this agent is not in the agent registry. NEXT ACTION: increment 1, the animation switch — deck.animation (default off), deck.nudge and deck.detect in hooks/deck/switches.ts, the tick's invalidate gated on it, the 33 ms fold skipped when off, terminalBar rendered still, honouring tokensaver.reduced-motion — with tests and a mutation check.
