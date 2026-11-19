# Call intercept

Reference notes on how installed mods hook a host event and decide what the host does with it. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-reference` ("Events a mod can hook", which lists each event with the fields it carries and the values its handler may return), `mods-doc-mods-and-events` ("React to events with a mod") and `mods-doc-mods-api` ("Use the mods API").

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A call intercept is a handler registered for one host event. It runs when the host is about to act on the event, or has just acted on it, and its return value sets the next step: pass the event on unchanged, pass a changed event on, refuse it with a reason, or block the stop of a turn. The events in this group are the prompt the person submits, each tool call and its result, each model request and turn, a compaction, a subagent spawn and a stop.

Two shapes recur. A guard decides: it refuses the event or changes it. An observer records the event and passes it on untouched. Some mods instead ship command hooks, a script for each event that reads the event as JSON on standard input and answers on standard output. token-optimizer works this way for its Claude Code events, and its answer is one JSON object or nothing.

## When to build one

- The host is about to act, and you must stop it, let it through or reshape it: a tool call that touches a protected path, a prompt that carries pasted logs, a tool result full of progress output.
- You only need a record. Pass the event on and do the bookkeeping after the pass, so the record matches the outcome. regia and deck work this way.
- Decide what the handler does for events that are not yours: return the pass-through at once. A handler that works on every event slows every event.
- Decide what a failure does before you write the handler. A guard that breaks can refuse the event or let it through. Pick one, and say why in the reference you write.
- A rule that needs a model judgment costs a request each time it runs. Answer the cases a keyword or a plain rule can decide, and send a judge only what is left, masked and short. context-harness does this.

## How each mod does it

### tokensaver 0.3.0 (MIT)

- The prompt handler tidies pasted logs in the prompts the person typed, and leaves slash commands and hidden prompts alone. It then passes the event on with the tidied text and with any context the session reply carries (excerpt 2).
- A tool-result handler shrinks each shell result block before it is stored: colour codes, progress bars and repeated lines go, and the saved characters are added to the lifetime totals. Error results pass through untouched. A companion handler notes each shell command as Claude issues it, so the trimmer knows which command produced a result (hooks/register.tsx:763-835).
- The agent.spawn handler asks the session for a model choice, passes the spawn on with the chosen model when there is one, and then records whether the subagent was denied (hooks/register.tsx:862-894).
- Its handlers end in a catch that passes the event on, so a failure in tokensaver costs its own feature and nothing else.

### deck 0.4.12 (MIT)

- The prompt handler reads the session model, keeps the first 40 characters of the last typed prompt for its header, clears the needs-input marks, and passes the event on unchanged (hooks/register.js:1733-1744).
- The tool handler (excerpt 3) counts the calls of the main loop, records todo writes and question tools, refreshes the project folder, and then passes the call on inside a try block. A finally block clears the in-flight record whether or not the call ran, so a failed call cannot leave a bar stuck. The handler returns the result it was given and never refuses a call of its own (hooks/register.js:1911-1960).
- The turn.step handler is a generator. It keeps the model of the first request in the main loop and forwards the stream with yield* (hooks/register.js:1758-1761).

### ponytail 5.3.2 (MIT)

- The prompt hook is a command hook. It reads the prompt from standard input after stripping a byte order mark, matches the ponytail commands with a regular expression, switches the session level or saves the default, shows or hides the band, and answers through the hook output writer. It never refuses a prompt (hooks/ponytail-mode-tracker.js:27-196).
- The band module tool handler records the result of shell test commands. For Write it reads the file as it was, for Edit it uses the old text the call carries, and it counts the functions added, reused, duplicated or removed. Every other call passes straight through, and a shell call returns the result it was given (hooks/band/register.tsx:212-266).
- The prompt handlers end in a catch that passes the event on, so a failed record cannot block the prompt.

### context-harness 0.0.1 (MIT)

- The tool guard (excerpt 1) takes each path the call names, as written and as the host resolves it, and checks it against the folder of the plugin itself, the state folder, the archive of folded results and the fragments folder. It also checks shell commands that print secrets. In active mode a verdict becomes a deny; in shadow mode the guard records what it would have refused and lets the call through (hooks/register.ts:481-547).
- The guard fails closed. When it throws before it has passed the call on and the guard is active, the call is refused with a message; otherwise the call goes through (hooks/register.ts:548-550).
- The prompt handler judges only the prompts the person types or sends from a remote or headless session, and the prompts a plugin sends as the person. It attaches the fragments whose keywords match, and it asks a judge only about the fragments no keyword decided. The judge receives the prompt with secrets, the home folder and email addresses masked, cut to 600 characters (hooks/register.ts:137-195; hooks/scrub.ts:4-37).
- The stop handler judges the last paragraph of a turn that ends by announcing unfinished work. Several cases skip the judge first: a subagent stop, a stop that already continues another stop, plan mode, background or scheduled tasks, an empty paragraph, a question, or a conditional sentence (hooks/stop-gate.ts:69-82). In active mode a flagged stop is blocked with a continuation message; in shadow mode the turn ends and the verdict is only recorded (hooks/register.ts:412-476).
- Its gates run in off, shadow or active mode, chosen in the settings. Shadow mode is how to measure a gate before it acts.

### token-weather-usage 3.17.15 (Apache-2.0)

- The turn.step handler reads the usage of each main-loop request and records cache hits, misses, the model and the savings. For a step of a subagent it marks the agent busy and clears the mark in a finally block. It returns the response it was given (hooks/token-weather-usage.mjs:601-648).
- The turn.complete handler reads the context fill and the cost after each main turn, works out what the last prompt cost and its share of the five-hour limit (the source reads that window; its behaviour on a subscription without a five-hour window is not verified here, and our recommendation is to show no share then, or the weekly one, never a zero or a division by an absent window), and saves the turns. For a turn of a subagent it refreshes the agents card and saves the turns instead (lines 650-687).
- The session.compact handler lowers the context reading right after a compaction, using the size the compaction reports, and falls back to live figures when the report has none (lines 692-709).
- The turn and compaction handlers wrap their reads in try and keep the previous reading when a read fails, so a missing figure does not blank the band (lines 650-716).

### regia 0.3.3 (knowledge only, no excerpt)

- The tool handler records each call before it runs, passes the call on, and then records the end, marking the call failed when the result is a denial or an error. A Skill tool call also records the skill it loads. The handler returns the result it was given (hooks/register.tsx:212-227).
- The agent.spawn handler records the spawn before it passes it on, then records the outcome as a start or a denial, with the model the subagent runs on (hooks/register.tsx:231-255).
- The session.append handler passes the event on first, and only then looks for a skill base-directory line in a user message, so the observation cannot change what is stored (hooks/register.tsx:263-273).
- The session.measure handler passes the event on, and when the context changed it asks the session for a breakdown by category and records it (hooks/register.tsx:283-303).

### token-optimizer 5.13.58 (PolyForm Noncommercial 1.0.0, no excerpt)

Described in the words of this plugin, from its hook runners and its desktop module.

- Its Claude Code events run through runner scripts, not in-process handlers. A runner reads the event as JSON on standard input, runs its subcommands in a fixed order under one shared time budget, captures what each one prints, and writes one JSON answer at the end. A runner that fails, or runs out of time, still exits with success, so the host never reports a hook failure (hooks/userpromptsubmit_runner.py:600-722; hooks/stop_runner.py:338-408).
- The read hook checks a cache before the host reads a file. It can deny a read of a path that a rule ignores, and it can answer with a cached structure or with a note that the file has not changed, in place of the full read (skills/token-optimizer/scripts/read_cache.py:1347-1380).
- The Bash hook prints nothing. Its own comment says that any output there would be a permission decision, so the hook leaves that decision to the host (skills/token-optimizer/scripts/bash_hook.py:55-57).
- The MCP hook denies a repeat of a call whose full result was archived. Its reason names the archived copy and tells the model how to read it, so the reason reaches the model (skills/token-optimizer/scripts/refetch_guard.py:202-233).
- The post-tool runner compresses noisy Bash output after the command ran, archives large results to disk with a pointer left in the conversation, invalidates the read cache after an edit, and runs a quality gate. A failed tool call goes to its own handler (hooks/posttooluse_runner.py:1046-1110).
- The Stop runner captures the compaction state, flushes the session and arms the keep-warm record. The SessionEnd path flushes the session (hooks/stop_runner.py:338-408).
- The desktop module reads each prompt, turn step, tool call, agent spawn, permission request and compaction, and keeps its band current from them. Its prompt handler attaches a pending hand-off to the prompt once. It takes the hand-off only after deleting it from the store, and it puts the hand-off back when the host rejects the event (desktop/token-optimizer-desktop/hooks/register.tsx:1422-1450).

## Traps

- A handler that returns without calling next leaves every later hook on that event without the event. Every handler in this group calls next once and returns what it got back, or a changed copy of the event.
- Choose the failure side for each event. Fail open lets the event through when the handler breaks, as tokensaver and ponytail do. Fail closed refuses it, as context-harness does for its tool guard once that guard is active. Pick one on purpose and write it down.
- Shadow before enforce. context-harness runs each gate in shadow mode first: the decision is made and recorded, and the host is not changed.
- Do not pay for a judge on every event. context-harness answers most prompts from keywords and sends the judge only what is left, masked and cut to 600 characters.
- Observe after the pass when the record must match the outcome. regia records the end of a tool call after next has run, and deck clears its in-flight record in a finally block.
- A streamed event needs a generator that forwards the stream. deck and token-weather-usage forward it with yield* next(e) in their turn-step handlers; keep that form for a stream.
- A rewrite lasts. A trimmed or tidied prompt or result replaces the stored text, so every later request carries the shorter form, as the comment in tokensaver says.
- Shared budgets. token-optimizer runners share one time budget and split it among the subcommands that actually run. A slow subcommand costs the ones after it, and a runner that passes its deadline ends with success.
- One answer per hook. A stray write to standard output by any subcommand corrupts the single JSON answer of a command hook, so token-optimizer buffers each subcommand output and emits it once.
- Keep the handler cheap. It runs on every event, so slow reads (a store, a process, a file) belong in a timer or in a runner, not in the handler.

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### context-harness 0.0.1, hooks/register.ts:525-547, MIT

Full source: examples/context-harness/hooks/register.ts:525-547 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
    if (verdict === undefined) return judgeTool($, e, next, { tool, command, candidates, home, cwd, t0 })
    if (mode === 'off') return next(e)

    const trust = await trustFor($)
    const isRefused = verdict.kind === 'self' || trust.trust === 'external'
    counts.floor++
    const record: ShadowRecord = {
      id: newId(t0),
      ts: new Date(t0).toISOString(),
      sessionId: await $.session.id(),
      joinKey: e.tool_use_id,
      point: TOOL_POINT,
      mode,
      sent: null,
      hookMs: (await $.clock.now()) - t0,
      decision: isRefused ? (mode === 'active' ? 'deny' : 'would-deny') : 'allow',
      facts: { tool, kind: verdict.kind, reason: verdict.reason, trust: trust.trust, why: trust.why },
    }
    void writeRecord($, record).catch(() => undefined)
    showStatus($)
    if (mode === 'active' && isRefused) return { deny: denyMessage(verdict, trust.trust) }

    return next(e)
```

