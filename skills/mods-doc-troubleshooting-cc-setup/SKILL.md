---
name: mods-doc-troubleshooting-cc-setup
description: "Use when working on troubleshooting claude setup. Read-only routing to the preserved Claude Code chapter. Loaded by mods-expert-developer-agent."
user-invocable: false
metadata:
  coordination: exempt
---

# TROUBLESHOOTING CLAUDE SETUP

## Overview

Routes reads about troubleshooting claude setup to its verbatim Claude Code chapter. Consult the preserved reference for this topic.

This skill is coordination-exempt: skip the ai-coord gate for its declared work.

## Prerequisites

Only the TROUBLESHOOTING CLAUDE SETUP chapter shipped in the references folder of this skill.

## Instructions

1. Confirm the task needs troubleshooting claude setup; otherwise stop without opening the chapter.
2. Pick the TROUBLESHOOTING CLAUDE SETUP section from the Table of Contents under Resources and follow its link.
3. Read only that troubleshooting claude setup section; do not preload this or any other chapter.
4. Stop when the TROUBLESHOOTING CLAUDE SETUP section is read: this wrapper routes reads only and authorizes no writes.

## Output

The TROUBLESHOOTING CLAUDE SETUP section the task needs, read into context; nothing is written.

## Error Handling

If an anchor misses, search the TROUBLESHOOTING CLAUDE SETUP headings for the entry title; if the section is absent, report `[BLOCKED]` naming it.

## Examples

Input: a task about "Find your error". Output: open [Find your error](references/chapter.md#find-your-error) and read that section only.

## Resources

Full chapter: [the chapter](references/chapter.md), with the complete TROUBLESHOOTING CLAUDE SETUP table of contents:

- [Troubleshoot installation and login](references/chapter.md#troubleshoot-installation-and-login)
  - [Find your error](references/chapter.md#find-your-error)
  - [Run diagnostic checks](references/chapter.md#run-diagnostic-checks)
    - [Check network connectivity](references/chapter.md#check-network-connectivity)
    - [Verify your PATH](references/chapter.md#verify-your-path)
    - [Check for conflicting installations](references/chapter.md#check-for-conflicting-installations)
    - [Check directory permissions](references/chapter.md#check-directory-permissions)
    - [Verify the binary works](references/chapter.md#verify-the-binary-works)
  - [Common installation issues](references/chapter.md#common-installation-issues)
    - [Install script returns HTML instead of a shell script](references/chapter.md#install-script-returns-html-instead-of-a-shell-script)
    - [`command not found: claude` after installation](references/chapter.md#command-not-found-claude-after-installation)
    - [`permission denied` when adding to your PATH](references/chapter.md#permission-denied-when-adding-to-your-path)
    - [`curl: (56) Failure writing output to destination`](references/chapter.md#curl-56-failure-writing-output-to-destination)
    - [Homebrew cask unavailable or outdated](references/chapter.md#homebrew-cask-unavailable-or-outdated)
    - [TLS or SSL connection errors](references/chapter.md#tls-or-ssl-connection-errors)
    - [`Failed to fetch version from downloads.claude.ai`](references/chapter.md#failed-to-fetch-version-from-downloadsclaudeai)
    - [The connection dropped while downloading the update](references/chapter.md#the-connection-dropped-while-downloading-the-update)
    - [Wrong install command on Windows](references/chapter.md#wrong-install-command-on-windows)
    - [`The process cannot access the file` during Windows install](references/chapter.md#the-process-cannot-access-the-file-during-windows-install)
    - [Install killed on low-memory Linux servers](references/chapter.md#install-killed-on-low-memory-linux-servers)
    - [Installation was killed before it could finish](references/chapter.md#installation-was-killed-before-it-could-finish)
    - [Install hangs in Docker](references/chapter.md#install-hangs-in-docker)
    - [`Raw mode is not supported` during install](references/chapter.md#raw-mode-is-not-supported-during-install)
    - [`claude update` or `claude doctor` hangs](references/chapter.md#claude-update-or-claude-doctor-hangs)
    - [Claude Desktop overrides the `claude` command on Windows](references/chapter.md#claude-desktop-overrides-the-claude-command-on-windows)
    - [Claude Code on Windows requires either Git for Windows (for bash) or PowerShell](references/chapter.md#claude-code-on-windows-requires-either-git-for-windows-for-bash-or-powershell)
    - [Claude Code does not support 32-bit Windows](references/chapter.md#claude-code-does-not-support-32-bit-windows)
    - [Linux musl or glibc binary mismatch](references/chapter.md#linux-musl-or-glibc-binary-mismatch)
    - [`Illegal instruction`](references/chapter.md#illegal-instruction)
    - [`dyld: cannot load` on macOS](references/chapter.md#dyld-cannot-load-on-macos)
    - [`Bus error` while a session is running](references/chapter.md#bus-error-while-a-session-is-running)
    - [`Exec format error` on WSL1](references/chapter.md#exec-format-error-on-wsl1)
    - [npm install errors in WSL](references/chapter.md#npm-install-errors-in-wsl)
    - [Permission errors during installation](references/chapter.md#permission-errors-during-installation)
    - [Native binary not found after npm install](references/chapter.md#native-binary-not-found-after-npm-install)
  - [Login and authentication](references/chapter.md#login-and-authentication)
    - [Reset your login](references/chapter.md#reset-your-login)
    - [OAuth error: Invalid code](references/chapter.md#oauth-error-invalid-code)
    - [403 Forbidden after login](references/chapter.md#403-forbidden-after-login)
    - [Claude Code access has not been granted for this account](references/chapter.md#claude-code-access-has-not-been-granted-for-this-account)
    - [This organization has been disabled with an active subscription](references/chapter.md#this-organization-has-been-disabled-with-an-active-subscription)
    - [OAuth login fails in WSL2, SSH, or containers](references/chapter.md#oauth-login-fails-in-wsl2-ssh-or-containers)
    - [Not logged in or token expired](references/chapter.md#not-logged-in-or-token-expired)
    - [Bedrock, Agent Platform, or Foundry credentials not loading](references/chapter.md#bedrock-agent-platform-or-foundry-credentials-not-loading)
  - [Still stuck](references/chapter.md#still-stuck)
