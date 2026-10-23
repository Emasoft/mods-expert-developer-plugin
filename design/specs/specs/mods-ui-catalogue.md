# Catalogue: per-component UI skills for mods-expert-developer-plugin

Merged from seven expert evaluations (machine-local evidence in `reports/mods-ui-harvest/01..07-*-eval.md`, not tracked), the plugin conventions survey (`mods-plugin-conventions.md`)
and the earlier proposal TRDD-5P3OAPO6 (its architecture is superseded; its interface ideas are kept in A8). Nothing
here has been built. The corpus was read only to settle rule 10 (claude-deck versus zycck, read by symbol name); no
corpus code was run and no corpus text was sent to an outside model.

Status words used throughout:

- `[PROV:Pnn]` = the verdict depends on undocumented host behaviour and stays PROVISIONAL until probe Pnn in section F
  settles it (review rule 3).
- `[CALC:Pnn]` = a number (contrast ratio, SVG size) that a report computed by hand or estimated; it is NOT restated
  as a fact here and is re-measured by the script named in probe Pnn.
- `UDnn` = a code from the normalised defect vocabulary in section 0.2 (review rule 2).
- `deck`, `aug`, `zy`, `ow`, `um`, `rg`, `wv` = the seven source repos (full names and SHAs in section G).
  A variant is cited as `repo:file:symbol`, never by a report's verdict count (review rule 1).

Counts (taken from the tables below): 13 foundation skills, 30 component skills (10 tier 1, 14 tier 2, 6 tier 3),
8 didactic skills. 51 new skills in total.

## Table of contents

