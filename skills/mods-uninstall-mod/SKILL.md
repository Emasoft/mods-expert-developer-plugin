---
name: mods-uninstall-mod
description: "Use when the user asks to uninstall a Claude Code mod plugin, named approximately or incompletely, with or without its marketplace name. Lists the matching installed plugins for the user to pick, uninstalls the one picked with the claude CLI, then reloads the plugins through the run tool."
user-invocable: true
allowed-tools: Bash(claude plugin marketplace list --json), Bash(python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-uninstall-mod/scripts/shortlist.py" *), mcp__mods-expert-developer-plugin__run
---

# MODS UNINSTALL MOD

## Overview

This skill uninstalls one installed mod plugin with the `claude` CLI. The argument is an approximate or incomplete plugin name, with or without its marketplace name. The skill finds the installed plugins whose names match, has the user confirm or pick one, uninstalls it, and reloads the plugins through the `run` tool. It never uninstalls a plugin the user has not picked.

## Prerequisites

- The `claude` CLI on the PATH, and logged in.
- `python3` on the PATH, for the shortlist script of step 3. Without it, stop and tell the user to install Python 3.
- The `run` tool (`mcp__mods-expert-developer-plugin__run`) for the reload, as in `mods-install-mod`: it exists only while its switch, `self-command.run`, is on.

## Instructions

1. Take the argument as the search text. If it is empty, ask the user which plugin to uninstall.

2. If the argument contains `/`, it names a marketplace by its repository. Run `claude plugin marketplace list --json` and take the `name` of the entry whose `repo` equals it. An entry whose `repo` is null never matches. Uninstall takes only names, so the search text becomes that name. If no entry matches, stop and say so.

3. Shortlist the installed plugins. First check the search text against `^[A-Za-z0-9 ._@/-]+$` and that it holds a letter or a digit; if it does not, ask the user again for the plugin name and run no command. Then run the shortlist script with the text in single quotes, so the shell expands nothing in it:

   ```bash
   python3 -I "${CLAUDE_PLUGIN_ROOT}/skills/mods-uninstall-mod/scripts/shortlist.py" '<search text>'
   ```

   The script runs `claude plugin list --json` and prints at most 10 rows, one per installed id and scope, each holding the id, the scope and the `projectPath` (or `-`), separated by tabs. It lowercases the search text and each id, removes spaces, `-`, `_` and `.` from both, and keeps an entry whose id contains the text and whose scope passes this filter: `user` entries; `local` and `project` entries only when their `projectPath` is the current folder, compared both as the shell names the folder and with its symlinks resolved, because the repository can be reached through a symlink; and `synced` entries, so step 4 can say why it stops. It filters before the cut at 10, because `claude plugin list --json` also lists local entries of other folders, which would otherwise take the rows. Show the user only these rows. Exit 1: `claude plugin list --json` did not run, failed, or gave output the script cannot read; stop and report the script's message verbatim. Exit 2: the script refused the search text; ask the user again for the plugin name.

4. Check the scope of each candidate:
   - `user`: a candidate.
   - `local` or `project`: a candidate. The filter in step 3 keeps one only when its `projectPath` is the current folder, so no second check is needed. Uninstall it with its own scope, `-s local` or `-s project`.
   - `synced`: `claude plugin uninstall` accepts only the user, project or local scope. Stop for this candidate and say so. Never map it to another scope.

5. Confirm with the user. If no candidate is left, say that no installed plugin matches, and ask for the exact name. If one candidate is left, show its id and scope. If several are left, list them numbered and ask which one to uninstall. Then ask the keep-data question: keep the plugin data (recommended), delete the plugin data, or cancel. Do not uninstall until the user has answered both questions. Never pass `-y`: `claude plugin uninstall --help` says `-y` only skips the `--prune` confirmation prompt, and this skill never passes `--prune`, so `-y` would skip nothing the skill asks; the two answers are the skill's own confirmation, and a permission prompt at step 6, when one appears, comes from Claude Code.

6. Uninstall. Run `claude plugin uninstall '<id>' -s '<scope>' --keep-data --json` when the user chose to keep the data, or `claude plugin uninstall '<id>' -s '<scope>' --json` when the user chose to delete it. Read the JSON result. A non-zero exit: stop and report the JSON result verbatim. No rule in this skill's `allowed-tools` covers `claude plugin uninstall`, so each uninstall runs only when the permission mode, the user's rules or the user's answer to a permission prompt allows it. When the uninstall is refused, do not try it another way: stop, run no reload, and return the exact command for the user to type, then `/reload-plugins --force`, the reload of step 7, to type once it has run.

7. Reload, as the last step of the turn. Call the run tool with `command` set to `reload-plugins` and `args` set to `--force`. Make no other tool call after it and end the turn; the tool queues the reload until the turn ends.

   If the run tool is not available in this session, do not try another reload path. Make the last line of your reply exactly `FAILED: reload not run (<reason>; turn on self-command.run in /mods-switches, then start a new session)`, with the reason in place of `<reason>`.

## Output

- The plugin id uninstalled, its scope, and whether its data was kept or deleted.
- The reload: that `/reload-plugins --force` was requested, or the FAILED line of step 7, or, when the uninstall was refused, its command and the `/reload-plugins --force` line for the user.

## Error Handling

- `python3` is missing: stop and tell the user to install Python 3.
- The argument is empty: ask for the plugin name.
- The repository in the argument matches no marketplace: stop and say so.
- The search text fails the step 3 check, or the shortlist script refuses it (exit 2): ask again, and run no other command.
- The shortlist script exits 1: stop and report its message verbatim.
- No candidate remains: ask for the exact name.
- The user cancels: stop. Nothing has changed.
- The uninstall exits non-zero: stop and report the JSON result verbatim.
- The uninstall is refused: stop, run no reload, and return the command and the reload line, as step 6 says.
- The run tool is absent: the FAILED line of step 7.

## Examples

Input: `dev tools`. The shortlist shows one user-scope row. The user picks it and keeps the data, so the skill runs the uninstall with `--keep-data`, then calls the run tool as the last call of the turn. A local-scope row of another folder never reaches the shortlist: the filter of the shortlist script drops it.

## Resources

- `claude plugin uninstall --help`: the flags this skill uses.
