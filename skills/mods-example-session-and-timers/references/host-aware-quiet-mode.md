# Host-aware quiet mode

Reference notes on a mod that keeps quiet when Claude Code runs inside a code editor: no toasts, no decorative drawing, and its unrequested messages as dim log lines. Notes are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-overview` ("Where mods run"), `mods-doc-mods-api` (`$.ui.toast`, `$.ui.log` and `$.env`) and `mods-doc-mods-reference` (the API table).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each source does it](#how-each-source-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Sources](#sources)

## What it is

A setting with three values that decides whether a mod speaks up: `on` keeps it quiet everywhere, `off` never, and `auto` only while Claude Code runs inside a code editor. When the mod is quiet, a message the person did not ask for becomes a dim transcript line (`$.ui.log`) instead of a toast (`$.ui.toast`), and a drawing drops its decoration, shows plain text, or shows only when the person can act on it.

What the chapters state: hooks run in the chat panel of the VS Code extension, but nothing a mod draws appears there, and a drawing mod can tell where it runs and fall back to transcript lines or command replies (`mods-doc-mods-overview` lines 205-216). A log line is dim and Claude does not read it; a toast leaves after a few seconds (`mods-doc-mods-api` lines 222-223). How a mod tells that it runs inside an editor is stated by no chapter and no generated type: the two variables the module reads are host facts the source relies on, UNVERIFIED.

## When to build one

- The mod shows toasts, art or a strip that suit a terminal but crowd an editor, where the person works beside the code.
- The mod must keep working where its drawings do not appear (the chat panel of the VS Code extension) and say what it has to say as log lines there.
- The person must be able to choose: always quiet, never quiet, or decided by the host.

## How each source does it

### tokensaver 0.4.0 (MIT)

- The plugin options carry a `quiet` field with the values on, off and auto, auto when unset; a value outside the three falls back to auto (src/runtime/config.ts:40-52). Its comment gives the reason for auto: the editor panel draws no glyph art and shows every toast as a notification. That claim about the panel is the source's own, UNVERIFIED.
- The editor check is true when TERM_PROGRAM, in any case, is vscode, or when CLAUDE_CODE_ENTRYPOINT contains vscode or cursor; quiet holds when the setting is on, or auto with the check true (src/runtime/config.ts:79-89).
- Both variables are read when the session starts, and read once more on each display sync, next to the list of surfaces (hooks/register.tsx:351-358 and 686-694). The comment on the host step says a hot reload loses what the session start read (src/runtime/session.ts:271-275).
- One notify function routes every unrequested message: a log line when quiet, a toast otherwise (hooks/register.tsx:271-278).
- Quiet changes the drawings. The strip above the prompt shows only when it offers the person an action, never for a passing mood (src/ui/clawd.ts:431-443); the terminal strip drops its glyph face for a dim label, the text and the meter (src/ui/clawd.ts:445-456); the pane shows one line of speech instead of the art (hooks/register.tsx:1206-1220); the note under a trimmed tool output loses its glyphs (hooks/register.tsx:1100-1111); and the pane no longer opens on its own beside the transcript (hooks/register.tsx:362-372).
- The command `/tokensaver quiet` takes on, off or auto, and also answers to `subtle`. With no word it flips what the person sees now, so a quiet session becomes off and a loud one on (src/runtime/commands.ts:66-70, src/runtime/session.ts:989-999). The reply says whether quiet is in effect.

## Reference module

### Reference module, host-aware-quiet-mode, MIT (this plugin)

```ts
// Quiet mode keyed on the host. The caller reads TERM_PROGRAM and CLAUDE_CODE_ENTRYPOINT with $.env.get and string
// literals, passes the values here, and sends each message the person did not ask for where notifyChannel says.
export type QuietSetting = 'auto' | 'on' | 'off'

export type HostEnv = {
  TERM_PROGRAM?: string | undefined
  CLAUDE_CODE_ENTRYPOINT?: string | undefined
}

// Which values mean a code editor. UNVERIFIED host facts, taken from the source and named by no chapter and no
// generated type: the terminal built into VS Code and its forks sets TERM_PROGRAM to vscode, and the editor
// extensions name themselves in CLAUDE_CODE_ENTRYPOINT. Pass a rule of your own for another editor.
export type EditorRule = { termPrograms: readonly string[]; entrypointWords: readonly string[] }
export const EDITOR_RULE_DEFAULTS: EditorRule = { termPrograms: ['vscode'], entrypointWords: ['vscode', 'cursor'] }

// True when TERM_PROGRAM equals one of the rule's names or CLAUDE_CODE_ENTRYPOINT contains one of its words, case
// ignored. An unset or empty variable never matches, and neither does an empty name or word in the rule.
export function isEditorHost(env: HostEnv, rule: EditorRule = EDITOR_RULE_DEFAULTS): boolean {
  const term = (env.TERM_PROGRAM ?? '').toLowerCase()
  const entry = (env.CLAUDE_CODE_ENTRYPOINT ?? '').toLowerCase()
  const byTerm = term !== '' && rule.termPrograms.some(name => name.toLowerCase() === term)
  const byEntry = entry !== '' && rule.entrypointWords.some(word => word !== '' && entry.includes(word.toLowerCase()))
  return byTerm || byEntry
}

