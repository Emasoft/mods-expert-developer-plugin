# Clock and timer

Reference notes on how installed mods run work on a schedule inside a session. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-api` ("Run and control background work") for `$.clock`, and `mods-doc-mods-interfaces` (the passage on keeping a clock or a countdown current by redrawing on a schedule).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A callback that the host runs while the session is open. The mod gets `$.clock.every(ms, fn)`, which repeats like setInterval, and `$.clock.after(ms, fn)`, which runs once like setTimeout. Each call returns a timer with a `cancel()` method, and `await $.clock.now()` gives the time in milliseconds. The callback runs outside any event, so it keeps running between turns and does not start one (`mods-doc-mods-api`).

## When to build one

- A figure must keep moving or counting while the person watches: a cache countdown, an elapsed time, an animation.
- Something must happen after a delay that is not itself an event: a warning once a cache has gone cold, or an action queued until the session is idle.
- Work must run between turns, such as a freshness check of data that another session may have changed.
- Do not use a timer for a figure needed only once, or for a fast loop over a slow process. Redraw on the event instead.

## How each mod does it

### tokensaver 0.3.0 (MIT)

- The refresh tick (hooks/register.tsx:316-330, excerpt below) is created only when no timer exists and something is still moving. The check is `needsClock()`: an animating strip, or a flare still on screen. Each tick advances the mood with the current time and refreshes again. When nothing moves any more, the tick cancels itself and draws one last frame without the passing mood. The interval is 250 ms (line 69).
- The idle check (hooks/register.tsx:432-456, excerpt below) is armed after a turn with `$.clock.after`, for the cache lifetime plus one second. Each arming cancels the earlier idle timer first. A lifetime of zero or less arms nothing.
- When the check fires, it computes the cold state from the larger of the current time and the time the timer was due, and it warns once, on the change from warm to cold.

### deck 0.4.12 (MIT)

- One 150 ms tick runs for the whole session (hooks/register.js:1565-1580, excerpt below). It counts frames and takes the seconds from `Date.now()`. It requests a redraw only when something visible changed: the pet moved, a terminal animation ran on an even frame, or a second passed while the clock or a meter is shown.
- Heavier work is paced by frame count: agents every 14 frames, usage every 400 frames with a lighter note every 100 frames, and weather every 8000 frames.
- Two short timers end themselves: the fold animation runs every 33 ms and cancels when the fold ends (hooks/register.js:988-1008), and the demo runs every 1.4 s and cancels once every step has finished (hooks/register.js:1666-1689).

### context-harness 0.0.1 (MIT)

- After a turn ends (hooks/register.ts:317-378), when context use has reached the fold threshold and folding would remove enough of the transcript, the mod sets a flag and calls `$.clock.after(1000, ...)`. One second later it runs the /compact command through `$.command.run`. The flag is cleared in a finally block, so a failed run cannot leave a fold pending.
- The code comment gives the reason. A compaction that the plugin starts itself with `$.session.compact()` skips the compaction hook of this plugin and would summarize instead of fold, so the plugin runs /compact as a person would type it, queued until the session is idle.

### token-weather-usage 3.17.15 (Apache-2.0): own words, no excerpt

- Two timers start at session.start (hooks/token-weather-usage.mjs:571-585). One runs every minute and adopts a newer shared reading and asks for a redraw. The other runs every ten seconds, recomputes the cache countdown text and refreshes the running agents, and asks for a redraw only when the text or the agent list changed.
- session.end cancels both, but only on a real end, with the reasons prompt_input_exit or other. A /clear or a /resume keeps them (hooks/token-weather-usage.mjs:590-597).

### regia 0.3.3: own words, no excerpt

- A one-second clock starts at session.start (hooks/register.tsx:137-170). Its tick returns at once when no run is busy. While busy it advances the clock and, every third tick, lists the running agents from the host, reconciles them with its own snapshot, and refreshes the status line (hooks/register.tsx:99-122).

### token-optimizer 5.13.58 (PolyForm Noncommercial 1.0.0): own words, no excerpt

- The desktop band cancels the timers it holds, then starts two `clock.every` timers, one for the band tick and one for the quality refresh. They sit in a try block, so a host without timers still redraws on events (desktop/token-optimizer-desktop/hooks/register.tsx:364-392).
- A busy state times out through a one-shot timer (desktop/token-optimizer-desktop/hooks/register.tsx:525-546). When it fires, the callback reads the state again and does nothing if the state has moved on, either to another busy value or to a different start stamp. Only then does it write a note and a toast.
- The Stop runner records a keep-warm arm for the session (hooks/stop_runner.py:301-319). That is a record, not a timer inside the session: the scheduled job it relates to runs outside the session and is not described here.

## Traps

- A timer keeps running between turns, so it can redraw or write while the person is idle. Keep each callback cheap.
- A callback that throws is written to the debug log, and the timer runs again at its next interval, so a failure that repeats shows up on every interval. Decide per case whether the timer should stop instead (`mods-doc-mods-api`).
- Cancel the earlier handle before you start a new one. token-weather-usage cancels both tickers at the top of session.start, token-optimizer cancels its cadence timers before it makes new ones, and tokensaver creates its tick only when no timer exists. Without this, a reload leaves the old timer running beside the new one.
- Cancel what is no longer needed. The tokensaver tick cancels itself when nothing moves, and the deck fold timer cancels at the end of the fold.
- Match the timer to the session. token-weather-usage keeps its timers through /clear and /resume and cancels them only on a real end.
- Compute from the time the timer was due, not from the moment the callback ran. tokensaver uses the larger of now and the scheduled time, so a late callback still reports the right state.
- A timeout armed for one state must check that state when it fires. The token-optimizer busy timeout does nothing when the state has moved on.
- Redraw only when the shown text changed. token-weather-usage compares the cache text before it asks for a redraw.
- Pace heavy reads apart from the tick. deck reads usage every 400 frames and weather every 8000 frames, not on every tick.
- The intervals run from 150 ms (deck) to one minute (token-weather-usage), each matched to what moves on screen.

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### tokensaver 0.3.0, hooks/register.tsx:316-330, MIT

Full source: examples/tokensaver/hooks/register.tsx:316-330 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
  if (timer === undefined && needsClock()) {
    timer = $.clock.every(TICK_MS, () => {
      session = onTick(session, Date.now()).session

      if (!needsClock()) {
        timer?.cancel()
        timer = undefined
        // One last frame without the passing mood.
        void attempt(() => update($, revision, count => count + 1), undefined)
        return
      }

      refresh($)
    })
  }
```

