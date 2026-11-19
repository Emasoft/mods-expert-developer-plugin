---
trdd-id: GH7GNM8U
title: Adopt the secret-shield detection patterns in requirements-drafts
column: dev
status: tasked
created: 2026-11-03T19:57:13+0100
updated: 2026-11-03T20:58:38+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: feature
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T19:57:13+0100
implementation-commits: [f2722c5]
---

# Adopt the secret-shield detection patterns in requirements-drafts

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

CURRENT STATE 2026-11-03: column dev. Written in the main-merge tree by the mods forge agent, not committed: hooks/requirements-drafts/logic.ts (labels, two new shapes, placeholder and about-name exclusions, type annotation step, JWT start fix, PuTTY idempotence), hooks/requirements-drafts/register.ts (toast names the kinds), hooks/tests/logic.test.ts and hooks/tests/requirements-drafts.test.ts (rewritten to the label format, new positives, negatives, growth shapes and idempotence checks), README.md (masking paragraph, credit line), NOTICE (paragraph and the MIT license of Amrit Preet Singh) and .cspell.json (five new words: Amrit, Preet, changeme, pypi, whsec). Checks, mutants and timings: the forge report under reports_dev/requirements-drafts/ of the main checkout.
NEXT ACTION: the orchestrator reviews the forge report and commits the files by name; the owner then checks a save with a secret on the terminal and on Desktop, and the card moves to human_review.
2026-11-03: committed as f2722c5 on dev main. Its commit message wrongly lists 'the named AWS secret key, AWS session tokens in JSON' as added. The measured comparison (report reports_dev/requirements-drafts/20261103_204941+0100-secret-shield-adoption.md) found both already covered by the credential-name rule, labelled assignment. Adopted: whsec_, pypi-AgE, the typed-assignment value, an unquoted call treated as code, the placeholder list, and the names about a secret. The git guard refused an amend, so this line is the correction. Orchestrator-verified: pytest 825 passed, 1 failed (token-optimizer 5.13.63 not pinned, unrelated), 17 skipped, with the reasons not yet listed.

## User directive (verbatim)

"study this mod and use the masks patterns from it: https://github.com/Singh-AP/awesome-claude-mods/tree/main/mods/safety/secret-shield"

## Owner ruling 2026-11-03 (verbatim)

"use the secret shield style"

It replaces, for this mod, the in-place same-length mask of 2026-10-31 (digits 0, letters a, other characters a bullet): every redacted secret is now stored as [REDACTED:<kind>], a label is never redacted again, the stored text stays within MAX_TEXT_BYTES (the size check runs after redaction, so a message whose labels make it too large is refused, never cut), and the toast names the kinds in plain words on one line.

## Context

Parent context: TRDD-O5LUMKPW (the requirements-drafts mod). That card is not edited by this one. No PRRD exists in this project (design/requirements/PRRD.md is absent), so no relevant-rules apply.

## Scope

- In: the secret-shield shapes our redaction missed (Stripe webhook secret whsec_, PyPI token pypi-AgE), a value after a TypeScript type annotation, the false matches it avoids (placeholder values, names that describe a secret, an unquoted function call, a lone opening brace), the [REDACTED:<kind>] label with per-kind counts, and the JWT pattern's quadratic scan on -eyJ runs.
- Out: secret-shield's isSecretFile, redactDeep, redactBlocks, withhold and its bearer rule; its JWT regex (same start-position flaw); its lowercase $var placeholder; an _id suffix as a name about a secret (a Vault secret_id is a credential). The Basic and Token behaviour is unchanged.

## Approval log

- 2026-11-03T19:57:13+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
- 2026-11-03T19:57:39+0100 — column → dev. implementation in progress by the mods forge agent
