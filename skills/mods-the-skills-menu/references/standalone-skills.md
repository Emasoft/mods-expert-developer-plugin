# Standalone tool skills

The four user-scope tool skills of the menu, with the use, the non-use, the inputs, the outputs and the dependencies of each. They are optional and recommended, and this plugin does not ship them; the Load with line of each tool is in SKILL.md.

## Table of Contents

- [tldr-code](#tldr-code)
- [fastedit](#fastedit)
- [jgrep](#jgrep)
- [quicksilver](#quicksilver)

## tldr-code

**Use when:** a scoped read of a file or a line range, or locating code by symbol: definitions, callers, impact, structure.

**Do not use when:** the job is a write (use fastedit), or locating code by what it does rather than by a name (use jgrep).

**Inputs:** a file path with a line range, or a symbol name and a directory.

**Outputs:** only the requested lines or symbol facts, read into context; nothing is written.

**Dependencies:** the user-scope `tldr-code` skill and the `tldr` CLI; not shipped by this plugin.

## fastedit

**Use when:** any file change: creating a file, editing, inserting, renaming or deleting a symbol or a block.

**Do not use when:** the job is only reading (use tldr-code).

**Inputs:** the target file and a snippet, or the content of a new file on stdin.

**Outputs:** the validated write, with a backup; check it with `fastedit diff`.

**Dependencies:** the user-scope `fastedit` skill and the `fastedit` CLI; not shipped by this plugin.

## jgrep

**Use when:** locating code by what it does when the identifier is unknown.

**Do not use when:** the exact identifier or string is already known (plain grep is enough).

**Inputs:** a natural-language description of the behaviour and the directory to search.

**Outputs:** ranked file and line locations, to read next with tldr-code.

**Dependencies:** the user-scope `jgrep` skill and the `jgrep` CLI; not shipped by this plugin.

## quicksilver

**Use when:** a verdict over bulk input that would be expensive to read: which of many files, lines or items matter.

**Do not use when:** the input is small enough to read, the job is generation, editing, counting or multi-step reasoning, or the input may hold secrets (it is sent to an outside model).

**Inputs:** the files, lines or items to triage and the question to decide.

**Outputs:** a per-item verdict, which is a lead to verify with tldr-code, never evidence.

**Dependencies:** the user-scope `quicksilver` skill, Node, and its qs.mjs script in that skill's scripts folder, plus a configured provider; not shipped by this plugin.
