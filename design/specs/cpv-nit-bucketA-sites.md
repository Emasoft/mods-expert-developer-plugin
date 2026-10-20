# The 72 CPV NIT findings — bucket A enumerated

Bucket A = the 30 distinct SITES on which a rule about a DANGEROUS INSTRUCTION fired.
(36 findings: a finding is a (rule, site) pair, and 6 of the 30 sites carry two rules.)

This is the list backing the editorial question in `DELEGATION.md`: **does this plugin ship, as they appear in Anthropic's own
documentation, the vendor's install one-liner, the permission-bypass CLI flag, the long-lived-token minting command, and the
superuser examples?** Each entry gives the chapter, the line, and the rule that fired — enough to read the passage itself.

**The line text is deliberately NOT quoted here.** A tracked file that quotes these commands is itself read by the skillaudit
rules as an invocation, so quoting them would make this file a new instance of the very finding it documents. The same thing
happened to the ledger during this series: writing the flagged command names into it took the finding count from 72 to 76. Read
the passage at the cited line instead.

## The 30 sites, by chapter

### `mods-doc-automate-actions-with-hooks`

- `skills/mods-doc-automate-actions-with-hooks/references/chapter.md` line 980 — rule: CLAUDE_CLI_PERMISSION_BYPASS

### `mods-doc-cc-github-actions`

- `skills/mods-doc-cc-github-actions/references/chapter.md` line 94 — rule: CLAUDE_CLI_TOKEN_THEFT
- `skills/mods-doc-cc-github-actions/references/chapter.md` line 116 — rule: CLAUDE_CLI_TOKEN_THEFT
- `skills/mods-doc-cc-github-actions/references/chapter.md` line 381 — rule: CLAUDE_CLI_TOKEN_THEFT

### `mods-doc-cc-permissions-modes`

- `skills/mods-doc-cc-permissions-modes/references/chapter.md` line 76 — rule: CLAUDE_CLI_PERMISSION_BYPASS
- `skills/mods-doc-cc-permissions-modes/references/chapter.md` line 382 — rule: SUPPLY_CHAIN

### `mods-doc-channels-reference`

- `skills/mods-doc-channels-reference/references/chapter.md` line 293 — rule: CLAUDE_CLI_PERMISSION_BYPASS

### `mods-doc-hooks-reference`

- `skills/mods-doc-hooks-reference/references/chapter.md` line 2033 — rule: CLAUDE_CLI_PERMISSION_BYPASS

### `mods-doc-mcp-servers-reference`

- `skills/mods-doc-mcp-servers-reference/references/chapter.md` line 1181 — rule: CLAUDE_CLI_TOKEN_THEFT

### `mods-doc-native-toolset-reference`

- `skills/mods-doc-native-toolset-reference/references/chapter.md` line 632 — rule: CMD_INJECTION

### `mods-doc-sessions-reference`

- `skills/mods-doc-sessions-reference/references/chapter.md` line 68 — rule: CLAUDE_CLI_PERMISSION_BYPASS
- `skills/mods-doc-sessions-reference/references/chapter.md` line 79 — rule: CLAUDE_CLI_PERMISSION_BYPASS
- `skills/mods-doc-sessions-reference/references/chapter.md` line 83 — rule: CLAUDE_CLI_PERMISSION_BYPASS

### `mods-doc-troubleshooting-cc-setup`

- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 125 — rule: CMD_INJECTION, SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 390 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 391 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 528 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 535 — rule: SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 599 — rule: CMD_INJECTION, SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 688 — rule: SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 704 — rule: CMD_INJECTION
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 788 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 789 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 790 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 791 — rule: PRIVILEGE_ESC
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 797 — rule: CMD_INJECTION, SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 829 — rule: CMD_INJECTION, SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 836 — rule: SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 845 — rule: CMD_INJECTION, SUPPLY_CHAIN
- `skills/mods-doc-troubleshooting-cc-setup/references/chapter.md` line 1049 — rule: CMD_INJECTION, SUPPLY_CHAIN

## Summary

| chapter | sites |
|---|---|
| `mods-doc-automate-actions-with-hooks` | 1 |
| `mods-doc-cc-github-actions` | 3 |
| `mods-doc-cc-permissions-modes` | 2 |
| `mods-doc-channels-reference` | 1 |
| `mods-doc-hooks-reference` | 1 |
| `mods-doc-mcp-servers-reference` | 1 |
| `mods-doc-native-toolset-reference` | 1 |
| `mods-doc-sessions-reference` | 3 |
| `mods-doc-troubleshooting-cc-setup` | 17 |
| **total** | **30** |
