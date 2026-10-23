---
trdd-id: F4HVS06F
title: Per-component UI skill family mods-ui harvested from seven community mods
column: proposal
status: proposed
created: 2026-10-23T03:10:40+0200
updated: 2026-10-23T03:10:40+0200
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: user
approved: false
---

# Per-component UI skill family mods-ui harvested from seven community mods

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-10-23

- PHASE: proposal, awaiting USER approval. Nothing is built. The plan is `design/specs/specs/mods-ui-catalogue.md`; this card's "Decisions" section overrides the catalogue where they differ.
- NEXT ACTION: the USER answers the questions under "Decisions for the USER"; on approval, move to `planned` and mint increment 0 (below) as its own TRDD.
- Evidence (not tracked, machine-local): seven expert evaluations in `reports/mods-ui-harvest/01..07-*-eval.md`. The catalogue cites their row codes (deck E1, ow B8, ...). To rebuild them elsewhere, re-clone the sources at the SHAs below and re-run the evaluation brief.
- Supersedes USER-scope card TRDD-5P3OAPO6 (a monolithic library design the user rejected on 2026-10-23).

## Request (USER, verbatim, 2026-10-23)

> the following mods uses some nice indicators for all data, with many different styles, and different value types to display, with or without animations. I want you to harvest those two mods projects and extract those ui elements as independent modules that can be reused by the developer in any mod he decides to build. think of them as a palette of ui elements that must be just referenced in the code as modular components imported and working out of the box. wrap them in a uniform standard interface so they will be all instanced and used in the code with the same parameters, and swapped without loosing positions or alignment. make it a library of components with many styles variations
>
> nono, no separate project or monolitic library. each component (or generator of components, if truly generic) must be a single skill, or a sub reference file with included code to import. atomically. each one separated, described, tested, as individual components that the plugin presents as knowledge and template (and eventually code) to the user. but in the end the agent is the one that will use the skills of those ui components to create mods according to the user request. so they must be composable and didascalic.
>
> are you using this plugin expert agent to spawn the subagents? it must understand mods to understand what of those project is good and what is not worthy of being harvested.

<!-- cspell:ignore nono monolitic didascalic -->

## Sources (all read as untrusted data; nothing run)

| repo | SHA | licence |
|---|---|---|
| nvr0x5/claude-deck | 1ecf6deb9199d3b1fa570bf08a57e69772bbb5af | MIT (parts derived from zycck: both notices) |
| augiefra/claude-mods | 797ec6a14cec30b0dceafb2aa910e1add8a3393e | Apache-2.0; NOTICE chain: Eric Cologni; Token Weather adapted from Anthropic PBC (Apache-2.0); agentpane by Anji Xu (MIT) |
| zycck/claude-mods | b77335ee560c609d67ae85c7321f886719361426 | MIT, Kirill Serditov (icons probably Lucide, ISC: verify) |
| OneWave-AI/claude-code-mods | e6da26ca36a88eec3be25605d30fa20f2c1c0cec | MIT (5x7 font: no stated origin) |
| aycandv/claude-usage-meter | 52b1130bddedc9cc9127e370a2f970429254647e | MIT, Aycan Deniz Vit |
| Regia (purpleheads2026/Mod_claude) | f30974ef0d0b985931af5865529e0809143b4ff2 | MIT, "Samuel" (LICENSE line) |
| BatuhanCakmakk/wavy-usage | c5e6937dd7996b8b5d7c597f220bf7caf8f265dc | MIT, Batuhan Çakmak |

Each was judged element by element by `mods-expert-developer-agent` against the mods chapters (HARVEST / HARVEST-WITH-FIX / SKIP, every verdict cited), then merged into the catalogue under two adversarial cross-report reviews.

## Plan in one paragraph

A family of `mods-ui-*` skills. Every component takes the same props (`kind`, `value`, `box`, `surface`, `variant`, `tone`, `palette`, `nowMs`, `motion`, `id`, `label`, `ascii`) and returns exactly the box it was given on four surfaces (Desktop Svg, terminal Raster, Box/Text tree, plain line), so two components that accept the same value kind swap without moving anything. Components are pure TypeScript with tests; a mod COPIES them in (with their foundation files and licence notices) through a quickstart script, because a plugin module can import only relative paths and `claude-code` — "import" in the request means "copy in, then import relatively". The agent composes them by following the `mods-ui-compose` skill.

