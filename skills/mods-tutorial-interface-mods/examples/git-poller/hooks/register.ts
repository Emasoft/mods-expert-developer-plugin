import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { View } from '../types/index.js'
import { ENABLED_KEY, MIN_GAP_MS, MOD_NAME, POLL_INTERVAL_MS, USAGE, gitArgv, isDue, parseStatus, parseSwitch } from './logic.js'

// Drawn values live in $.state, so they survive a hot reload and redraw readers
// (mods-doc-mods-interfaces chapter.md:740-748 compares module variables, $.state and $.store;
// the atom, read and update calls are shown at :789).
// enabled is the off switch copied from the store, so ui.render reads only this atom and never the store.
// Writers of enabled: command.run, and the session.start kick (once), which writes only if no command ran
// while its store read was pending (switchGen). Nothing else writes it, so a poll that read the store
// before a /git-poller off cannot write a stale value back over it.
const view = atom({ plugin: 'git-poller', key: 'view' } as const, { snapshot: null, stale: false, enabled: true } as View)

// Counts the /git-poller commands handled. startPolling compares it before and after its store read.
let switchGen = 0

// Module variables: timers stop when the module reloads (mods-doc-mods-api chapter.md:231) and
// module variables reset on a reload (mods-doc-mods-interfaces chapter.md:740-748), so they stay in step.
// The session's directory, from session.start (its event carries cwd: mods-doc-mods-testing chapter.md:138).
let cwd: string | undefined
let inflight: Promise<void> | null = null
let lastStartedAt: number | null = null
// The timer handle (cancel() per mods-doc-mods-api chapter.md:196). null until session.start starts it.
let timer: ReturnType<EngineInterface['clock']['every']> | null = null

// The store holds the off switch. A missing key means on, so only an explicit false turns the mod off.
// $.store.get(key) resolves to the value or undefined (mods-doc-mods-interfaces chapter.md:744).
async function isEnabled($: EngineInterface): Promise<boolean> {
  return (await $.store.get(ENABLED_KEY)) !== false
}

async function runGit($: EngineInterface): Promise<void> {
  // On any failure keep the last good snapshot and only mark it stale: blanking the band
  // would hide a transient error as if the repository had vanished.
  try {
    // No cwd (an event without one): do not run git in whatever directory the engine runs in, which
    // could report another repository's branch. Keep the last snapshot and mark it stale.
    if (typeof cwd !== 'string' || cwd === '') {
      await update($, view, (v) => ({ ...v, stale: true }))
      return
    }
    // git -C <cwd> runs git in the session's directory (see gitArgv). The rejection on start
    // failure or timeout is documented at mods-doc-mods-api chapter.md:290.
    const out = await $.process.run(gitArgv(cwd))
    const snapshot = out.exitCode === 0 ? parseStatus(out.stdout) : null
    if (snapshot === null) await update($, view, (v) => ({ ...v, stale: true }))
    else await update($, view, (v) => ({ ...v, snapshot, stale: false }))
  } catch {
    await update($, view, (v) => ({ ...v, stale: true }))
  }
}

// A refresh that starts while another runs joins it. inflight is assigned synchronously,
// before any await, so two callers in the same tick cannot both start git.
// $.clock.now() resolves to the time (mods-doc-mods-testing chapter.md:216).
function refresh($: EngineInterface): Promise<void> {
  if (inflight !== null) return inflight
  inflight = (async () => {
    lastStartedAt = await $.clock.now()
    await runGit($)
  })().finally(() => {
    inflight = null
  })
  return inflight
}

// Refreshes when the store switch is on. It only reads the switch and never writes the view atom:
// the atom is written by command.run and the session.start kick alone (see the comment on `view`).
// runGit already handles git failures; this guards what is left (a rejected store read or clock
// call) so a background caller never raises an unhandled rejection. The next tick simply tries again.
async function pollIfEnabled($: EngineInterface): Promise<void> {
  try {
    if (await isEnabled($)) await refresh($)
  } catch {
    // Nothing to report to: the timer, turn.complete and the session.start kick have no caller to throw to.
  }
}

