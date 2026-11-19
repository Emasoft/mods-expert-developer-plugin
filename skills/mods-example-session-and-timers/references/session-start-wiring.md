# Session-start wiring

Reference notes on how installed mods run code when a session starts, resumes, clears or compacts, and where they register their commands, tools and stores. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-api` (the session.start examples and "Run and control background work") and `mods-doc-hooks-reference` (the SessionStart event).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

The work a mod must finish before the first prompt of a session: load saved state, register a `/name` command or a tool for the model, start the timers the session needs, read the model and the repository, and restore what a compaction removed. In a mod this is the handler of the `session.start` event. Some mods also handle the start path that runs again after a clear, a resume or a compaction, because those change or shrink the state that the start loaded.

## When to build one

- The mod needs saved state or a setting before the first prompt: preferences, a store, a settings read.
- The mod registers a command or a tool. The session.start example in `mods-doc-mods-api` does both.
- The mod keeps a timer for the whole session (see clock-or-timer.md).
- A clear or a compaction would lose state the mod holds, or leave it out of date, so the mod must reset or restore it.
- Keep slow work out of the start. A network call, a repository scan or a process run should start after the handler returns, or without being awaited (see the traps).

## How each mod does it

### tokensaver 0.3.0 (MIT)

- The handler (hooks/register.tsx:635-684, excerpt below) reads six stores and the NO_COLOR variable in parallel. Each read goes through a helper that takes a fallback value, here undefined, so an unreadable store gives defaults instead of a failed start.
- It then hydrates the options from the stored values, registers the /tokensaver command with an immediate flag, reads the model and counts the repository files in parallel, commits the facts it learned and syncs the display. It returns next(e) last.
- When a surface attaches later (session.attach, lines 677-684), it re-syncs the display and notes the attach in the session diagnostics.

### deck 0.4.12 (MIT)

- The handler (hooks/register.js:1540-1591, excerpt below) merges the saved preferences over the defaults, so a key added in a later version takes its default, and it drops a saved stage list (delete prefs.stages).
- It reads the home folder from the host environment, the saved usage history, the session model, the session id and the saved spend ledger. It starts the weather fetch without awaiting it, so the start does not wait for the network.
- It starts one 150 ms tick (see clock-or-timer.md), registers the /deck command with the immediate flag set to true, and returns next(e).

### ponytail 5.3.2 (MIT)

- The SessionStart hook is declared in hooks/claude-codex-hooks.json with the matcher startup, resume, clear or compact (excerpt below). The activate script reads the source from stdin. For a compaction it keeps the level the flag file holds; otherwise it uses the saved default level (hooks/ponytail-activate.js:31-200, with the finish function at 182-193).
- It writes the level flag, emits the ruleset, adds a codebase map under a one-second timeout, and offers the status line setup only once: the offer is recorded in a flag file. It copies the status script into the config folder through a temporary file and a rename, so a symlink is replaced rather than written through, and it does not edit the settings file.
- Its stdin error handler and a one-second fallback timer both call the same finish path, so the session never waits for input that does not come.

### context-harness 0.0.1 (MIT)

- The handler (hooks/register.ts:67-123) registers three tools (read_coordinate, policy_report and set_policy) in one try block, and two commands in a second. Loading the fragments and the key and status line when the judgment layer is on come after that, and dropping old records is a third block. Each block starts on its own, so one failure leaves the others working, and each failure goes to the host log.
- The classic.SessionStart handler (hooks/register.ts:199-204, name as the mod uses it) runs for the main agent only. When the source is clear, it forgets the attached state of the session.

### token-weather-usage 3.17.15 (Apache-2.0): own words, no excerpt

- The session.start handler (hooks/token-weather-usage.mjs:535-588) cancels both timers from an earlier start, then resets every per-session variable (readings, limits, cache state, agents, the last prompt), so a reload does not carry old readings into the new run.
- It reads the language and the cache environment, restores the saved turns from the host store, seeds the first context reading from the session usage, refreshes the running agents, and adopts the newest shared limit reading, or publishes its own when none exists yet.
- It then starts the minute and ten-second timers (see clock-or-timer.md), asks for a redraw, and returns next(e).

### regia 0.3.3: own words, no excerpt

- The session.start handler (hooks/register.tsx:137-170) reads the usage, sets the start time only when none is known, and applies the measured meters.
- It registers the /regia command, starts a one-second clock, and opens its pane with the host open call.
- It then reads the message history to find skills loaded before the plugin started, such as after a reload or in a resumed session. When the history cannot be read, the handler goes on with the skill list it has; the mod comment says the skills then show up from the next one loaded.

### token-optimizer 5.13.58 (PolyForm Noncommercial 1.0.0): own words, no excerpt

- The desktop handler (desktop/token-optimizer-desktop/hooks/register.tsx:1383-1421) calls next(e) first. It starts the band only when the mod is enabled, the session is interactive, and the surface is neither the terminal nor VS Code. The start then reads a held hand-off, the band size and the clock state, refreshes the band at once, schedules a later refresh for the status command so the session never waits for it, and starts the cadence timers.
- A clear arrives as classic.SessionStart with source clear. The mod starts a new session generation, so results from the earlier session are discarded when they arrive, and it reads the new session start time from the host rather than trusting the arrival time of the event.
- On the Claude Code path, the SessionStart runner (hooks/sessionstart_runner.py:546-629) checks consent first. Without consent only the health bootstrap runs. With consent it runs a fixed list of sub-steps in order (health check, quality-cache refresh, restore after a compaction, clearing of compacted state, restore for a new session), collects each sub-step output into one JSON object, sends diagnostics to a log file because the host would otherwise put them into the model context, and splits one shared time budget across the sub-steps that will run.

### token-optimizer 5.13.61 (PolyForm Noncommercial 1.0.0): own words, no excerpt

- In 5.13.60, and still in 5.13.61, the desktop mod gave up two of its four settings-hook handlers, the ones on the prompt-submit and stop events. The transcript path they supplied is now noted by the one session-start handler it kept, each time that handler fires (desktop/token-optimizer-desktop/hooks/register.tsx:1390-1400).
- The comment beside that handler gives the reason. On a machine an organization manages, the built-in guard plugin is loaded ahead of a user's mod; by the comment's account it holds back each `classic.*` event from that mod and shows the person a notice for every one it held back, so each such handler is one more notice. No chapter or generated type says the guard does this: UNVERIFIED.
- A test added in 5.13.60 reads the hooks file as text, collects the `classic.*` names passed to `on`, and compares them with the two the mod keeps on purpose, the session start and the permission request (desktop/token-optimizer-desktop/tests/pure/classic-handlers.spec.ts:1-13). A new classic handler then fails that test until someone decides it is needed.

## Reference module

One module of this plugin's own for the pin that token-optimizer's test makes, written from the description above and from no code of it.

### Reference module, classic-handler-inventory, MIT (this plugin)

```ts
// The classic.* events a hooks module registers, read from its source text: each on('classic.<Event>', ...) call,
// with any of the three quote marks, the names sorted and each listed once.
// Compare the list with the set the author chose, in a test: a classic hook added later then fails that test, so a
// new one is a decision and not a slip.
// It reads text, not code: a call in a comment counts (the safe side), and a name computed at run time, as in
// on(name, ...), is not seen.
const CALL = /\bon\s*\(\s*(["'`])([^"'`\n]+)\1/g

export function classicHandlersIn(source: string): string[] {
  const found = new Set<string>()
  for (const match of source.matchAll(CALL)) {
    const name = match[2]
    if (name !== undefined && name.startsWith('classic.')) found.add(name)
  }
  return [...found].sort()
}
```

The behaviour tests are in tests/reference-modules/classic-handler-inventory.test.ts.

Run the pin where the hooks file can be read as text, such as a check script in the repository: a test under `claude plugin test` gets the engine's `$`, not the mods API a hook receives (`mods-doc-mods-testing` line 69), so it has no file read of its own. Whether a kit test can load a file as text some other way is UNVERIFIED.

## Surfaces

Terminal: works. The module is a development check on the text of the hooks module, not a call a mod makes while a session runs, and the terminal runs the hooks of that same module (`mods-doc-mods-overview` line 211).

Desktop: works the same. The Code tab of the Desktop app runs the same hooks module (`mods-doc-mods-overview` line 212), so one pin covers both surfaces.

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add.

Operating systems: any; the module is a pure function.

## Traps

- Start at most once per session, and cancel what an earlier start left running. token-weather-usage cancels its tickers at the top of session.start, and token-optimizer cancels its cadence timers before it creates new ones. A handler that can run again on a reload otherwise leaves two timers running.
- Reset per-session state at the start. A reload keeps the module variables of the old run unless the handler clears them, as token-weather-usage does.
- Do not hold the first prompt. Start slow work (a weather fetch, a status command, a repository scan) without awaiting it, or after the handler returns. The chapter gives each hook a time limit on its own execution. deck does this for the weather, token-optimizer for the status command, and ponytail puts a one-second limit on its map run.
- Pass the event on with next(e) and return what it gives. The tokensaver, deck, regia, token-weather-usage and context-harness handlers do this; token-optimizer calls it first and then does its own start.
- A clear is also a start. Ponytail matches startup, resume, clear and compact; token-optimizer and context-harness check the source field and act on clear only. Decide which sources your state needs.
- Compaction runs the start path inside the same conversation. Keep the live state, as ponytail keeps its level, rather than reset it to the default.
- Pick a command or tool name that no built-in uses (`mods-doc-mods-api`). $.command.register can throw. context-harness logs each failed registration and keeps the rest; under the fail-fast rule of this plugin, decide per registration whether a failure should stop the start.
- Check consent before any write or process run at start (token-optimizer runner).
- The inventory is a text scan, so it sees only literal registrations: an `on('classic.<Event>', ...)` call with the name written out in quotes. A registration made through a variable (`on(eventName, ...)`), a loop over a list of names, or an alias of `on` (`const hook = on; hook('classic.Stop', ...)`) is invisible to it, and so is a handler registered by a file the hooks module imports. A test that passes on the inventory therefore shows no literal `classic.*` registration was added, not that none exists; keep registrations literal in the file that is scanned, and scan every file that registers.
- Register as few `classic.*` hooks as the work allows. Where an event of the mods API carries what you need (`session.start`, `prompt.submit`, `turn.complete` and the others), use it; put all the work for one settings-hook event in one handler; and avoid the `classic.*` wildcard, which receives every settings-hook event (`mods-doc-mods-and-events` line 98). A clear has no event of its own in the mods API, so `classic.SessionStart` with source clear is the documented way to reload after it (`mods-doc-mods-interfaces` line 822) and is usually worth keeping. The generated types put the managed settings hooks first in the chain of a settings-hook event, so a managed block ends it above every mod (`ClassicEventOf`); by token-optimizer's account, where an organization manages the machine, every such handler of a user's mod brings the person one more warning (UNVERIFIED). Pin the set with a test over the source text (classic-handler-inventory, above).

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### deck 0.4.12, hooks/register.js:1540-1563, MIT

Full source: examples/deck/hooks/register.js:1540-1563 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```js
  on('session.start', async ($, e, next) => {
    cwd = e.cwd ?? ''
    try {
      home = ((await $.env.get('HOME')) ?? '').replace(/\/$/, '')
    } catch {}
    const saved = await $.store.get('prefs')
    if (saved && typeof saved === 'object') {
      prefs = {
        ...clone(DEFAULT_PREFS),
        ...saved,
        show: { ...DEFAULT_PREFS.show, ...(saved.show ?? {}) },
        style: { ...DEFAULT_PREFS.style, ...(saved.style ?? {}) },
      }
      delete prefs.stages
    }
    await refreshUsage($)
    await readSessionModel($)
    const savedHist = await $.store.get('hist')
    if (savedHist && typeof savedHist === 'object') hist = savedHist
    try {
      sessionId = await $.session.id()
    } catch {}
    await loadSpend($)
    refreshWeather($).catch(() => {})
```

### tokensaver 0.3.0, hooks/register.tsx:635-654, MIT

Full source: examples/tokensaver/hooks/register.tsx:635-654 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
  on('session.start', async ($, e, next) => {
    const [storedLog, storedThresholds, storedSettings, storedDelegation, storedAssistant, storedLifetime, noColor] =
      await Promise.all([
        attempt(() => $.store.get(STORE_LOG), undefined),
        attempt(() => $.store.get(STORE_THRESHOLDS), undefined),
        attempt(() => $.store.get(STORE_SETTINGS), undefined),
        attempt(() => $.store.get(STORE_DELEGATION), undefined),
        attempt(() => $.store.get(STORE_ASSISTANT), undefined),
        attempt(() => $.store.get(STORE_LIFETIME), undefined),
        attempt(() => $.env.get('NO_COLOR'), undefined),
      ])

    assistantOverrides = parseAssistantOverrides(storedAssistant)
    lifetime = parseLifetime(storedLifetime)
    applyAssistantOverrides(options)

    await commit(
      $,
      hydrate({ options, storedLog, storedThresholds, storedSettings, storedDelegation, noColor }),
    )
```

### ponytail 5.3.2, hooks/claude-codex-hooks.json:3-15, MIT

Full source: examples/ponytail/hooks/claude-codex-hooks.json:3-15 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```json
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "node -e \"require(require('path').join(process.env.CLAUDE_PLUGIN_ROOT.split(String.fromCharCode(92)).join('/'), 'hooks/ponytail-activate.js'))\"",
            "timeout": 5,
            "statusMessage": "Loading ponytail mode..."
          }
        ]
      }
    ],
```

Credits for these excerpts are in NOTICE at the plugin root.
