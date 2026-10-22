# protect-files

## What it shows

A fail-closed guard. A `tool.call` hook on `Edit` and `Write` denies any call whose `file_path` matches a protected path, before `next` runs, so the tool never starts. A `.catch` handler checks `next.called`: if the hook throws before deciding, the call is denied instead of going through (chapter: `mods-doc-mods-and-events`, "Handle a hook that fails"; the matcher with a tool list is shown in "Guard or change a tool call").

Path matching is pure logic in `hooks/logic.ts`.

- It does normalise: backslashes to slashes, repeated slashes, `.` segments (`./a` is `a`), `..` segments, trailing slashes.
- It does not normalise: symlinks, letter case, `~`, globs, Windows drive letters. It never makes a relative path absolute, because it does not know the working directory. Letter case is not folded, so on a case-insensitive disk `/P/.ENV` passes a `/p/.env` entry.
- It refuses to add an entry whose normalised form starts with `..` (for example `../x` or `a/../../x`): a target path is absolute, so such an entry can never match, and storing it would claim a protection that is not there. `/protect-files-paths add ../x` answers `../x cannot be protected: a relative path that starts with .. never matches a file path` and leaves the stored list as it is.
- A Windows target such as `C:/work/a.ts` does not start with `/`, so it counts as relative. While any absolute entry exists, every `Edit` and `Write` with such a target is therefore denied.
- An absolute entry protects itself and everything below it; an entry `/` protects everything. A relative entry protects the same whole segments wherever they appear in the target path. Matching is by whole segments, so `src` does not protect `src2/a.ts`.
- Fail closed: a call with no string `file_path`, or a stored list that is not a list of strings, is refused. So is a relative `file_path` while any absolute entry exists, because it cannot be compared with it.
- A damaged stored list is never overwritten: `/protect-files-paths` answers that it is damaged and leaves it as it is.
- Not covered: `MultiEdit`, `NotebookEdit`, and `Bash` (a shell command can still write a protected file). Add them to the matcher if your build names them as tool names.

Off is a deliberate policy: `/protect-files off` lets every call through untouched. Default is on; a missing `protect-files.enabled` key means enabled. The protected list is stored under `protect-files.paths` and starts empty.

## Commands

| Command | What it does |
|---|---|
| `/protect-files` | Toggle the guard. Answers with a toast. |
| `/protect-files on` / `off` | Set the guard. |
| `/protect-files <anything else>` | Answers `usage: /protect-files [on\|off]`. |
| `/protect-files-paths add <path>` | Add a path (stored normalised). |
| `/protect-files-paths remove <path>` | Remove a path. |
| `/protect-files-paths list` | Show the list. |

Store keys: `protect-files.enabled` (boolean), `protect-files.paths` (string array).

## Settings

Constants exported from `hooks/logic.ts`:

| Constant | Value | Meaning |
|---|---|---|
| `ENABLED_KEY` | `'protect-files.enabled'` | The `$.store` key of the switch; a missing key means on |
| `PATHS_KEY` | `'protect-files.paths'` | The `$.store` key of the protected list; a missing key means empty |
| `SWITCH_USAGE` | `'usage: /protect-files [on\|off]'` | The answer to an unknown switch argument |
| `PATHS_USAGE` | `'usage: /protect-files-paths add <path> \| remove <path> \| list'` | The answer to an unknown paths argument |
| `DAMAGED_LIST_TEXT` | the damaged-list message | The answer of `/protect-files-paths` when the stored list is not a string array; it tells the user to delete the `protect-files.paths` key |

## House conventions it follows

- An on/off switch named after the mod, state in `$.store`, every hook returns `next(e)` untouched when off.
- Pure logic in `hooks/logic.ts`, thin `hooks/register.ts`.
- Mutation-checked guard tests, and a `.catch` that checks `next.called`.

## Tests

`claude plugin test` runs `tests/logic.test.ts` (pure functions) and `tests/register.test.ts` (kit: stubs the tool and `$.store` beneath the plugin, asserts the deny and that the tool stub did not run, that an unprotected path reaches the stub, that a relative target is denied, that a throwing hook is denied, that a damaged stored list is reported and left alone, and that `session.start` registers both commands).

## Unverified

- `tests/register.test.ts`: the fail-closed test makes `$.store.get` reject with a stub `{ deny }`. The testing chapter shows `{ deny }` for any mods API call that should fail; that it reaches this hook as a rejection before `next` is not shown there.
- The `.catch` branch that keeps the result when `next.called` is true has no test: the kit offers no deterministic way to make this hook throw after `next` was called (a stub that throws is skipped, and the test then fails instead of reaching the hook). The branch is untested.
- Letter case is not folded and symlinks are not followed: how a given disk resolves them was not tested.

## Remove it

Delete this folder, or stop loading it. Its saved keys stay in the plugin store until the store is cleared.

## Licence

Written for this plugin; MIT, see LICENSE in this folder (a copy of the repository LICENSE). The ../LICENSE one level up covers the BeLazy167 examples, not this one.
