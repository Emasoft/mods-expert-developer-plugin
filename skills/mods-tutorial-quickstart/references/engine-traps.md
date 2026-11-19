# Engine traps, indexed by symptom

Look up what you see, not what you suspect. Each row gives the symptom, the likely cause, the fix, a tag and, for anything not yet confirmed, the run that would settle it.

## Table of Contents

- [How to read this file](#how-to-read-this-file)
- [The mod does not load](#the-mod-does-not-load)
- [A hook misbehaves](#a-hook-misbehaves)
- [State and timers](#state-and-timers)
- [Drawing](#drawing)
- [Platform and packaging](#platform-and-packaging)
- [Open issues](#open-issues)
- [Stale or conflicting claims](#stale-or-conflicting-claims)

## How to read this file

Every row carries one tag.

- **CHAPTER** means a chapter skill states the fact. The tag names the chapter skill and the section title, so you can open it and check.
- **UPSTREAM** means the fact was read in a public source on a date, pinned to a commit where one exists; the tag gives the URL. A source can change after that date. Where it disagrees with a chapter, the chapter wins.
- **UNVERIFIED** means the chapters neither confirm nor contradict the claim. Do not build on it until you have run the check in the last column on your own build. Nothing tagged UNVERIFIED is a fact here.

Rows already settled elsewhere are linked, not repeated: the [traps table](traps-table.md) ("Traps the chapters do not settle") and the claims table in [house-conventions](house-conventions.md#unverified--test-on-a-real-build-before-relying-on-it). The reach and abuse side is in [threat-model](threat-model.md) and [review-checklist](review-checklist.md). Where this file and a chapter disagree, follow the chapter; the notice at the top of the quickstart `SKILL.md` gives the one exception (API names and type shapes).

## The mod does not load

Run `claude plugin validate` first; the engine prints a refusal message per cause. Compare that message with the rows below.

| Symptom | Cause | Fix | Tag | Settle by |
|---|---|---|---|---|
| Hooks module refused at load, with a name complaint | The names `on`, `$` and `next` are taken by the engine's own bindings, so your code cannot declare them | Rename your variable or helper | UNVERIFIED | Declare a local named `next` in a throwaway mod and read the validate message |
| JSX is refused or renders nothing | JSX is allowed only in `.tsx` or `.jsx` files, and a local `h`, a local `Fragment` or a `@jsx` pragma clashes with the engine's own factory | Keep JSX in `.tsx`, and declare none of those names | UNVERIFIED (the quickstart traps table already covers a global `h`) | Add a local `Fragment` to a `.tsx` hooks file and run validate |
| A state definition is refused | An `atom` call must name its plugin and key as literals, be held in a `const`, use a key declared in the plugin's `types/index.d.ts`, and the contract file must be listed under `types` in `plugin.json` | Follow the literal and declared-key shape; see the bare-`export {}` row in house-conventions | UNVERIFIED | Break each of the four conditions one at a time and run validate |
| `setTimeout`, `setInterval` or `WebAssembly` is refused | The engine allows only its own clock | Use `$.clock.after` and `$.clock.every` | UNVERIFIED | Call `setTimeout` in a hook and run validate |
| The module no longer loads after a second hook for one event | A second `on` for the same event and matcher stops the module loading | Combine the two hooks into one, or narrow each with its own matcher (house-conventions, At register) | CHAPTER: `mods-doc-mods-and-events`, "Filter which events a hook handles" | Not needed |
| An import is refused | An import that resolves outside the plugin folder is refused, symlinks included | Copy the file into the plugin folder | UNVERIFIED | Import a file through a symlink that points outside the folder |
| A large module is refused | Reported cap of 1 MiB for a module | Split the module, or drop the data from it | UNVERIFIED | Pad a hooks file past 1 MiB and run validate |
| `$.env.get` is refused | The variable name must be a literal string, as for other calls the analyser must classify | Write the name inline, never from a variable | UNVERIFIED | Pass a variable as the name and run validate |
| Refusal of a helper function that receives `$` | A function receiving `$` has to be defined in the file that uses it, and its name must be unique among identifiers; putting `$` into an object is also said to be refused (reported) | Hand `$` to each call as an argument and keep the helper in the same file | UNVERIFIED | Import such a helper from a second file and run validate |
| The module loads under one name and your override of another plugin does not apply | Same-name precedence: managed settings first, then a plugin directory given on the command line or in the environment (it silently replaces an installed copy), then installed plugins, then personal skills, then project skills | Run with debug output and look for the override line | UNVERIFIED (the chapters cover the refusal message only, in `mods-doc-mods-troubleshooting`) | Load one plugin name both with --plugin-dir and as an installed copy and log which loads; this settles that pair only, the rest of the order stays UNVERIFIED |

## A hook misbehaves

| Symptom | Cause | Fix | Tag | Settle by |
|---|---|---|---|---|
| A turn or tool hook runs too often, or for work you did not start | `tool.call`, `turn.step` and `turn.complete` also fire for subagents. `e.agentId` is set when a subagent or teammate makes the call | Gate on `e.agentId === undefined` when the hook should see the main conversation only | CHAPTER: `mods-doc-mods-reference`, "Events a mod can hook" (the field). The statement that `turn.start` has no `agentId` is UNVERIFIED | Log `e.agentId` in a `turn.start` hook while a subagent runs |
| A call made while drawing is denied | `ui.render` is a read-only pass. State writes are covered by the interfaces tutorial; files, processes and model calls are reported as denied too | Do effects in other hooks, commands or timers and invalidate the render | UNVERIFIED | Call `$.model.complete` from a render hook and read the failure |
| `$.ui.ask` rejects, or shows odd choices | It is a question dialog underneath: the text should end with a question mark, offer 2 to 4 labels with the safest first, and it rejects when dismissed or when the session is headless | Wrap the call in a catch and treat rejection as "no answer"; in a test, answer the underlying question tool call (see `mods-doc-mods-testing`) | UNVERIFIED (label count and question mark); CHAPTER for the typed answer: `mods-doc-mods-and-events` | Ask five labels in a throwaway mod and read the result |
| A command or prompt submitted from a hook hangs or is refused | Running `$.command.run`, `$.prompt.submit` or `$.session.compact` within a hook that the turn blocks on may deadlock or be rejected; the promise from `$.prompt.submit` settles once its turn has begun | Follow the timing rule in house-conventions, Per event; one way to start the call after the hook has finished is `$.clock.after(0, fn)` (UNVERIFIED). The compaction wording conflict is in the traps table of the quickstart `SKILL.md` | UNVERIFIED | Call each from a command hook and from a turn-waited hook on a real build |
| A model call returns no answer instead of throwing | `$.model.complete` settles with `isAnswered` false plus a reason; `$.model.fork` reports that nothing exists to fork until the first reply, right after `/clear`, and after a resumed restart | Check `isAnswered`; when `fork` reports nothing to fork, call `complete` over the tail of `$.session.messages()` | CHAPTER for `isAnswered`: `mods-doc-mods-api`. The `nothing-to-fork` cases are UNVERIFIED | Call `fork` as the first action of a new session |
| You wait for Esc, Ctrl+C, a paste or a permission answer and nothing arrives | Mods get no event for those keys, for a paste or for a key release. A permission answer is not an event either; infer it from the `tool.check` ask plus the end of the call, or from `classic.PermissionDenied`. A permission refusal reaches `tool.call` as an error result | Poll `$.prompt.read` for pastes; read the call result instead of waiting for a dialog event | UNVERIFIED (`classic.PermissionDenied` is a settings hook event: `mods-doc-hooks-reference`, "PermissionDenied") | Log every event in a throwaway mod, then press each key and paste text |
| A command name does not run your command | Names collide with built-in commands and skills | Prefix every command with the mod name | UNVERIFIED | Register a command named like a built-in and run it |
| Order-dependent start-up is flaky | `classic.SessionStart` and `session.start` come in no guaranteed order (reported) | Do not rely on their order; write start-up as an idempotent routine that any hook may call, and let the first hook that needs it trigger it on demand | UNVERIFIED | Log both events with `$.clock.now` on several starts |
| A toast, status or log line has the mod name in front of it | The engine prefixes plugin text with the plugin name (reported) | Leave the name out of your own text | UNVERIFIED | Toast a short text and read what is drawn |
| An `http` request is slow to finish | `$.http.fetch` settles only once the entire body has arrived; it does not stream | Run a streaming client through `$.process.spawn` and read its output; pass secrets on standard input | UNVERIFIED; CHAPTER for the 30 second limit: `mods-doc-mods-reference`, "Limits" | Fetch a slow streaming URL and see when the call resolves |
| A hook on `prompt.context`, `prompt.section` or a `classic.*` event never runs where the settings are managed, or where the sign-in is a Team or Enterprise account | The built-in guard's hook file hands those events on past the user tier ([pinned blob 72e0324 at commit 65823ec](https://github.com/anthropics/claude-code/blob/65823ec0034ed0aa0266bc43903fefd3ff94a327/mods/sec-default/hooks/register.ts)); the list is in [threat-model, Loading and the built-in guard](threat-model.md#loading-and-the-built-in-guard) | If the mod must work where the guard loads, run the Settle-by test there before relying on these events; for a restore after `/clear` see house-conventions, At reload or clear | UPSTREAM; UNVERIFIED on a machine with managed settings | On a machine with managed settings, install a mod that hooks `prompt.context` and `classic.SessionStart` and see whether its hooks run |

## State and timers

State lifetimes are in the chapters and in house-conventions. These rows cover what fails around them.

| Symptom | Cause | Fix | Tag | Settle by |
|---|---|---|---|---|
| Two sessions overwrite each other's saved values | One store file serves every session on the machine, and a read then write is not atomic | One key per writer and combine on read; read again right before writing; cap list size | CHAPTER: `mods-doc-mods-interfaces`, "Save from more than one session"; the 4 MiB cap is in `mods-doc-mods-reference`, "Limits" | Not needed |
| Lost updates continue with the key-per-writer layout | Several writers still share one key, for instance a list | Put a revision number in the value; on write, read again, compare the revision, retry a few times; inside one process a chained promise queue is enough | UNVERIFIED (design on top of the chapter rule) | Run two sessions that append in a loop and count the entries |
| A task such as playing a sound or running a sweep should happen in one session only | All sessions run identical hooks | Hold a lease: save an owner token with a timestamp, renew it on a short interval, and regard a lease unrenewed for several intervals as free | UNVERIFIED (design on top of the chapter rule) | Run two sessions and check that only the lease holder acts |
| A timer looks running after `/reload-plugins` but never fires | A reload drops pending `$.clock` calls while `$.state` is kept | Persist the deadlines in `$.state` and arm the timers again from them in `session.start`. Module-level variables do not survive a reload (`mods-doc-mods-interfaces`, "Keep state across reloads and sessions") | CHAPTER for `session.start` running again after a reload: `mods-doc-mods-reference`, "Events a mod can hook" (session events); UNVERIFIED only for whether pending `$.clock` calls are dropped | Start a timer, run `/reload-plugins`, and see whether it fires |
| A repeating timer stopped on its own | A period the engine refuses ends the repetition (reported) | Save a heartbeat timestamp at each tick and, from the next hook, restart a timer whose heartbeat is stale | UNVERIFIED | Pass a period of 0 and of -1; if neither is refused, find a value that is, then check whether the repeat stops |
| Two projects share one key by accident | The store is machine-wide, not per project | Add a hash of the root from `$.session.root` to the key | UNVERIFIED | Run the same mod in two projects and compare keys |
| Text from another session is treated as an instruction | Incoming session text is only text | Treat it as untrusted data; see [threat-model](threat-model.md) | Linked, not restated | Not needed |
| A watcher polls too much or reads a half-written file | Writes are not atomic, so a reader can see part of a file | List the folder once, re-read only when the modified time or size changed, and keep the last good parse | UNVERIFIED; CHAPTER for the non-atomic write: `mods-doc-mods-reference`, "Mods API methods" (the `fs.stat` field names are not in the chapters) | Write a file in a loop and read it from a watcher |

## Drawing

The forge agent in this plugin forbids Raster, Image and Svg and forbids drawing that depends on the surface, so measurements for those are not recorded here.

| Symptom | Cause | Fix | Tag | Settle by |
|---|---|---|---|---|
| Your band vanishes while a question dialog is open | The dialog takes the place of the prompt area (reported); the reported height cap is about 12 rows | Keep the drawing compact; place your elements before the `next(e)` reference, and write that reference only once | UNVERIFIED | Open a question dialog while the band is drawn and count the rows |
| A `Client` module shows a placeholder where you expect output | The placeholder can appear in place of the module (reported) | Do not rely on a `Client` for information the person must see | UNVERIFIED | Draw a `Client` and read what shows; repeat 10 times; runs without it do not refute the claim, which stays UNVERIFIED until it is seen |
| You need to know whether anything can be drawn | The list of surfaces from `$.session.surfaces` is empty when there is no screen (reported) | Treat empty as headless and hand a line to Claude through context instead (headless fallback only; drawing itself must not depend on the surface) | UNVERIFIED | Print the list in an interactive and in a print-mode session, 10 times each; it stays UNVERIFIED until an empty list is seen in print mode; a non-empty list in print mode refutes it |
| A hover effect leaves a card on top of later rows | Hover groups are one scope on several boxes (the display form is not in the chapters); absolute cards were reported painted over by later transcript rows | Use cards in the flow, and check the props on a build | UNVERIFIED (the chapters list the `hover` prop only) | Build two boxes in one hover scope and move the pointer |
| A button in transcript text gets no clicks | One source says a Markdown link with press handling works there and a Button does not. That source's own example draws a Button with `onPress` in a user message row, and its cookbook calls clicks in transcript rows not guaranteed | Prefer a link there; record which one your build honours | UNVERIFIED (both statements recorded) | Click each in a transcript row |
| Button props from another source (`variant`, `role`) | The chapter lists Button props as `key`, `label`, `onPress`, `hotkey`, `plain`, `dimColor`, `autoFocus`, `action`; the 2.1.309 types also declare `variant` ('primary' or 'secondary') and `role` ('dismiss') | Read your build's types before using `variant` or `role`, and keep the press working without them; the forge agent does not set them (it draws both surfaces identically) | CHAPTER: `mods-doc-mods-reference`, "Elements" | Draw a Button with `variant` on both surfaces and compare |
| A drawing copied from an example gets `undefined` props or draws nothing | Component props sit under `e.props` in the 2.1.309 types; another author reports that `token-weather` reads them from `e` | Read `e.props` | UNVERIFIED | Read the render hook of `token-weather` in `claude-code-playground` |

## Platform and packaging

| Symptom | Cause | Fix | Tag | Settle by |
|---|---|---|---|---|
| `npm` fails to start on Windows | On Windows `npm` is a batch file, `npm.cmd`, which a spawn without a shell cannot execute | Launch it through the shell as `cmd` with `/d /s /c`, or give an absolute path | UNVERIFIED | Spawn `npm --version` with and without the shell |
| A guard on shell commands never fires on Windows | The tool may be named PowerShell, not Bash | Match both names | UNVERIFIED | Log the tool name for a command on Windows |
| Commands are not found when Claude starts from a desktop launcher | The path is bare and `~` is not expanded | Build absolute paths from `$.env.get('HOME')` or `$.env.get('USERPROFILE')` | UNVERIFIED | Start from the macOS Dock and print the path |
| A spawned process fails with a missing-file error though the program exists | The working directory was deleted | Pass a safe working directory (the root folder) explicitly | UNVERIFIED | Delete the directory, then spawn |
| `$.audio.play` is silent | It sounds on macOS only; elsewhere it resolves and plays nothing | Fall back to a toast on other systems; on Windows use a constant script with the path in the environment, never in the command text | UNVERIFIED (the chapters list `play` and `speak` only) | Call it on Linux and read the result |
| You need a streaming child, binary data or a long-lived helper | `for await` over the spawn result reads output as it comes and ends the child when the loop stops; the text write method cannot write binary data (reported) | Send base64 to a system tool for binary; keep one helper with a version handshake | UNVERIFIED | Spawn a child that prints slowly and break out of the loop, and try writing a binary buffer with the text write method |
| A clean install runs a package manager | A `package.json` or lock file in the plugin folder makes a marketplace install run npm (reported) | Ship none in the mod folder | UNVERIFIED | Install a copy that has one and watch the install output |
| Validation warns about a file at the plugin root | A `CLAUDE.md` at the plugin root warns under strict validation (reported) | Keep it out of the shipped folder | UNVERIFIED | Run `claude plugin validate --strict` with and without it |
| A helper script leaks into the shell tool | A file under `bin/` joins the Bash tool's path (reported) | Keep helpers elsewhere | UNVERIFIED | List `PATH` from a Bash call after install |
| `claude plugin details` shows fewer hooks than you wrote | Its count includes only hooks of the settings kind (reported) | Read the validate output instead | UNVERIFIED | Compare both outputs for one mod |
| Generated type files end up in version control | The mods folder holds a generated `.claude-plugin/types/` folder (reported) | Ignore that folder in git, and do not run `git init` in the dev mods folder itself | UNVERIFIED | Load a mod in a fresh folder and look at what is generated |

## Open issues

Re-check with `gh api repos/anthropics/claude-code/issues/<number> --jq .state` before you rely on any state in this table. State shown is the answer on 2026-10-23.

| Issue | What it does to a mod | State on 2026-10-23 | What to do |
|---|---|---|---|
| https://github.com/anthropics/claude-code/issues/92533 | A hook on Bash `tool.call` breaks worktree subagents | open | Test a Bash guard with a worktree subagent before shipping |
| https://github.com/anthropics/claude-code/issues/100837 | Loading build 2.1.295 in headless mode produces no type files | open | Do not rely on generated types in headless runs |
| https://github.com/anthropics/claude-code/issues/100797 | Desktop rebuilds an unchanged drawing on every redraw | open | Redraw only when a value changed |
| https://github.com/anthropics/claude-code/issues/99395 | On desktop the first click in a pane only focuses it | open | Do not assume the first press reaches `onPress` |
| https://github.com/anthropics/claude-code/issues/99217 | Remote Control views draw nothing | open | Do not make a drawing the only way to learn something important |
| https://github.com/anthropics/claude-code/issues/101089 | An Input cannot be made full width | open | Plan for a fixed width |
| https://github.com/anthropics/claude-code/issues/101090 | Mod text cannot be selected | open | Offer a copy button where the person needs the text |
| https://github.com/anthropics/claude-code/issues/99423 | The VS Code extension draws no mod interface | closed | Listed as open on 2026-10-11 in the source; test on the current extension |

## Stale or conflicting claims

Claims that circulate and are wrong, outdated or in conflict. None is advice.

- The early access environment flag for function hooks: dated early access; this plugin's overview already marks the flag as ignored.
- The `/plugin-types` command: no chapter names it, so whether it still exists is UNVERIFIED; re-test before relying on it. The 2.1.309 `claude-code` types file does not mention it; its header says it is written beside the mod under `.claude-plugin/types/` on each load, with line 1 naming the build, so read that file instead.
- "`session.start` did not fire in a reloaded module": some authors report this; the reference chapter says it runs again after a reload of that mod, so follow the chapter and make start-up safe to repeat anyway.
- "`$.http.fetch` has no timeout": wrong. The reference chapter gives 30 seconds for one call, redirects and body included.
- "No call resolves a path through symlinks": the quickstart traps table keeps it as UNVERIFIED; re-test on a real build.
- "No event fires while typing" and "`tool.check` is not implemented": reported as outdated by the same source; no chapter confirms either way, so test before you rely on either.
- Button `variant` and `role`: the reference chapter does not list them; the 2.1.309 types declare them (see Drawing).
- A Button in a transcript row: the source contradicts itself (see Drawing).
- Limits cited from types of builds 2.1.292 and 2.1.293 (stream caps, grid sizes, node counts, call times): the chapters lack several of them. Treat each as UNVERIFIED and read the types of your own build.
- Headline counts in the source's description (mods read, techniques, events, methods) are the author's own numbers; do not quote them.
