---
trdd-id: 04ZJ9E90
title: Break the installed mods into catalogued component example skills
column: design
status: tasked
created: 2026-10-27T13:15:16+0100
updated: 2026-10-27T13:15:16+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-10-27T13:15:16+0100
---

# Break the installed mods into catalogued component example skills

## STATE
CURRENT STATE 2026-10-27: design; nothing built. NEXT ACTION: read-only component inventory of the seven installed mods (reports under reports_dev/mod-examples/), then fix the taxonomy, then one worker per component skill.

## User directive
"ok. i want you to copy all those mods into the plugin, incorporating them as templates and examples to learn and reproduce. you can break down them into the single components, putting the knowledge and the source as examples into different modular skills that the agent can call when it needs to build some similar components. make sure to classify and catalogue all the components that you break down those mods into, so the agent will discover the right component when reading the catalogue descriptions of them, and only loading the corresponding reference file when it needs it, as the progressive skills discovery system work."

"those mods" = the seven installed mods listed on 2026-10-27: tokensaver@claude-tokensaver 0.3.0, token-weather-usage@augiefra-mods 3.17.15, token-optimizer@alexgreensh-token-optimizer 5.13.58, deck@deck 0.4.12, context-harness@context-harness 0.0.1, regia@mod-claude 0.3.3, ponytail@ponytail 5.3.2.

## Licence decisions
- MIT with a LICENSE file: context-harness (ysys143), deck (nvr0x5), ponytail (DietrichGebert), tokensaver (Gregory Albert). Source may be copied; NOTICE carries the copyright line and the MIT text.
- regia: MIT declared only in its manifest, with no LICENSE file; author "Samuel". Copy is allowed under MIT; NOTICE names the author from the manifest and says the holder is taken from the manifest.
- token-weather-usage: Apache-2.0 per its README (author Eric Cologni; upstream LICENSE and NOTICE at augiefra/claude-mods). Copy is allowed with the Apache-2.0 text, its upstream NOTICE reproduced, and a statement of changes. Its README says parts adapt code from MIT projects (agentpane by Anji Xu); credit those too.
- token-optimizer: PolyForm Noncommercial 1.0.0. This plugin is MIT, so NO source is copied: knowledge only, in our own words, with the scripts_dev/nocopy_diff.py no-copy proof.

## Design
- Split by COMPONENT TYPE, not by mod (for example band, pane, tool registration, command, store and state, call intercept, toast, clock and timer, process run). Each component skill gathers that component from every mod that has one.
- Each skill is skills/mods-example-<component>/:
  - SKILL.md: short, says when to load which reference;
  - references/<component>.md: knowledge in our words, per-source notes;
  - examples/<mod>/<file> with the copied source, one representative file per component per mod, plus version and source path.
  This follows the existing examples/ folders of the tutorial skills.
- One discovery-oriented catalogue entry per component in skills/mods-the-skills-menu/references/skills-catalog.md, plus a menu group.
- A new "example skills" category in BOTH tests/test_plugin_structure.py and tests/test_skills_menu.py, committed before the skill files. Each skill needs agents/openai.yaml and a README Components row.

## Checks per commit
- Grep copied files for machine paths.
- CPV security pass on the copied source.
- tsc must not pick up examples (check how the existing tutorial examples are excluded).
- List every .cspell.json word added.
- Clean-clone gate: pytest, CPV v5.22.3 strict, CPV v5.23.0 diff against the baseline.

## Sequence
After the pending release (mod-manager manifest-hooks fix, gate, publish).

## Approval log

- 2026-10-27T13:15:16+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
