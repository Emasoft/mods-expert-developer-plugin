# The engine command

Reference notes on how installed mods start a host compaction or clear, from a button, a command or a rule. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-reference` (the `session.compact` event, which fires before a compaction and can skip it, and the `$.session` methods, which include `compact`) and `mods-doc-mods-api` ("Add a command").

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A compaction replaces older turns with a shorter form, so the next request is smaller. A clear empties the conversation. A mod can ask for either in one of two ways:

| Way | Call | What the host does |
|---|---|---|
| Session method | `$.session.compact({ instructions })`, with optional instructions for the summary | Compacts, and reports the token counts or a skip reason |
| Command | `$.command.run({ command: 'compact' })` or `{ command: 'clear' }` | Runs the slash command as if the person had typed it |

The chapter `mods-doc-mods-reference` lists `compact` among the `$.session` methods and `run` among the `$.command` methods (its API table, lines 204 and 210), and `session.compact` and `command.run` among the events. The generated types add the timing: the session method rejects while a turn runs, and the command is queued until the session is idle and rejects inside a hook the turn waits on (the generated types, at `$.session.compact` and `$.command.run`).

## When to build one

- The person wants a button or a command that compacts or clears now.
- A rule decides the moment, such as a context that is nearly full or a prompt cache that has gone cold. Start the work once the turn has ended, never inside it.
- A clear removes the conversation. If the next session will need what it knew, save that first.
- A compaction is not free: the next request misses the prompt cache in full. Build one only when the saving is worth that cost.

## How each mod does it

### tokensaver 0.3.0 (MIT)

- One helper does the compaction. It calls the session method with the instructions, then records the token counts before and after, or the reason the host skipped it. On an error it shows a toast and leaves the state as it was (excerpt at hooks/register.tsx:382-405).
- Three entry points reach that helper. A rule step that asks for a compaction becomes an effect that is not awaited, so the hook that noticed the need returns first. The `/tokensaver compact` command answers at once with its own line and starts the helper 50 milliseconds later, because a running command holds the turn and the host refuses a compaction inside it (excerpt at hooks/register.tsx:517-534). The band has a Compact now button for the same purpose.
- The status text is refreshed in a finally block, so the display follows success and failure alike.

### tokensaver 0.4.0 (MIT)

- The compaction helper keeps the shape of 0.3.0 and adds one step: when the session method rejects, it hands the work to the built-in `/compact` command with the same instructions, through `$.command.run`, and answers that it is compacting through the command (hooks/register.tsx:402-433). Its comment says headless hosts, naming VS Code, Cursor and the SDK, compact only inside a turn; that claim is the source's own, UNVERIFIED.
- The counts of a compaction run by the command are recorded by the mod's own `session.compact` hook, which books every compaction of the main conversation except the ones a plugin starts with the session method (hooks/register.tsx:886-904). The command reaches that hook, while the session method skips the hooks of the plugin that called it (the generated types, at `$.session.compact`).
- When the command is refused too, the helper drops that second refusal and shows a toast with the reason of the first (hooks/register.tsx:402-411 and 435-439). The reference module below keeps both causes instead.

### context-harness 0.0.1 (MIT)

- The idle fold runs on the turn-complete event. It acts only when the context is above a threshold and the fold would remove a minimum share of the transcript. If notes that are due for the work are not written yet, it asks the agent to write them, at most twice, and waits for a later turn (hooks/register.ts:317-364).
- It writes a line to a log first, marked as an idle fold request, so the compaction hook can tell this compaction from one the person started. Then it schedules the command one second later (excerpt at hooks/register.ts:365-378).
- A flag marks the scheduled fold until the command settles, so no second fold is queued meanwhile.
- It runs the command rather than the session method, because a compaction the plugin starts with the session method skips the compaction hook of that same plugin, and that hook would summarize where it should fold.

### token-optimizer 5.13.58 (PolyForm Noncommercial; knowledge only, no excerpt)

Described from `desktop/token-optimizer-desktop/hooks/register.tsx` (the Clean up path around lines 563-646 and the Start fresh path around lines 754-914), in the words of this plugin:

- Clean up is refused while another busy step runs, while a call the mod recorded is still running, and while a turn is running; in the last case it says so in a toast. Otherwise it marks the step busy and, on a zero-delay timer, claims a call record, runs the host compact command, and reads the live token count before and after.
- Success is decided from evidence: whether a compaction was counted during the call and whether the token count fell. The reply text is not used, because a refused compaction can come back as an ordinary answer without an error. The claim is released in a finally block.
- Start fresh takes two presses. The first press only arms the button; a second press while the arm is still fresh does the work. The arm window is set in a helper module this reference did not read.
- The work runs the capture script that ships with the mod, under a timeout, to save a hand-off record. It keeps that record on disk, and only then runs the host clear command.
- Each step checks the session identifier and a generation counter again. If the session changed, the work stops, and a hand-off record written by this press is removed. A failure is shown as a note, and the conversation is left as it was.

## Reference module

One module of this plugin's own, written from the tokensaver 0.4.0 technique and not copied from it: compact with the session method and, only if the caller opts in with `fallbackToCommand`, run the `/compact` command when the host rejects that call. It takes `$`, the instructions and the option, and returns which way the compaction went and whether it was deferred.

What the fallback is for, and what it cannot tell. The only cause of a rejection that the generated types name is a running turn: the session method "rejects while a turn runs" (index.d.ts line 2929). For that cause the command is the right move, because it is queued and runs once the session is idle (line 3153), so the compaction comes later instead of now. Neither the chapters nor the types give the rejection a code or a class, so a mod cannot tell a running turn from any other refusal, such as the headless-host refusal the sources claim (UNVERIFIED) or a host's limit, which line 3157 names among the reasons the command is rejected. The module therefore respects the refusal by default: without the option the rejection is thrown as it is. The option is for a mod that accepts a deferred compaction and takes the risk of running `/compact` after a refusal that may have been deliberate; its result then says `deferred: true`, so a caller never reports it as done.

### Reference module, compact-with-command-fallback, MIT (this plugin)

```ts
import type { EngineInterface, SessionCompactResult } from 'claude-code'

