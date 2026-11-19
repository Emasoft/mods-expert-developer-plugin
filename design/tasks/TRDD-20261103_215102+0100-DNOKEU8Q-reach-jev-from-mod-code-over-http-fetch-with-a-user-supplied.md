---
trdd-id: DNOKEU8Q
title: Reach Jev from mod code over http fetch with a user-supplied key
column: todo
status: tasked
created: 2026-11-03T21:51:02+0100
updated: 2026-11-03T22:23:13+0100
current-owner: main-agent@emasoft-mods-expert-developer
created-by: main-agent@emasoft-mods-expert-developer
task-type: spike
min-approval-requirement: none
assignee: main-agent@emasoft-mods-expert-developer
mandate: true
mandated-by: none
approved: true
approval-judge: main-agent@emasoft-mods-expert-developer
approval-datetime: 2026-11-03T21:51:02+0100
relevant-rules: [8, 10, 11]
---

# Reach Jev from mod code over http fetch with a user-supplied key

## ⏵ STATE — READ THIS FIRST ON RESUME (authoritative; supersedes the body) — 2026-11-03

- Column todo. NPT of TRDD-IG2K6DUY; it must be done before increment I5 of that card. Nothing run yet.
- Rule served: directives 9, 10 and 11 (Jev compares each candidate with each existing rule, one pair per call, two passes, two modes); PRRD G10 (no MCP server, ever) and G11 (native mod code first), and G8 (disclose what cannot be supplied by default: the key).
- NEXT ACTION: write a throwaway probe mod in a temporary directory outside the project (never in the plugin), load it with claude --plugin-dir, and run the calls below.

## What to measure

1. $.http.fetch (api chapter:279, 291) POSTs the System One body { model, state, questions } to the OpenRouter endpoint https://openrouter.ai/api/v1/systemone and to https://api.typesafe.ai/v1/systemone (quicksilver scripts/qs.mjs:158-161, 438-441), with the key as a bearer header: status, latency of one pair call, reply shape for a noul (yes/no) question and for a choice question.
2. The key path, provider-specific (the blocking security rule of point 4 of TRDD-IG2K6DUY): the userConfig option openrouterApiKey, else OPENROUTER_API_KEY, is sent only to the OpenRouter endpoint, and typesafeApiKey, else JEV_API_KEY, else TYPESAFE_API_KEY, only to the TypeSafe endpoint (qs.mjs:155-160). Both options are sensitive (manifest chapter:456); the environment is read with $.env.get (api chapter:281). With each key set alone, check that no request goes to the other endpoint. The key never appears in a log line, a toast or an error text.
3. The versioned Jev model id to pin for each provider (the Jev memory note says pin it; quicksilver uses ~typesafe/jev-latest through OpenRouter and jev-latest through TypeSafe, qs.mjs:158-160).
4. The error shapes: no key (401), a bad model id, a body over the token limit (HTTP 400 max_tokens_exceeded per the Jev note), a timeout at 30 s (reference chapter:310).
5. How many calls may run at once without errors (the design uses 8).
6. That nothing in the path is an MCP server (G10).

## Done when

The probe results are recorded under reports_dev/requirements-drafts/, the probe directory is removed, and TRDD-IG2K6DUY point 4 is confirmed or corrected from them.

## Approval log

- 2026-11-03T21:51:02+0100 — MANDATE issued by main-agent@emasoft-mods-expert-developer (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.
