# OAuth token refresh

Reference notes on renewing an expired login with its refresh token over HTTP: send the request, refuse anything that is not a complete answer, and return the new tokens and the new expiry. Notes are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-api` (`$.http.fetch`, `$.clock`, and the rule that every `$` call is an event an earlier mod can see) and `mods-doc-skills-reference` (the variables that replace a stored sign-in).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each source does it](#how-each-source-does-it)
- [Reference module](#reference-module)
- [Surfaces](#surfaces)
- [Traps](#traps)
- [Sources](#sources)

## What it is

One function, `refreshOAuthToken`. It takes the token endpoint (a URL and a client id, both parameters) and the refresh token, makes one POST with `$.http.fetch`, and returns `{ accessToken, refreshToken, isRotated, expiresAt }`. It decides nothing about when to refresh, where the tokens are kept or whose they are: the caller checks the expiry, takes a lock for the account (account-token-refresh-lock), reads the saved login again inside it, calls this function, and saves the result before the lock goes.

What it refuses, each with an error that never quotes the answer: an endpoint that is not an https URL, an empty or spaced client id or refresh token, a request that could not be sent, an answer that is not 2xx (the error carries the status), an answer over 64 KiB, an answer that is not a JSON object, a `refresh_token` field that is not a plain token, an answer without a plain `access_token`, and an answer without a positive number in `expires_in`. A server that rotates the refresh token spends the old one; when it answers with a new refresh token but the rest is unusable, the error carries that new token as `rotatedRefreshToken`, so the caller can still save it. The expiry is the clock reading taken before the request plus `expires_in` seconds, so a slow answer never makes the token look younger than it is.

The endpoint URL and client id of Claude Code's own login are constants of its client. The sources name them as read from the Claude Code binary; that is their claim and UNVERIFIED here, and this module writes neither. Read them from the build you target.

## When to build one

- A mod that holds saved logins for accounts that are not the live one, and wants their access tokens fresh before it uses them.
- Not for the login Claude Code itself holds: refreshing it rotates the refresh token under the host, which then holds a spent one. Both sources refuse that case; the caller does, before calling this function.

## How each source does it

### moabualruz/rice-session-accounts at af30e671ec51, MIT

- The request is a POST of a JSON body with the grant type, the refresh token and the client id, plus the scopes of the login when it has any; a login without scopes omits the field to keep the scopes it was granted, and an empty field would ask for none (hooks/oauth.ts:140-162). The client id is the login's own when it was signed in with another client. The reference module sends no scope; a mod that needs it adds it.
- The answer is checked field by field. A body over 64 KiB is refused unread. A JSON syntax error is replaced by a fixed text, because the parser quotes what it read and the answer carries grants. A token must be a non-empty string without white space or control characters and under 16 KiB. A missing `refresh_token` means the server did not rotate and the current one stays. A missing `expires_in` counts as ten minutes, a longer one as seven days (hooks/oauth.ts:16-24, 164-220). The reference module refuses a missing or non-positive `expires_in` instead of guessing, and does not cap it.
- When the answer has a new refresh token but no usable access token, the source builds a credential with the new refresh token and an expiry of 0, so the next call spends the new one (hooks/oauth.ts:203-208). The reference module hands the new token to the caller on the error instead.
- A refused answer is classified without echoing the body: only a short list of known error codes may be shown, a revoked grant (`invalid_grant`) means a new sign-in, a 429 and a 5xx keep the saved login for a retry, and a failed request is reported by its error code, never its text (hooks/oauth.ts:25-29, 222-272).

### simplecore-inc/claude-mods at bbaba9937769, MIT

- The refresh is due when the expiry is within five minutes. The request is the same POST with the scopes of the login joined (an empty string when there are none). The answer must have a string `access_token` and a numeric `expires_in`, else it is an error; the refresh token is taken from the answer or kept; the expiry is the time of the call plus `expires_in` seconds (mods/accounts/hooks/anthropic.ts:104-141).
- A refresh that answers after its 30 seconds is still saved when it comes, because the server has already rotated the token (mods/accounts/hooks/credentials.ts:428-431). The reference module has no timeout of its own; the host's limits apply.

## Reference module

The module takes the endpoint as a parameter and sends nothing else. It uses `$.http.fetch` and `$.clock.now` and no other call. The behaviour tests are in tests/reference-modules/oauth-token-refresh.test.ts.

### Reference module, oauth-token-refresh, MIT (this plugin)

```ts
import type { EngineInterface } from 'claude-code'

// Both values are the caller's: the module holds no endpoint and no client id.
export type TokenEndpoint = { url: string; clientId: string }
export type Refreshed = { accessToken: string; refreshToken: string; isRotated: boolean; expiresAt: number }

export class RefreshError extends Error {
  status: number | undefined
  rotatedRefreshToken: string | undefined
  constructor(message: string, facts: { status?: number; rotatedRefreshToken?: string } = {}) {
    super(message)
    this.name = 'RefreshError'
    this.status = facts.status
    this.rotatedRefreshToken = facts.rotatedRefreshToken
  }
}

const MAX_BODY = 64 * 1024
const MAX_TOKEN = 16 * 1024

const isToken = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= MAX_TOKEN && !/[\s\p{Cc}]/u.test(value)

// https, a host, no embedded sign-in, no white space anywhere.
function isHttpsEndpoint(url: string): boolean {
  if (/\s/.test(url)) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.host !== '' && parsed.username === '' && parsed.password === ''
  } catch {
    // new URL throws on a string that does not parse, and that is the same refusal.
    return false // not a valid https endpoint
  }
}

