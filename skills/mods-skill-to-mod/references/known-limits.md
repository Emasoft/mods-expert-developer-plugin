# Known limits

## Table of Contents

- [The checker is a keyword heuristic](#the-checker-is-a-keyword-heuristic)
- [Matching command text is a reminder](#matching-command-text-is-a-reminder)
- [A loaded skill is not a proven run](#a-loaded-skill-is-not-a-proven-run)
- [The debug-log masking matches patterns](#the-debug-log-masking-matches-patterns)
- [Surfaces differ](#surfaces-differ)
- [Record the tested version](#record-the-tested-version)

## The checker is a keyword heuristic

The checker is a keyword heuristic over prose. It can miss a moment phrased unusually and over-read an example, which is why the verdict is confirmed by judgement, not copied. It needs two points of evidence before it counts a moment, ignores the trigger wording every skill puts in its own description, and lists weaker hits as `weak_signals`. One known miss: a skill that talks about a pane that already exists (the built-in browser's, say) still reads as MOD_FIRST.

## Matching command text is a reminder

Matching command text is a reminder, not a guarantee: `echo "git push"` also matches, and a rewritten command can slip past. Enforcement belongs in permission rules or managed settings (chapter skill `mods-doc-cc-permissions-modes`).

## A loaded skill is not a proven run

`skill.prompt` shows that a skill was loaded, not that it succeeded. The scaffold treats "loaded since the last edit" as "checked". For proof, have the skill write a receipt file and the mod read it, which costs a `$.fs.read` call the user must accept.

## The debug-log masking matches patterns

The debug-log masking matches patterns (keys that name a secret, Bearer and Basic credentials, credentials in URLs, known token prefixes, long random-looking strings), each replaced by a `[REDACTED:<kind>]` label. A secret in another shape gets through, so the log is still sensitive.

## Surfaces differ

Surfaces differ: what a mod draws shows in the terminal and the Desktop app, `claude -p` runs hooks but draws nothing, and an organisation can stop user-installed mods from loading (chapter skills `mods-doc-mods-overview` and `mods-doc-manage-mods-for-organizations`). Mention the ones that matter for the mod.

## Record the tested version

Mods follow a fast-moving API. Record in the mod's README the Claude Code version it was tested with.