- [0. Cross-report tables](#0-cross-report-tables)
- [A. Skill family design](#a-skill-family-design)
- [B. Foundation skills](#b-foundation-skills)
- [C. Component skills](#c-component-skills)
- [D. Didactic skills and reference files](#d-didactic-skills-and-reference-files)
- [E. Anti-patterns the skills must teach NOT to do](#e-anti-patterns-the-skills-must-teach-not-to-do)
- [F. Probe checklist](#f-probe-checklist)
- [G. Licence map](#g-licence-map)
- [H. Plugin integration work](#h-plugin-integration-work)
- [I. Open questions for the user](#i-open-questions-for-the-user)

## 0. Cross-report tables

### 0.1 Element matrix (review rule 1: choose by element, not by verdict counts)

The seven reports split rows at different granularity (deck 56 rows, ow 62, aug 27, zy 40, um 32, rg 37, wv 43), so
their HARVEST counts are not comparable. This matrix lists, per element kind, which report rows describe it. A dash
means the repo has no such element. The chosen component skill is in the last column.

| element kind | deck (01) | aug (02) | zy (03) | ow (04) | um (05) | rg (06) | wv (07) | skill |
|---|---|---|---|---|---|---|---|---|
| linear ratio bar, terminal | E1-E7 | E1 | V8, V13 | B2, F3, P5, R1 | E2 | E18 | - | `mods-ui-bar` |
| linear ratio bar, Desktop | E9-E13 | - | (V1 is a track) | - | - | E3c | E7 | `mods-ui-bar` |
| two-value / pace / composition bar | - | E1, E2 | - | - | - | E3b | E9, (E8 idea) | `mods-ui-stacked-bar` |
| staged progress track with knob | E5 pill delta, E8 | - | V1-V5, V8, V13 | - | - | - | - | `mods-ui-track` |
| ring / arc | E20 | - | - | - | E1 | E1c, E1d | E1-E5 | `mods-ui-ring` |
| quarter-circle glyph gauge | E20 (terminal) | - | - | - | - | - | E18 | `mods-ui-ring` (terminal form) |
| sparkline / series | E6, E13 | E7, E8 | - | B5 | E6 | - | - | `mods-ui-sparkline` |
| event / history strip | E19 | - | - | - | - | E4a | - | `mods-ui-event-strip` |
| stat tile | - | (E3 recipe) | - | S3 | - | E3a | E4, E5 | `mods-ui-stat-tile` |
| fixed-width value text | H15 | E9, H1-H5 | V12, V19 | B3, B9 | H5 | E16 | H8, H9 | `mods-ui-value` (+ `mods-ui-core-format`) |
| chip / pill / badge | E21 | E11 | (V3 knob) | S6, S14, P6, R3 | - | E6 | - | `mods-ui-chip` |
| packed chip row / enum chips | E17, E21, H20 | - | - | - | - | E7 | - | `mods-ui-chip-row` |
| state lamp / glyph / node | H1 | E5 | V14 | S5 | - | E5, E19 | - | `mods-ui-status-lamp` |
| icon set | (ICON_PATH) | E6, E13 | V14, BOT | - | - | - | - | `mods-ui-icon` |
| clock / stopwatch / countdown | E26 clock, H15 | H2, H3 | V6, V7 | B4, T5 | - | E1d, E16 | H7, H10 | `mods-ui-clock` |
| spinner | (E5 shimmer) | - | - | N1 | - | - | - | `mods-ui-spinner` |
| ticker / marquee / typewriter | - | - | - | T1 | E3, E4, E5 | - | - | `mods-ui-ticker` |
| ordinal level meter | E18 | - | - | - | - | - | E15, E16 | `mods-ui-level-meter` |
| ranked share rows | - | - | - | R2 | E7, E8 | E9 | E12 | `mods-ui-ranked-bars` |
| status rows / agent strips / cards | E14, E15 | - | V9, V10, V11 | N2, S13 | - | E4 | - | `mods-ui-status-rows` |
| event feed / recent list | - | - | - | S15, S16 | - | E10 | - | `mods-ui-feed` |
| legend | - | - | - | - | - | E2 | E21 | `mods-ui-legend` |
| switch | - | - | V16 | - | - | - | - | `mods-ui-switch` |
| segmented control / tabs | E30 picker | - | V17 | - | E16 | - | E13 | `mods-ui-segmented` |
| disclosure / fold / close | E27, E28 | - | V15, V11 | - | - | - | - | `mods-ui-disclosure` |
| hover card / tooltip | - | E12 | V5, V7 | - | (E5 title) | (A10) | E10 | `mods-ui-hover-card` |
| big text | - | - | - | G1 | (E3 font) | - | - | `mods-ui-big-text` |
| timeline / Gantt | - | - | - | S11, S12 | - | E8 | - | `mods-ui-timeline` |
| tree with connectors | - | - | - | S7, S10, S13, S19 | - | - | - | `mods-ui-tree` |
| rotating history ring / orbit | - | - | - | - | - | E1a, E1b | - | `mods-ui-radar-ring` |
| animated ambient Raster band | (E5 flicker) | - | - | B1, L1, W1 | - | - | (E16 wind) | `mods-ui-ambient-band` |
| sprite lane (pet) | E24, E25, H23, H24 | - | - | P1, P3, F2 | - | - | - | `mods-ui-sprite-lane` |
| band / pane composition | E26, E29, E31 | E11 layout, H8, H11 | V19 site, V22 | B8 (anti), S1 | E11-E14 | E20, §1 | E17, E23 | `mods-ui-compose` (didactic) |
| section header / divider | - | E16 | V18 | S4 | - | E12, E13 | - | `mods-ui-compose` recipe |
| SVG validator / gallery harness | E32 idea | - | (tests/engine, not reusable) | - | H11-H14 | T10 | - | `mods-ui-core-svg-validate`, gallery |

### 0.2 Normalised defect vocabulary (review rule 2)

Every component row in section C cites these codes instead of re-explaining a defect. The crosswalk column maps each
code back to every report's own D-code or cross-cutting item, so nothing a report found is lost.

| code | defect | crosswalk (report: item) |
|---|---|---|
| UD01 | Cell width not measured: strings cut or counted by UTF-16 unit or code point; ambiguous-width glyphs break an exact terminal footprint | deck D1 (H7, H11, H17, E1-E7, E20); aug E5.3, H7, H8.2; zy H2 (width table pinned to one Bun build, no generator), H4; ow S13, R1, N1, P1, T1, T3, E12/E21 note; um E2.4, H6; rg E15; wv E18, E19, E21 |
| UD02 | Grapheme cut: truncation splits a surrogate pair, ZWJ sequence or combining mark | deck H7; aug H7; ow T1, P1 (`charCodeAt`); rg E15; um H6 |
| UD03 | Dark-only palette: no light twin, near-white text, forced dark slabs, `color-scheme` declared but no light rule | deck D10, H3, H4; aug H10, E6.1, E8.2; zy V5 tips; ow D6; um E1.2-3, E2.2, E3.2, E5, E9; rg F-THEME, tokens defect 3; wv sec. 1.3, H2 |
| UD04 | Off-palette colour: hex where a terminal theme key belongs, or a colour outside the tone palette | deck D3, D10; aug E1.2, E5.2; ow D6; rg A5; um E8.3 |
| UD05 | Contrast below WCAG (text under 4.5:1, graphics under 3:1), or measured before Raster rounding | aug E1.2, E2.5, E6.1, E8.2, E13; zy claim 3 (thin margins); rg tokens defects 4-5, E4; wv sec. 1.3; deck D10 (#9a9893 unaudited). All `[CALC:P22]` |
| UD06 | Colour-only encoding: a state told apart only by colour | aug E1.1; deck E19; rg E3a dot, E4a, E6 (failed vs killed), E1a; ow S5 (needs text twin) |
| UD07 | Un-namespaced SVG ids, classes or keyframes; collide when documents share a DOM or are composed | deck D8, H13, H14; aug E2.1; zy V1(d), V6(c); ow S2, anti-pattern 12; um E4.1, E6.1, E7; rg F-IDS; wv E1(b), E9(c) |
| UD08 | Svg size unguarded against 131,072 characters (and the open 100,000-character tree-text question) | deck D9, E14; zy section 4 (100k question); ow S1; um E4.2, C2.4; rg F-SIZE, A8; wv E15(c). Sizes `[CALC:P23]` |
| UD09 | Content-derived footprint: width or height follows content instead of the caller's box | deck D11, E9-E13, E21; aug E7.1, E8.1, E9, E11, H8; zy V3, V9 row count; ow D9, S6, S7, G1; um E5, E7, E8; rg F-HEIGHT, A8; wv E4, E5, E12, E17 |
| UD10 | Pixels-per-column guess used as fact (`bodyColumns` x 8 / 7.5 / 7.25 / 7) | deck D11, E31; zy V1(c); um C2.1; rg section 1; wv A6 |
| UD11 | `maxRows` / `scroll.bodyRows` ignored, or height taken from `e.viewport` (the window) | aug E11.3, H8.3, H11.2; ow D9, N2, S13; wv A9, E23 |
| UD12 | Reduced motion missing: SMIL not gated, no still form, no motion option on Raster, or the reduced-motion list not single-sourced | deck D6, E10, E11, E13; ow D7, S2, S9; um E3.5; rg section 4 fix 4; wv sec. 1.2, A10, E1(c), E15(b), E16(a) |
| UD13 | Flashing at about 3 Hz or more, or full-band saturated red flashing | ow D8 (boss 6.7 Hz, pet 4 Hz, hazard 2.5 Hz, banner 3 Hz) |
| UD14 | Animation restarts or replays on redraw: no clock-derived phase, glide replay, stale `now`, phase summed instead of derived, negative modulo | deck D5, E10; ow S2 (entry animations replay); rg section 4 fixes 2-3; um H10 (the fix); zy H8, H9 (the fix); wv H5 (the fix) |
| UD15 | Wall clock (`Date.now()`, `new Date()`, `performance.now()`) instead of `$.clock.now()` | deck D7, H15, H18, H23, E26, E28; zy V19; ow D11; um C2.3 |
| UD16 | Module-level or render-time mutable state shared across sites or instances | deck D4, E28; zy section 4 (globals list); ow D3; wv H5 (module Map); aug section 4.10 |
| UD17 | Timers in `ui.render` or callbacks, redraws over the documented budget, perpetual work, no frame caching | deck E28, D14, E25; ow D3, D4, D14; um C2.8; wv E15(e); zy V5 (frames rebuilt) |
| UD18 | Swallowed errors (`catch {}`, `.catch(() => undefined)`), errors logged once then hidden, unguarded `$.command.register` | deck anti-pattern 4; aug section 4.2; zy section 4 (10 gating hooks without `.catch`); ow D12; um C2.2; rg A1; wv A4, A5 |
| UD19 | Undocumented prop, event field or host behaviour used as fact | deck D13; aug section 4.4, 4.6, 4.7, H6, E12.1; zy claim 4, section 4; ow D13; um C1; rg A3, A4, A6, A7; wv A3, sec. 1.1 |
| UD20 | Band tree without `await next(e)`, or suppressing another mod's output | ow B8; um C2.7; deck anti-pattern 8; wv E23 (correct, the model) |
| UD21 | Cross-session overwrite in `$.store` or `$.fs` (whole-object writes, non-atomic files) | deck D12; aug section 4.8; ow R4 |
| UD22 | `$.ui.blit` misuse: no `columns`/`rows`, `deny` read as unmount, no back-off | ow D1, D2; zy H13 (deny shape inferred); um C1 (blit `.deny`) |
| UD23 | Raster palette rounding ignored (smooth gradients band, contrast measured on unrounded colour) | ow D5; um E2.3, E3.3, E10; aug E1.4 note; zy H3 (the fix) |
| UD24 | Zero, tiny and missing values misdrawn: zero shows a lit cell, minimum nub overstates, 0% round cap paints a dot, "no data" equals 0% | ow B1, B2 (a test enshrines it); rg E3c, E9; wv E1(f), E7(a,b); deck E20, E7; um E2.5 |
| UD25 | Formatter bugs: "1000k" rollover, "21th" ordinal, `n === 1` plurals, hard-coded units or tr/ru/it defaults, USD-only money | deck H15; aug H1, H2, H4; ow R5; rg E16, E25; wv H7, H8, H10, A8 |
| UD26 | Accessibility: blank or thin `alt`, hover-only information, unnamed controls, glyph-only labels | deck E25, E27; aug E2.2, E8.3, E12.2; zy V15, V16, claim 4; ow G5; um E1.4; wv E10 |
| UD27 | Incomplete escaping: C0 controls, U+FFFE/U+FFFF, dangling surrogates, quotes in attributes, unescaped caption | deck H8; rg E14, E3a; wv H20; zy H5 (the fix) |
| UD28 | Domain coupling: a generic generator imports a mod's model or hard-codes its thresholds and labels | zy (structural, every V row); um E1.1, E2.1; wv E1(e), E9(a); rg E3a, E3b; deck E17, E18 |
| UD29 | Duplicated helpers drifting apart | ow anti-pattern 14 (5x `toBase64`, 2x `pixels.ts`, 4x bar, 2x `revealed`); rg E2, E17, tokens defect 2; wv H3, H20; deck H15 (two `elapsed`) |
| UD30 | Tests that do not test the drawing, enshrine a bug, or use a home-made engine | deck anti-pattern 10; ow anti-pattern 16; zy section 4 (fake engine); um D4, D5 |
| UD31 | Out-of-scope behaviour in a UI mod: gating tool calls or turns, self-updater, private endpoint, shelling out for data the API exposes | zy section 4, H16; wv A1, A2; um C2.9 |

### 0.3 Value kinds

The proposal's seven kinds, extended where the evaluations found elements it did not cover. Each component declares
the kinds it accepts and rejects every other kind with an error (A8).

| kind | shape | examples |
|---|---|---|
| `ratio` | `{ value: 0..1, expected?: 0..1, projected?: 0..1, marks?: [{ at, major }] }` | context used, quota with pace notch and forecast ghost |
| `parts` | `[{ value, kind: 'solid' \| 'hatch' \| 'muted', tone, label }]`, plus `scale` | stacked used / free / reserved |
| `count` | `number` (integer), optional `total` | steps done, tool calls |
| `duration` | `{ ms }` or `{ since: epochMs }` | elapsed, countdown, reset-in |
| `rate` | `{ value, unit }` | tokens per second, cost per hour |
| `delta` | `{ prev, cur }` | trend word |
| `enum` | `{ state, label, glyph? }` (never colour alone) | running / waiting / failed / done |
| `level` | `{ index, of }` (ordinal) | effort, signal strength |
| `boolean` | `boolean` plus `label` | switch |
| `text` | `string` | ticker, caption |
| `series` | `number[]` (non-negative unless declared) | per-turn usage |
| `intervals` | `[{ lane, t0, t1?, tone, isError }]` | Gantt, timeline, radar history |
| `list` | `[{ id, label, kind?, value?, state?, depth?, parentId? }]` | agent rows, feed, ranked items |

## A. Skill family design

### A1. Family, prefix and naming

| part | prefix | count | purpose |
|---|---|---|---|
| foundation | `mods-ui-core-<name>` | 13 | generic generators and helpers that every component imports; code lives here once |
| component | `mods-ui-<component>` | 30 | one UI component (or one generic generator of a family of variants) per skill |
| didactic | `mods-ui-compose`, `mods-ui-howto-<topic>` | 8 | how to compose, animate, test and make accessible; the gallery template lives in `mods-ui-compose` |

- Recommended prefix: `mods-ui-`. It is new, so the hard-coded guards change (H1). The alternative, reusing
  `mods-tutorial-`, is in I1; it inherits the verbatim tutorial notice and still breaks the 65/61/3 counts.
- Names follow the existing rules: kebab-case, `name` equals the directory, no "claude" or "anthropic"
  (`tests/test_plugin_structure.py:75,143-148`).

### A2. SKILL.md shape (fits the survey, section 1)

- Frontmatter: `name`, quoted one-line `description` (126-309 characters like the existing skills; it names the value
  kinds and surfaces so routing can match), `user-invocable: false`, `metadata: coordination: exempt`. No new
  frontmatter fields: the survey found no evidence that CPV accepts any, so dependencies are NOT declared there (A5).
- Body, in the CPV order the tests expect: H1 in capitals (`# MODS UI BAR`), one reference-only sentence ("Copy this
  component into your mod with the copy script; never load it from the plugin cache"), then `## Overview`,
  `## Prerequisites`, `## Instructions`, `## Output`, `## Error Handling`, `## Examples`, `## Resources`.
- Budget: under 500 lines (CPV MAJOR, `test_skills_menu.py:979`); target under 250. The contract table (value kinds,
  variants, sizes, surfaces, motion, drop order) goes in Overview; the variant gallery and source notes go in
  `references/`.
- Every skill ships `agents/openai.yaml` with `policy: allow_implicit_invocation: true`
  (`test_plugin_structure.py:109-118`).

### A3. Where code lives

```text
skills/mods-ui-core-text/
  SKILL.md
  agents/openai.yaml
  references/text.ts          pure, no `$`, imports nothing from 'claude-code'
  references/text.test.ts     node:test + node:assert, run by tsx in CI (H5)
  references/width-table.ts   GENERATED from Unicode EastAsianWidth (never hand-edited)
  references/sources.md       provenance per symbol: repo, SHA, file, symbol, licence, what changed
skills/mods-ui-bar/
  SKILL.md
  agents/openai.yaml
  references/bar.ts           imports ../../mods-ui-core-*/references/*.js only
  references/bar.test.ts
  references/sources.md
skills/mods-ui-compose/
  SKILL.md
  examples/ui-gallery/        gallery TEMPLATE: manifest, hooks.json, register.tsx, kit tests; NO component code
  references/compose-band.md, compose-pane.md, recipes.md
```

- Component and foundation code is pure TypeScript: no `$`, no import from `claude-code`, no module-level mutable
  state (UD16), no timers. This keeps it importable by a mod (passing `$` into an imported module fails
  `claude plugin validate`) and lets CI type-check it without the generated host types.
- Import specifiers end in `.js` (the house convention, `turn-timer/hooks/register.ts:3` imports `./logic.js`).
- Each `.ts` file starts with a licence header naming every origin (G) and the SPDX id of the file.

### A4. How a mod gets a component (copy, never import from the plugin)

Examples are copied, never loaded (survey section 1), and there is no cross-example import. So a mod gets components
by copying them:

1. `copy-ui.sh <mod-dir> mods-ui-bar mods-ui-chip ...` resolves the import closure of the named components (the
   foundation files they import, transitively), copies them into `<mod-dir>/hooks/ui/`, and rewrites
   `../../mods-ui-core-text/references/text.js` to `./text.js`.
2. It writes or extends `<mod-dir>/THIRD_PARTY_NOTICES.md` with one entry per copied file, taken from each file's
   licence header (G), and copies an Apache-2.0 `NOTICE` chain when an Apache-derived file is in the closure.
3. It never overwrites a file in `hooks/ui/` that differs from the version it last copied (it keeps a
   `hooks/ui/.copied.json` of hashes); it stops with an error instead, so a mod is never left half-updated.
4. It prints the path of the host adapter snippet (B, `mods-ui-core-host`) that the mod pastes into its register file.

Script location: `skills/mods-tutorial-quickstart/scripts/copy-ui.sh`, beside `new-mod.sh`, `check-mod.sh` and
`keep-mod.sh`, because `test_plugin_structure.py:313` allows non-example code only there (H1 lists the check). Its
tests join `tests/test_mod_scripts.py`, which already runs the quickstart scripts in temporary directories.

### A5. Declared dependencies: the imports are the declaration

A component's dependencies on foundation skills are its relative imports. There is one source of truth:

- `copy-ui.sh` reads the imports to build the closure.
- `## Prerequisites` in SKILL.md lists the same foundation skills in prose; a new pytest
  (`test_ui_prerequisites_match_imports`) parses both and fails on any difference.
- Components never import other components (no component-to-component edges). Composition (a ring inside a stat tile)
  happens in the mod's register file or through a `slot` render function passed in by the caller.

### A6. How the agent composes several components

The agent (forge agent or expert agent, via the menu, H3) loads `mods-ui-compose` first. That skill teaches one
procedure:

1. Read the site's box: `e.props.bodyColumns`, `e.props.maxRows` (band) or `e.props.scroll.bodyRows` (pane),
   `e.surface`. Never `e.viewport` for a pane or band (UD11).
2. Choose components by value kind, then by surface, then by footprint (the summary table in C).
3. Give each instance its box (`columns x rows`, or `widthPx x heightPx` on Desktop), one shared `palette` and
   `tone`, one `nowMs` per render, and a unique `id`.
4. Lay the returned parts out with the row grammar from deck E31: glyph column, label column, visual slot, value
   column, action column, each of fixed width.
5. Keep later mods in the band with `await next(e)` inside the Box; yield to surveys with `e.props.hasSurvey`.
6. Copy the components with `copy-ui.sh`, paste the host adapter, run `check-mod.sh`.

Because every component returns exactly the box it was given, swapping one component for another that accepts the
same value kind on the same surface never moves anything else (the swap guarantee, A8).

### A7. Avoiding jscpd duplication (threshold 5)

- Foundation code exists once, in `mods-ui-core-*`; components import it. The helpers that the reports found copied
  up to five times (UD29) become one file each.
- Shared test fixtures (size matrix, hostile strings, footprint asserters, the SVG gate) live once in
  `mods-ui-core-contract/references/testkit.ts`; component tests import them.
- No example contains component code. The gallery and compose examples are templates that `copy-ui.sh` fills in a
  temporary directory when they are checked (H5). Owner policy forbids settling duplication with a jscpd exclude
  (survey section 1, card JFB5E98B), so this is the only route; its trade-off is I3.

### A8. The uniform contract (kept from TRDD-5P3OAPO6, tightened by the review rules)

```ts
export type Surface = 'svg' | 'raster' | 'text' | 'line'
export type Box = { columns: number; rows: number } | { widthPx: number; heightPx: number }
export type Motion = 'full' | 'calm' | 'off'          // 'off' emits no animation at all
export interface Props<V> {
  kind: ValueKind          // must be one of the component's declared kinds, else throw
  value: V
  box: Box                 // FIXED by the caller; never derived from content
  surface: Surface
  variant: string          // must be one of the component's declared variants, else throw
  tone?: Tone              // 'neutral' | 'accent' | 'ok' | 'warn' | 'crit' | 'dim'
  palette?: Palette        // from mods-ui-core-tokens; dark default, light twin required
  nowMs?: number           // caller-owned clock (await $.clock.now()); omitted = still frame
  motion?: Motion
  id: string               // per instance; prefixes every SVG id, class and keyframe
  label: string            // accessible text; becomes alt / <title> / aria-label
  ascii?: boolean          // force the ASCII glyph set (terminals with ambiguous-width trouble)
}
export interface Rendered {
  svg?: string                                         // Desktop: one complete document
  cells?: { columns: number; rows: number; cells: string }   // terminal Raster, base64
  tree?: Descriptor                                    // Box/Text descriptor, whitelisted props only
  line?: string                                        // status line / toast / any plain text
  alt: string
  settleAt?: number                                    // when a glide ends: caller schedules one standing redraw
}
```

Rules every component obeys (each is a test in its `.test.ts`, using `testkit.ts`):

- **Fixed footprint (review rule 4).** Given `columns x rows` it returns exactly that many cells, measured with the
  display-width table (UD01); given `widthPx x heightPx` it returns an SVG whose `width`, `height` and `viewBox` are
  exactly those. Unused cells and rows are padded. Height is never derived from content. A list takes `maxRows` and
  ends with a "+N more" row when items do not fit. Below a component's minimum size, detail is dropped in the order
  its skill declares (for example: detail text, then label, then value text, then the visual). An unsupported kind,
  variant or size below the absolute minimum throws an `Error` naming the component, the argument and the accepted
  values; it never draws something else.
- **Four surfaces (review rule 5).** Every component implements `svg`, `raster`, `text` and `line`, or its skill
  declares the defined fallback for a missing one (for example ring on `raster` = quarter-circle glyph plus percent
  text in cells). Any glyph whose terminal width is unverified (P11) has an ASCII twin used when `ascii` is set or
  when the probe result says so. Terminal `Image` is optional (kitty 0.28+ and Ghostty only, not tmux, screen or
  background sessions), always with a Raster or text fallback and a self-contained `alt`.
- **Motion (review rule 6).** Components take `nowMs` and never start a timer. Phase is derived from the clock
  (negative `animation-delay` / SMIL `begin`), never summed and never restarted by a redraw. Every SMIL element is
  emitted as a moving and a still twin (zy `withStill`), because SMIL ignores CSS `prefers-reduced-motion`. CSS
  animation is wrapped in the reduced-motion media query. Every animated variant has a still form, used when
  `motion: 'off'`, when `nowMs` is omitted, and on any surface where the probe says animation does not run.
- **Swap guarantee.** Two components that accept the same value kind, at the same box, on the same surface, can be
  swapped without moving anything around them. The Desktop half of this holds only once P10 settles whether the
  Desktop draws an Svg at its viewBox size or scales it.
- **Safety.** Every `svg` passes the host gate of `mods-ui-core-svg-validate` before it is returned (size under
  131,072 characters, one well-formed `<svg>` root, no script, no external reference, unique and prefixed ids).

### A9. Skill-wide invariants every UI skill teaches (review rule 11)

1. A band hook returns its own tree with `await next(e)` placed inside its Box, so later mods keep their band; it
   yields with `return next(e)` when `e.props.hasSurvey` is true (MODS INTERFACES > Pick where to draw and open
   panes; MODS REFERENCE > Render sites).
2. Status-line text is written only when it changed (`ow:swarm/hooks/register.tsx:pushStatus`); toasts fire only on
   transitions (`ow:burn-meter/hooks/burn.ts:crossed`; `$.ui.toast` with `timeoutMs`).
3. Per-instance SVG ids: every `id=`, `url(#...)`, `href="#..."`, class name and keyframe name carries the instance
   prefix (UD07).
4. Scoped CSS class names, never bare `.t0` or `.row`.
5. SVG size gate: assert under 131,072 characters in the component test at the worst-case caps; at runtime, drop to
   the still variant and then to a thinned variant before exceeding it (UD08).
6. The usage-meter checkers (`um:svg-util.ts:svgProblems`, `textOverflow`, `parseXml`) are test tooling only, never a
   runtime sanitizer (B, `mods-ui-core-svg-validate`).
7. `$` stays in the register file; generators are pure; timers start in `session.start` or from the event that opens
   a pane, never inside `ui.render` (UD17).
8. Time comes from `await $.clock.now()` once per hook and is passed down as `nowMs` (UD15).

## B. Foundation skills

### B0. Source paths and dependency order

Source citations use these roots (all at the SHAs in section G). Line numbers were located with `grep -n` on the
definition and are given only to speed up the skill author's own read; the author re-reads every symbol in full before
porting it.

| short | root |
|---|---|
| `deck:` | `nvr0x5_claude-deck/hooks/` (`theme.js`, `register.js`, `styles-desktop.js`, `styles-terminal.js`, `pet.js`) |
| `aug:` | `augiefra_claude-mods/plugins/token-weather-usage/hooks/token-weather-usage.mjs` (one file, written `tw.mjs` below) |
| `zy:` | `zycck_claude-mods/plugins/plan-progress/hooks/register.tsx` (one file, written `zy.tsx` below) |
| `ow:` | `OneWave-AI_claude-code-mods/<mod>/hooks/` |
| `um:` | `aycandv_claude-usage-meter/plugins/usage-ticker/hooks/` |
| `rg:` | `purpleheads2026_Mod_claude/regia/hooks/` plus `regia/design-tokens.json` (the corpus folder for Regia; `docs/demo/lib/*.mjs` are copies of the same code, UD29) |
| `wv:` | `BatuhanCakmakk_wavy-usage/hooks/` |

Foundation import order (a skill imports only skills above it; no cycles; components import any of them):

```text
core-contract  <- core-escape  <- core-text  <- core-format
core-contract  <- core-color   <- core-tokens <- core-scale
core-contract  <- core-motion
core-escape, core-text, core-motion, core-tokens <- core-svg <- core-svg-validate (tests only)
core-text, core-color, core-tokens <- core-cells <- core-pixels
core-host: a snippet, imports nothing (it is pasted into the mod's register file)
```

### B1. `mods-ui-core-contract`

- **Purpose.** The shared types of A8 (`Props`, `Rendered`, `Box`, `Surface`, `ValueKind`, `Descriptor`), the
  assertion helpers every component calls first (`assertKind`, `assertVariant`, `assertBox`, `assertSurface`), the one
  `COLUMN_PX` constant used to convert a terminal box to pixels when a component needs it `[PROV:P12]`, and the
  descriptor prop whitelist (only props that the generated `index.d.ts` declares; `hover`, `display`, `variant` and
  `wrap` values are gated by P03). Also `references/testkit.ts`: the size matrix, the hostile-string table, the
  footprint asserters (`expectCells(r, box)`, `expectSvgBox(r, box)`), the still-frame asserter and the motion
  continuity asserter.
- **Sources.** TRDD-5P3OAPO6 (interface, kinds, tiers); `um:register.test.tsx` (render-harness shape, H14) as the model
  for testkit; report 03 section 4 (the fake engine in zy tests) as the counter-example.
- **Fixes.** UD09, UD10, UD11, UD19, UD30.
- **Tests.** Each assertion throws a named error for an unknown kind, variant, surface and a box below the minimum; the
  footprint asserter is itself mutation-checked (a component returning one extra column, one missing row or a
  `viewBox` that differs from `width`/`height` must fail it); the whitelist rejects an undeclared prop.

### B2. `mods-ui-core-escape`

- **Purpose.** One escaper for SVG text and attribute values, plus `attrNum` for numbers.
- **Sources.** Base `zy.tsx:esc` (407) and `zy.tsx:str` (77); union with `deck:theme.js:esc` (43),
  `rg:svg.ts:esc` (84), `wv:jet.ts:escape` (230), `um:svg-util.ts:escape` (8), `ow:swarm/hooks/card.ts:esc` (26).
- **Fixes (union, UD27).** Escapes `& < > " '` in text and attributes; removes C0 controls other than tab and newline
  (XML 1.0 forbids them); removes U+FFFE and U+FFFF; replaces a lone surrogate with U+FFFD; `attrNum` rejects `NaN`
  and `Infinity` with an error and prints a fixed number of decimals, so markup is byte-stable.
- **Tests.** The hostile-string table from testkit (quotes, `]]>`, controls, lone surrogates, ZWJ emoji, RTL marks)
  escaped and then parsed by `core-svg-validate`'s `parseXml` without error and with the original visible text.

### B3. `mods-ui-core-text`

- **Purpose.** Measure and fit text: graphemes, terminal cell width, grapheme-safe truncation, padding to an exact cell
  count, middle ellipsis for paths, and an SVG text-width ESTIMATE that is labelled as such.
- **Sources.** `zy.tsx:textWidth` (413), `zy.tsx:fitLabel` (437), the `segmenter` and the one-cell width tables (H2,
  a hand-pasted blob tied to one Bun build); `deck:theme.js:textWidth` (47), `trunc` (38), `runs` (58), `textCells`
  (77) and `deck:register.js:folderText` (293); `aug:tw.mjs:textWidth` (1574) and `fit` (1337);
  `rg:svg.ts:textWidth` (97), `fit` (92), `fitParts`; `um:svg-util.ts:fit` (61); `ow:session-wrapped/hooks/png.ts:textWidth`
  (33) and `fit` (50).
- **Fixes.** UD01: a width table GENERATED by `references/gen-width.mjs` from the Unicode `EastAsianWidth.txt` and
  emoji-presentation data (pinned Unicode version, checked-in output, a test that the generator reproduces it),
  replacing zy's blob; ambiguous-width characters count as width 2 unless the caller passes `ambiguous: 1`
  `[PROV:P11]`. UD02: every cut goes through `Intl.Segmenter` graphemes. SVG: `svgTextWidth(s, fontPx)` is an estimate
  per font class; components either clip text with a `clipPath` or reserve the estimated width plus a declared margin,
  never both trust the estimate and draw unclipped. UD29: one copy.
- **Tests.** CJK, emoji with ZWJ and skin tones, combining marks, RTL, the full glyph list of P11; `fitCells(s, n)` never
  returns more than `n` cells and never splits a grapheme (property test over random strings); `padCells` returns
  exactly `n`; generator reproducibility.

### B4. `mods-ui-core-format`

- **Purpose.** Locale-aware fixed-width value text: compact numbers, integers, percent, durations, clock times,
  countdowns, ordinals, plurals, money.
- **Sources.** Compact numbers: base `um:cards.ts:tok` (35), the only copy that rolls 999,950 over to "1.0M"; the
  "1000k" copies are `deck:register.js:fmtK` (256), `aug:tw.mjs:short` (1698), `rg:svg.ts:fmtTokens` (110),
  `wv:model.ts:tokens` (69). Durations and clocks: `aug:tw.mjs:duration` (905), `clockTime` (915); `zy.tsx:elapsed`
  (1000); `deck:register.js:elapsed` (287) and `deck:styles-desktop.js:elapsed` (243) (two copies); `deck:register.js:countdown`
  (262); `wv:model.ts:elapsed` (390), `windowElapsed` (105), `countdown` (79), `clockTime` (95). Ordinals:
  `ow:agent-race/hooks/race.ts:ordinal` (105) ("21th" bug). Plurals: base `aug:tw.mjs:plural` (259, Intl.PluralRules);
  `zy.tsx:plural` (1355), `rg:i18n.ts:plural` (130). Percent: `zy.tsx:percent` (995), `wv:model.ts:percentText` (74),
  `aug:tw.mjs:percent` (1631), `um:desktop-state.ts:percent` (140). Money: `wv:model.ts:costText` (255).
- **Fixes (UD25).** Rounding happens BEFORE choosing the unit, so 999,950 prints "1.0M", never "1000k"; ordinals use
  `Intl.PluralRules({ type: 'ordinal' })` with per-locale suffix tables; plurals use `Intl.PluralRules` categories,
  never `n === 1`; money uses `Intl.NumberFormat` with a REQUIRED currency (no USD default); every formatter takes an
  explicit `locale` from the caller (no `tr`, `ru` or `it` defaults, wv A8); percent clamps and shows "<1%" for a
  non-zero value that rounds to 0 and never "100%" for a value under 1 (UD24); every formatter has a `width` option
  that pads to its declared maximum, so value columns stay fixed (review rule 4).
- **Tests.** Boundary tables (999; 999.4; 999.5; 999,949; 999,950; 1e6; 1e9); English ordinals 1, 2, 3, 4, 11, 12, 13,
  21, 22, 23, 101, 111, 112; Russian and Arabic plural categories; negative or `NaN` input rejected with an error;
  each output's cell width never exceeds its declared width.

### B5. `mods-ui-core-color`

- **Purpose.** Colour arithmetic for every surface: parse and format hex, mix, shade in both directions, heat ramp,
  Raster 4-bit rounding, WCAG contrast, and `readable()`.
- **Sources.** `zy.tsx:hex` (402), `mix` (403), `q17` (46), `readable` (54); `deck:theme.js:hex` (53), `mix` (54);
  `um:palette.ts:mix` (15), `um:desktop-theme.ts:hex` (8); the ow copies of `mix`
  (`boss-fight/hooks/pixels.ts:71`, `code-pet/hooks/pixels.ts:71`, `burn-meter/hooks/burn.ts:137`,
  `inbox-alerts/hooks/wave.ts:6`, `swarm/hooks/model.ts:44`); `wv:svg.ts:shade` (36) and `wv:jet.ts:shade` (69) (two
  copies); heat: `um:gauge.ts:heat` (33), `wv:model.ts:heat` (15), `ow:burn-meter/hooks/burn.ts:heat` (109).
- **Fixes.** UD23: `q17(c)` reproduces the host's Raster rounding `[PROV:P13]`, and `readable(fg, bg, { min, surface })`
  measures contrast AFTER rounding when `surface` is `raster`; UD05: `contrast(a, b)` is WCAG 2.x relative luminance,
  never an eyeballed value; shade lightens and darkens (`wv` shade only darkened); the heat ramp takes its stops from
  `core-tokens`, not hard-coded hex; UD29: one copy of each.
- **Tests.** Reference contrast pairs (black on white 21:1; `#767676` on white 4.54:1); `mix` endpoints; shade symmetry;
  `q17` table once P13 is answered; `readable` returns a candidate that passes after rounding, or throws when none does.

### B6. `mods-ui-core-tokens`

- **Purpose.** ONE design-token schema and two shipped palettes (dark and light). Review rule 7: "one palette, not three".
- **Sources.** `rg:../design-tokens.json` (the schema; rg kept it plus two code copies, UD29); `deck:theme.js` tone
  palette (H1) and tone adapter (H4); `aug:tw.mjs` palettes (H10: `ICON_COLORS`, `WEATHER_ICON_COLORS`);
  `wv:svg.ts:SCHEME` (16); `zy.tsx` `STATE_COLOR` and its dark and light `SCHEMES`; `um:palette.ts:PALETTE`.
- **Shape.** `Palette = { scheme: 'dark' | 'light', surface: { bg, panel, line }, ink: { primary, secondary, dim },
  tone: { neutral, accent, ok, warn, crit, dim }, terminal: { <tone>: <theme key> }, raster: { <tone>: <rounded rgb> } }`.
  Terminal text uses the host's theme keys where the generated `index.d.ts` declares them (P03), so the user's theme
  wins; hex appears only in Svg and Raster.
- **Choosing the scheme.** On Desktop, whether an Svg can follow the app theme by itself is P15; in the terminal, how
  a mod learns the background is P18. Until both are answered, the caller passes `palette` explicitly and the default
  is dark.
- **Fixes.** UD03 (a light twin for every key, parity checked), UD04 (no hex outside tokens), UD05 (every ink and tone
  validated against every surface by script: 4.5:1 for text, 3:1 for graphics, after q17 for Raster) and UD06 (each
  tone is documented with its required glyph or word twin, which `mods-ui-status-lamp` supplies).
- **Tests.** The contrast script of P22 runs as a test over both palettes; key parity between dark and light; no tone
  value appears as a literal in any component file (a grep test over `skills/mods-ui-*/references/*.ts`).
- **Numbers.** The reports' contrast figures (zy `STATE_COLOR` 4.54-5.31, rg "other" 2.97, rg `#d03b3b` 3.44, aug amber
  3.8, wv light theme) are hand or partly-hand calculations `[CALC:P22]`; the palettes are chosen from the script's
  output, not from them.

### B7. `mods-ui-core-scale`

- **Purpose.** Turn values into display decisions: threshold classification with hysteresis, ordinal levels,
  quantisation for byte-stable output, transition detection, pace and forecast, monotone smoothing for series.
- **The shared fill cores (review rule 9).** `fillModel(ratio, cells, { eighths })` is the ONE terminal-bar core: exact
  width, eighth-cell resolution, zero lights no cell, values above 1 report `overflow`. `partsModel(parts, cells)` is
  the stacked-bar core (largest-remainder allocation so the parts always sum to the width; parts under one cell merge
  into "other"). `mods-ui-bar`, `mods-ui-stacked-bar`, `mods-ui-ranked-bars` and `mods-ui-stat-tile` all draw these
  models, so no component imports another component (A5). The ring core is `core-svg`'s `arcPath` over the same ratio.
- **Sources.** Thresholds and mappers: `deck:register.js` (H19, including `95*(1-exp(-n/18))`), rg thresholds (report 06
  E17), `wv:register.tsx:levelFrom` (130), `wv:model.ts:ringStep` (261). Transitions: `ow:burn-meter/hooks/burn.ts:crossed`
  (89). Pace: `um:pace.ts` (H9) and `um:panel-svg.ts:pace` (253), `wv:jet.ts:pace` (237), `wv:register.tsx:pace` (480),
  `aug:tw.mjs:pace` (849), `ow:agent-race/hooks/race.ts:pace` (113). Forecast and burn: `um:gauge.ts:forecast` (22),
  `wv:model.ts:forecast` (380), `deck:register.js:burnRate` (178), deck history sampler (H18). Smoothing:
  `um:palette.ts:smooth` (25), `zy.tsx:smooth` (511).
- **Fixes.** UD28: thresholds, labels and tones are injected by the caller, never baked in; UD24: `levelFrom(0)` is
  level 0 and the top level needs the ratio to reach 1 (deck E18's off-by-one); "no data" is a distinct result, never
  0; hysteresis stops tone flapping at a boundary; `crossed` returns a transition once per crossing (toast discipline,
  A9.2); forecast refuses fewer than two samples instead of guessing.
- **Tests.** Edges on both sides of every threshold; a value oscillating around a boundary within the hysteresis band
  produces one change; `crossed` fires exactly once for up and once for down; forecast with 0, 1 and 2 samples;
  smoothing never overshoots monotone input.

### B8. `mods-ui-core-motion`

- **Purpose.** Everything time-based, all driven by a caller-supplied `nowMs`: motion tokens, clock-derived phase,
  still twins, reduced-motion CSS, glides with `settleAt`, flash guard, time quantisation.
- **Sources.** `zy.tsx:withStill` (683), `liveSource` (676, the `{{T:ms}}` begin re-substitution), `settleBy` (713),
  `easeOut` (1469), `headAt` (1479), `glideKnob`; `deck:styles-desktop.js:glideFrom` (30) and `twinkleCss` (19),
  `deck:register.js:withFadeIn` (218); `um:desktop-state.ts:phaseAt` (50), `memoMarkup` (92), `deskClock` (98);
  `um:scroll.ts` (scroll physics, H3); `rg:motion.ts:motionCss` (durations, easings, the reduced-motion list);
  `wv:svg.ts:MOVE` (22) and `OVERSHOOT` (23) (the wavy slosh spline); `ow:burn-meter/hooks/burn.ts:tween` (112);
  `ow:boss-fight/hooks/fight.ts:phaseAt` (198).
- **Provides.** `MOTION` tokens (one table: durations, easings including the `.2 .8 .2 1` spline and the wavy
  `MOVE`/`OVERSHOOT` pair); `phaseDelay(nowMs, periodMs)` returning a negative delay with a positive modulo (rg fix);
  `beginAt(startMs, nowMs)` for SMIL; `withStill(moving, still, cls)`; `reducedMotionCss(scope, rules)` wrapping rules
  in `@media (prefers-reduced-motion: no-preference)`; `glide({ from, to, startMs, durMs, ease }, nowMs)` returning the
  current value and `settleAt`; `flashGuard(periodMs, property)`; `quantise(nowMs, stepMs)`.
- **Fixes.** UD12 (every SMIL element gets a still twin; CSS animation gets the media query; one reduced-motion list),
  UD13 (the guard refuses luminance-changing animation faster than 3 flashes per second, which ow's 6.7 Hz boss and
  4 Hz pet fail), UD14 (phase is derived from `nowMs`, never summed per frame, never restarted by a redraw; the glide
  start is stored by the caller, which fixes deck's glide replay D5), UD15, UD16 (no module state).
- **Tests.** Two renders 1,000 ms apart place a looping element at the phase a single continuous animation would have;
  two renders at the same `nowMs` are byte-identical; every `<animate>`/`<animateTransform>` in a `withStill` output
  has a still twin; the flash guard rejects 150 ms and accepts 400 ms periods; negative time differences give a
  positive phase.

### B9. `mods-ui-core-svg`

- **Purpose.** SVG building blocks: the document wrapper, per-instance ids and scoped classes, arc paths, path
  batching, a character budget, seeded randomness, clipped text.
- **Sources.** `zy.tsx:addDot` (482), `thin` (587), `hash` (409), `streamHash` (502), `ICON_PATH`;
  `deck:theme.js:hash` (27), `seedOf` (32); `um:svg-util.ts:arcPath` (27); `rg:svg.ts` shared geometry (`tileW`, `tileH`,
  `rowH`, `growFrom`, report 06 E26); `wv:svg.ts:wavePath` (47), `bubbles` (54), `clamp`.
- **Provides.** `svgDoc({ box, id, label, css, body })` returning one `<svg>` root with `width`, `height` and `viewBox`
  equal to the box, a `<title>` from `label`, and a `<style>` whose every selector carries the prefix; `scope(id)`
  minting ids, class names and keyframe names; `arcPath` with explicit 0, full-circle and near-full cases;
  `pathBatch` (zy `addDot`) merging many dots or cells into one `<path>`; `budget(maxChars)` with zy `thin()` as the
  deterministic detail reducer; `seeded(hash)`; `clippedText` built on `core-text`'s estimate.
- **Fixes.** UD07, UD08 (each component declares its worst case; `budget` drops to the thinned form before the
  131,072-character limit `[CALC:P23]`), UD24 (a 0% arc draws nothing, not a round-cap dot; rg E3c, wv E1(f)), UD29.
- **Tests.** Two instances of every component concatenated into one document parse with no duplicate id and no
  dangling `url(#...)`; `arcPath` at 0, 0.5, 0.999 and 1; `budget` output under the limit at the declared caps.

### B10. `mods-ui-core-svg-validate` (test tooling, never runtime)

- **Purpose.** The validators every component test and the gallery use (review rule 11).
- **Sources.** `um:svg-util.ts:parseXml` (88), `svgProblems` (188), `textOverflow` (221); `um:register.test.tsx`
  (harness); `rg:../scripts/showcase.mjs` (gallery idea, report 06 T10).
- **Provides.** `parseXml`; `svgProblems(svg)` reporting size over the limit, more than one root, `<script>`,
  `<foreignObject>`, event attributes, external `href`, duplicate ids, dangling references, and ids or classes without
  the instance prefix; `textOverflow(svg)` comparing estimated text extent with its container.
- **Fixes.** UD07, UD08, UD30. `copy-ui.sh` copies it only with `--with-tests`, so a mod never ships it as a runtime
  sanitizer.
- **Tests.** One fixture per problem kind yields exactly that problem and no other; a clean fixture yields none.

### B11. `mods-ui-core-cells`

- **Purpose.** The terminal cell layer: a `Grid` of `{ ch, fg, bg, attrs }`, text placement with the one-cell rule,
  and the Raster encoder.
- **Sources.** `zy.tsx` `Grid` (H1), `trackCells`, `stripCells`; `um:board.ts:rasterWidth`, `um:gauge.ts:gaugeCells`,
  `um:base64.ts` (encoder, H7); `deck:register.js:toBase64` (349), `deck:theme.js:runs` and `textCells`; the seven ow
  `toBase64` copies (`boss-fight/hooks/pixels.ts:78`, `code-pet/hooks/pixels.ts:78`, `burn-meter/hooks/burn.ts:147`,
  `inbox-alerts/hooks/wave.ts:18`, `launch-codes/hooks/fx.ts:5`, `session-wrapped/hooks/png.ts:149`,
  `sportscaster/hooks/wav.ts:9`) and the two ow `encode` copies (`boss-fight/hooks/pixels.ts:110`,
  `code-pet/hooks/pixels.ts:110`).
- **Fixes.** UD01 (a character whose table width is not 1 is refused, or replaced by its ASCII twin when the caller
  allows it, because a Raster cell holds one one-cell character), UD22 (the encoder always returns `columns` and
  `rows`, so a blit always carries its size), UD29 (one encoder, one base64 path via `Uint8Array.prototype.toBase64`).
  Limits: at most 512 x 256 cells, three uint32 values per cell, default colour 0x01000000.
- **Tests.** Encode then decode round trip; 513 columns throws; a wide glyph throws; default colour survives; the
  encoder output for a fixed grid is byte-stable.

### B12. `mods-ui-core-pixels`

- **Purpose.** Review rule 8 says the pixel layers stack: an RGBA rasteriser, then a half-block packer, then the cell
  encoder. This skill is the first two layers plus an optional PNG encoder for terminal `Image`.
- **Sources.** RGBA layer: deck rasteriser (H24) and `deck:pet.js` `canvas`, `petFrame`. Packer: `ow:code-pet/hooks/pixels.ts`
  `canvas`, `sprite`, `rows` (P1, the best of the corpus; `ow:boss-fight/hooks/pixels.ts` is a copy, UD29). Braille
  packer variant: zy terminal track (V8) and um LED crawl (`um:led.ts`, E3). PNG: `ow:session-wrapped/hooks/png.ts:encodePng`
  (119).
- **Provides.** `Rgba(width, height)` with blend, rect, line and sprite blit; `halfBlock(rgba): Grid` using `▀`/`▄`
  pairs; `braille(rgba): Grid` (2 x 4 dots per cell, one colour per cell); `encodePng(rgba)` with the 2 MiB gate.
- **Fixes.** UD23 (colours are q17-rounded and the fg/bg pair is chosen AFTER rounding), UD01 (block and braille widths
  depend on P11; an ASCII density fallback ` .:-=+*#%@` is provided), UD13, UD29.
- **Tests.** A 2-row checkerboard packs to known cells; rounding happens after packing; `encodePng` output inflates with
  Node's `zlib` and its IHDR, IDAT and IEND chunks validate; a 2 MiB overflow throws.

### B13. `mods-ui-core-host` (a snippet the mod pastes, not an importable module)

- **Purpose.** The only code that touches `$`. It is a snippet because passing `$` into an imported module fails
  `claude plugin validate` (survey section 1), so the host half is pasted into the mod's register file once.
- **Sources.** zy frame loop (H13: blit at about 30 fps, stop after 6 refusals, 1 s rest) `[PROV:P14]`;
  `um:timing.ts:paintDue` (15); `ow:swarm/hooks/register.tsx:pushStatus` (53); `ow:burn-meter/hooks/burn.ts:crossed`
  (89); `wv:register.tsx` band container (E23, the `await next(e)` model); `um:register.tsx:deskStrip`.
- **Provides** (`references/host-adapter.tsx`, about 80 lines). `toElement(descriptor)` mapping a whitelisted
  descriptor to `$.ui.resolve` elements; `frameLoop(site, paint)` that blits only when the cell hash changed, always
  with `columns` and `rows`, backs off on refusal as P14 establishes and stops when the site unmounts; `statusOnChange`;
  `toastOnTransition`; `settle(settleAt)` scheduling one standing `$.ui.invalidate`; and the one line
  `const nowMs = await $.clock.now()`.
- **Fixes.** UD15, UD17 (no timer inside `ui.render`; the loop starts on the event that opens the site and respects
  the 10/s and 30/s redraw caps), UD18 (every `catch` logs with context and re-throws or ends the feature visibly),
  UD20, UD22.
- **Tests.** Pure tests of the change-detection and back-off logic in `host-logic.ts` (imported by the snippet); the
  live behaviour is covered by the gallery's `claude plugin test` run with `mock.clock` (local, H6), because the host
  loop cannot run without the host.

<!-- end of section B -->

## C. Component skills

### C0. How to read a component entry, and the summary

Every entry has the same fields: **Kinds** (accepted value kinds; anything else throws), **Variants** (each with its
source as `repo:file:symbol` and the report row), **Surfaces** (native or the declared fallback, per review rule 5),
**Footprint** (minimum box and the order in which detail is dropped, per review rule 4), **Motion** (what animates,
the still form, and the use of `nowMs`, per review rule 6), **Probes** (the F items that gate the verdict; until they
are answered, the entry is PROVISIONAL), **Defects** (UD codes this skill must not repeat), **Fixes**, **Tests** and a
**Didactic** note (what the skill teaches beyond itself). The minimum `Tests` for every component, not repeated below:
the testkit footprint matrix on all four surfaces, the still frame, byte stability at equal `nowMs`, two instances in
one document, the SVG gate, an ASCII-mode run, and an unknown kind and variant each throwing.

Surface key: S = Desktop Svg, R = terminal Raster, T = Box/Text tree, L = plain line (status line or toast),
I = optional terminal Image. "fb" = a declared fallback, not a native drawing.

| # | skill | tier | kinds | S | R | T | L | animated | gating probes |
|---|---|---|---|---|---|---|---|---|---|
| C1 | `mods-ui-bar` | 1 | ratio, count | yes | yes | yes | yes | glide, twinkle | P11 P13 P16 P17 |
| C2 | `mods-ui-stacked-bar` | 1 | parts, ratio | yes | yes | yes | yes | glide | P11 P22 P23 |
| C3 | `mods-ui-track` | 1 | ratio + marks | yes | yes | yes | yes | stream, glide, clock | P01 P02 P04 P05 P10 P11 P16 P17 P23 |
| C4 | `mods-ui-ring` | 1 | ratio, duration, level | yes | yes | fb | yes | grow, slosh | P02 P10 P11 P16 P17 P23 |
| C5 | `mods-ui-stat-tile` | 1 | count, rate, duration, ratio, delta | yes | yes | yes | yes | tween | P10 P12 P22 |
| C6 | `mods-ui-value` | 1 | count, rate, duration, ratio, delta | yes | yes | yes | yes | no | P03 P11 |
| C7 | `mods-ui-chip` | 1 | enum, text, count | yes | yes | yes | yes | no | P03 P11 |
| C8 | `mods-ui-status-lamp` | 1 | enum | yes | yes | yes | yes | pulse | P01 P11 P16 P22 |
| C9 | `mods-ui-sparkline` | 1 | series | yes | yes | yes | yes | no | P10 P11 P23 |
| C10 | `mods-ui-clock` | 1 | duration | yes | yes | yes | yes | reel | P01 P02 P08 P16 P17 |
| C11 | `mods-ui-spinner` | 2 | boolean | yes | yes | yes | yes | always (still form) | P01 P02 P08 P11 |
| C12 | `mods-ui-ticker` | 2 | text, list | yes | yes | fb | fb | scroll | P01 P06 P11 P14 P16 P23 |
| C13 | `mods-ui-icon` | 2 | enum | yes | yes | yes | yes | no | P11 P22 |
| C14 | `mods-ui-chip-row` | 2 | list | yes | yes | yes | yes | no | P03 P11 |
| C15 | `mods-ui-event-strip` | 2 | series of enum | yes | yes | yes | yes | no | P11 P22 |
| C16 | `mods-ui-level-meter` | 2 | level | yes | yes | yes | yes | wind (still form) | P02 P11 P23 |
| C17 | `mods-ui-ranked-bars` | 2 | list | yes | yes | yes | yes | no | P03 P11 |
| C18 | `mods-ui-status-rows` | 2 | list | yes | yes | yes | yes | flow, live clock | P01 P02 P03 P09 P11 P19 P23 |
| C19 | `mods-ui-feed` | 2 | list | yes | yes | yes | yes | no | P03 P09 P21 |
| C20 | `mods-ui-legend` | 2 | list | yes | yes | yes | yes | no | P11 |
| C21 | `mods-ui-switch` | 2 | boolean | yes | fb | yes | yes | no | P03 P04 P05 P20 |
| C22 | `mods-ui-segmented` | 2 | enum | yes | fb | yes | yes | no | P03 P05 P20 |
| C23 | `mods-ui-disclosure` | 2 | boolean | yes | fb | yes | yes | fold (still form) | P03 P05 P11 P20 |
| C24 | `mods-ui-hover-card` | 2 | text, list | yes | fb | fb | fb | no | P03 P04 P05 P17 |
| C25 | `mods-ui-big-text` | 3 | text, count | yes | yes | yes | yes | no | P11 |
| C26 | `mods-ui-timeline` | 3 | intervals | yes | yes | yes | yes | now line | P11 P23 |
| C27 | `mods-ui-tree` | 3 | list (with parent) | yes | yes | yes | yes | no | P11 P19 P21 |
| C28 | `mods-ui-radar-ring` | 3 | intervals, series | yes | fb | fb | fb | rotation | P02 P16 P23 |
| C29 | `mods-ui-ambient-band` | 3 | ratio, level, enum | yes | yes | fb | no (declared) | always (still form) | P06 P13 P14 |
| C30 | `mods-ui-sprite-lane` | 3 | enum, ratio | yes | yes | fb | yes | always (still form) | P07 P11 P13 P14 |

Tier 1 is built first because every band in the corpus is assembled from it; tier 2 adds lists and controls; tier 3
are pictures whose value is mostly didactic (each teaches one hard technique) and whose verdicts carry the most probes.

### Tier 1

#### C1. `mods-ui-bar` (linear ratio bar; the bar family of review rule 9)

- **Kinds.** `ratio` (value, optional `expected` notch, optional `marks`), `count` with `total`.
- **Variants** (all drawings of `core-scale`'s `fillModel`): `segments` (`deck:styles-terminal.js:segments`,
  `deck:styles-desktop.js:segments`; report 01 E1, E9), `line` (E2, E10), `solid` (E3, E11), `dots` (E4, E12), `pixel`
  terminal (E5; the Desktop pixel style is a track variant, C3), `spark-fill` (E6, E13 used as a bar), `mini` (E7),
  `eighths` (`um:gauge.ts:gaugeCells`, report 05 E2, the exact-width reference), `block` (rg terminal block bar, 06 E18),
  `thin` (rg thin limit bar, 06 E3c), `hp` (`ow:boss-fight/hooks/register.tsx:hpBar`, 04 F3), `heat`
  (`ow:burn-meter/hooks/burn.ts:fireCells`, 04 B1, with the heat ramp from `core-color`), `text`
  (`ow:burn-meter/hooks/burn.ts:barText`, 04 B2, and zy plain-text bar 03 V13), `capsule` (`wv:svg.ts:resetBar`, 07 E7).
- **Surfaces.** S, R and T native for every variant; T uses eighth-block glyphs `[PROV:P11]` with the ASCII form
  `[#####-----]`; L is the ASCII form or a percent.
- **Footprint.** Minimum 4 columns x 1 row or 24 x 6 px. Drop order: label, value text, marks, expected notch; the bar
  itself is never dropped.
- **Motion.** Optional fill glide (`core-motion` `glide`, returns `settleAt`) and the pixel twinkle (deck `twinkleCss`,
  phase from `nowMs`, scoped classes). Still form: the static fill.
- **Defects.** UD01, UD06 (the expected notch is a shape as well as a colour), UD09, UD23, UD24 (ow B2's zero lights a
  cell in four copies and a test enshrines it; rg E3c draws 3 px at 0%), UD29.
- **Fixes.** Zero lights nothing; a `nub` minimum exists only when the caller asks for it and the value text is shown;
  an overflow above 1 shows the crit tone AND a `!` twin; labels are fitted with `core-text`.
- **Tests.** Ratios 0, 1e-9, 1/16, 0.5, 1 - 1e-9, 1, 1.2 on every variant; the zero test is mutation-checked.
- **Didactic.** One model, many drawings: changing `variant` never changes the footprint.

#### C2. `mods-ui-stacked-bar` (two-value, pace and composition bars)

- **Kinds.** `parts`; `ratio` with `expected` and `projected` (the two-value pace bar).
- **Variants.** `two-value` (`aug:tw.mjs:textGauge` 02 E1, `━ ╍ ─`), `capsule` (`aug:tw.mjs:svgGauge` 02 E2, hatched
  capsule, the best of the family), `hatched` (`rg:svg.ts:metersSvg` 06 E3b), `turn` (`wv:svg.ts:turnBar` 07 E9).
- **Surfaces.** S, R, T native; T uses one glyph per part kind (`━` solid, `╍` projected, `─` free) with ASCII
  `= ~ -` `[PROV:P11]`; L prints "62% used, +18% projected".
- **Footprint.** Parts under one cell merge into "other". Drop order: legend, part labels, projected segment.
- **Motion.** None by default; optional glide.
- **Defects.** UD05 (aug amber 3.8:1 `[CALC:P22]`), UD06 (aug E1.1 margin by colour only), UD07 (aug E2.1 id `"tw"+label`
  collides), UD09 (aug hard-coded size), UD26 (aug E2.2 alt), UD28 (wv E9(a)).
- **Fixes.** Every part kind has a pattern AND a colour; hatch pattern ids come from `scope(id)`; `alt` lists every part
  with its value; parts are allocated by `partsModel`, so they always sum to the box.
- **Tests.** Parts summing above 1 throw unless `scale` is declared; order is stable; one-cell parts merge.
- **Didactic.** Encoding a second value without relying on colour.

#### C3. `mods-ui-track` (staged progress track with knob; review rule 10)

- **Kinds.** `ratio` with `marks: [{ at, label, done }]`, a head label (stage and step text) and an optional `duration`.
- **Base: the zy upstream.** `zy.tsx:trackSvg` and `drawTrack` (from line 726), `waveFrom`, the stream pattern and mask
  (`STREAM_WAVE`, `FLICKER`), `glideKnob`, `pill`, `clockPill`, `tips`, `isNarrow` (W < 360 px draws a circle knob with
  the stage number or a done check). Terminal: zy Braille track (03 V8) and plain-text bar (03 V13).
- **claude-deck deltas, listed explicitly** (both sources read by symbol: `deck:styles-desktop.js` `twinkleCss`,
  `glideFrom`, `pillMarkup`, `pixel`, `desktopTrack`; `zy.tsx` `trackSvg`, `drawTrack`):
  1. `dither-ramp` variant: deck's per-pixel `<rect>` dither in 5 density buckets `.b0`-`.b4`, grey mixed to the light
     tone along the fill (density `0.22 + 0.78 * u^1.5`, bucket from `u^0.9 * 1.1`), where zy uses a width-independent
     pattern and mask stream. Re-implemented with `pathBatch` and a `budget`, which fixes deck D9 (size).
  2. Knob placement `trail`: deck's `at(x)` puts the knob's right edge on the fill head once `x >= kw`, flips it to the
     right of the head only near the LEFT edge, then clamps. zy's `centre` (with `clampX`) stays the default.
  3. Pill `count` slot: deck's `row.count` tspan (dim, 0.75 opacity), beside zy's stage name, separator mark and step
     name.
  4. Generic `marks: [{ f, stage }]` input in place of zy's marks derived from its Plan model (fixes UD28).
  5. Knob ink: deck's `#fff` versus zy `INK` becomes the palette's on-tone ink chosen by `readable()`.
  6. Phase-preserving twinkle: deck `twinkleCss(nowMs)` on classes `t0`-`t3`, rebuilt on `phaseDelay` with scoped
     classes.
  - Correction to report 01: the narrow circle knob is NOT a deck delta; zy `drawTrack` already has it.
  - Deck LACKS, so porting deck alone would lose: `withStill`, the `{{T:}}` begin offsets, settle and stand, `thin()`
    budgets, the hover tip overlay, the clock pill, the light-scheme `.mp`/`.ma` classes, frame caching and size
    independence. All of them stay.
- **Surfaces.** S native; R the Braille track (`core-pixels` `braille`) `[PROV:P11]`; T the plain bar with stage text;
  L "Stage 3/5, Writing tests, 62%".
- **Footprint.** Narrow form under 360 px or 24 columns. Drop order: tips, clock pill, step name, stage name, mark
  labels, marks.
- **Motion.** Stream and twinkle loops phase-locked to `nowMs`; knob glide with `settleAt`; every SMIL element in a
  `withStill` pair; still form = the static track.
- **Probes.** P01, P02 (animation in plain versus interactive Svg), P04 and P05 (the marks' hover overlay), P10, P16,
  P17, P23.
- **Defects.** UD07, UD08, UD09, UD12, UD14 (deck glide replay D5), UD15, UD28.
- **Tests.** One test per delta (knob x at 0, mid and W in `trail` and `centre`; the dither bucket formula at u = 0, 0.5,
  1; the count slot fitting), plus the upstream behaviours above.
- **Didactic.** How to merge a derived copy back onto its upstream without silently dropping either side.

#### C4. `mods-ui-ring` (ring and arc gauges; the ring family of review rule 9)

- **Kinds.** `ratio` (value, `expected` notch, `projected` ghost), `duration` (a time ring), `level`.
- **Variants.** `forecast` (`um:ring-svg.ts:ringSvg`, `ringModel`, `um:pane-view.ts:ringBadgeSvg`; 05 E1: ghost and
  notch), `dash-grow` (rg dash ring gauge and centre readout, 06 E1c, E1d; `rg:svg.ts` `grow`, `growFrom`), `liquid`
  (`wv:svg.ts:liquidRing` with `wavePath`, `bubbles`, glass and head dot; 07 E1, E2, E3), `icon` (`deck:register.js:ringSvg`,
  01 E20). Terminal: `quarter` glyph (deck E20 terminal form; `wv:terminal.ts:glyph`, 07 E18) `◔ ◑ ◕`.
- **Surfaces.** S native; R a small ring through `core-pixels` at 4 x 2 cells or more, else the quarter glyph; T the
  quarter glyph plus percent, ASCII "62%" `[PROV:P11]`; L the percent.
- **Footprint.** A non-square box is honoured: the ring is centred and the rest padded. Drop order: centre detail line,
  label, ghost, notch.
- **Motion.** Grow and the liquid slosh (`MOVE`/`OVERSHOOT` spline) derived from `nowMs`; still twin.
- **Defects.** UD07 (wv E1(b)), UD08, UD12 (wv always-on animation, A10), UD24 (wv E1(f) round cap at 0%), UD26
  (um E1.4 alt), UD28 (um E1.1, wv E1(e)).
- **Tests.** Value 0, 1, above 1, `expected` equal to value, `projected` below value; the arc at 0 draws nothing.
- **Didactic.** Arc maths and why a 0% round cap lies.

#### C5. `mods-ui-stat-tile`

- **Kinds.** `count`, `rate`, `duration`, `ratio`, `delta`: one headline value with label, optional trend and an
  optional `slot` (a render function the caller passes, for a ring or sparkline drawn by another component).
- **Variants.** `tile` (`rg:svg.ts` `tiles`, `tileW`, `tileH`; 06 E3a), `ring-tile` (wv 07 E4, E5), `card`
  (`ow:session-wrapped/hooks/card.ts:renderCard`; 04 S3 stat strip, G4 stat row), `glass` (um 05 E9), the aug gauge
  block recipe (02 E3).
- **Surfaces.** All four native; L "Tokens 1.2M, up".
- **Footprint.** Drop order: trend word, sub-label, slot, label; the value is never dropped.
- **Motion.** Optional value tween (`ow:burn-meter/hooks/burn.ts:tween`); still by default.
- **Probes.** P10, P12, P22.
- **Defects.** UD06 (rg E3a status dot by colour only), UD09 (`ow:session-wrapped/hooks/card.ts:cardHeight` derives
  height from content), UD25, UD27 (rg caption unescaped).
- **Tests.** A slot that returns the wrong size throws; the trend has a glyph and a word.
- **Didactic.** Composition through a slot instead of a component dependency.

#### C6. `mods-ui-value` (fixed-width value text)

- **Kinds.** `count`, `rate`, `duration`, `ratio`, `delta`.
- **Variants.** `plain`; `trend` (aug trend word, 02 E9); `speed` (zy speed meter, 03 V19); `percent` (zy 03 V12);
  `money`.
- **Surfaces.** All four native; it is a thin layer over `core-format` with tone and an arrow twin.
- **Footprint.** Exact width. Drop order: unit, decimals, then the compact form.
- **Probes.** P03 (Text colour keys), P11 (arrow glyphs).
- **Defects.** UD01, UD06 (a trend shown by colour only), UD15 (zy V19 reads the wall clock), UD25.
- **Tests.** The width is identical across a sweep of every value the kind can take.
- **Didactic.** Why a value column must not change width.

#### C7. `mods-ui-chip` (pill, badge, tag, monogram)

- **Kinds.** `enum`, `text`, `count`.
- **Variants.** `pill` (aug 02 E11; `ow:swarm/hooks/card.ts` `pill`, `pillX`, 04 S6; `zy.tsx:pill`), `badge` (count),
  `tag` (deck strips tier tag, see C18), `monogram` (`rg:svg.ts:monograms`, 06 E6), `collapsed` (deck 01 E21).
- **Surfaces.** S, R native; T a bordered Box (`paddingY: 0` after the border and `flexShrink: 0`, per aug E11, only
  where P03 confirms the props); L "[OK]".
- **Footprint.** The given width, with ellipsis. Drop order: icon, count, then the text is truncated; never sized by
  content.
- **Probes.** P03, P11.
- **Defects.** UD06, UD09, UD11 (aug ignores `maxRows`), UD19 (aug undocumented props), UD26.
- **Tests.** A CJK label; an empty label throws.

#### C8. `mods-ui-status-lamp` (state lamp, glyph, node)

- **Kinds.** `enum` with states `idle`, `running`, `waiting`, `ok`, `warn`, `failed`, `killed`, `done`, `unknown`.
- **Variants.** `lamp` (rg 06 E5), `glyph` (rg glyph map `◌ ● ✓ ✕`, 06 E19; zy state glyphs, 03 V14), `node`
  (ow swarm node glyph, 04 S5), `weather` (aug `☀ ☁ ☂ ☇ ↯`, 02 E5).
- **Every state has** a tone, a glyph, an ASCII twin and a word (UD06); `failed` and `killed` differ by glyph, not by
  colour (rg).
- **Surfaces.** All four native.
- **Motion.** A `running` pulse in CSS, gated by reduced motion and slower than the flash guard.
- **Probes.** P01, P11, P16, P22 (zy `STATE_COLOR` figures are `[CALC:P22]`).
- **Defects.** UD01, UD05, UD06, UD13, UD26.
- **Tests.** Every state has a distinct glyph and word; ASCII mode emits only ASCII.
- **Didactic.** Colour is never the only channel.

#### C9. `mods-ui-sparkline`

- **Kinds.** `series`, with an optional reference line.
- **Variants.** `line` monotone (`um:pane-view.ts:sparkSvg`, `um:panel-svg.ts:sparkPath`, 05 E6), `bars` (aug 02 E8;
  ow 04 B5), `blocks` (aug text sparkline 02 E7; `deck:styles-terminal.js:spark` 01 E6), `desktop` (`deck:styles-desktop.js:spark`,
  01 E13), `window-bars` (`ow:burn-meter/hooks/register.tsx:windowBar`, 04 B4).
- **Surfaces.** S, R native; T `▁▂▃▄▅▆▇█` `[PROV:P11]` with ASCII `_.-=*#`; L the last value and its trend.
- **Footprint.** The series is resampled to exactly the available columns or steps, newest on the right. Drop order:
  axis label, reference line, then coarser resampling.
- **Probes.** P10, P11, P23.
- **Defects.** UD07, UD09 (aug E7.1, E8.1 widths from content), UD24 (an all-zero series draws a baseline and "no data"
  is a distinct placeholder), UD26 (aug E8.3 alt).
- **Tests.** Empty, constant, single-point and very long series; negative values throw unless declared.

#### C10. `mods-ui-clock` (clock, stopwatch, countdown)

- **Kinds.** `duration` (`since` or `until`); wall time from `nowMs` and a caller-given time zone.
- **Variants.** `digital` (`aug:tw.mjs:clockTime`, `wv:model.ts:clockTime`), `reel` (zy rolling-reel clock, 03 V6,
  needs `liveSource`'s `{{T:}}` re-substitution), `pill` (zy hover-reveal clock pill `clockPill`, 03 V7), `countdown`
  (`wv:model.ts:countdown`, `deck:register.js:countdown`, aug cache-countdown technique 02 E10), `game`
  (ow `gameClock`, 04 T5), `readout` (rg centre readout, 06 E1d).
- **Surfaces.** All four native. On L the precision is minutes unless P08 shows the status line redraws faster, because
  a mod does not control that cadence.
- **Footprint.** Tabular digits of fixed width. Drop order: seconds, unit labels.
- **Motion.** Reel digits derived from `nowMs`; still form = static digits; the caller redraws at most once per second.
- **Probes.** P01, P02, P08, P16, P17.
- **Defects.** UD12, UD14 (a reel that restarts), UD15 (zy V19, wv, deck wall clock), UD25 (wv Turkish default).
- **Tests.** `mock.clock` sweeps across minute, hour and day boundaries; reel phase continuity; a countdown past zero
  shows "overdue" with the warn tone and a word.

<!-- end of tier 1 -->

### Tier 2

#### C11. `mods-ui-spinner`

- **Kinds.** `boolean` (busy). **Variants.** `arc` `◜◝◞◟` (ow 04 N1), `braille` dots, `shimmer` (deck 01 E5 flicker),
  `pulse`.
- **Surfaces.** All four native; the frame index is `floor(nowMs / period) mod n`, so no timer lives in the component.
- **Footprint.** One cell, or a square box. **Motion.** Always animated; still form = a static `…` (ASCII `...`).
- **Probes.** P01, P02, P08, P11. **Defects.** UD01, UD12, UD13, UD17 (ow timers in render).
- **Tests.** The frame at given `nowMs` values; the still form.

#### C12. `mods-ui-ticker` (marquee, card ticker, LED crawl, typewriter)

- **Kinds.** `text`, `list` (cards).
- **Variants.** `seamless` (`um:strip-svg.ts` `stripSvg`, `tickerMotion`, 05 E4), `cards` (`um:strip-svg.ts:cardMarkup`,
  05 E5), `led` (`um:led.ts` `buildStrip`, `textStrip`, `FONT_ROWS`, 05 E3), `typewriter` (ow inner-monologue
  `revealed`, 04 T1), with `um:scroll.ts` scroll physics (H3) for the offset.
- **Surfaces.** S (CSS translate) and R (LED crawl painted by the host frame loop) native; T and L fall back to the
  first item truncated plus "+N".
- **Footprint.** The box is fixed; content loops. Drop order: second item, separator.
- **Motion.** The offset is derived from `nowMs` (`um:desktop-state.ts:phaseAt`); the seamless copy uses scoped ids.
  Still form = the first item, static.
- **Probes.** P01, P06, P11, P14, P16, P23 (um E4.2 size `[CALC:P23]`).
- **Defects.** UD02 (ow T1 cuts by `charCodeAt`), UD07 (um E4.1), UD08, UD12 (um E3.5), UD17.
- **Tests.** Offset continuity across renders; the seam (start and end draw the same pixels); reduced motion is static.

#### C13. `mods-ui-icon`

- **Kinds.** `enum` (icon name). **Variants.** `lucide` (zy `ICON_PATH`, `BOT`, chevrons; Lucide, ISC), `weather`
  (`aug:tw.mjs` `WEATHER_ICONS`, `weatherSvg`, 02 E6), `aug` (`aug:tw.mjs` `ICONS`, `LIMIT_ICONS`, 02 E13), `deck`
  (`deck:styles-desktop.js:ICON_PATH`; its `ask` icon is zy-derived).
- **Surfaces.** S a path; R a small sprite through `core-pixels`; T a glyph twin `[PROV:P11]` and an ASCII word; L the word.
- **Footprint.** Square; strokes scale with the box. **Probes.** P11, P22.
- **Defects.** UD04, UD05 (aug E13), UD26 (every icon carries a label).
- **Tests.** Every icon has a label and a text twin; every path parses.

#### C14. `mods-ui-chip-row` (packed chips, enum chip group, chips with counts)

- **Kinds.** `list` of `{ label, count?, tone }`.
- **Variants.** `packed` (deck chip budget packer, `deck:register.js` `chips`, `chipText`, 01 H20), `enum-group`
  (deck 01 E17), `counts` (rg chips "x N", `chipH`, 06 E7).
- **Surfaces.** All four native; L "a, b, c +2".
- **Footprint.** The width budget is spent in order; the "+N more" chip's width is reserved first. One row, or the
  declared number of rows.
- **Probes.** P03, P11. **Defects.** UD01, UD06, UD09 (deck E21), UD11.
- **Tests.** Items that fit, items that just do not fit, the reserved "+N" width, stable order.

#### C15. `mods-ui-event-strip` (history squares, tick strip)

- **Kinds.** `series` of `enum`. **Variants.** `squares` (deck history squares, 01 E19), `ticks` (rg tick strip,
  06 E4a).
- **Surfaces.** All four native; T `■ □` with ASCII `# .` `[PROV:P11]`; L the last N states as letters.
- **Footprint.** Exactly N slots, newest right. Drop order: spacing between slots.
- **Probes.** P11, P22. **Defects.** UD01, UD06 (both sources tell states apart by colour only; each state gets a shape).
- **Tests.** Exactly N slots; every state has a distinct shape.

#### C16. `mods-ui-level-meter` (ordinal level)

- **Kinds.** `level`. **Variants.** `bars` (deck ordinal level meter, 01 E18), `jet` (`wv:jet.ts:jetStrip`, 07 E15),
  `wind` (wv 07 E16).
- **Surfaces.** All four native; T `▁▃▅▇` `[PROV:P11]` with ASCII `|||..`; L "3/5".
- **Motion.** wv's always-on wind animation gets a still form (UD12).
- **Probes.** P02, P11, P23 (jet size, hand-estimated at about 45-55k characters, `[CALC:P23]`).
- **Defects.** UD08, UD12, UD24 (deck E18 off by one), UD28.
- **Tests.** Every index from 0 to `of`, with its label.

#### C17. `mods-ui-ranked-bars` (share rows, leaderboard, ranked lanes)

- **Kinds.** `list` with `value` and an optional `total`.
- **Variants.** `share-svg` (um share bars, 05 E7; `um:desktop-state.ts:shareOf`), `rows` (um native bar rows, 05 E8),
  `leaderboard` (rg 06 E9), `share-rows` (`wv:register.tsx` `shared`, `shareWidth`, 07 E12), `lanes`
  (`ow:agent-race/hooks/register.tsx:laneRow`, 04 R2).
- **Surfaces.** All four native; each bar is a `fillModel` drawing.
- **Footprint.** `maxRows` with a "+N more" row; fixed rank, label and value columns.
- **Probes.** P03, P11. **Defects.** UD09 (um E7, E8), UD11, UD24 (rg E9 minimum nub), UD25.
- **Tests.** `maxRows` overflow; ties keep a stable order; zero values light nothing.

#### C18. `mods-ui-status-rows` (agent strips, status cards, task rows; review rule 10)

- **Kinds.** `list` of `{ id, label, state, ratio?, since?, tool?, tag? }`.
- **Base: the zy upstream.** `zy.tsx:stripsSvg` (from line 1232), `schemeCss`, `stripStyle`, the per-row cache
  (`StripRow`, `drawnRows`, `cachedRow`), the live clock for running rows, `toolWord`, `dotFits`, `fitStrip`,
  `stripBudget`, the index and bot gutter, the scheme backing rect; Raster strips (03 V10) and "+N more" (03 V11).
- **claude-deck deltas, listed explicitly** (both read by symbol: `deck:styles-desktop.js` `STRIP_H`, `STRIP_GAP`,
  `stripsHeight`, `stripsSvg`; `zy.tsx` `stripsSvg`, `schemeCss`, `stripStyle`):
  1. Optional single-document stacking of all rows (`stacked: true`), versus zy's per-row documents. deck's
     `stripsHeight` returns -3 when there are no rows; the port returns the declared empty-state row instead.
  2. A tag chip slot at the right (a rect at 0.25 opacity plus text) coloured by an injected `tagColor(row)` (deck
     `tierColor`), next to zy's "(model, effort)" suffix; both stay as options.
  3. An injected tool formatter (deck `stripTool(a)`) replaces zy's hard-coded `toolWord` (fixes UD28).
  4. Tool-word placement option: right after the name (deck) or right-aligned before the clock and capped at 25% of the
     width (zy, the default).
  5. Elapsed time: zy's live clock by default; deck's static "Xm Ys" when `motion: 'off'`.
  6. deck has no index or bot gutter, no scheme backing rect and no `dotFits`; the zy versions stay.
  7. Geometry: deck indent 12, row 18 px, gap 3 versus zy indent 10, row 16 px, gap 2 with the first row 5 px taller;
     zy is the default density and deck becomes `density: 'roomy'`.
  8. deck's `.sn { fill: #F0EEFC }` is dark only; the port takes both schemes from `core-tokens`.
  9. deck's fill-flow `<animate>` has no begin offset; the port uses `beginAt`.
  - Other variants: `terminal-row` (deck terminal agent row 01 E15 with the expanded-row layout E31), `cards` (rg card
    list, 06 E4; its `#d03b3b` is `[CALC:P22]`), `gutter-row` (ow 04 N2), ow terminal lanes (04 S13).
- **Surfaces.** S, R, T native; L "3 running, 1 waiting".
- **Footprint.** `maxRows` (UD11) with a "+N more" row; fixed row height from tokens.
- **Motion.** Live clock and fill flow from `nowMs`; still twins.
- **Probes.** P01, P02, P03, P09 (100,000-character text limit), P11, P19, P23.
- **Defects.** UD03, UD07, UD08 (deck D9, E14), UD09, UD11, UD15, UD28.
- **Tests.** One test per delta; 0, 1, `maxRows` and `maxRows + 1` rows; the empty state.
- **Didactic.** The row grammar (glyph, label, visual slot, value, action) shared with `mods-ui-compose`.

#### C19. `mods-ui-feed` (event feed, recent list, comms rail)

- **Kinds.** `list` of `{ t, label, kind, state }`.
- **Variants.** `feed` (`ow:agent-narrator/hooks/register.tsx` `feed`, `row`, 04 S15), `crowd`
  (`ow:sportscaster/hooks/register.tsx` `feed`, `ticker`), `recent` (rg recent list, 06 E10), `rail` (ow swarm comms
  rail, 04 S9).
- **Surfaces.** All four native; L the latest item.
- **Footprint.** Newest first; `maxRows` with "+N more"; the time column has a fixed width (`core-format`).
- **Probes.** P03, P09, P21. **Defects.** UD09, UD11, UD15, UD25.
- **Tests.** Overflow; relative times under `mock.clock`.

#### C20. `mods-ui-legend`

- **Kinds.** `list` of `{ label, tone, kind }`. **Variants.** `swatch` (rg legend 06 E2; `wv:register.tsx` `legend`,
  `legendItem`, `legendWidth`, 07 E21).
- **Surfaces.** All four native; T `■` `[PROV:P11]` with ASCII `[#]`; hatched parts show a hatched swatch.
- **Footprint.** Fixed; items that do not fit become "+N". **Probes.** P11.
- **Defects.** UD01, UD06, UD09 (`legendWidth` from content). **Tests.** Every swatch kind; overflow.

#### C21. `mods-ui-switch`

- **Kinds.** `boolean` plus a REQUIRED label. **Variants.** `switch` (`zy.tsx:switchSvg`, 03 V16), `checkbox` (`[x]`).
- **Surfaces.** S the drawing with a Button laid over it `[PROV:P05]`; R falls back to T; T a Button whose accessible
  name is the label (zy claim 4: blank labels are unnamed); L "on" or "off".
- **Probes.** P03, P04, P05, P20. **Defects.** UD19, UD26.
- **Tests.** A missing label throws; on and off differ by shape, not only colour.

#### C22. `mods-ui-segmented` (segmented control, tabs, style picker)

- **Kinds.** `enum` (options and the selected one).
- **Variants.** `segmented` (zy 03 V17), `picker` (deck style picker pane, 01 E30), `tabs` (um 05 E16;
  `wv:register.tsx:switchWindow`, 07 E13).
- **Surfaces.** S with Buttons; R falls back to T; T a Button row; L the selected label.
- **Probes.** P03, P05, P20. **Defects.** UD09, UD19, UD26.
- **Tests.** Selection is shown by shape and text as well as colour; keyboard order follows visual order.

#### C23. `mods-ui-disclosure` (fold chevron, close, collapse)

- **Kinds.** `boolean` (open) plus a label. **Variants.** `chevron` (zy fold chevron and `foldChip`, 03 V15), `close`
  (deck close Button `✕`, 01 E27), `fold` (deck fold animation, 01 E28, rebuilt without module state or wall clock).
- **Surfaces.** S, T native; R falls back to T; L the label with "open" or "closed".
- **Motion.** The fold animation has a still form. **Probes.** P03, P05, P11, P20.
- **Defects.** UD15, UD16 (deck E28), UD26 (an unnamed `✕`). **Tests.** The accessible name; the still form.

#### C24. `mods-ui-hover-card` (tooltip, hover card)

- **Kinds.** `text`, `list` of key-value pairs.
- **Variants.** `card` (`aug:tw.mjs` `hoverCard`, `tip`, `teamTip`, 02 E12), `overlay` (zy `tips`, `tipRules`,
  `hoverStyle`, 03 V5), `title` (um `<title>`, 05 E5), `tooltip` (`um:desktop-state.ts:tooltip`; wv 07 E10).
- **Surfaces.** S only (hover). R, T and L have no hover: the same facts MUST also be in `alt` or in a pane the caller
  opens, which this skill's contract checks (UD26).
- **Probes.** P03 (Box `hover`), P04, P05, P17 (CSS `:hover` in a plain Svg). **Defects.** UD03 (zy V5 tips dark only),
  UD19, UD26.
- **Tests.** Every fact in the card also appears in `alt`.

<!-- end of tier 2 -->

### Tier 3

#### C25. `mods-ui-big-text`

- **Kinds.** `text`, `count`. **Variants.** `5x7` (`ow:session-wrapped/hooks/font.ts`, 04 G1; font origin unstated,
  I5), `led` (`um:led.ts` `FONT_ROWS`, 05 E3).
- **Surfaces.** R native; S rectangles batched with `pathBatch`; T block characters `[PROV:P11]` with an ASCII form; L
  the plain text.
- **Footprint.** Characters that do not fit are dropped from the end with an ellipsis glyph cell; never resized by content.
- **Probes.** P11. **Defects.** UD01, UD09 (G1). **Tests.** Every glyph of the font set; overflow.

#### C26. `mods-ui-timeline` (Gantt, swimlane)

- **Kinds.** `intervals`. **Variants.** `gantt` (ow swarm Gantt, 04 S11, S12), `swimlane` (rg swimlane timeline,
  06 E8), `lanes` (ow terminal lanes, 04 S13).
- **Surfaces.** All four native; T lanes drawn with `━`; L a summary ("4 agents, longest 12m").
- **Footprint.** Fixed lane count with `maxRows`; the time axis is fitted to the width.
- **Motion.** Only the "now" line moves, derived from `nowMs`.
- **Probes.** P11, P23. **Defects.** UD07, UD08, UD09, UD11, UD25 (rg's axis label "-1.25m").
- **Tests.** Open intervals, zero-length intervals, negative times rejected.

#### C27. `mods-ui-tree` (tree with connectors)

- **Kinds.** `list` with `parentId` or `depth`. **Variants.** `connectors` (`ow:swarm/hooks/model.ts:tree` and its Row
  model, 04 S7, S10; ow terminal tree, 04 S19), with `peakConcurrency` (`ow:swarm/hooks/model.ts`) for a header.
- **Surfaces.** T native (`├─ └─ │` `[PROV:P11]` with ASCII `|- \- |`); S, R native; L the node count.
- **Footprint.** `maxRows`; deep levels collapse to "+N". **Probes.** P11, P19, P21.
- **Defects.** UD01, UD09, UD11. **Tests.** Orphans, cycles rejected, depth collapse.

#### C28. `mods-ui-radar-ring` (rotating history ring, orbit)

- **Kinds.** `intervals`, `series` over time. **Variants.** `history` (`rg:radar.ts` `radarSvg`, `radarGeometry`,
  `laneR`, 06 E1a), `orbit` (rg 06 E1b).
- **Surfaces.** S only; R, T and L fall back to `mods-ui-timeline`'s text lanes, chosen by the CALLER, since components
  do not import each other (the skill shows the two-line switch).
- **Motion.** Rotation derived from `nowMs`; still twin. **Probes.** P02, P16, P23.
- **Defects.** UD06 (rg E1a), UD07, UD08, UD12. **Tests.** Rotation continuity; the still frame.

#### C29. `mods-ui-ambient-band` (animated Raster band)

- **Kinds.** `ratio`, `level`, `enum` (mood). **Variants.** `fire` (`ow:burn-meter/hooks/burn.ts` `flameRows`,
  `fireCells`, 04 B1), `hazard` (`ow:launch-codes/hooks/fx.ts:hazardCells`, 04 L1), `wave`
  (`ow:inbox-alerts/hooks/wave.ts:waveFrame`, 04 W1), `shimmer` (deck flicker, 01 E5).
- **Surfaces.** R native, painted by the host frame loop; S as CSS; T falls back to a static row; L is omitted (declared).
- **Footprint.** Fills the box exactly. **Motion.** Always animated, under the host cap and the flash guard (ow's
  2.5 Hz hazard and 3 Hz banner are slowed below 3 flashes per second); still form = one static frame.
- **Probes.** P06, P13, P14. **Defects.** UD12, UD13, UD17, UD22, UD23.
- **Tests.** Frame determinism from `nowMs`; the flash guard; the still frame.

#### C30. `mods-ui-sprite-lane` (pet, boss, race track)

- **Kinds.** `enum` (mood), `ratio` (position).
- **Variants.** `pet-svg` (`deck:pet.js` `petLaneSvg`, `petFrame`, `stepPet`, 01 E24, behaviour H23), `pet-image`
  (deck 01 E25), `pixel-pet` (`ow:code-pet/hooks/scene.ts:petFrame`, 04 P1), `boss` (ow boss-fight arena), `race`
  (`ow:agent-race/hooks/race.ts` lanes and track, 04 R1).
- **Behaviour.** A pure function of (seed, `nowMs`, events); no module state.
- **Surfaces.** S, R native; I optional `[PROV:P07]` with R as fallback; T a static glyph plus the mood word; L the word.
- **Motion.** Frames from `nowMs`; the flash guard (ow's 6.7 Hz boss and 4 Hz pet fail it); still form = idle frame.
- **Probes.** P07, P11, P13, P14. **Defects.** UD13, UD15, UD16, UD17, UD26 (deck E25 and ow G5 blank alt).
- **Tests.** Deterministic frames; a non-empty, self-contained `alt`; the Image path never runs without a fallback.
- **Open.** deck's pet resembles the Claude mascot (I6).

<!-- end of section C -->

## D. Didactic skills and reference files

Doc citations below and in E point at the plugin's own chapter copies, as `<skill>/references/chapter.md:<line>`.

| # | skill | teaches | built from |
|---|---|---|---|
| D1 | `mods-ui-compose` | The A6 procedure: read the site's box, choose components by kind, surface and footprint, lay them out with the row grammar (glyph, label, visual slot, value, action), keep later mods with `await next(e)`, yield to surveys, copy the components, paste the host adapter, run `check-mod.sh`. Two worked examples: a band (bar, chip row, clock) and a pane (status rows, sparkline, three stat tiles). Ships the gallery TEMPLATE (`examples/ui-gallery/`, see I2). | aug three-mode degrade (02 H8) and band composition (H11); `wv:model.ts:bandLayout` (07 H11) and the band container (E23); deck header with hotkey (01 E26), SessionMode footer button (E29), expanded rows (E31); rg composition (06 section 1, E20) and the Strings pattern for text (E25); section headers and dividers (zy 03 V18, aug 02 E16, rg 06 E12-E13, ow 04 S4); um panes (05 E11-E14) |
| D2 | `mods-ui-howto-animate` | The caller owns the clock; phase is derived, never summed; still twins; reduced motion for CSS and for SMIL; `settleAt` and the one standing redraw; byte-stable markup (quantised time, cached frames); the change-only blit loop with back-off; redraw budgets; the flash guard. | zy H7, H8, H9, H13; um H4, H10, techniques E1-E15; rg motion fixes 1-7; wv H5, H14; deck T1-T15; ow didactic items 1-15 |
| D3 | `mods-ui-howto-surfaces` | `e.surface`; the four surfaces and the defined fallbacks; the Raster one-cell rule; the status line's `⚠ <mod>:` prefix eating width; the optional terminal Image and its fallback; ASCII mode; degrade ladders. | `mods-doc-mods-reference/references/chapter.md:268-271`; `mods-doc-mods-interfaces/references/chapter.md:472-512`; `mods-doc-mods-api/references/chapter.md:221`; aug H8 |
| D4 | `mods-ui-howto-fixed-footprint` | Review rule 4 in depth: the box comes from `bodyColumns`, `maxRows` and `scroll.bodyRows`, never `e.viewport`; designing a drop order; "+N more"; why `COLUMN_PX` is provisional; padding versus stretching. | `mods-doc-mods-reference/references/chapter.md:231,244,248`; rg F-SIZE, F-HEIGHT; ow D9; wv A9 |
| D5 | `mods-ui-howto-accessibility` | Contrast measured by script after Raster rounding; colour is never the only channel; self-contained `alt`; named Buttons; hover never the only carrier; three flashes per second; reduced motion; keyboard reach. | zy claim 4; aug E2.2, E12.2; deck E25, E27; ow D8, G5; um E1.4; WCAG 2.2 success criteria 1.4.1, 1.4.3, 1.4.11, 2.3.1, 2.3.3 |
| D6 | `mods-ui-howto-test-components` | The testkit; the SVG validator as test tooling; mutation checks on every guard; `mock.clock`; screenshots in light and dark on both surfaces; running the gallery with `claude plugin test`; why a home-made engine proves nothing. | `mods-doc-mods-testing/references/chapter.md:119,176,210-247`; um H11-H14, D1-D5; zy section 4; ow anti-pattern 16 |
| D7 | `mods-ui-howto-interactive` | Buttons and the callback-change and rerender cycle; `$.state` atoms versus `$.store`; hover overlays and their limits; opening, closing and focusing panes; `holdToasts`; hotkeys. | `mods-doc-mods-interfaces/references/chapter.md:182,342-346,683`; zy V15-V17, V22; deck E26-E30 |
| D8 | `mods-ui-howto-new-component` | How to add a component skill that fits the family: the A8 contract, the file layout, `sources.md` provenance and licence headers, the minimum tests, the menu entry, and when a family is ONE generic generator with variants versus separate skills (the user's "or generator of components, if truly generic"). | this catalogue, sections A and C |

Reference files every component skill links to instead of repeating: `mods-ui-compose/references/row-grammar.md`,
`mods-ui-howto-animate/references/motion-recipes.md`, `mods-ui-howto-accessibility/references/contrast-table.md`
(GENERATED by the P22 script, never hand-edited), and `mods-ui-core-contract/references/defect-vocabulary.md` (section
0.2 of this catalogue, so code comments and tests can cite `UDnn`).

## E. Anti-patterns the skills must teach NOT to do

| # | anti-pattern | seen in | UD | doc citation | do instead |
|---|---|---|---|---|---|
| E1 | A band tree that does not contain `await next(e)`, hiding every later mod | ow B8; um C2.7; deck AP8 | UD20 | `mods-doc-mods-interfaces/references/chapter.md:214,295` | Put `await next(e)` inside your Box; `return next(e)` when `hasSurvey` |
| E2 | Height or width from content, or rows from `e.viewport.rows` | deck D11; ow D9; wv A9; aug E11.3 | UD09, UD11 | `mods-doc-mods-reference/references/chapter.md:244,248` | Draw to `bodyColumns`, `maxRows`, `scroll.bodyRows` |
| E3 | `Date.now()`, `new Date()` or `performance.now()` in drawing code | deck D7; ow D11; zy V19; um C2.3 | UD15 | `mods-doc-mods-testing/references/chapter.md:119,210,216` (`mock.clock` drives only `$.clock`) | `await $.clock.now()` once, pass `nowMs` |
| E4 | Timers or loops inside `ui.render` or a button callback | deck E28; ow D3 | UD17 | `mods-doc-mods-api/references/chapter.md:196` | Start timers from `session.start` or the opening event |
| E5 | Redrawing above the budget or forever | ow D4; deck D14; um C2.8 | UD17 | `mods-doc-mods-reference/references/chapter.md:318` (10/s; 30/s for the visible terminal pane, expanded band and hint line) | Redraw on change and once at `settleAt`; blit Raster frames |
| E6 | `$.ui.blit` without size, or treating a refusal as unmount | ow D1, D2 | UD22 | `mods-doc-mods-interfaces/references/chapter.md:512` (same `key`, same size) | Always pass `columns` and `rows`; back off per P14 |
| E7 | Wide or ambiguous glyphs in a Raster cell | deck D1; ow N1, P1 | UD01 | `mods-doc-mods-interfaces/references/chapter.md:512` ("Each character has to be one cell wide") | `core-cells` refuses them; ASCII twin |
| E8 | SVG over the size limit, or unguarded | deck D9; um E4.2; wv E15 | UD08 | `mods-doc-mods-reference/references/chapter.md:268` (131,072 characters) | `budget` and `thin`; a size test at worst-case caps |
| E9 | More than 100,000 characters of text in one tree (long lists) | zy section 4 question | UD08 | `mods-doc-mods-reference/references/chapter.md:313` | `maxRows` and "+N more"; P09 |
| E10 | Global SVG ids and bare class names | deck D8; aug E2.1; um E4.1; rg F-IDS | UD07 | none (a DOM rule; the Desktop composes documents) | `scope(id)` for every id, class and keyframe |
| E11 | SMIL animation with no still form; CSS animation outside the reduced-motion query | deck D6; ow D7; wv A10; um E3.5 | UD12 | none in the mods docs; WCAG 2.3.3 | `withStill`; `reducedMotionCss`; P16 |
| E12 | Flashing faster than three times a second | ow D8 | UD13 | WCAG 2.3.1 | `flashGuard` |
| E13 | Dark-only colours, or hex where a theme key belongs | deck D10; ow D6; um E1-E9; wv 1.3 | UD03, UD04 | `mods-doc-mods-reference/references/chapter.md` element table (Text props, P03) | `core-tokens` light and dark; theme keys in Text |
| E14 | Information shown only by colour, or only on hover | aug E1.1; deck E19; rg E3a, E4a; aug E12 | UD06, UD26 | WCAG 1.4.1 | Glyph and word twins; facts also in `alt` |
| E15 | Blank `alt` on Image or Svg | deck E25; ow G5 | UD26 | `mods-doc-mods-reference/references/chapter.md:271` (Image takes `alt` text) | Self-contained `alt` from `label` and value |
| E16 | Swallowing errors (`catch {}`), or gating hooks with no `.catch` | aug 4.2; ow D12; zy section 4; rg A1; wv A4, A5 | UD18 | `mods-doc-mods-reference/references/chapter.md:62-63,303` (`next.error` in `.catch`) | Log with context and fail visibly |
| E17 | Unguarded `$.command.register` | um C2.2 | UD18 | `mods-doc-mods-api/references/chapter.md:49` (throws for a taken name) | Wrap, log and disable the command |
| E18 | Whole-object `$.store` writes from several sessions, or non-atomic `$.fs` files | deck D12; aug 4.8; ow R4 | UD21 | `mods-doc-mods-reference/references/chapter.md:214-215,316` (`write` is not atomic; the store is shared by every session; 4 MiB) | Per-key writes; read-modify-write per key |
| E19 | Status-line text rewritten on every event; toasts on every event | ow pushStatus (the fix) | UD17 | `mods-doc-mods-api/references/chapter.md:221` | Write on change; toast on transitions (`crossed`) |
| E20 | Undocumented props, fields or host behaviour used as fact | deck D13; aug 4.4-4.7; zy claim 4; ow D13; um C1; rg A3-A7; wv A3 | UD19 | the element and event tables in `mods-doc-mods-reference/references/chapter.md:203-271` | Use only what the generated `index.d.ts` declares; otherwise a probe |
| E21 | Shelling out or calling private endpoints for data the API exposes; gating tool calls from a UI mod; self-updaters | zy section 4, H16; wv A1, A2; um C2.9 | UD31 | `mods-doc-mods-api/references/chapter.md:290` (`$.process.run`) | Out of scope for UI skills |
| E22 | Copy-pasted helpers drifting apart | ow AP14; rg tokens; wv H3, H20 | UD29 | none | One foundation file, imported |
| E23 | Tests that assert a bug, mock the engine, or never look at pixels | ow AP16; zy section 4; deck AP10 | UD30 | `mods-doc-mods-testing/references/chapter.md:176` (the kit answers the API) | testkit, validator, screenshots, mutation checks |
| E24 | Module-level mutable state shared between instances or sessions | deck D4; ow D3; wv H5; aug 4.10 | UD16 | `mods-doc-mods-troubleshooting/references/chapter.md:265` (keep values in `$.state` or `$.store`) | State in `$.state`; components stay pure |

## F. Probe checklist

Every `[PROV:Pnn]` in this catalogue is settled here. A probe is run once, by a human or by the forge agent on a
logged-in machine, recorded in the implementing TRDD with the Claude Code version and surface, and turned into a test
or a documented constant. Items marked "brief" are the ones the brief named; the others were added while merging.

| id | probe | how | gates |
|---|---|---|---|
| P01 | CSS animation in a plain image `Svg` versus an interactive one, on Desktop (brief) | Gallery pane with both forms of one looping element; screenshots 1 s apart | C3 C8 C10 C11 C12 C18 |
| P02 | SMIL animation in the same two forms (brief) | Same, with `<animate>` | C3 C4 C10 C11 C16 C18 C28 |
| P03 | Box `hover` and `display`, Button `variant`, Text `wrap` values, Image `alt` behaviour, Text colour theme keys (brief) | Read the generated `index.d.ts` after the first load; record the declared unions | C6 C7 C14 C17 C18 C19 C21-C24, B1, B6 |
| P04 | What `isInteractive` is (brief). The docs show it only as a `$.session.start` field in `mods-doc-mods-testing/references/chapter.md:138`; the corpus uses it about Svg | Read `index.d.ts`; compare with zy V5 and wv A3 usage | C3 C21 C24 |
| P05 | A Button laid over an Svg: hit area, order, focus (brief) | Gallery pane with a Button over a ring | C3 C21 C22 C23 C24 |
| P06 | Blit throughput: maximum useful rate, and whether blits count against the redraw throttle | Gallery Raster at 15, 30, 60 frames per second; count painted frames | C12 C29 B13 |
| P07 | Terminal Image: detection of support (kitty 0.28+, Ghostty), behaviour in tmux and background sessions, `alt` shown on fallback | Run the gallery in each terminal | C30 B12 |
| P08 | Status-line redraw cadence, which a mod does not control (brief) | `$.ui.status` with a seconds counter; observe | C10 C11 |
| P09 | The 100,000-character tree-text limit: what is counted and per what | A pane with a growing list; find the cut | C18 C19 E9 |
| P10 | Whether the Desktop draws an `Svg` at its `viewBox` size or scales it to the pane (brief) | Two Svgs of different viewBox in one pane; measure | A8 swap guarantee, C1-C5 C9 |
| P11 | Terminal width of every glyph used: `● ✓ ✕ ◌ ○ ◔ ◑ ◕ ■ □ ▶ ✈ ◜ ◝ ◞ ◟ ☀ ☁ ☂ ☇ ↯ ━ ╍ ─ ▀ ▄ ▁▂▃▄▅▆▇█ ├ └ │ ↑ ↓ …` and Braille (brief) | A Raster and a Text row per glyph in iTerm2, Terminal.app, kitty, Ghostty, WezTerm, VS Code, with East Asian Ambiguous set wide and narrow | every component's T and R forms, B3 B11 B12 |
| P12 | Desktop pixels per terminal column (`COLUMN_PX`); the corpus guesses 7, 7.25, 7.5 and 8 | Measure a pane of known `bodyColumns` | B1, C5 |
| P13 | Raster 4-bit palette rounding (q17) (brief) | Paint a 256-step ramp; read back screenshots | B5 B12, C1 C29 C30 |
| P14 | How blit refuses and backs off: the shape of a refusal (`deny`), and the right back-off (brief) | Blit faster than allowed; log every result | B13, C12 C29 C30 |
| P15 | Whether a Desktop Svg follows `prefers-color-scheme` | Toggle the app theme with a gallery Svg open | B6, all S forms |
| P16 | Whether a Desktop Svg sees `prefers-reduced-motion` (the CSS half of review rule 6) | Toggle the OS setting | C1 C3 C4 C8 C10 C12 C28 |
| P17 | CSS `:hover` inside a plain image Svg | Hover the gallery track marks | C3 C10 C24 |
| P18 | Terminal light or dark background detection for palette choice (zy H16 was skipped as fragile) | Compare available signals on light and dark terminal themes | B6 |
| P19 | Band sizing: `maxRows` and `bodyColumns` when later mods add content through `next(e)` | Two gallery mods in one band | C18 C27, D4 |
| P20 | Keyboard reach of Buttons and hotkeys in the terminal (deck's hotkey 0) | Tab and hotkey through a gallery pane | C21 C22 C23 |
| P21 | Pane scrolling with a fixed-height tree and `scroll.bodyRows` | A pane taller than the window | C19 C27 |
| P22 | Contrast of every palette pair, computed by script AFTER q17 for Raster (brief: "computed by script, not by hand") | `mods-ui-core-tokens/references/contrast.test.ts` over both palettes; emits `contrast-table.md` | B5 B6, C2 C8 C13 C15 C18 |
| P23 | Worst-case SVG character counts per component and variant, computed by script (brief) | `svg-size.test.ts` renders each at its declared caps and asserts under 131,072 | B9, C2-C4 C9 C12 C16 C18 C26 C28 |

## G. Licence map

| repo | SHA | licence | copyright line for NOTICE | notes |
|---|---|---|---|---|
| nvr0x5/claude-deck | 1ecf6deb9199d3b1fa570bf08a57e69772bbb5af | MIT | nvr0x5 | Parts derived from zycck (hash, textWidth, ICON_PATH.ask, the `.2 .8 .2 1` spline, twinkle timings, pixel density formulas, passed-mark colour, strips geometry and CSS, parsePlan, lastHead glide): carry BOTH notices on those files |
| augiefra/claude-mods | 797ec6a14cec30b0dceafb2aa910e1add8a3393e | Apache-2.0 | Eric Cologni | Token Weather sections are adapted from Anthropic PBC (Apache-2.0): keep that line too. batch/toolText code (and possibly `fit`) adapted from agentpane (MIT, Anji Xu). Apache-2.0 requires the licence text, a NOTICE, and a statement of changes in each modified file |
| zycck/claude-mods | b77335ee560c609d67ae85c7321f886719361426 | MIT | Kirill Serditov | `ICON_PATH`, `BOT` and chevrons are probably Lucide (ISC): verify each path against Lucide before shipping |
| OneWave-AI/claude-code-mods | e6da26ca36a88eec3be25605d30fa20f2c1c0cec | MIT | "Claude Code Mods contributors" / OneWave AI | The 5x7 font (`session-wrapped/hooks/font.ts`) has no stated origin (I5) |
| aycandv/claude-usage-meter | 52b1130bddedc9cc9127e370a2f970429254647e | MIT | Aycan Deniz Vit | |
| Regia (corpus folder `purpleheads2026_Mod_claude`) | f30974ef0d0b985931af5865529e0809143b4ff2 | MIT | Samuel (Samuel-Aldeia) | Credits a dataviz tool for its METHOD only; no code from it, so no notice needed. Folder name versus author to confirm (I11) |
| BatuhanCakmakk/wavy-usage | c5e6937dd7996b8b5d7c597f220bf7caf8f265dc | MIT | Batuhan Çakmak | "Inspired by" usage-band, cache-ttl-timer, claude-runway: no code from them |
| Lucide | to pin when verified | ISC | Lucide Contributors | Only through zy (and deck's zy-derived `ask` icon) |

Mechanics:

- Every ported file starts with a header naming each origin as `repo@sha path:symbol`, its SPDX id and "modified by
  Emasoft" with a one-line summary of the change (Apache-2.0 section 4(b) for aug-derived files).
- `NOTICE` gains one entry per origin group, in the existing per-group format (the BeLazy167 MIT entry is the model),
  plus an Apache-2.0 group naming Eric Cologni and Anthropic PBC with the licence text in `LICENSES/Apache-2.0.txt`.
- `copy-ui.sh` writes the same entries into the user's mod (`THIRD_PARTY_NOTICES.md`) for exactly the files it copied,
  so the obligation travels with the code.
- Mixing Apache-2.0 files into the MIT plugin is allowed; the plugin stays MIT for its own code, and the Apache files
  keep their licence (I4 asks whether to accept that or re-implement those parts).

## H. Plugin integration work

Each item names the file and line the survey found; the implementing TRDD re-reads each before editing.

1. **Structure guards** (`tests/test_plugin_structure.py`):
   - :111-113 hard-coded counts 65 / 61 / 3: add the `mods-ui-` count (51) and update the total, or derive the counts
     from the menu (preferred: one source of truth).
   - :41 `TUTORIAL_SKILLS` and the survey's `SKILL_DIRS`: add the `mods-ui-` family as a recognised prefix.
   - :75, :143-148 naming and `user-invocable: false`: unchanged; the new skills comply.
   - :109-118 `agents/openai.yaml`: unchanged; every new skill ships one.
   - :313 scripts only in quickstart: unchanged; `copy-ui.sh` lives there.
   - :339 code only under `mods-tutorial-*/examples/<ex>/`: extend to allow `skills/mods-ui-*/references/*.ts` (and
     `.test.ts`, `gen-width.mjs`) and the gallery template location chosen in I2.
   - :563 example manifests depth: allow the gallery template if I2 puts it in `mods-ui-compose`.
   - :164-170 `test_agent_preloads_every_skill_and_only_existing_ones` accepts only `mods-doc-*` names: extend only if
     the forge agent preloads `mods-ui-compose` (item 4).
   - New tests: `test_ui_prerequisites_match_imports` (A5), `test_ui_no_component_imports_component`,
     `test_ui_no_tone_literals_outside_tokens` (B6), `test_ui_every_skill_has_sources_md`,
     `test_ui_licence_header_present`.
2. **Menu** (`tests/test_skills_menu.py:924,931`, every skill named exactly once): add a `### UI components` group to
   `mods-the-skills-menu` with three tables (foundation, components by tier, how-to), each row naming value kinds and
   surfaces so routing can match. `:979` SKILL.md under 500 lines applies to every new skill and to the menu.
3. **Preload cap** (`tests/test_skills_menu.py:54`, `PRELOAD_LIMIT` 32): the 51 UI skills are NOT preloaded; agents
   load them on demand by name through the menu. The expert agent's `skills:` list and routing table stay unchanged.
4. **Agents.** `mods-forge-agent`: add a "UI components" paragraph (load `mods-ui-compose` first, then components by
   name; never hand-draw a component the family has; copy with `copy-ui.sh`). Optionally preload `mods-ui-compose`
   (needs the :164-170 change). `mods-expert-developer-agent`: one routing sentence pointing UI work at the forge agent.
5. **CI step.** A new job in the existing workflow: `actions/setup-node` (Node 24, built-in cache), then
   `npx --yes tsx@<pinned> --test "skills/mods-ui-*/references/*.test.ts"` and
   `npx --yes typescript@<pinned> tsc --noEmit -p skills/mods-ui-tsconfig.json` (strict, `noUncheckedIndexedAccess`,
   no host types needed because the library is `$`-free). Runner: **tsx**, because component imports use the house
   `.js` specifiers and Node's own type stripping does not map `./text.js` to `text.ts`. Plus a job that runs
   `copy-ui.sh` on the gallery template in a temporary directory and type-checks the result. `jscpd` keeps threshold 5
   with no new excludes (A7).
6. **Gallery and screenshots.** The gallery mod renders every component and variant at three sizes on every surface.
   `check-mod.sh` (`tsc`, `claude plugin validate`, `claude plugin test`) runs it locally on a logged-in machine; CI
   cannot, because `claude plugin test` needs authentication. Screenshots in light and dark, terminal and Desktop, go
   to `reports/screenshots/` (gitignored); a human reviews them before any image is committed to the README. The live
   Desktop check and every probe in F need a human.
7. **Copy script.** `skills/mods-tutorial-quickstart/scripts/copy-ui.sh` with tests in `tests/test_mod_scripts.py`
   (closure resolution, import rewrite, notice writing, refusal to overwrite a locally modified file).
8. **Validation.** CPV strict must stay at zero findings with `.ts` files under `skills/*/references/`; run it on the
   first foundation skill before building the rest (unknown until tried). README skill table, CHANGELOG and a minor
   version bump through the canonical pipeline.
9. **Tracking.** One TRDD for the probes (F) first, then one per foundation skill, one per tier of components, one for
   the didactic skills and one for each guard change, each with its derived TRDDs (guards, menu, NOTICE, CI).

## I. Open questions for the user

1. **Prefix.** `mods-ui-*` (recommended: a clean family, but it changes the count, prefix and code-placement guards in
   H1) or `mods-tutorial-ui-*` (fits the code-placement rule, but inherits the tutorial notice wording and still
   changes the counts)?
2. **Gallery location.** Inside `mods-ui-compose/examples/ui-gallery/` (needs the :339 and :563 guard changes) or as a
   new example under `mods-tutorial-interface-mods/examples/` (fits today's rules)?
3. **Duplication.** The plan avoids jscpd hits by keeping component code only in skills and filling templates with
   `copy-ui.sh`. Is a template-only gallery acceptable, given the owner's "never settle it with a jscpd exclude"?
4. **Apache-2.0 code.** Accept aug's Apache-2.0 files (and the Anthropic PBC line) with NOTICE obligations inside the
   MIT plugin, or re-implement those parts (the two-value gauge, hatched capsule, hover card, weather icons) from the
   technique only?
5. **The OneWave 5x7 font** has no stated origin: ship it, ask OneWave AI, or draw a replacement?
6. **Branding.** claude-deck's pet resembles the Claude mascot. Port it, or ship a neutral sprite for the sprite-lane
   examples?
7. **Scope.** Confirm that out-of-scope behaviours (private endpoints, tool-call gating, self-updaters, UD31) are
   excluded from every UI skill, even as examples.
8. **Terminal colours.** If P03 shows Text accepts theme keys, should terminal Text always use them (the user's theme
   wins) and never hex?
9. **Terminal Image.** Ship the optional Image path at all (kitty 0.28+ and Ghostty only), or leave it as a how-to note?
10. **Test runner.** Pin `tsx` through `npx` in CI (no `package.json`), or add a minimal `package.json` with pinned
    dev dependencies?
11. **Attribution.** The Regia corpus folder is `purpleheads2026_Mod_claude` while report 06 names the author Samuel
    (Samuel-Aldeia). Which name goes in NOTICE?
12. **Preload.** Should the forge agent preload `mods-ui-compose`, or should every UI skill load only on demand?
13. **Variant count for the first release.** Every variant listed in C, or the best one per family first (bar
    `eighths`, stacked `capsule`, track `stream`, ring `forecast`, status rows `strips`) with the rest in later
    increments?

<!-- end of catalogue -->