// Which way the compaction went. The session method answers with the compaction or with a hook's veto ({ skip }); the
// /compact command is queued until the session is idle, and its answer is only the text the command printed.
// deferred is true exactly when the command ran: the compaction was handed to the queue, so never report it as done.
export type CompactOutcome =
  | { way: 'session'; deferred: false; result: SessionCompactResult }
  | { way: 'command'; deferred: true; text: string | undefined }

export type CompactOptions = {
  // Off unless you set it. Left off, a rejection of $.session.compact is thrown as it is, so a refusal stands. Turn it on
  // only in a mod that accepts a deferred compaction: the command is queued until the session is idle.
  fallbackToCommand?: boolean
}

// Compacts with $.session.compact. When the host rejects that call, it rethrows the rejection, or, with
// options.fallbackToCommand, runs the /compact command and returns { deferred: true }.
// The cause of a rejection is not told apart (the generated types name only a running turn).
// Call it after the hook that asked for it has returned, from a timer or a button press: the generated types say the
// session method rejects while a turn runs and the command rejects inside a hook the turn waits on, so from such a
// hook both calls fail.
// A { skip } answer is a veto by a hook and stands: it is returned and the command is not tried.
// When both calls are refused, the error carries both causes.
export async function compactWithCommandFallback(
  $: EngineInterface,
  instructions?: string,
  options: CompactOptions = {},
): Promise<CompactOutcome> {
  let refusal: unknown
  try {
    const result = await $.session.compact(instructions === undefined ? {} : { instructions })
    return { way: 'session', deferred: false, result }
  } catch (error) {
    if (options.fallbackToCommand !== true) throw error
    refusal = error
  }
  try {
    // args is the text after /compact, as the person would type it; left out, the host reads it as empty.
    const ran = await $.command.run(instructions === undefined ? { command: 'compact' } : { command: 'compact', args: instructions })
    return { way: 'command', deferred: true, text: ran.text }
  } catch (error) {
    throw new AggregateError([refusal, error], 'the host refused the compaction and the /compact command')
  }
}
```

The behaviour tests are in tests/reference-modules/compact-with-command-fallback.test.ts.

## Surfaces

Terminal: works. `$.session.compact` and `$.command.run` are listed in the API table (`mods-doc-mods-reference` lines 204 and 210) without a surface named, and neither is marked limited to one surface in the generated types.

Desktop: works in the Code tab of the Desktop app (`mods-doc-mods-overview` line 212), except in a WSL session, where plugins are not available (line 213). The opt-in fallback is for a mod that accepts a compaction queued behind the running turn, not a way past a host that refuses on purpose: token-optimizer and tokensaver both say a host that runs headless refuses a compaction a plugin starts with the session method. Whether the Desktop app, the chat panel of the VS Code extension or the SDK refuses it, and whether each accepts the command instead, is UNVERIFIED.

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add. The caller words what the person sees.

Operating systems: any; the module uses no program and no path.

## Traps

- The engine refuses a compaction while a command holds the turn. Start it after the command has returned, on a short timer. The 50 milliseconds that tokensaver waits is its own choice, not a host rule.
- Do not await a compaction in the hook that asked for it. Let it run once the turn lets go.
- A compaction that a plugin starts with the session method skips the session compaction hook of that same plugin. If your hook has to see it, run the host compact command as the person would type it.
- Judge success from evidence: a compaction counted during the call, and the token counts before and after. Do not judge it from the reply text.
- Allow one compaction or clear at a time. Record a claim before the call and release it in a finally block, so a second press or a second rule cannot overlap.
- A compaction costs one full prompt-cache miss. Gate it on a minimum saving, as context-harness does before it folds.
- A clear removes the conversation. Save a hand-off first, and make a destructive button take two presses, as token-optimizer does.
- Check the session identifier at every step that waits. A session that changed meanwhile must not be compacted or cleared.
- token-optimizer comments say its desktop sessions run headless, where the host refuses a plugin-started compaction. The chapters do not confirm this: UNVERIFIED here.
- The default respects a refusal: without `fallbackToCommand` a rejection of `$.session.compact` is thrown as it is. The module cannot tell why the session method was rejected: the generated types name one cause, a running turn (index.d.ts line 2929), and give the rejection no code or class, so a deliberate refusal looks the same. Set the option only in a mod that accepts a deferred compaction.
- `$.command.run` is queued and runs once the session is idle (index.d.ts line 3153), so the fallback turns an immediate compaction into a deferred one, and the outcome says `deferred: true`. Never report it as done: word the reply as queued ("compacting when the turn ends"), hold your one-at-a-time claim until the call settles, and judge success from your own `session.compact` hook. Whether the returned promise waits for the run to finish, and not only for its start, is not stated: UNVERIFIED.
- Fall back to the command only when the session method rejects. A `{ skip }` answer is a veto from a hook, and running `/compact` after it asks again for what a hook has just refused; return it as it is.
- The command result says only what `/compact` printed. It carries no token counts: read them in your own `session.compact` hook, which a compaction by the command reaches, as tokensaver 0.4.0 does.
- When the command is refused too, keep both causes. tokensaver 0.4.0 shows only the first; an error that names both tells the person whether the session method or the command is the one to look at.
- The behaviour tests answer the two calls through the host test kit. Only by running the kit was it seen that a stub that throws is skipped, after which the call rejects with the kit's own message, and that a compaction answer needs at least one message: UNVERIFIED.

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### tokensaver 0.3.0, hooks/register.tsx:382-405, MIT

Full source: examples/tokensaver/hooks/register.tsx:382-405 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
const compactNow = async ($: EngineInterface, instructions: string): Promise<string> => {
  try {
    const result = await $.session.compact({ instructions })

    assistant = onCompacted(assistant, {
      before: result.skip === undefined ? result.tokensBefore : undefined,
      after: result.skip === undefined ? result.tokensAfter : undefined,
      isSkipped: result.skip !== undefined,
      now: Date.now(),
    })

    return result.skip === undefined ? 'Compacted.' : `Compaction skipped: ${result.skip}`
  } catch (error) {
    assistant = { ...assistant, isCompacting: false }

    const text = `Clawd could not compact now: ${reasonOf(error)}`

    $.ui.toast(text)

    return text
  } finally {
    refresh($)
  }
}
```

### tokensaver 0.3.0, hooks/register.tsx:517-534, MIT

Full source: examples/tokensaver/hooks/register.tsx:517-534 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
    case 'compact': {
      const step = requestCompact(assistant)

      assistant = step.assistant

      if (step.reply.instructions === undefined) {
        return `Clawd: ${step.reply.why ?? 'not now'}`
      }

      const instructions = step.reply.instructions

      // A command holds its own turn, under which the engine refuses to compact: start once it has let go.
      $.clock.after(50, () => {
        void compactNow($, instructions)
      })

      return 'Clawd is compacting the conversation, keeping your current task in focus.'
    }
```

### context-harness 0.0.1, hooks/register.ts:365-378, MIT

Full source: examples/context-harness/hooks/register.ts:365-378 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
    $.clock.after(1000, () => {
      // /compact as the person would type it: a compaction this plugin starts
      // with $.session.compact() skips this plugin's own session.compact hook,
      // so it would summarize instead of fold. Queued until the session is idle.
      void $.command
        .run({ command: 'compact' })
        .catch(() => undefined)
        .finally(() => {
          isFoldScheduled = false
        })
    })

    return done
  })
```

Credits for these excerpts are in NOTICE at the plugin root.