## Decisions (override the catalogue)

1. **Foundation = ONE skill `mods-ui-core`** holding the 13 helpers as sub-reference files (`references/contract.ts`, `escape.ts`, `text.ts`, `format.ts`, `color.ts`, `tokens.ts`, `scale.ts`, `motion.ts`, `svg.ts`, `cells.ts`, `pixels.ts`, `host-snippet.md`, `testkit.ts`, `svg-validate.ts`), each with its own test file. Reason: they are helpers, not components; the request allows "a sub reference file with included code" and allows a separate skill only for "a generator of components, if truly generic". Catalogue A1/B counts (13 skills) are superseded.
2. Components: 30 as listed in catalogue C, subject to the merge question below.
3. Teaching skills: the 8 in catalogue D.
4. Prefix `mods-ui-`; gallery template in `mods-ui-compose/examples/ui-gallery/`.
5. Skills load on demand through the menu; none is preloaded.
6. Terminal Image: how-to note only in the first release.
7. Terminal Text uses theme keys if probe P03 confirms Text accepts them.
8. The copy script records copied-file hashes in a visible file (`hooks/ui/COPIED.json`, not a dot file) and runs `tsc --noEmit` on the mod after rewriting imports, failing loudly on any miss.
9. The evaluations stay in gitignored `reports/` (evidence derived from untrusted code); only the catalogue (the plan) is tracked.

## Delivery plan (each step its own TRDD, with derived guard / menu / NOTICE / CI TRDDs)

0. **Pipeline proof:** `mods-ui-core` with `contract.ts` + `text.ts` and their tests only; change the code-placement guard (`tests/test_plugin_structure.py:_misplaced_example_code` rejects `.ts`/`.json` under `skills/<x>/references/` today) and the 65/61/3 count guard; add the CI test step; run CPV `--strict` (pinned v5.22.3) for real — no rule rejecting `.ts` in `references/` was found in CPV 5.22.2, but that is unproven until run; check jscpd (threshold 5 scans `skills/**/*.ts`).
1. **Probes:** the 23 probes of catalogue F, on a logged-in machine, each recorded with the Claude Code version and surface. Every `[PROV]` component stays provisional until its probes are settled.
2. The rest of `mods-ui-core`.
3. Tier 1 components (bar, stacked-bar, track, ring, stat-tile, value, chip, status-lamp, sparkline, clock).
4. Tier 2, then tier 3.
5. Teaching skills and the gallery.
6. README, menu group `### UI components`, catalog, NOTICE groups, CHANGELOG, minor version through the canonical pipeline.

## Decisions for the USER

1. Approve the plan (one foundation skill + 30 components + 8 teaching skills), or change its scope.
2. **Merges:** should these pairs become one generator skill with variants? chip + chip-row; status-lamp + icon; switch + segmented + disclosure; feed + status-rows. (Recommendation: merge chip + chip-row and switch + segmented + disclosure; keep the others apart.)
3. **augiefra Apache-2.0 code:** carry it with its NOTICE chain (Eric Cologni, Anthropic PBC), or re-implement the four parts (two-value gauge, hatched capsule, hover card, weather icons) from the technique only? (Recommendation: re-implement.)
4. **OneWave 5x7 font** (no stated origin): ship, ask the author, or draw a replacement? (Recommendation: draw a replacement.)
5. **claude-deck pet** (resembles the Claude mascot): port it or ship a neutral sprite? (Recommendation: neutral sprite.)
6. **First release:** every variant, or the best one per family first? (Recommendation: one per family.)
7. **Test runner:** add a minimal `package.json` with pinned `tsx` and `typescript` dev dependencies (the repo has none today), or call them through pinned `npx` in CI? (Recommendation: `package.json`, so Dependabot can track them.)
8. **Template-only gallery:** the gallery holds no component code (a script fills it in a temporary directory) so jscpd finds no duplicates without an exclude. Acceptable?

## Approval log