### tokensaver 0.3.0, hooks/register.tsx:432-456, MIT

Full source: examples/tokensaver/hooks/register.tsx:432-456 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```tsx
const armIdleCheck = ($: EngineInterface): void => {
  idleTimer?.cancel()
  idleTimer = undefined

  const ttl = assistant.config.cacheTtlMinutes * 60_000

  if (ttl <= 0) {
    return
  }

  const firesAt = Date.now() + ttl + 1000

  idleTimer = $.clock.after(ttl + 1000, () => {
    idleTimer = undefined

    const wasCold = assistant.isCold
    // The timer firing is the proof that the idle time passed, whatever clock drives it.
    assistant = onIdleCheck(assistant, { now: Math.max(Date.now(), firesAt), isEnabled: session.config.isEnabled })

    if (assistant.isCold && !wasCold) {
      $.ui.toast(`Clawd: ${speechOf(assistant, { now: Date.now(), isEnabled: true, activeAgents: 0 })}`)
      refresh($)
    }
  })
}
```

### deck 0.4.12, hooks/register.js:1565-1580, MIT

Full source: examples/deck/hooks/register.js:1565-1580 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```js
    $.clock.every(150, async () => {
      frame++
      const now = Date.now()
      const rows = collectRows(now)
      react($, rows, now)
      const petMoved = prefs.show.pet && stepPet(pet, petMood(rows, now), now)
      const secondTick = now - lastSecond >= 1000
      if (secondTick) lastSecond = now
      const terminalAnim = sawTerminal && frame % 2 === 0 && (rows.some((r) => r.animating) || prefs.show.pet)
      const ticking = secondTick && (prefs.show.clock || rows.some((r) => r.kind === 'meter' || r.strips))
      if (petMoved || terminalAnim || ticking) $.ui.invalidate('ui.render')
      if (frame % 14 === 0) await syncAgents($)
      if (frame % 400 === 0) await refreshUsage($)
      else if (frame % 100 === 0) await noteUsage($)
      if (frame % 8000 === 0) await refreshWeather($)
    })
```

Credits for these excerpts are in NOTICE at the plugin root.