// The session.start kick: copies the store switch into the view atom once (a restart or reload
// leaves the atom at its default, so the band would otherwise ignore a stored off), then polls.
async function startPolling($: EngineInterface): Promise<void> {
  try {
    // A /git-poller command that runs while the store read below is held back is newer than that read:
    // its switch must win, so the generation taken before the read gates the write and the refresh.
    const gen = switchGen
    const enabled = await isEnabled($)
    if (gen !== switchGen) return
    await update($, view, (v) => (v.enabled === enabled ? v : { ...v, enabled }))
    // A command that ran between the update and the refresh must not get a stale poll (it would cost one wasted git call; the band stays hidden either way). No test opens this window.
    if (enabled && gen === switchGen) await refresh($)
  } catch {
    // Same as pollIfEnabled: no caller to throw to.
  }
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    // The session's directory for every git call (the event carries cwd: mods-doc-mods-testing chapter.md:138).
    cwd = e.cwd
    // Started once. It also runs while the mod is off, doing nothing, so that /git-poller on
    // needs no restart. The callback captures `$` the way the countdown example does
    // (mods-doc-mods-testing chapter.md:224-227, "Test a timer").
    // session.start fires again after a reload of the mod (mods-doc-mods-reference chapter.md:136),
    // and a reload resets module variables, so the null `timer` after a reload restarts it.
    if (timer === null) {
      timer = $.clock.every(POLL_INTERVAL_MS, async () => {
        await pollIfEnabled($)
      })
    }
    // The first refresh is not awaited: a slow git or store must not delay the session start
    // or skip the command registration below (mods-doc-mods-api chapter.md:208 does the same
    // with its timer: "Return without waiting for the timer, so the session starts right away").
    // It also copies the store switch into the view atom.
    void startPolling($)
    // Register the command last, as the chapter says (mods-doc-mods-api chapter.md:49): a taken
    // name throws, and a hook that throws is skipped, so nothing after this call would run.
    // The call and its fields: mods-doc-mods-api chapter.md:34.
    await $.command.register({ name: MOD_NAME, description: 'Switch the git working-tree band on or off', argumentHint: '[on|off]' })
    // next(e) passes the event on unchanged (mods-doc-mods-reference chapter.md:69; session.start row at :136).
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    // A subagent's turn fires turn.complete with agentId set: poll for the main loop only
    // (mods-doc-mods-and-events chapter.md:253, mods-doc-mods-reference chapter.md:85).
    // The refresh is not awaited: turn.complete must not wait for git, so a slow git cannot delay
    // the end of the turn. pollIfEnabled catches its own errors, so nothing is left unhandled.
    if (e.agentId === undefined && isDue(await $.clock.now(), lastStartedAt, MIN_GAP_MS)) void pollIfEnabled($)
    // next(e) passes the event on unchanged (mods-doc-mods-reference chapter.md:69; turn.complete row at :126).
    return next(e)
  })

  // A string literal, not MOD_NAME: with a variable, claude plugin validate printed command=? for this hook.
  // e.args is the text typed after the command name, or an empty string (mods-doc-mods-api chapter.md:40).
  on('command.run', { command: 'git-poller' }, async ($, e) => {
    const action = parseSwitch(e.args, await isEnabled($))
    if (action.kind === 'usage') return { text: USAGE }
    // Taken before the store write and the atom update below (a usage answer changes nothing, so it
    // does not count): a startPolling store read pending across this point sees the counter move
    // and drops its answer.
    switchGen++
    // $.store.set(key, value) takes any JSON value (mods-doc-mods-interfaces chapter.md:744).
    await $.store.set(ENABLED_KEY, action.enabled)
    // The band reads the switch from the view atom, so write it here too (the other writer is the start kick).
    await update($, view, (v) => ({ ...v, enabled: action.enabled }))
    // $.ui.toast shows a notification with the mod's name (mods-doc-mods-api chapter.md:222).
    await $.ui.toast(MOD_NAME + (action.enabled ? ' on' : ' off'))
    // Not awaited: switching on must not wait for git. pollIfEnabled catches its own errors.
    if (action.enabled) void pollIfEnabled($)
    // No $.ui.invalidate call: a ui.render hook that read an atom runs again each time the atom is
    // written (mods-doc-mods-interfaces chapter.md:798), and the update above writes the atom ui.render reads.
    // {} is an allowed command.run answer (mods-doc-mods-reference chapter.md:113).
    return {}
  })

  // The { component: 'AbovePrompt' } matcher draws in the band above the prompt (mods-doc-mods-interfaces chapter.md:216;
  // AbovePrompt in the render sites table: mods-doc-mods-reference chapter.md:231). A hook returns a tree, or next(e)
  // to show nothing (mods-doc-mods-interfaces chapter.md:214).
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // Read the state first: the read subscribes this site to later writes. It is the only read here.
    const now = await read($, view)
    if (!now.enabled || now.snapshot === null) return next(e)
    // $.ui.resolve(e) returns the elements (mods-doc-mods-interfaces chapter.md:361). Box, Text and Button props, with
    // dimColor and color on Text: mods-doc-mods-reference chapter.md:260-262 and mods-doc-mods-interfaces chapter.md:436.
    const { Box, Text, Button } = $.ui.resolve(e)
    const { branch, changed, untracked } = now.snapshot
    return Box({
      children: [
        Text({ dimColor: true, children: 'git: ' }),
        Text({ children: branch }),
        changed > 0 ? Text({ color: 'yellow', children: ' · ' + changed + ' changed' }) : '',
        untracked > 0 ? Text({ color: 'cyan', children: ' · ' + untracked + ' untracked' }) : '',
        now.stale ? Text({ dimColor: true, children: ' (stale)' }) : '',
        Text({ children: ' ' }),
        // Letter hotkey: a digit on a band button also fires from an empty prompt.
        // plain: true drops the brackets and shows the hotkey (mods-doc-mods-interfaces chapter.md:398).
        // The Button props key, label, onPress and hotkey: mods-doc-mods-reference chapter.md:262
        // and the example at mods-doc-mods-interfaces chapter.md:402.
        Button({ key: 'refresh', label: 'Refresh', hotkey: 'r', plain: true, onPress: async () => { await refresh($) } }),
      ],
    })
  })
}
