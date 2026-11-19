# Errors the scripts print

## Table of Contents

- [Messages and fixes](#messages-and-fixes)

Moved from this skill's SKILL.md, whose Error Handling section links here; the skill is adapted from arm-pz's skill-to-mod project (MIT, see NOTICE). Each script stops on a problem with one line that names it, and a verify run that finds a problem ends with `RESULT: FAIL`.

## Messages and fixes

- `error: CLAUDE_PLUGIN_ROOT is not set` (exit 2): the command was typed without its `CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"` prefix. Run it exactly as shown.
- `error: the mods-skill-to-mod scripts need Python 3.9 or later` (exit 2): the `python3` first on PATH is older. Put a newer `python3` first on PATH rather than changing the command, which then would no longer match the `allowed-tools` grant.
- `error: this script is in ..., but CLAUDE_PLUGIN_ROOT points at ...` (exit 2): the script and the variable name two different installs. Run the copy under `${CLAUDE_PLUGIN_ROOT}`.
- `--out ... is inside CLAUDE_PLUGIN_ROOT` or `... is inside CLAUDE_PLUGIN_ROOT` from the verify step: choose a folder the user names, outside the install folder.
- A refusal from the scaffold (a bad frontmatter, a reserved name, a regular expression that does not compile, a command named like the skill, an MCP request, a non-empty output folder) is printed in one line; fix the spec or the skill and run it again.
- `RESULT: FAIL`: read the section marked FAILED (validate, house rules or test), fix the mod and run the verify step again. Debug a hook that is skipped with the chapter skill `mods-doc-mods-troubleshooting`.
