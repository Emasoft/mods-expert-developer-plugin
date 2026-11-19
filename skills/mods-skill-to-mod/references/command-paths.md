# How the commands find their files

## Table of Contents

- [The CLAUDE_PLUGIN_ROOT prefix](#the-claude_plugin_root-prefix)
- [What allowed-tools grants](#what-allowed-tools-grants)
- [Nothing is written under the install folder](#nothing-is-written-under-the-install-folder)

## The CLAUDE_PLUGIN_ROOT prefix

Every command of SKILL.md starts with `CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"`. Claude Code substitutes the install folder into both places when it loads this skill, but it does not put the variable CLAUDE_PLUGIN_ROOT in the environment of commands run through the Bash tool (chapter skill `mods-doc-plugin-manifest-reference`, "Where each variable resolves"). The prefix hands it to the script, which reads its sibling files from that folder alone. A script started without it, or from a different copy than the one the variable names, stops with exit 2 and says why. Type each command as shown, with both quoted forms.

## What allowed-tools grants

The `allowed-tools` of this skill lets five commands run without a permission prompt. Each rule repeats its command as written, the `CLAUDE_PLUGIN_ROOT=` prefix and the quotes included, because Claude Code matches a Bash rule against the command as written and does not drop an assignment in front of it. Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}` in the rules as it does in the commands (chapter skill `mods-doc-skills-reference`, "Available string substitutions"). A rule that ends in ` *` is a prefix match: its command runs with any arguments at all (chapter skill `mods-doc-headless-mode-reference`, "Create a commit"). What each rule allows:

- `claude --version`: that command only.
- `check_skill.py *`: reads any file or folder the user can read; it writes nothing.
- `scaffold_mod.py *`: creates a plugin at any `--out` path the user can write to, with no prompt, and runs `node` to compile the spec's regular expressions. Only the script's own checks limit where it writes: it refuses an output folder inside `${CLAUDE_PLUGIN_ROOT}` or inside the source skill, and a non-empty one unless `--force` is given. With `--force` it writes into that folder, replacing files of the same names and the earlier copy of the skill.
- `verify_mod.py *`: runs `claude plugin validate` and `claude plugin test` on any plugin folder it is given, so it runs that plugin's tests, and with `--update-readme` rewrites that plugin's `README.md`. It refuses a folder inside `${CLAUDE_PLUGIN_ROOT}`.
- `test_check_skill.py`: no ` *`, so the exact command with no arguments.

A command spelled any other way gets no grant from these rules: the session's permission mode decides it as if this skill were not loaded (chapter skill `mods-doc-cc-permissions-modes`, "Available modes"). It prompts in Manual (`default`) mode, goes to the classifier in `auto` mode, is denied without a prompt in `dontAsk` mode and runs without one in `bypassPermissions` mode. A live probe on Claude Code 2.1.317 found that a granted command joined to another with `&&` got no grant; chaining with `;`, `|`, a redirect or `$()` was not probed.

## Nothing is written under the install folder

Nothing is ever written under `${CLAUDE_PLUGIN_ROOT}`, because Claude Code replaces that folder on every plugin update: the scripts write no bytecode there, the scaffold refuses an output folder inside it, and the verify step refuses a plugin folder inside it. The mod goes to a folder the user names. The one thing kept between sessions, the spec of each mod, goes under `${CLAUDE_PLUGIN_DATA}/skill-to-mod/specs/`, which survives updates.