// Whether the mod keeps quiet now: on and off decide alone, auto follows the host.
export function isQuiet(setting: QuietSetting, isInEditor: boolean): boolean {
  return setting === 'on' || (setting === 'auto' && isInEditor)
}

// A setting from the store, the plugin options or the command line: one of the three words, any case, outer spaces
// dropped. Anything else is undefined; the caller keeps its default or answers in its own words.
export function parseQuietSetting(value: unknown): QuietSetting | undefined {
  if (typeof value !== 'string') return undefined
  const word = value.trim().toLowerCase()
  return word === 'auto' || word === 'on' || word === 'off' ? word : undefined
}

// The setting after the command. An empty argument flips what the person sees now: quiet becomes off and loud becomes
// on, so an empty argument leaves auto, which comes back only when named. A word sets it; anything else is undefined.
export function nextQuietSetting(argument: string, isQuietNow: boolean): QuietSetting | undefined {
  if (argument.trim() === '') return isQuietNow ? 'off' : 'on'
  return parseQuietSetting(argument)
}

// Where a message the person did not ask for goes: a toast when the mod may speak up, a dim log line when it is quiet.
// The reply to something the person asked for, such as a command, is not routed here.
export function notifyChannel(isQuietNow: boolean): 'toast' | 'log' {
  return isQuietNow ? 'log' : 'toast'
}
```

The behaviour tests are in tests/reference-modules/host-aware-quiet-mode.test.ts.

In the hook: read both variables with `$.env.get('TERM_PROGRAM')` and `$.env.get('CLAUDE_CODE_ENTRYPOINT')` each time the display is brought up to date, compute `isQuiet(setting, isEditorHost(env))`, and call `$.ui.log(text)` where `notifyChannel` answers log, `$.ui.toast(text)` where it answers toast. A drawing reads the same answer to drop its decoration.

## Surfaces

Terminal: works. The module is a pure function of two values the caller reads with `$.env.get`. In an editor's integrated terminal drawings do appear (`mods-doc-mods-overview` line 211), so quiet there is the person's choice, not a need.

Desktop: works the same in the Code tab of the Desktop app (`mods-doc-mods-overview` line 212), except in a WSL session, where plugins are not available (line 213). Whether Desktop sets either variable is UNVERIFIED; with neither set, auto stays loud.

The chat panel of the VS Code extension: hooks run and nothing the mod draws appears (`mods-doc-mods-overview` line 214), which is where quiet matters most. What the panel does with a toast is UNVERIFIED.

This module draws nothing: it has no pane, bar, button or text of its own, since the caller words every message, so there is no style to set and no show or hide control to add.

Operating systems: any; the module is a pure function.

## Traps

- Read the host again each time the display is brought up to date, not only in `session.start`. tokensaver does so because, by its comment, a hot reload loses what the start read (UNVERIFIED). The interface chapter states that /clear, /resume and /branch reset `$.state` without running `session.start` again (`mods-doc-mods-interfaces` line 822), so a value kept only from the start can go stale.
- The variable names must be string literals in `$.env.get`; `claude plugin validate` lists the names a module reads (the generated types, at `$.env.get`).
- An editor's integrated terminal sets TERM_PROGRAM too, so auto is quiet there as well, although drawings appear. If you want quiet only in the chat panel, pass a rule with an empty `termPrograms` list.
- The documented signals for a session that draws nowhere are an empty `$.session.surfaces()` and a null `surface` in `session.start` for a `-p` run or the SDK (the generated types). They do not name an editor; combine them with this check by computing your own `isInEditor` before calling `isQuiet`.
- Quiet routes only what the person did not ask for. The reply to a command stays the command's reply, and an error the person must act on still has to reach them, at least as a log line.
- A command word outside on, off and auto gives undefined: answer in your own words rather than guess. An alias such as tokensaver's subtle belongs in your command parser, not in this module.
- The setting is the person's: keep it in the plugin options or in `$.store`, which every session on the machine shares (`mods-doc-mods-reference`, the `$.store` row). A stored value that no longer parses falls back to your default.

## Sources

- tokensaver 0.4.0 src/runtime/config.ts:1-7, 40-52, 79-89, MIT
- tokensaver 0.4.0 src/runtime/session.ts:271-275, 888-889, 989-999, MIT
- tokensaver 0.4.0 src/runtime/commands.ts:66-70, MIT
- tokensaver 0.4.0 src/ui/clawd.ts:431-456, MIT
- tokensaver 0.4.0 hooks/register.tsx:271-278, 351-372, 686-694, 1100-1111, 1206-1220, MIT