/** Never put the answer, the request or the host's own error text in a message: the answer carries grants. */
export async function refreshOAuthToken($: EngineInterface, endpoint: TokenEndpoint, refreshToken: string): Promise<Refreshed> {
  if (!isHttpsEndpoint(endpoint.url)) throw new RefreshError('the token endpoint must be an https URL')
  if (!isToken(endpoint.clientId)) throw new RefreshError('the client id must be a non-empty token without spaces')
  if (!isToken(refreshToken)) throw new RefreshError('the refresh token must be a non-empty token without spaces')
  // Read before the request, so that a slow answer cannot make the new token look younger than it is.
  const startedAt = await $.clock.now()
  let response
  try {
    response = await $.http.fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: endpoint.clientId }),
    })
  } catch {
    throw new RefreshError('the token request could not be sent or was not answered')
  }
  if (!response.ok) throw new RefreshError(`the token endpoint answered ${response.status}`, { status: response.status })
  if (response.text.length > MAX_BODY) throw new RefreshError('the token endpoint answered with an oversized body')
  let body: unknown
  try {
    body = JSON.parse(response.text)
  } catch {
    throw new RefreshError('the token endpoint answered with text that is not JSON')
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new RefreshError('the token endpoint answered with JSON that is not an object')
  const fields = body as Record<string, unknown>
  const rotated = fields.refresh_token
  if (rotated !== undefined && !isToken(rotated)) throw new RefreshError('the refresh_token of the answer is not a plain token')
  // A rotated token is saved even from a refused answer: the server has already spent the old one.
  const salvage = rotated !== undefined && rotated !== refreshToken ? { rotatedRefreshToken: rotated } : {}
  const accessToken = fields.access_token
  if (!isToken(accessToken)) throw new RefreshError('the answer holds no plain access_token', salvage)
  const seconds = fields.expires_in
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) throw new RefreshError('the answer holds no positive expires_in', salvage)
  return { accessToken, refreshToken: rotated ?? refreshToken, isRotated: rotated !== undefined && rotated !== refreshToken, expiresAt: startedAt + seconds * 1000 }
}
```

## Surfaces

Terminal: works. It uses `$.http.fetch` and `$.clock.now`, neither marked limited to one surface in the generated types, and `mods-doc-mods-api` (line 291) describes `$.http.fetch` without naming a surface.

Desktop: works in the Code tab of the Desktop app (`mods-doc-mods-overview`, line 212), except in a WSL session, where plugins are not available (lines 212-213). That Desktop reaches the token endpoint through the same host path is UNVERIFIED.

This module draws nothing: it has no pane, bar, button or text, so there is no style to set and no show or hide control to add.

Operating systems: any; the module uses no program and no path.

## Traps

- Spending a refresh token twice loses the login. Take the account's lock first (account-token-refresh-lock), read the saved login again inside it, and save the result before the lock is released; this module does none of that.
- The request and the answer are `$.http.fetch` events: a mod earlier in the chain can see the refresh token in the body and the new tokens in the answer, rewrite them or refuse the call (`mods-doc-mods-api`). A refusal after the server answered still leaves the token rotated; the error then holds no new token, because the caller never saw the answer.
- `$.http.fetch` follows up to five redirects and, on a redirect to another origin, drops every request header except four (`mods-doc-mods-api`). The body is not a header, so it is sent again, to wherever the redirect leads. The module cannot tell; use an endpoint that does not redirect. Whether the host sends the body again on every redirect status is UNVERIFIED.
- The module refuses a non-https endpoint, which is stricter than `$.http.fetch`, which accepts http and https. That choice protects the token in transit and is not read from a chapter.
- A rotated refresh token in a refused answer is returned on the error as `rotatedRefreshToken`. An error object travels: do not log it whole, and save the token before anything else.
- The module does not send `scope`. A login that was granted scopes keeps them when the field is absent (RFC 6749 section 6, as the rice source says); whether this server follows that is UNVERIFIED.
- A 2xx answer with a numeric `expires_in` as text, such as "3600", is refused. A server that answers so is not covered; add the conversion in your copy if you meet one.
- The expiry is a local clock reading plus the server's lifetime. A skewed local clock shifts it; refresh with a margin, as both sources do (five minutes).
- A host error for a failed request is dropped on purpose, because it may quote the URL or the body. The cost is that a network failure and a refusal by an earlier mod look the same; the caller can tell them from a status on the error.
- A rotated `refresh_token` inside a non-2xx, oversized or non-JSON answer is lost: the module never reads it, so the old token is spent and the caller holds no new one. Only an answer that parses as a JSON object can hand a rotated token back.
- The module sets no timeout of its own. A request that hangs past the lock's `staleMs` (account-token-refresh-lock) lets a second session take the lock and refresh with a token the server already spent; keep the refresh well inside `staleMs`.
- The behaviour tests answer `$.http.fetch` and `$.clock.now` through the host test kit. The `url` and `init` fields of the http.fetch event and the `{ value }` shape of a stub answer were found by running the kit and not read from a chapter: UNVERIFIED.

## Sources

- moabualruz/rice-session-accounts@af30e671ec51 hooks/oauth.ts:10-29, 140-272, MIT
- simplecore-inc/claude-mods@bbaba9937769 mods/accounts/hooks/anthropic.ts:104-141, MIT
- simplecore-inc/claude-mods@bbaba9937769 mods/accounts/hooks/credentials.ts:412-434, MIT
- simplecore-inc/claude-mods@bbaba9937769 docs/accounts.md:373, MIT
