# git-poller

## What it shows

A band above the prompt with the working-tree state: the branch, the number of changed files and the number of untracked files, plus a `Refresh` button (hotkey `r`). A background poller keeps it current by running `git -C <cwd> status --porcelain=v1 --branch` through `$.process.run` (an argument list, no shell), where `<cwd>` is the `cwd` of the `session.start` event. Without a usable `cwd` git does not run and the snapshot is marked stale.

It is a teaching example for a poller: one timer started once in `session.start`, refreshes that join, a minimum gap after `turn.complete`, main loop only, and a last good snapshot kept on error (the band then adds `(stale)`).

## Settings

Constants exported from `hooks/logic.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `MOD_NAME` | `'git-poller'` | The command name and the toast prefix |
| `ENABLED_KEY` | `'git-poller.enabled'` | The `$.store` key holding the switch; a missing key means on |
| `USAGE` | `'usage: /git-poller [on\|off]'` | The answer to an unknown argument |
| `POLL_INTERVAL_MS` | `15000` | The timer refreshes every 15 seconds |
| `MIN_GAP_MS` | `5000` | A `turn.complete` refresh waits until 5 seconds have passed since the last refresh started |
| `GIT_STATUS_ARGS` | `['status', '--porcelain=v1', '--branch']` | What git is asked. `gitArgv(cwd)` returns `['git', '-C', cwd, ...GIT_STATUS_ARGS]`, the argument list given to `$.process.run`, so git runs in the session's directory |

`session.start` starts the first refresh without waiting for it, so a slow git never delays the session or the command registration. `turn.complete` does not wait for git either: it starts the refresh and returns at once. Outside a git repository the band never appears.

## Commands

| Command | Does |
|---|---|
| `/git-poller` | Toggles the band |
| `/git-poller on` | Turns it on |
| `/git-poller off` | Turns it off |
| `/git-poller <anything else>` | Answers `usage: /git-poller [on\|off]` |

Each change shows a toast, `git-poller on` or `git-poller off`. The switch is the store key `git-poller.enabled`; a missing key means on. The band reads the switch from the view atom, which `session.start` (and every poll) and the command fill from the store. While off, the command still answers, `session.start` still starts the timer and registers the command, and `turn.complete` and `ui.render` do nothing (the timer itself still runs and does no work, so `on` needs no restart).

| Key | Does |
|---|---|
| `r` | Refresh now (a letter, not a digit: a digit hotkey on a band button also fires from an empty prompt) |

## House conventions it follows

From `skills/mods-tutorial-quickstart/references/house-conventions.md`:

- An on/off switch, kept in `$.store`.
- Keyboard first: the button has a letter `hotkey`.
- Pure logic in `hooks/logic.ts`, thin `hooks/register.ts`.
- Pollers: all eight rules (timer once in `session.start`, joined refreshes, minimum gap, main loop only, last good snapshot on error, `$.process.run`, redraw through `$.state`, timer tested with the kit).
- Mutation-checked guard tests.

## Tests

Run `claude plugin test` in this folder. `tests/logic.test.ts` covers the pure functions, `tests/register.test.ts` the wiring with the kit mock clock, and `tests/ui.test.tsx` mounts the band with the full `AbovePrompt` prop set and presses the button. Git, the store and the clock are all stubbed; no test runs real git.

## Unverified

- `hooks/register.ts`: the validator printed `command=?` when the `command.run` matcher was a variable, so the matcher is a string literal. Whether a variable would still work at run time was not tested.
- `hooks/register.ts`: that `session.start` always carries `cwd` on every surface is shown only by the testing chapter's example.
- `hooks/register.ts`: with no cwd on `session.start`, or after `/branch` into another directory (`session.start` does not fire after `/clear`, `/resume` or `/branch`: mods-doc-mods-reference chapter.md:136), the band stays empty or shows the old directory.
- `hooks/logic.ts`: the `## No commits yet on` and `## Initial commit on` headers (newer and older git) come from git, not from a chapter; the tests feed them as text.
- `tests/helpers.ts`: that `clock.settle()` also lets the mod's pending promises finish after `session.start` is observed, not documented.
- Layout, colours and the key on your own terminal were not looked at: only the drawn tree is tested.

## Remove it

Delete this folder. To clear the saved switch, run `/git-poller on` before removing it, or delete the `git-poller.enabled` key from the plugin store.

## Licence

Written for this plugin; MIT, see LICENSE in this folder (a copy of the repository LICENSE). The ../LICENSE one level up covers the BeLazy167 examples, not this one.
