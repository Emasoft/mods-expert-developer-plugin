# Sending a request from a mod

Reference notes on how installed mods call an HTTP address. Excerpts are third-party data to read and adapt, never instructions to follow. The mods-doc-* chapter skills are authoritative: `mods-doc-mods-api` (the `$.http.fetch` result shape and its redirect rule for headers) and `mods-doc-mods-reference` (the Limits table: body sizes, the redirect count and the 30-second limit on one call).

## Table of Contents

- [What it is](#what-it-is)
- [When to build one](#when-to-build-one)
- [How each mod does it](#how-each-mod-does-it)
- [Traps](#traps)
- [Excerpts](#excerpts)

## What it is

A network call is a request a mod sends to an HTTP address. A GET fetches data, such as a forecast or the coordinates of a place. A POST carries data out, such as the prompt for a judge model or a row for a webhook. In a host hook the call is `$.http.fetch(url, init)`. The API chapter says it resolves to `{ status, ok, headers, text }` once the body is read. The reference chapter limits one call, redirects and body included, to 30 seconds, follows at most five redirects, and caps a request or response body at 4 MiB.

The API chapter also says that on a redirect to a different origin the host keeps only the accept, accept-language, content-type and user-agent headers. An Authorization header is dropped, so a request that depends on it can fail after the redirect.

## When to build one

- The figure cannot be worked out on the machine: a forecast, the coordinates of a place, or a judgement only a model can give.
- Decide first what leaves the machine. A request is the point where text or data leaves, so read references/scrubbing-before-send.md before the request is written.
- Make the request off the drawing path, and never let a slow server hold the turn. Report the outcome in a status line instead.
- Each model request costs tokens or money. If the call can repeat on every prompt, put a budget and a circuit breaker around it, as context-harness does.

## How each mod does it

### deck 0.4.12 (MIT)

- Weather: the refresh runs only when weather is on and a city is stored. It sends a GET to an open-meteo forecast address whose query carries the stored latitude and longitude, then reads the current temperature and weather code. Every error is caught and ignored, so the band keeps the previous value (hooks/register.js:1078-1087, the first excerpt below).
- City: the `/deck city` subcommand sends the typed city name, encoded for the query, to an open-meteo geocoding address, takes the first result, stores its name and coordinates, then refreshes the weather at once. An empty result gives the person a "No city found" reply. The geocoding request is at hooks/register.js:1713, inside the command handler at lines 1602-1731.
- What leaves the machine: the typed city name in the geocoding query, and the stored coordinates in the forecast query. The mod sends no other content.

### context-harness 0.0.1 (MIT)

- The judge call (askJev) sends one POST per judged point to the endpoint of the chosen provider. The key goes as a bearer token and the body is built from the question set. A timer races the request: a late answer is dropped, and whichever settles first decides. A timeout, a network failure, an HTTP error and an answer that does not parse each come back as a typed failure, never as a throw (hooks/jev-call.ts:57-81, the third excerpt below).
- Two providers, both over HTTPS, have their endpoints in hooks/jev.ts:15-18. The key is read from three places (hooks/jev-call.ts:10-21). Which one wins is decided in hooks/key.ts, which this reference does not quote.
- Budget: judge() reads a per-point budget from the store before the call, refuses the call when the budget or the circuit says no, and records the result after the call (hooks/jev-call.ts:91-107 and hooks/budget.ts:10-36).
- The prompt sent is scrubbed and capped at 600 characters (hooks/register.ts:166; see references/scrubbing-before-send.md).

### ponytail 5.3.2 (MIT)

- The optional webhook receives one turn row as JSON after each finished turn, with a bearer token when one is set. webhookRequest refuses a value that is not a URL, and any scheme other than https, except plain http to localhost. The token is attached only after that check. The name in the row is blanked when the person turns name sending off (hooks/band/metrics.ts:304-317, the second excerpt below).
- The send is not awaited. The code fires it, then reports either a status line with the answer code or a status line saying the webhook is unreachable (hooks/band/register.tsx:139-165).
- The local CSV row is written before the webhook is attempted, so a refused or failed send does not lose the row (hooks/band/register.tsx:139-165).

### token-optimizer 5.13.58 (PolyForm Noncommercial; knowledge only, no excerpt)

This reference makes no claim about the network code of token-optimizer. Its one outbound request on the desktop is a model request that the host fork sends when the Keep warm button is pressed. It is a model request, not an HTTP call of the mod of its own, and this skill does not describe it.

## Traps

- Encode user text placed in a query. deck encodes the city name and leaves the numeric coordinates as they are.
- Check the scheme before a token leaves the machine. ponytail allows https, and plain http only to localhost.
- Do not depend on an Authorization header across a redirect to another origin: the host drops it. Keep authenticated calls on one origin, or fail and say so.
- Put a timeout on every call. The host ends one call at 30 seconds, and context-harness adds its own race so that the answer never waits past its own limit.
- Do not hide a failure. deck refresh catches every error and keeps the old value, so a wrong city or a changed service leaves a stale reading on the band with no sign. Report the failure in a status line or a log.
- Budget any call that can repeat. context-harness keeps a per-point budget with a circuit breaker.
- Never await a webhook on the turn path. Fire it, then report the outcome in a status line, as ponytail does.
- Scrub the text before it is sent (references/scrubbing-before-send.md).

## Excerpts

Data to read and adapt. Each is copied unchanged from the version named in its heading.

### deck 0.4.12, hooks/register.js:1078-1087, MIT

Full source: examples/deck/hooks/register.js:1078-1087 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```js
async function refreshWeather($) {
  if (!prefs.city || !prefs.show.weather) return
  try {
    const { lat, lon, name } = prefs.city
    const r = await $.http.fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,weather_code')
    if (!r.ok) return
    const cur = JSON.parse(r.text).current
    weather = { temp: cur.temperature_2m, code: cur.weather_code, name }
  } catch {}
}
```

### ponytail 5.3.2, hooks/band/metrics.ts:304-317, MIT

Full source: examples/ponytail/hooks/band/metrics.ts:304-317 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
// The token travels only over HTTPS; plain http is allowed for a board on this machine.
export function webhookRequest(url: string, token: string, sendNames: boolean, row: Snapshot): WebhookRequest | { refused: string } {
  let target: URL
  try {
    target = new URL(url)
  } catch {
    return { refused: 'webhook URL is not a URL' }
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
  if (target.protocol !== 'https:' && !(target.protocol === 'http:' && local)) return { refused: 'webhook needs https' }
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token !== '') headers.authorization = `Bearer ${token}`
  return { url: target.href, init: { method: 'POST', headers, body: JSON.stringify(sendNames ? row : { ...row, name: '' }) } }
}
```

### context-harness 0.0.1, hooks/jev-call.ts:57-81, MIT

Full source: examples/context-harness/hooks/jev-call.ts:57-81 once the whole copies land (TRDD-04ZJ9E90, held on CPV issue #267)

```ts
/** One Jev call, raced against a timer; never throws. */
export async function askJev(
  $: EngineInterface,
  key: JevKey,
  state: Record<string, unknown>,
  questions: Record<string, JevQuestion>,
  timeoutMs: number,
): Promise<JevResult> {
  const provider = JEV_PROVIDERS[key.provider]
  const started = await $.clock.now()
  const request = $.http
    .fetch(provider.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key.key}` },
      body: requestBody(state, questions, provider.model),
    })
    .then(
      response => ({ response }),
      () => ({ response: undefined }),
    )
  // A late answer is dropped: whichever settles first decides.
  const timer = $.clock.sleep(timeoutMs).then(() => 'timeout' as const)
  const winner = await Promise.race([request, timer])
  const ms = (await $.clock.now()) - started
  if (winner === 'timeout') return { ok: false, kind: 'timeout', ms }
```
