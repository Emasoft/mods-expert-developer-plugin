# Traps the chapters do not settle

## Table of Contents

- [How to read this table](#how-to-read-this-table)
- [The traps](#the-traps)

## How to read this table

Claims from the source tutorial that the chapter skills do not confirm. Each row is marked UNVERIFIED unless a type file settled it. Test an UNVERIFIED row on your build before relying on it, and prefer the documented call the Status column names.

## The traps

| Trap from the source | Status |
|---|---|
| Run a slash command with `$.command.run({ command: 'compact' })`, not `$.prompt.submit` | UNVERIFIED. Chapters: only `run`, and `$.session.compact` for compaction. 2.1.309 type docs: `$.session.compact` is the `/compact` call, refused mid-turn; `$.command.run` lists `compact` as an example, refused in a hook the turn waits on. |
| A rewritten result returned as `{ ...r, text }` is ignored, because `text` and `ref` are set by core; answer `{ result: newResult }` | UNVERIFIED. `redact-output` follows this shape. |
| A path guard is bypassed by `..`, symlinks or other spellings; allow-list on `(await $.fs.stat(path, { resolve: true })).realPath` | UNVERIFIED API. Normalising a path first is sound either way. |
| `mobile` has no `Input` and `vscode` no `Client` | UNVERIFIED. The reference confirms only that `Raster` and `Image` draw in the terminal. |
| `h` is a global in a `.tsx` hooks module | UNVERIFIED. |
| A `Client` module path must be a string literal | UNVERIFIED. |
| `tsc` rejects a mount target unless `props` are the site's full props; copy the `PANE` constant of `notes-pane` | UNVERIFIED. |
| `claude plugin test` reports `the rollout switch served off` for users on an LLM gateway | UNVERIFIED. |
| A `*` hook also fires while the mods API is being built at `engine.create`, when `$` has no members yet | UNVERIFIED. The reference lists `engine.create` (`mods-doc-mods-reference`, section "Other mods"), not `*` hooks there. |
| Testing a mod that relies on a second mod requires the second plugin to be installed and loaded first | UNVERIFIED. The events chapter says only that dependency order follows the manifest `dependencies` (`mods-doc-mods-and-events`, section "The order mods run in"). |
| Loading the built-in `plugin-authoring` skill starts the dev-mods watch | UNVERIFIED. The development chapter says only that the first saved file prompts for hot reloading (`mods-doc-mods-development`, section "Ask Claude for a mod"). Expect the hot-reload prompt on your first save. |
| Under `tsc` against the generated types, a test that fires `$.command.run` must pass `origin` and `presentation`, a test that fires `turn.complete` must pass `reason` and takes no `usage: null`, and a stubbed `$.command.register` handler must return `{ value: { command } }` | VERIFIED (2.1.310), with `strict` and `noUncheckedIndexedAccess` on (so `strictNullChecks` is on). Declarations, by name in the 2.1.310 types (`grep -n` the name in the `index.d.ts` under your own `.claude-plugin/types/claude-code/`): `CommandRunInput` requires `origin` and `presentation`; `PromptOrigin` has kind `composer`; `CommandPresentation` is `{ isFullscreen, columns }`; `TurnCompleteInput` requires `reason` (`TurnCompleteReason`: `answer`, `aborted`, `refusal`, `error`), and its `usage` is `usage?: TurnUsage` (optional, `null` excluded, so absent rather than null); the `command.register` entry of the `OpValueOf` map type (the result of `$.command.register`, declared as `Promise<OpValueOf['command.register']>`) is `{ command: string }`, so the handler returns `{ value: { command } }`, not the `{ value: undefined }` the chapters show. The short forms in `mods-doc-mods-testing` and `mods-doc-mods-development` pass at runtime but fail `tsc`. The `RUN` and `DONE` constants of the `protect-files`, `git-poller` and `turn-timer` example tests are the type-clean form. |
