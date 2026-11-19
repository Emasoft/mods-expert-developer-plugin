# What the generated mod relies on

## Table of Contents

- [Where the facts live](#where-the-facts-live)
- [Layout](#layout)
- [Hooks and return shapes the scaffold uses](#hooks-and-return-shapes-the-scaffold-uses)
- [Static rules](#static-rules)
- [Failure behaviour](#failure-behaviour)
- [Limits that matter here](#limits-that-matter-here)
- [Switches and options (PRRD G13)](#switches-and-options-prrd-g13)
- [The debug log (PRRD G14)](#the-debug-log-prrd-g14)
- [State](#state)
- [Tests](#tests)
- [Paths](#paths)

Adapted from skills/skill-to-mod/references/mod-contract.md of arm-pz/skill-to-mod (MIT, see NOTICE). This page is a map, not a second copy of the documentation: each section names the chapter skill of this plugin that holds the facts, and the chapter wins on any disagreement. For API names and type shapes, the type files the installed build writes into `<mod>/.claude-plugin/types/` after the mod has loaded once win over both.

## Where the facts live

| Topic | Chapter skill, section |
| --- | --- |
| Files of a mod, the hook function, every event, every API method, limits | `mods-doc-mods-reference`: "Files", "The hook function", "Events a mod can hook", "Mods API methods", "Limits" |
| Writing a mod by hand, the static rules the validator enforces | `mods-doc-mods-development`: "Write a mod yourself", "Change and test a mod" |
| How a hook handles an event, tool calls and prompts, `.catch` | `mods-doc-mods-and-events`: "How a hook handles an event", "Hook tool calls, prompts, and turns", "Mod ordering and failed hooks" |
| Commands, tools, model calls, files, processes and the network | `mods-doc-mods-api` |
| Panes, bands, status lines, state across reloads | `mods-doc-mods-interfaces` |
| Tests with `claude plugin test` | `mods-doc-mods-testing`: "Write a mod test" |
| `userConfig`, `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` | `mods-doc-plugin-manifest-reference`: "User configuration options", "Environment variable resolution and quoting" |
| The debug log, a skipped hook | `mods-doc-mods-troubleshooting`: "Read the debug log", "A hook is skipped or a mod is unloaded" |
| Where mods run, trust, turning mods off | `mods-doc-mods-overview`: "How a mod works", "Decide whether to trust a mod", "Turn mods on or off" |

## Layout

The scaffold writes the layout of `mods-doc-mods-reference`, "Files":

```text
<plugin>/
├── .claude-plugin/plugin.json   name, version, description, keywords, userConfig (the switches)
├── hooks/hooks.json             { "modules": ["./register.js"] }
├── hooks/register.js            export function register(on, options = {})
├── skills/<skill>/              the source skill, copied unchanged
├── tests/<plugin>.test.ts       run by claude plugin test
└── README.md                    behaviour, switches, debug log, trust block
```

`options` holds the `userConfig` values with defaults filled in. The `= {}` default only keeps `register` safe if a host passes nothing.

## Hooks and return shapes the scaffold uses

| Event | Used by | What the generated hook returns |
| --- | --- | --- |
| `tool.call` on `{ tool: 'Bash' }` | gate | `next(e)`; `{ deny: reason }` with an instruction Claude can act on; in `nudge` mode the result of `await next(e)` with one more `context` line |
| `tool.call` on Edit, Write, MultiEdit, NotebookEdit | stale-on-edit | the result of `await next(e)`, unchanged; it only clears the record of checks |
| `skill.prompt` | gate | `next(e)`; it records `e.skill`, which is `name` or `plugin:name` |
| `prompt.submit` | prime | `next({ ...e, context: [...(e.context ?? []), line] })`, never a rewrite of the user's text |
| `session.start` | command | `next(e)` after `$.command.register(...)`, skipped when the `command` setting is off |
| `command.run` on `{ command: name }` | command | `{ text }` |

## Static rules

From `mods-doc-mods-development`, "Change and test a mod": event names in `on(...)` are string literals; every API call is written in full (`$.ui.status(...)`), never aliased; `$` may go only to a function that the same file declares at its top level (the generated `debugLog`, `showStatus`); imports are relative files inside the plugin plus the bare `claude-code`, as `import` declarations at the top. `claude plugin validate` prints `hooks:` and `calls:` lines, which are the trust surface that the verify step copies into the README.

## Failure behaviour

From `mods-doc-mods-and-events`, "Handle a hook that fails": a hook that throws, times out or returns the wrong shape is skipped when it failed before calling `next`, and its result stands when it failed after. A `.catch` handler decides instead; inside it `next.error.kind` is `throw`, `timeout` or `re-entry`, and `next.called` says whether the hook had called `next`. Every generated hook has a `.catch` that fails open (`return next(e)`) and writes the kind to the debug log. Only a real guard fails closed, and a reminder is not one.

## Limits that matter here

From `mods-doc-mods-reference`, "Limits": a hook has 10 seconds of its own time per event (50 ms for `prompt.edit`), not counting time inside a mods API call such as `$.ui.ask`, so a question can wait for a person; a `.catch` handler has 1 second; command names are letters, digits, `_` and `-`, up to 64 characters; one `claude plugin test` test has 5 seconds unless it sets `timeoutMs`.

## Switches and options (PRRD G13)

Each function gets a boolean in `userConfig` (`mods-doc-plugin-manifest-reference`, "User configuration options"): `gate`, `staleOnEdit`, `statusLine`, `prime`, `command` and `debugLog`, as the spec asks for them. `mode` is a string with fixed options (`ask`, `block`, `nudge`), shown as a picker. The user changes a default with `/plugin configure <plugin>@<marketplace>`; `/<command> <function> off|on` changes one for the session, `/<command> off` snoozes every function but the debug log, and `/<command>` lists each function and whether it is on.

## The debug log (PRRD G14)

The generated `debugLog($, level, text)` writes `$.ui.log(NAME + ' ' + level + ': ' + redact(text), { to: 'debug' })` only while the `debugLog` setting or its session switch is on. `{ to: 'debug' }` sends the line to the debug log alone, never to the transcript; the option is declared in the type files of the installed build (`log: (text, options?: UiLogOptions)`, `to` being `transcript` or `debug`) and used by this plugin's own mods-manager. The user reads it by starting Claude Code with `--debug` or `--debug-file <path>` (`mods-doc-mods-troubleshooting`, "Read the debug log"). `redact()` masks values of keys that name a secret, Bearer and Basic credentials, credentials in URLs, known token prefixes and long random-looking strings, and replaces each with a label that names its kind, such as `[REDACTED:github-token]`: the style of this plugin's debug-log masker (`hooks/debug-log/redact.ts`).

## State

Module variables live until the module reloads; they are all the generated mod needs. For state that must survive a reload or be shared, see `mods-doc-mods-interfaces`, "Keep state across reloads and sessions" (`$.state` and `$.store`), and add the call to the trust notes.

## Tests

From `mods-doc-mods-testing`, "Write a mod test": files end `.test.ts`; `test` and `expect` come from `claude-code/testing`; each test gets `($, on)`, where `$` fires events through the mod (`$.tool.call`, `$.skill.prompt`, `$.prompt.submit`, `$.command.run`, `$.session.start`) and `on` registers the stubs that stand in for Claude Code beneath it. Every `$` call the mod makes needs a stub (`ui.status`, `ui.toast`, `ui.log`, `command.register`); `$.ui.ask` reaches a `tool.call` stub as an `AskUserQuestion` call; `session.start` needs its own stub and must be fired before anything that depends on it; `userConfig` values come as `test(name, { options: {...} }, body)`.

## Paths

The scripts of this skill read their own files from `${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/` and write nothing there. The spec goes under `${CLAUDE_PLUGIN_DATA}/skill-to-mod/specs/`, the mod into a folder the user names. The generated mod itself reads and writes no file.