### tokensaver 0.3.0, hooks/register.tsx:722-746, MIT

Full source: examples/tokensaver/hooks/register.tsx:722-746 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
  on('prompt.submit', async ($, e, next) => {
    const kind = e.origin.kind
    const isFromUser = kind === 'composer' || kind === 'bridge' || kind === 'sdk'
    const model = await attempt(() => $.session.model(), undefined)

    if (model !== undefined) {
      session = onFacts(session, { model }).session
    }

    idleTimer?.cancel()
    idleTimer = undefined
    await sync($, 'turn start')

    const tidied = await commitAssistant(
      $,
      onPromptText(assistant, {
        text: e.text,
        // A slash command's line and a hidden prompt take no rewrite of their text.
        isFromUser: isFromUser && e.command === undefined && e.isMeta !== true,
        isEnabled: session.config.isEnabled,
        isDryRun: session.config.isDryRun,
        now: Date.now(),
      }),
    )
    const text = tidied.text ?? e.text
```

### deck 0.4.12, hooks/register.js:1932-1950, MIT

Full source: examples/deck/hooks/register.js:1932-1950 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```js
    let ran
    try {
      ran = await next(e)
    } finally {
      if (e.tool_use_id) inFlight.delete(e.tool_use_id)
      if (waiting.delete(key)) {
        if (a && a.state === 'waiting') a.state = 'running'
        if (key === 'main' && !askedUser) for (const bar of bars.values()) if (bar.explicit === 'needs_input') bar.explicit = null
        $.ui.invalidate('ui.render')
      }
    }

    const ok = ran && ran.deny === undefined && ran.isError !== true
    if (ok && !e.agentId && (e.tool === 'TaskCreate' || e.tool === 'TaskUpdate' || e.tool === 'TaskList')) {
      applyTaskResult(e, ran.result)
      $.ui.invalidate('ui.render')
    }
    // a worktree move or /cd may have moved the project folder, with or without CwdChanged
    if (!e.agentId) await refreshFolder($)
```

Credits for these excerpts are in NOTICE at the plugin root.
