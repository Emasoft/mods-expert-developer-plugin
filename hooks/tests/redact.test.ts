// Unit tests of the secret masker of the debug logs (hooks/debug-log/redact.ts), no kit stubs.
import { describe, expect, test } from 'claude-code/testing'

import { isCodeCall, redact } from '../debug-log/redact'

// Fixtures are split so the secret scanner does not read them as live credentials; nothing is suppressed.
const shape = (...parts: string[]) => parts.join('')
// A label is never redacted again (owner ruling of 2026-11-03, item 2): text already stored, redacted
// a second time, comes back as it was, with nothing counted.
const unchanged = (text: string) => redact(text).text === text && redact(text).count === 0

/** The text's size in UTF-8 bytes, the unit MAX_TEXT_BYTES counts. */
const byteLength = (text: string): number => new TextEncoder().encode(text).length
// The cap of the largest timed input of the linear checks (runSize): 4 MiB less 8 KiB, the size limit
// these checks were measured against.
const MAX_TEXT_BYTES = 4 * 1024 * 1024 - 8 * 1024

// Linear-time checks: absolute time bounds failed when other test runs loaded the machine, so each
// check times one input shape at n and 4n characters and bounds t(4n) / t(n), which cancels the
// machine's speed: about 4 for a linear scan, about 16 for a quadratic one.
const GROWTH_LIMIT = 8
// The smaller input must take at least this long when warm, well above timer noise: n doubles from
// MIN_RUN_SIZE until it does. A small start finds a quadratic scan at a few thousand characters,
// where its 4n run takes 16 to 64 times MIN_RUN_MS. 50 ms, not 20: measured inside claude plugin
// test on 2026-10-31, two runs at once at a load average of 52 to 124, 300 single measurements of the
// linear shapes below at each value, the two interleaved: at 20 ms 17 reached 8 (up to 34.1) and 69
// fell below 3; at 50 ms 8 reached 8 (up to 13.9) and 36 fell below 3, for about twice the time. Five
// fast shapes can reach the size cap of runSize first and are timed there (21 ms or more a run then).
const MIN_RUN_MS = 50
const MIN_RUN_SIZE = 1 << 10
// A shape whose measurements take longer than this is reported as slow, once they return. Twice the
// 30 s it was at a MIN_RUN_MS of 20, as the measurements now take about twice as long: the slowest
// single measurement of a linear shape took 13.7 s (load average 52 to 124), and a shape takes up to
// three.
const SLOW_SHAPE_MS = 60_000
// The kit's timeoutMs cannot stop a synchronous test: it fails the test only once the body returns
// (measured on 2026-10-31 with claude plugin test 2.1.316: a 20 s busy loop under timeoutMs 2000 ran
// the full 20 s, then failed). The measurement bounds its own work instead: the size search (runSize)
// stops at MIN_RUN_MS or at its size cap, and each shape is measured at most three times. So this
// timeout names a test that ran too long, and only the 1200 s that tests/test_mod_tests.py gives the
// whole kit run stops a hang. The kit runs each test file in its own process, all at once, and the
// tests of one file one after another, so this file sets the time: 6 x 140 s here and about 1 s for
// the rest make 841 s, 359 s under that budget. The slowest of these tests took 75 s, in runs that
// shared the machine at load averages of 18 to 89 (2026-10-31).
const LINEAR_TEST = { timeoutMs: 140_000 }

/** An input of at least size characters: unit repeated, after head and before tail. */
const repeated = (unit: string, head = '', tail = '') => (size: number) =>
  head + unit.repeat(Math.ceil(size / unit.length)) + tail

/** The time of runs redact calls on text, back to back, in milliseconds. */
function timed(text: string, runs = 1): number {
  const begin = performance.now()
  for (let run = 0; run < runs; run += 1) redact(text)
  return performance.now() - begin
}

/** The warm time of text: one untimed run, then the faster of two timed runs. */
function warmTime(text: string): number {
  timed(text)
  return Math.min(timed(text), timed(text))
}

/**
 * The n a shape is measured at: n doubles from MIN_RUN_SIZE until a warm run of n characters takes
 * MIN_RUN_MS, and stops where doubling again would put the 4n input over MAX_TEXT_BYTES in UTF-8
 * bytes. redact has no size check, so an input over the cap would still be scanned in full; the cap
 * bounds the largest timed input, and with it the time and memory of one run. The earlier cap of 1M
 * characters timed 4n inputs of 4,194,304 characters, over the cap even in ASCII. The timer is a
 * parameter so a test can run the search with one that never reaches MIN_RUN_MS.
 */
function runSize(make: (size: number) => string, warm = warmTime): number {
  let size = MIN_RUN_SIZE
  while (byteLength(make(size * 8)) <= MAX_TEXT_BYTES && warm(make(size)) < MIN_RUN_MS) size *= 2
  return size
}

/**
 * t(4n) / t(n) for one input shape, measured warm: the size search runs each input untimed first, and
 * the two inputs measured are each run once untimed before timing, so neither time includes compiling
 * the patterns, which would raise t(n) and hide a quadratic scan. Each time is the fastest of 3, the
 * two sizes interleaved so a burst of load slows both alike. t(n) is a quarter of four runs back to
 * back, so each timed block holds the same work as one run at 4n: on a loaded machine a short run can
 * slip in between two preemptions or garbage collections while a long one cannot (timed one run each,
 * linear scans showed ratios of 8.2 to 13.1 at a load average of 225, measured on 2026-10-31).
 */
function growth(make: (size: number) => string): number {
  const size = runSize(make)
  const small = make(size)
  const large = make(size * 4)
  timed(small)
  timed(large)
  let fastSmall = Infinity
  let fastLarge = Infinity
  for (let run = 0; run < 3; run += 1) {
    fastSmall = Math.min(fastSmall, timed(small, 4) / 4)
    fastLarge = Math.min(fastLarge, timed(large))
  }
  return fastLarge / fastSmall
}

/**
 * Each shape whose time grows by GROWTH_LIMIT or more when its input grows fourfold, or that is slow.
 * GROWTH_LIMIT is 4 to the power 1.5, the ratio of a scan that grows as n^1.5: the check catches
 * quadratic scans (about 16) and worse, not every scan that grows faster than linear: one between
 * linear and n^1.5 passes (n log n reads about 4.5). It is not lower because load pushes single
 * measurements of linear shapes over 8 (up to 13.9, measured on 2026-10-31), and a lower limit lets
 * more of them agree on a false failure.
 * A verdict needs two measurements that agree, the median of three stopped once two agree: while
 * three test runs shared the machine, 3 of 270 single measurements of linear shapes reached 8 and
 * others fell to 1.2, which for a quadratic scan would read about 5 (measured on 2026-10-31).
 */
function notLinear(shapes: Record<string, (size: number) => string>): string[] {
  const slow: string[] = []
  for (const [name, make] of Object.entries(shapes)) {
    const began = performance.now()
    const ratios: number[] = []
    let high = 0
    while (high < 2 && ratios.length - high < 2) {
      const ratio = growth(make)
      ratios.push(ratio)
      if (ratio >= GROWTH_LIMIT) high += 1
    }
    if (high >= 2) slow.push(`${name}: t(4n)/t(n) = ${ratios.map((ratio) => ratio.toFixed(1)).join(', ')}`)
    if (performance.now() - began > SLOW_SHAPE_MS) slow.push(`${name}: over ${SLOW_SHAPE_MS} ms`)
  }
  return slow
}

describe('redact', () => {
  test('secret-looking text keeps everything but each secret value, which is redacted exactly', () => {
    // cspell:disable
    // [message, text as stored]: each secret value replaced by [REDACTED:<kind>] (owner ruling of 2026-11-03,
    // "use the secret shield style"), and the name, the separator, the quotes and the rest of the text kept.
    // Every one of these messages was refused before 2026-10-31.
    const samples: [string, string][] = [
      [shape('key ', 'AKIA', 'ABCDEFGHIJKLMNOP', ' here'), 'key [REDACTED:aws-access-key] here'],
      [shape('token ', 'gh', 'p_', 'abcdefghijklmnopqrstuvwxyz0123456789'), 'token [REDACTED:github-token]'],
      [shape('use ', 'sk-', 'ant-api03-', 'abcdefghijklmnopqrstuvwxyz'), 'use [REDACTED:anthropic-key]'],
      ['password = hunter2hunter2', 'password = [REDACTED:assignment]'],
      ['Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345', 'Authorization: Bearer [REDACTED:bearer-token]'],
      // A private key: the body is redacted, the BEGIN and END lines stay (a lone header has no body to redact).
      [
        shape('-----BEGIN OPENSSH ', 'PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmU=\n-----END OPENSSH ', 'PRIVATE KEY-----'),
        shape('-----BEGIN OPENSSH ', 'PRIVATE KEY-----\n[REDACTED:private-key]\n-----END OPENSSH ', 'PRIVATE KEY-----'),
      ],
      ['export aws_secret_access_key=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY', 'export aws_secret_access_key=[REDACTED:assignment]'],
      ['GITHUB_ACCESS_TOKEN: abcdefgh12345678', 'GITHUB_ACCESS_TOKEN: [REDACTED:assignment]'],
      [shape('OPENAI_API_KEY=', 'sk-', 'proj-', 'abcdefghijklmnopqrstuvwxyz_0123456789'), 'OPENAI_API_KEY=[REDACTED:openai-key]'],
      [shape('sk-', 'proj-', 'abcdefghijklmnopqrstuvwxyz_0123456789'), '[REDACTED:openai-key]'],
      ['NPM_TOKEN=abcd1234efgh5678', 'NPM_TOKEN=[REDACTED:assignment]'],
      ['dbpassword=s3cretValue99', 'dbpassword=[REDACTED:assignment]'],
      // A base64 secret holds / and still counts (the AWS documentation's example secret key).
      ['aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'aws_secret_access_key=[REDACTED:assignment]'],
      // A dot or a $ inside a value does not make it a reference (second fix round, 2026-10-23).
      ['token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123def456', 'token=[REDACTED:jwt]'],
      ['password=Hunter2.Xk9fj', 'password=[REDACTED:assignment]'],
      ['my password=Xk29fjs82kdQ.', 'my password=[REDACTED:assignment]'],
      ['password=$ecretPa55word', 'password=[REDACTED:assignment]'],
      // A short JWT with no credential name before it: the unconditional pattern takes 8 or more per part.
      ['the cookie holds eyJabcd1234.efgh5678.ijkl9012 after login', 'the cookie holds [REDACTED:jwt] after login'],
      // A / start is a path only in a path shape; base64 secrets can start with / (CPV round, 2026-10-23).
      ['aws_secret_access_key=/K7MDENGbPxRfiCYEXAMPLEKEYwJalrXUtnFEMI', 'aws_secret_access_key=[REDACTED:assignment]'],
      ['password=/Xk29fjs82kdQ', 'password=[REDACTED:assignment]'],
      // Pins for the path shape: two or more segments, and one of them all lowercase letters.
      ['aws_secret_access_key=/K7MDENG/bPxRfiCYEXAMPLEKEY', 'aws_secret_access_key=[REDACTED:assignment]'],
      ['password=/qwertyuiopasdfghjk', 'password=[REDACTED:assignment]'],
      // Credentials inside a URL, after a credential name or anywhere in the message: only the password is redacted.
      [shape('secret: ', 'postgres', '://admin:', 'S3cr3tPass', '@db:5432/app'), shape('secret: ', 'postgres', '://admin:', '[REDACTED:url-password]', '@db:5432/app')],
      [
        shape('connect with ', 'postgres', '://admin:', 'S3cr3tPass', '@db:5432/app today'),
        shape('connect with ', 'postgres', '://admin:', '[REDACTED:url-password]', '@db:5432/app today'),
      ],
      // The Redis form has an empty user; a quoted value is read inside its quotes.
      [shape('cache at ', 'redis', '://:S3cr3tPass@cache:6379'), shape('cache at ', 'redis', '://:[REDACTED:url-password]@cache:6379')],
      ['password: "Xk29fjs82kdQ"', 'password: "[REDACTED:assignment]"'],
      // A credential inside a value that counts as a reference is still judged (last fix round, 2026-10-23).
      ['token_url: https://app.example.com/cb?access_token=Xk29fjs82kdQabc', 'token_url: https://app.example.com/cb?access_token=[REDACTED:assignment]'],
      ['password=$OPENAI_KEY;token=Xk29fjs82kdQ', 'password=$OPENAI_KEY;token=[REDACTED:assignment]'],
      // Short and compound credential names; the long words still match inside a name (PGPASSWORD).
      ['DB_PASS=Xk29fjs82kdQ', 'DB_PASS=[REDACTED:assignment]'],
      ['pwd=Xk29fjs82kdQ', 'pwd=[REDACTED:assignment]'],
      ['PRIVATE_KEY=Xk29fjs82kdQabc', 'PRIVATE_KEY=[REDACTED:assignment]'],
      ['db_credential: Xk29fjs82kdQ', 'db_credential: [REDACTED:assignment]'],
      ['PGPASSWORD=Xk29fjs82kdQ', 'PGPASSWORD=[REDACTED:assignment]'],
      // HTTP basic auth: base64 of user:password after "Basic".
      [shape('Authorization: Basic ', 'dXNlcjpw', 'YXNzd29yZA=='), 'Authorization: Basic [REDACTED:basic-credentials]'],
      // The reference prefixes count only at the start of a value.
      ['password=Xk29fjs82kdQprocess.env.X', 'password=[REDACTED:assignment]'],
      ['password=Xk29fjs82kdQos.environ', 'password=[REDACTED:assignment]'],
      ['password=Xk29fjs82kdQsecrets.x', 'password=[REDACTED:assignment]'],
      // Inside a reference, & and ; end each inner value: a later :// does not hide the credential.
      [
        'token_url: https://app/cb?access_token=Xk29fjs82kdQabc&redirect=https://app/home',
        'token_url: https://app/cb?access_token=[REDACTED:assignment]&redirect=https://app/home',
      ],
      ['password=$A;token=$B;secret=Xk29fjs82kdQ', 'password=$A;token=$B;secret=[REDACTED:assignment]'],
      // Basic auth after authorization and : or =, even with a token of letters only.
      ['Authorization: Basic QWxhZGRpbjpvcGVuSesame', 'Authorization: Basic [REDACTED:basic-credentials]'],
      ['authorization=basic QWxhZGRpbjpvcGVuSesame', 'authorization=basic [REDACTED:basic-credentials]'],
      // Basic auth anywhere when the token decodes to user:password: plain, with a + or / inside, or padded with ==.
      ['send Basic YWRtaW46czNjcjN0UGFzcw with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      ['send Basic QWxhZGRpbjpvcGVu+SesameAB with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      ['send Basic QWxhZGRpbjpvcGVu/SesameAB with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      ['send Basic QWxhZGRpbjpvcGVuSesameAB== with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      // The credential names passphrase and credentials (2026-10-24): both were saved as written before.
      ['passphrase=Xk29fjs82kdQ7pLm', 'passphrase=[REDACTED:assignment]'],
      ['aws_credentials=Xk29fjs82kdQ7pLm', 'aws_credentials=[REDACTED:assignment]'],
      // A JSON header: the quote before "Basic" hides authorization, and the token decodes to user:password.
      ['"Authorization": "Basic QWxhZGRpbjpvcGVuU2VzYW1l"', '"Authorization": "Basic [REDACTED:basic-credentials]"'],
      ['{"Authorization": "Basic QWxhZGRpbjpvcGVuSesame"}', '{"Authorization": "Basic [REDACTED:basic-credentials]"}'],
      // A letters-only token that decodes to user:password counts with no authorization before it.
      ['send Basic QWxhZGRpbjpvcGVuSesameAB with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      // A UTF-8 user name: the colon comes after bytes above 0x7E, which do not end the run (2026-10-24).
      ['send Basic Sm9zw6k6czNjcmV0UGFzc3cwcmQ with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      // A 3-byte UTF-8 user name (CJK): the E1..EF lead branch of the UTF-8 check must accept it, so this is redacted.
      ['send Basic 5bGx55SwOnMzY3JldFBhc3N3MHJk with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      // The empty-user shape of a personal access token: a leading colon and 8 or more bytes after it.
      ['send Basic OmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMw with curl', 'send Basic [REDACTED:basic-credentials] with curl'],
      // A space before the separator, and Proxy-Authorization, with a token that decodes to no colon,
      // so only the authorization rule can redact them.
      ['Authorization : Basic QWxhZGRpbk9wZW5TZXNhbWU', 'Authorization : Basic [REDACTED:basic-credentials]'],
      ['Proxy-Authorization: Basic QWxhZGRpbk9wZW5TZXNhbWU', 'Proxy-Authorization: Basic [REDACTED:basic-credentials]'],
      // Quoted keys: JSON, a Python dict, quoted YAML (review finding H1, 2026-10-24).
      ['{"password": "Xk29fjs82kdQ"}', '{"password": "[REDACTED:assignment]"}'],
      ['{"api_key":"abcd1234efgh5678"}', '{"api_key":"[REDACTED:assignment]"}'],
      ['"token":"Xk29fjs82kdQabc"', '"token":"[REDACTED:assignment]"'],
      ["creds = {'password': 'Xk29fjs82kdQ'}", 'creds = {\'password\': \'[REDACTED:assignment]\'}'],
      // Go := and Ruby/PHP => with a quoted value, and a fullwidth colon.
      ['secret := "Xk29fjs82kdQ"', 'secret := "[REDACTED:assignment]"'],
      ['password => "Xk29fjs82kdQ"', 'password => "[REDACTED:assignment]"'],
      ['password：Xk29fjs82kdQ', 'password：[REDACTED:assignment]'],
      // An OpenPGP private key block and a PuTTY private key file: only the key body is redacted.
      [
        shape('-----BEGIN PGP ', 'PRIVATE KEY BLOCK-----\nlQOYBF0abc\n-----END PGP ', 'PRIVATE KEY BLOCK-----'),
        shape('-----BEGIN PGP ', 'PRIVATE KEY BLOCK-----\n[REDACTED:private-key]\n-----END PGP ', 'PRIVATE KEY BLOCK-----'),
      ],
      [
        'PuTTY-User-Key-File-3: ssh-ed25519\nEncryption: none\nPublic-Lines: 2\nAAAAC3NzaC1lZDI1NTE5AAAAIA\nPrivate-Lines: 1\nAAAAIGZpcnN0c2VjcmV0a2V5Ynl0ZXM',
        'PuTTY-User-Key-File-3: ssh-ed25519\nEncryption: none\nPublic-Lines: 2\nAAAAC3NzaC1lZDI1NTE5AAAAIA\nPrivate-Lines: 1\n[REDACTED:putty-key]',
      ],
      // An Authorization Token header, plain and quoted; curl -u and mysql/docker password flags.
      ['Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b', 'Authorization: Token [REDACTED:bearer-token]'],
      ['"Authorization": "Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"', '"Authorization": "Token [REDACTED:bearer-token]"'],
      ['curl -u admin:S3cr3tPass https://api.example.com', 'curl -u admin:[REDACTED:cli-password] https://api.example.com'],
      ['curl --user=admin:S3cr3tPass https://api.example.com', 'curl --user=admin:[REDACTED:cli-password] https://api.example.com'],
      ['curl -uadmin:S3cr3tPass https://api.example.com', 'curl -uadmin:[REDACTED:cli-password] https://api.example.com'],
      ['mysql --password Xk29fjs82kdQ -h db', 'mysql --password [REDACTED:cli-password] -h db'],
      ['mysql -uroot -pXk29fjs82kdQ', 'mysql -uroot -p[REDACTED:cli-password]'],
      ['docker login --password Xk29fjs82kdQ ghcr.io', 'docker login --password [REDACTED:cli-password] ghcr.io'],
      // camelCase forms of the credential words.
      ['secretKey: "Xk29fjs82kdQ"', 'secretKey: "[REDACTED:assignment]"'],
      ['secretAccessKey=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY', 'secretAccessKey=[REDACTED:assignment]'],
      ['privateKey=Xk29fjs82kdQabc', 'privateKey=[REDACTED:assignment]'],
      ['apiKey: "Xk29fjs82kdQ"', 'apiKey: "[REDACTED:assignment]"'],
      ['authToken: "Xk29fjs82kdQ"', 'authToken: "[REDACTED:assignment]"'],
      ['dbPass=Xk29fjs82kdQ', 'dbPass=[REDACTED:assignment]'],
      // Vendor prefixes with no credential name before them (review finding M1): the prefix is part of the value.
      [shape('sk_', 'live_', '51H8xAbCdEfGhIjKlMnOpQrSt'), '[REDACTED:stripe-key]'],
      [shape('rk_', 'live_', '51H8xAbCdEfGhIjKlMnOpQrSt'), '[REDACTED:stripe-key]'],
      [shape('use ', 'sk_', 'test_51H8xAbCdEfGhIjKlMnOpQrSt', ' in CI'), 'use [REDACTED:stripe-key] in CI'],
      [shape('glp', 'at-', 'Ab3dEfGh1jKlMn0pQrSt'), '[REDACTED:gitlab-token]'],
      [shape('np', 'm_', 'abcdefghijklmnopqrstuvwxyz0123456789'), '[REDACTED:npm-token]'],
      [shape('h', 'f_', 'abcdefghijklmnopqrstuvwxyzABCDEFGH'), '[REDACTED:huggingface-token]'],
      [
        shape('S', 'G.', 'abcdefghijklmnopqrstuv.', 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG'),
        '[REDACTED:sendgrid-key]',
      ],
      [shape('xa', 'pp-1-A0123456789-1234567890123-abcdef0123456789abcdef'), '[REDACTED:slack-app-token]'],
      // Webhook and bot URLs: only the token in the path is redacted.
      [
        shape('https://hooks.', 'slack.com/services/', 'T01ABCDEF/B01ABCDEF/', 'abcdefghijklmnopqrstuvwx'),
        shape('https://hooks.', 'slack.com/services/', 'T01ABCDEF/B01ABCDEF/', '[REDACTED:slack-webhook]'),
      ],
      [
        shape('https://discord.com/api/webhooks/', '123456789012345678/', 'abcdefghijklmnopqrstuvwxyz0123456789_-ABCD'),
        shape('https://discord.com/api/webhooks/', '123456789012345678/', '[REDACTED:discord-webhook]'),
      ],
      [
        shape('https://api.telegram.org/bot', '123456789:', 'AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw', '/getMe'),
        shape('https://api.telegram.org/bot', '123456789:', '[REDACTED:telegram-bot-token]', '/getMe'),
      ],
      [shape('key ', 'ASIA', 'ABCDEFGHIJKLMNOP', ' here'), 'key [REDACTED:aws-access-key] here'],
      // A Docker config auth entry that decodes to user:password.
      [shape('{"auths":{"ghcr.io":{"auth":"', 'dXNlcjpw', 'YXNzd29yZA==', '"}}}'), '{"auths":{"ghcr.io":{"auth":"[REDACTED:docker-auth]"}}}'],
      // One sample per vendor rule that had none (review of 2026-10-31, finding 11), so dropping any
      // rule turns this list red: a fine-grained GitHub token, a Slack bot token, a Google API key on
      // its own (35 characters after AIza), the other GitHub prefixes, and Bearer in any case.
      [shape('use ', 'github', '_pat_', '11ABCDEFG0abcdefghijklmnopqrstuvwxyzABCDEFG', ' in CI'), 'use [REDACTED:github-token] in CI'],
      [shape('slack ', 'xo', 'xb-', '1234567890-abcdefghij'), 'slack [REDACTED:slack-token]'],
      [shape('use ', 'AIza', 'SyA1234567890abcdefghijklmnopqrstuv', ' here'), 'use [REDACTED:google-api-key] here'],
      [shape('gh', 'o_', 'abcdefghijklmnopqrstuvwxyz0123456789'), '[REDACTED:github-token]'],
      [shape('gh', 'u_', 'abcdefghijklmnopqrstuvwxyz0123456789'), '[REDACTED:github-token]'],
      [shape('gh', 's_', 'abcdefghijklmnopqrstuvwxyz0123456789'), '[REDACTED:github-token]'],
      [shape('gh', 'r_', 'abcdefghijklmnopqrstuvwxyz0123456789'), '[REDACTED:github-token]'],
      ['Authorization: BEARER abcdefghijklmnopqrstuvwxyz012345', 'Authorization: BEARER [REDACTED:bearer-token]'],
      [
        'curl -H "authorization: bearer abcdefghijklmnopqrstuvwxyz012345" https://api.example.com',
        'curl -H "authorization: bearer [REDACTED:bearer-token]" https://api.example.com',
      ],
    ]
    // cspell:enable
    // One assertion over the list, so a red run names every sample stored wrongly; each holds one value.
    expect(samples.filter(([text, stored]) => redact(text).text !== stored || redact(text).count !== 1)).toEqual([])
    // Stored text redacted again is left as it is: a label is never a value.
    expect(samples.filter(([, stored]) => !unchanged(stored))).toEqual([])
  })
  test('ordinary text is kept as written', () => {
    expect(redact('The password field must hide what is typed.')).toEqual({ text: 'The password field must hide what is typed.', count: 0, kinds: {} })
    // Requirement text that names a credential with no value after it, or with a reference after it.
    // One assertion over the list, so a red run names every sample wrongly changed.
    const ordinary = [
      'Secretary: Jennifer, the project lead',
      'Secretary: Office2025B on the third floor',
      'passwords=encrypted at rest',
      // References, not secrets: an env reference, a path or a URL after a credential name.
      'api_key: process.env.OPENAI_API_KEY',
      'token=${{ secrets.NPM_TOKEN }}',
      'TOKEN=$GITHUB_TOKEN_FOR_RELEASES',
      'secret_key_base: config/credentials.yml.enc',
      'token_url: https://auth.example.com/oauth/token',
      'token_url: http://localhost:8080/oauth2token',
      'password_file: /run/secrets/db_password1',
      'secret_dir: ~/vault/keys2026ab',
      'API_KEY="$OPENAI_KEY_FROM_THE_ENVIRONMENT"',
      // The sentence's period after a path is stripped before the path is judged.
      'Load it from secret_file: config/credentials.yml.enc.',
      // Lowercase dotted identifiers are code references.
      'token: req.headers.authorization',
      'token = request.headers.token',
      'api_key: config.auth.key',
      // An @ in the query is not a user: the authority ends at ? or #.
      'callback token_url: https://host:8080?email=me@x.com',
      // The short words pass and pwd count only as a whole part of a name: bypass, compass, OLDPWD do not.
      'bypass=Xk29fjs82kdQ',
      'compass=Xk29fjs82kdQ',
      'OLDPWD=Xk29fjs82kdQ',
      // Reference prefixes at the start of a value.
      'api_key = os.environ["OPENAI_API_KEY"]',
      'token: secrets.NPM_TOKEN',
      'token=${{secrets.NPM_TOKEN}}',
      'api_key = os.environ.get(KEY_NAME)',
      // "basic" before a long word of letters is ordinary requirement text.
      'Add basic internationalization support',
      'a basic authentication flow for administrators',
      // A slash list after "basic" is ordinary text: it does not decode to user:password.
      'Add basic read/write/execute permissions',
      // A capitalised word starting O[g-v] decodes to a leading colon; its next bytes are not all ASCII.
      'Add basic OpenTelemetryExporter support',
      'Add basic OrchestrationLayerFactory support',
      // The new credential words in prose, with no secret value after them.
      'the passphrase field is required',
      // cspell:disable
      // Next to each shape added on 2026-10-24 (refused then, redacted now), the ordinary text that must stay saved.
      'the password field is required',
      'secret := os.Getenv("X")',
      'secret := loadFromVaultWithRetries(ctx)',
      'password => hashPasswordWithSalt(password)',
      'const f = token => token.trim()',
      'use a PGP key to sign',
      '-----BEGIN PGP PUBLIC KEY BLOCK-----',
      'convert the PuTTY-User-Key-File-3 file; its Private-Lines: field holds the key',
      'curl -u admin: https://api.example.com',
      'curl -u $USER:$PASS https://api.example.com',
      'docker run -u appuser:appgroup1 img',
      'git push -u origin main',
      'mysql --password -h db',
      'psql -p5432 -h db',
      'mkdir -pv build',
      'docker compose -pmyproject2026 up',
      'mysql --password --default-character-set=utf8mb4 -h db',
      'docker login --password-stdin',
      'tokenizerConfig: "Xk29fjs82kdQ"',
      'PASSWORDHASH=Xk29fjs82kdQ',
      'sk_live mode docs',
      'pk_live_51H8xAbCdEfGhIjKlMnOpQrSt',
      'use glpat- tokens for CI',
      'npm_config_registry is set',
      'hf_hub_download(repo_id)',
      'SG.x.y',
      'xapp- tokens are app-level',
      'the hooks.slack.com/services/ URL goes in settings',
      'discord.com/api/webhooks/{id}/{token}',
      'api.telegram.org/bot<token>/getMe',
      'ASIA pacific region',
      '{"auths":{"ghcr.io":{}}}',
      // cspell:enable
    ]
    expect(ordinary.filter((text) => redact(text).count !== 0 || redact(text).text !== text)).toEqual([])
  })
  test('a value after a credential name is redacted whatever its shape', () => {
    // cspell:disable
    // Each of these was saved in clear before the review of 2026-10-31: the value was short, digits
    // only, words only or not Latin, so it did not look random. A named value is a secret now.
    const named: [string, string][] = [
      ['api_key: 7777777777', 'api_key: [REDACTED:assignment]'],
      ['password=12345678', 'password=[REDACTED:assignment]'],
      ['db_password: s3cr3t', 'db_password: [REDACTED:assignment]'],
      ['password=correcthorse', 'password=[REDACTED:assignment]'],
      ['password=hunter2', 'password=[REDACTED:assignment]'],
      ['sessionid=abc', 'sessionid=[REDACTED:assignment]'],
      ['password=ａｂｃ１２３４５６', 'password=[REDACTED:assignment]'],
      ['password=日本語パスワード1234', 'password=[REDACTED:assignment]'],
      ['password=x²³⁴', 'password=[REDACTED:assignment]'],
      // A ~ alone is no home path: only ~/ is.
      ['password=~Xk29fjs82kdQ', 'password=[REDACTED:assignment]'],
      // The password flags name their value too.
      ['docker login --password hunter2 ghcr.io', 'docker login --password [REDACTED:cli-password] ghcr.io'],
      ['curl -u admin:pw https://api.example.com', 'curl -u admin:[REDACTED:cli-password] https://api.example.com'],
      ['mysql -uroot -phunter', 'mysql -uroot -p[REDACTED:cli-password]'],
    ]
    // cspell:enable
    expect(named.filter(([text, stored]) => redact(text).text !== stored || redact(text).count !== 1)).toEqual([])
    expect(named.filter(([, stored]) => !unchanged(stored))).toEqual([])
  })
  test('escaped JSON and quoted values with spaces are read to their closing quote', () => {
    // cspell:disable
    // An escaped JSON line (JSON inside a JSON string): the name and the value both sit in \"...\".
    expect(redact(String.raw`{\"password\": \"Abc123xyzQ9\"}`)).toEqual({ text: String.raw`{\"password\": \"[REDACTED:assignment]\"}`, count: 1, kinds: { assignment: 1 } })
    // An escaped quote inside a value does not close it, in plain JSON and in an escaped JSON line.
    expect(redact(String.raw`"password": "a\"b12345678c"`)).toEqual({ text: '"password": "[REDACTED:assignment]"', count: 1, kinds: { assignment: 1 } })
    expect(redact(String.raw`{\"password\": \"a\\\"b12345678c\"}`))
      .toEqual({ text: String.raw`{\"password\": \"[REDACTED:assignment]\"}`, count: 1, kinds: { assignment: 1 } })
    // Unquoted, a quote after a backslash is part of the value.
    expect(redact(String.raw`password=abc\"def`)).toEqual({ text: 'password=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    // A quoted value runs to its closing quote, spaces included.
    expect(redact('password: "correct horse battery staple"')).toEqual({ text: 'password: "[REDACTED:assignment]"', count: 1, kinds: { assignment: 1 } })
    expect(redact('api_key = "AB12 CD34 EF56"')).toEqual({ text: 'api_key = "[REDACTED:assignment]"', count: 1, kinds: { assignment: 1 } })
    expect(redact('token: "xyz 12345678"')).toEqual({ text: 'token: "[REDACTED:assignment]"', count: 1, kinds: { assignment: 1 } })
    // A quote that is never closed ends at the line break.
    expect(redact('password: "abc\nthe next line')).toEqual({ text: 'password: "[REDACTED:assignment]\nthe next line', count: 1, kinds: { assignment: 1 } })
    // == is a comparison, not a separator.
    expect(redact('if password == other')).toEqual({ text: 'if password == other', count: 0, kinds: {} })
    // cspell:enable
  })
  test('a false match after a credential name costs only readability', () => {
    // Schema prose names a credential field without holding one. Since the review of 2026-10-31 its
    // value is redacted anyway, because a value's shape no longer decides: until then these were
    // ordinary samples saved as written. Pinned so the trade stays deliberate.
    const prose: [string, string][] = [
      ['auth_token: optional string', 'auth_token: [REDACTED:assignment] string'],
      ['password: required, min length', 'password: [REDACTED:assignment] min length'],
      ['access_token: `string`', 'access_token: [REDACTED:assignment]'],
      ['the secret: keep it short', 'the secret: [REDACTED:assignment] it short'],
      ['api_key: string in the config schema', 'api_key: [REDACTED:assignment] in the config schema'],
      ['passphrase: required, min length', 'passphrase: [REDACTED:assignment] min length'],
      ['credentials: see the vault documentation', 'credentials: [REDACTED:assignment] the vault documentation'],
      ['"password": "required"', '"password": "[REDACTED:assignment]"'],
      ['{"api_key": "string"}', '{"api_key": "[REDACTED:assignment]"}'],
      ['the password：field is required', 'the password：[REDACTED:assignment] is required'],
      ['secretKey: "required"', 'secretKey: "[REDACTED:assignment]"'],
      ['apiKey: string in the config schema', 'apiKey: [REDACTED:assignment] in the config schema'],
      ['{"auth": "required"}', '{"auth": "[REDACTED:assignment]"}'],
      ['sessionid: a string cookie', 'sessionid: [REDACTED:assignment] string cookie'],
      // An unquoted value runs to whitespace, so a separator inside it goes into the label with it.
      ['password=Abc12345xyz,other=1', 'password=[REDACTED:assignment]'],
      // A value after an Authorization header or a scheme word, whatever its shape (verify round of
      // 2026-10-31): these were ordinary samples until then.
      ['Authorization: Token <your-token-here>', 'Authorization: Token [REDACTED:assignment]'],
      ['Authorization: Token AuthenticationRequiredForAll', 'Authorization: Token [REDACTED:assignment]'],
      ['use a bearer token for the API', 'use a bearer [REDACTED:bearer-token] for the API'],
    ]
    expect(prose.filter(([text, stored]) => redact(text).text !== stored || redact(text).count !== 1)).toEqual([])
    expect(prose.filter(([, stored]) => !unchanged(stored))).toEqual([])
    // Pinned here until 2026-11-03, stored as written since: each name says what the value is about
    // (a URL, a mode, a count), so the value holds no secret (adapted from the secret-shield mod, see NOTICE).
    for (const text of ['token_url: https://x/cb?token_type=bearer&scope=read', 'auth_mode: required', 'token_count: 1234567890123456']) {
      expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    }
  })
  test('text with no credential name is stored as written, and so is a value shaped like a reference', () => {
    // cspell:disable
    // A git SHA, a UUID and base64 in a code fence hold no credential name and no vendor prefix.
    for (const text of [
      'commit 3f786850e387550fdab836ed7e6dc881de23001b',
      'id 123e4567-e89b-12d3-a456-426614174000',
      '```\nQWxhZGRpbjpvcGVuIHNlc2FtZQ==\n```',
    ]) expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    // Known residuals, pinned on purpose: a value shaped like a reference is not redacted, even after a
    // credential name. A lowercase dotted password reads as code (req.headers.authorization), $UPPER as
    // an env reference, a/b.ext as a file path.
    for (const text of ['password=correct.horse.battery', 'password=$HUNTER2', 'password=a/b.txt']) {
      expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    }
    // cspell:enable
  })
  test('an Authorization value, user:password@host and a long hex run are redacted (verify round, 2026-10-31)', () => {
    // cspell:disable
    // Hex digits: a run of 64 or more is a key, wherever it stands.
    const hex = (n: number) => '0123456789abcdef'.repeat(8).slice(0, n)
    // [message, stored, values redacted]
    const redacted: [string, string, number][] = [
      // (6) Any value after an Authorization header or a scheme word, whatever its length or shape; the
      // scheme word stays readable.
      ['Authorization: Bearer abc.def.ghi', 'Authorization: Bearer [REDACTED:bearer-token]', 1],
      ['Bearer abc.def.ghi', 'Bearer [REDACTED:bearer-token]', 1],
      ['token: Bearer abc.def.ghi', 'token: Bearer [REDACTED:bearer-token]', 1],
      ['Authorization: Token abc.def.ghi', 'Authorization: Token [REDACTED:assignment]', 1],
      ['token: Basic abc.def', 'token: Basic [REDACTED:assignment]', 1],
      ['"token": "Bearer abc.def"', '"token": "Bearer [REDACTED:bearer-token]"', 1],
      ['{"Authorization": "Bearer abc.def.ghi"}', '{"Authorization": "Bearer [REDACTED:bearer-token]"}', 1],
      [String.raw`{\"Authorization\": \"Bearer abc.def\"}`, String.raw`{\"Authorization\": \"Bearer [REDACTED:bearer-token]\"}`, 1],
      [
        'curl -H "Authorization: Bearer abc.def.ghi" https://api.example.com',
        'curl -H "Authorization: Bearer [REDACTED:bearer-token]" https://api.example.com',
        1,
      ],
      ['HTTP_AUTHORIZATION=Bearer abc.def', 'HTTP_AUTHORIZATION=Bearer [REDACTED:bearer-token]', 1],
      ['authorization: bearer $TOKEN', 'authorization: bearer [REDACTED:bearer-token]', 1],
      ['Authorization: abc123', 'Authorization: [REDACTED:assignment]', 1],
      // No known scheme: the first word may be the key, so both words are redacted; in prose that costs
      // only readability.
      ['Authorization: Custom abc123', 'Authorization: [REDACTED:assignment] [REDACTED:assignment]', 2],
      ['Authorization: required for all endpoints', 'Authorization: [REDACTED:assignment] [REDACTED:assignment] all endpoints', 2],
      // (7) user:password@host with no scheme: the user and the host stay readable.
      ['user:hunter2@db.example.com', 'user:[REDACTED:url-password]@db.example.com', 1],
      ['connect with user:hunter2@db.example.com.', 'connect with user:[REDACTED:url-password]@db.example.com.', 1],
      [':s3cret@redis.example.com:6379', ':[REDACTED:url-password]@redis.example.com:6379', 1],
      ['admin:p@ss@db.example.com', 'admin:[REDACTED:url-password]@db.example.com', 1],
      ['admin:pw@localhost', 'admin:[REDACTED:url-password]@localhost', 1],
      // (8) A bare run of 64 or more hex digits; a 0x before it stays readable.
      [hex(64), '[REDACTED:hex-key]', 1],
      ['sha256:' + hex(64), 'sha256:[REDACTED:hex-key]', 1],
      ['0x' + hex(64), '0x[REDACTED:hex-key]', 1],
      [hex(128), '[REDACTED:hex-key]', 1],
    ]
    const wrong = redacted.filter(([text, stored, count]) => redact(text).text !== stored || redact(text).count !== count)
    expect(wrong).toEqual([])
    expect(redacted.filter(([, stored]) => !unchanged(stored))).toEqual([])
    // Stored as written: a lone scheme word, names that only start with authorization, mailto and ssh
    // addresses, a reference as the password, no host after the @, hex runs of 63 digits or fewer, a
    // UUID, and a run inside a longer word.
    for (const text of [
      'Authorization: Bearer',
      'authorization_url: https://auth.example.com/authorize',
      'const auth = req.headers.authorization',
      'mailto:john@example.com',
      'git@github.com:org/repo.git',
      'scp notes.txt user@host.example.com:/tmp',
      'user:$DB_PASS@db.example.com',
      'a:b@c',
      hex(63),
      hex(40),
      '0x' + hex(40),
      '123e4567-e89b-12d3-a456-426614174000',
      'key_' + hex(64),
      hex(70) + 'g',
    ]) expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    // cspell:enable
  })
  test('a Basic token with no authorization before it counts only when it decodes to user:password', () => {
    // cspell:disable
    for (const text of [
      // The token behind the authorization samples decodes to no colon at all, so alone it is saved as written.
      'send Basic QWxhZGRpbk9wZW5TZXNhbWU with curl',
      // A leading colon with 7 printable bytes after it before a control byte: too short for a token.
      'send Basic OmFiY2RlZmcBQUJD with curl',
      // A leading colon with a space among the next 8 bytes: not a token's shape.
      'send Basic OmFiYyBkZWZnaGlq with curl',
      // The colon comes after a control byte (0x01), outside the leading run.
      'send Basic AWFiOm9wZW5TZXNhbWU with curl',
      // DEL (0x7F) ends the run too.
      'send Basic QX9iOm9wZW5TZXNhbWU with curl',
      // High bytes before the colon that are not valid UTF-8 (0xFF 0xFE): not a user name.
      'send Basic //5hOm9wZW5TZXNhbWU5OQ with curl',
    ]) expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    // A leading colon with 8 printable bytes after it: the empty-user shape counts.
    expect(redact('send Basic OmFiY2RlZmdoAUFC with curl')).toEqual({ text: 'send Basic [REDACTED:basic-credentials] with curl', count: 1, kinds: { 'basic-credentials': 1 } })
    // The token of ":openSesameAbcd": a leading colon and 8 printable bytes, so it is redacted.
    expect(redact('send Basic Om9wZW5TZXNhbWVBYmNk with curl')).toEqual({ text: 'send Basic [REDACTED:basic-credentials] with curl', count: 1, kinds: { 'basic-credentials': 1 } })
    // A 4n+1 token decodes its first 4n characters: user:password there still counts.
    expect(redact('send Basic QWxhZGRpbjpvcGVuSesameABC with curl')).toEqual({ text: 'send Basic [REDACTED:basic-credentials] with curl', count: 1, kinds: { 'basic-credentials': 1 } })
    // Missing padding is tolerated: the same user:password token with and without its ==, which is redacted too.
    expect(redact('send Basic YWRtaW46b3BlblNlc2FtZQ== with curl')).toEqual({ text: 'send Basic [REDACTED:basic-credentials] with curl', count: 1, kinds: { 'basic-credentials': 1 } })
    expect(redact('send Basic YWRtaW46b3BlblNlc2FtZQ with curl')).toEqual({ text: 'send Basic [REDACTED:basic-credentials] with curl', count: 1, kinds: { 'basic-credentials': 1 } })
    // cspell:enable
  })
  test('a value is replaced by its label, and no character of it survives', () => {
    // cspell:disable
    // The owner's examples of 2026-10-31, each after a credential name. Since the owner ruling of
    // 2026-11-03 ("use the secret shield style") the whole value is replaced by [REDACTED:<kind>]
    // instead of a mask of the same length, and the text around it is kept as written.
    const label = '[REDACTED:assignment]'
    const values: [string, string][] = [
      ['token: ', 'ghp_Ab12Cd34'],
      ['secret=', 'sk-live_Ab-12'],
      // A trailing ! included: a password can end in one.
      ['password=', 'p@ss.w0rd!'],
      // Mixed case and every other symbol.
      ['password=', 'a+B/c=D.e:F!12'],
      // Letters and digits of any script, superscripts, a combining accent, a letter outside the BMP.
      ['password=', 'Ünïcødé9x'],
      ['password=', '密码abc١٢٣xyz9'],
      ['password=', 'x²³⁴'],
      ['password=', 'e' + String.fromCharCode(0x301) + 'x'],
      ['password=', '𝒜bc12345'],
    ]
    for (const [name, value] of values) {
      expect(redact(name + value)).toEqual({ text: name + label, count: 1, kinds: { assignment: 1 } })
      // No character of the value survives: each one the name and the label do not hold is gone.
      const left = [...value].filter((ch) => !(name + label).includes(ch))
      expect(left.filter((ch) => redact(name + value).text.includes(ch))).toEqual([])
    }
    expect(redact('api_key = "abcd1234efgh5678"')).toEqual({ text: `api_key = "${label}"`, count: 1, kinds: { assignment: 1 } })
    // Values that overlap are one value, labelled by the vendor shape (redact): the shape starts where
    // the named value starts, or inside it.
    expect(redact(shape('OPENAI_API_KEY=', 'sk-', 'proj-', 'abcdefghijklmnopqrstuvwxyz_0123456789')))
      .toEqual({ text: 'OPENAI_API_KEY=[REDACTED:openai-key]', count: 1, kinds: { 'openai-key': 1 } })
    expect(redact(shape('secret: "', 'gh', 'p_', 'abcdefghijklmnopqrstuvwxyz0123456789', ' here"')))
      .toEqual({ text: 'secret: "[REDACTED:github-token]"', count: 1, kinds: { 'github-token': 1 } })
    // A named value that starts before the shape is labelled by the shape too: the label names what
    // was found, so the named value gives way to the vendor kind it holds.
    expect(redact(shape('secret: "see ', 'sk', '-ant-', 'api03-', 'abcdefghijklmnopqrstuvwxyz0123', '"')))
      .toEqual({ text: 'secret: "[REDACTED:anthropic-key]"', count: 1, kinds: { 'anthropic-key': 1 } })
    expect(redact('Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345'))
      .toEqual({ text: 'Authorization: Bearer [REDACTED:bearer-token]', count: 1, kinds: { 'bearer-token': 1 } })
    // Separate values count one each.
    expect(redact('password=Xk29fjs82kdQ token=Qw37ert95yuI'))
      .toEqual({ text: `password=${label} token=${label}`, count: 2, kinds: { assignment: 2 } })
    // cspell:enable
  })
  test('the secret-shield shapes are redacted, and its lookalikes are stored as written (2026-11-03)', () => {
    // cspell:disable
    // Adapted from the fixtures of the secret-shield mod (see NOTICE). The first three kept their secret in
    // clear before 2026-11-03 (an annotation's type word was taken for the value); the last two pin where
    // the new exclusions stop. [message, stored]
    const found: [string, string][] = [
      [shape('value: ', 'whsec', '_', 'aB3dE5fG7hJ9kL1mN3pQ5rS7tU', ' end'), 'value: [REDACTED:stripe-key] end'],
      [shape('value: ', 'pypi', '-AgE', 'IcHlwaS5vcmc', 'x'.repeat(50), ' end'), 'value: [REDACTED:pypi-token] end'],
      // A TypeScript type annotation: the value is the one after its =.
      ['const apiKey: string = "abc123def456"', 'const apiKey: string = "[REDACTED:assignment]"'],
      // With no space before the =, the value holds it: password: abc=def is one value.
      ['password: abc=def', 'password: [REDACTED:assignment]'],
      // A quoted call is a string, so it is a value.
      ['password = "get_password()"', 'password = "[REDACTED:assignment]"'],
    ]
    expect(found.filter(([text, stored]) => redact(text).text !== stored || redact(text).count !== 1)).toEqual([])
    expect(found.filter(([, stored]) => !unchanged(stored))).toEqual([])
    // Each of these was masked before 2026-11-03, and none holds a secret.
    const kept = [
      // An unquoted function call is code.
      'password = get_password()',
      'token = vault.read(path)',
      // After a type annotation the value is read as any other: a reference stays as written.
      'const apiKey: string = process.env.API_KEY',
      // Placeholders: a sample word, a boolean, a template slot, a sample phrase, a masking run, a command
      // or env() call, and a label that a sentence's period follows.
      'password: changeme',
      'pass_through: true',
      'API_KEY=<your-api-key>',
      'token: "{{ api_token }}"',
      'API_KEY=your_api_key_here',
      'password=********',
      'token=xxxxxxxx',
      'secret=...',
      'password="$(vault read secret/db)"',
      'API_KEY=env(API_KEY)',
      'password=[REDACTED:assignment].',
      // Names that describe a secret instead of holding one.
      'token_type: "Bearer"',
      '"password_hint": "your pet\'s name"',
      'SECRET_LENGTH=32',
      'passwordField: required',
      'api_key_header: X-Api-Key',
      // A lone { after a credential name opens a nested value; it is no value.
      '{"credentials": {"region": "eu-west-1"}}',
    ]
    expect(kept.filter((text) => redact(text).count !== 0 || redact(text).text !== text)).toEqual([])
    // cspell:enable
  })
  test('a code call is an identifier, dotted or not, then a (, and nothing else is (2026-11-04)', () => {
    // isCodeCall decides which unquoted values are code and so stay unmasked. It is split by hand, so each
    // edge of the split is pinned: an empty part, a leading or trailing dot, a space, a leading digit, a ( at
    // the start, and no ( at all.
    const accepted = ['get_password()', 'vault.read(path)', '$x.y(', 'a(b.c(']
    const rejected = ['a..b(', '.a(', 'a.(', 'a (', '1a(', '(x)', 'nope']
    expect(accepted.filter((value) => !isCodeCall(value))).toEqual([])
    expect(rejected.filter((value) => isCodeCall(value))).toEqual([])
  })
  test('a private key block keeps its BEGIN and END lines and its line breaks', () => {
    // cspell:disable
    // Built from parts, like every fixture here that a secret scanner would read as a real key.
    const begin = (kind: string) => shape('-----BEGIN ', kind, 'PRIVATE KEY-----')
    const end = (kind: string) => shape('-----END ', kind, 'PRIVATE KEY-----')
    const label = '[REDACTED:private-key]'
    const stored = [
      `mykey:\n${begin('RSA ')}\n${label}\n${end('RSA ')}\nthanks`,
      `${begin('EC ')}\n${label}\n${end('EC ')}\n${begin('EC ')}\n${label}\n${end('EC ')}`,
      `the key ${begin('')}\n${label}`,
      `  ${begin('RSA ')}\n  ${label}\n  ${end('RSA ')}`,
      'PuTTY-User-Key-File-3: ssh-ed25519\nPrivate-Lines: 2\n[REDACTED:putty-key]\r\nPrivate-MAC: 0a1b2c',
    ]
    expect(redact(`mykey:\n${begin('RSA ')}\nMIIEow+Ab/9\nQ2xY==\n${end('RSA ')}\nthanks`))
      .toEqual({ text: stored[0], count: 1, kinds: { 'private-key': 1 } })
    // Two blocks are two values.
    expect(redact(`${begin('EC ')}\nMHcCAQ\n${end('EC ')}\n${begin('EC ')}\nAoGBAN\n${end('EC ')}`))
      .toEqual({ text: stored[1], count: 2, kinds: { 'private-key': 2 } })
    // With no END line the body runs to the end of the text: a truncated paste is redacted too.
    expect(redact(`the key ${begin('')}\nMIIEvQ\nIBADAN`)).toEqual({ text: stored[2], count: 1, kinds: { 'private-key': 1 } })
    // A lone header has no body: nothing to redact.
    expect(redact(begin('OPENSSH '))).toEqual({ text: begin('OPENSSH '), count: 0, kinds: {} })
    // Indented markers match too: the markers are not anchored to a line start (review of 2026-10-31).
    // The body is trimmed at both ends, so an inner line's indentation goes into the label with it.
    expect(redact(`  ${begin('RSA ')}\n  MIIE\n  ow12\n  ${end('RSA ')}`)).toEqual({ text: stored[3], count: 1, kinds: { 'private-key': 1 } })
    // A PuTTY file: only the Private-Lines body is redacted, its \r\n line breaks inside the one label;
    // the header and the MAC stay.
    expect(redact('PuTTY-User-Key-File-3: ssh-ed25519\nPrivate-Lines: 2\nAAAAIGZp\r\ncnN0c2Vj\r\nPrivate-MAC: 0a1b2c'))
      .toEqual({ text: stored[4], count: 1, kinds: { 'putty-key': 1 } })
    // A second redact changes none of them: a PuTTY body that is one label line is not counted again,
    // though Private-Lines still says 2.
    expect(stored.filter((text) => !unchanged(text))).toEqual([])
    // cspell:enable
  })
  test('the shapes left out on 2026-10-24 are redacted now, and the ordinary text beside them is not', () => {
    // cspell:disable
    // A session cookie, a ?key= and an Azure sig= query value, and the ENCRYPTION_KEY, JWT_SIGNING_KEY
    // and AUTH names: a false match now only redacts a value (owner ruling 2026-10-31).
    expect(redact('Cookie: sessionid=38afe7a8bc; csrftoken=Xk29fjs82kdQ'))
      .toEqual({ text: 'Cookie: sessionid=[REDACTED:assignment] csrftoken=[REDACTED:assignment]', count: 2, kinds: { assignment: 2 } })
    expect(redact('JSESSIONID=Xk29fjs82kdQ7pLm')).toEqual({ text: 'JSESSIONID=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    expect(redact('https://maps.example.com/api/js?key=AIzaXk29fjs82kdQ7pLm&callback=init'))
      .toEqual({ text: 'https://maps.example.com/api/js?key=[REDACTED:query-key]&callback=init', count: 1, kinds: { 'query-key': 1 } })
    expect(redact('https://acct.blob.core.windows.net/c/b.txt?sv=2022-11-02&sp=r&sig=Xk29fjs82kdQ%2Bab%3D'))
      .toEqual({ text: 'https://acct.blob.core.windows.net/c/b.txt?sv=2022-11-02&sp=r&sig=[REDACTED:query-key]', count: 1, kinds: { 'query-key': 1 } })
    expect(redact('ENCRYPTION_KEY=Xk29fjs82kdQ7pLm')).toEqual({ text: 'ENCRYPTION_KEY=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    expect(redact('encryptionKey=Xk29fjs82kdQ7pLm')).toEqual({ text: 'encryptionKey=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    expect(redact('JWT_SIGNING_KEY: "Xk29fjs82kdQ7pLm"')).toEqual({ text: 'JWT_SIGNING_KEY: "[REDACTED:assignment]"', count: 1, kinds: { assignment: 1 } })
    expect(redact('AUTH=Xk29fjs82kdQ')).toEqual({ text: 'AUTH=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    expect(redact('BASIC_AUTH=Xk29fjs82kdQ')).toEqual({ text: 'BASIC_AUTH=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    // sessionid: a string cookie moved to the false-match test on 2026-10-31: a value after a credential
    // name is redacted whatever its shape. auth_mode: required moved with it, and back to ordinary text on
    // 2026-11-03, when a name about a secret (a mode, a URL, a count) stopped counting as a credential name.
    for (const text of [
      'oauth_scope=read_write_admin_1234',
      'see ?key=value in the docs',
      'the sig= parameter is required',
      'primary_key=account_id_12345678',
    ]) expect(redact(text)).toEqual({ text, count: 0, kinds: {} })
    // cspell:enable
  })
  test('the size search stops where the 4n input would cross the size limit, counted in UTF-8 bytes', () => {
    // [unit, the largest n whose 4n input fits]: 1 byte a character, 3 (•), and 2 a UTF-16 unit (a
    // surrogate pair). A timer that reads 0 never reaches MIN_RUN_MS, so the search runs to the cap. At
    // the earlier cap of 1M characters every one of these 4n inputs was over the limit.
    for (const [unit, size] of [['a', 1 << 19], ['•', 1 << 18], ['😀', 1 << 18]] as const) {
      const make = repeated(unit)
      expect(runSize(make, () => 0)).toBe(size)
      expect(byteLength(make(size * 4))).toBeLessThanOrEqual(MAX_TEXT_BYTES)
      expect(byteLength(make(size * 8))).toBeGreaterThan(MAX_TEXT_BYTES)
      expect(byteLength(make((1 << 20) * 4))).toBeGreaterThan(MAX_TEXT_BYTES)
    }
  })
  // In each linearity test the growth check comes first: a quadratic regression fails it in seconds at a
  // few thousand characters, where the fixed inputs of up to 200,000 characters after it would take
  // minutes.
  test('a long run with many separators is scanned once, not once per separator', LINEAR_TEST, () => {
    // The credential scan runs on every masked line; a quadratic scan of a 1 MB line would hang the hook (found by
    // the code review of 2026-10-23).
    expect(notLinear({
      'many short pairs': repeated('a=1&'),
      'names inside one reference': repeated('token=a://'),
      'one long credential value': repeated('token='),
      'inner references': repeated('token=$A;'),
      'many short references': repeated('token=$A '),
    })).toEqual([])
    expect(redact('a=1&'.repeat(20_000)).count).toBe(0)
    // Credential names inside one long reference value: the scan resumes after the value.
    expect(redact('token=a://'.repeat(10_000)).count).toBe(0)
    // A long value that is itself a credential is one value, redacted at once.
    expect(redact('token='.repeat(20_000))).toEqual({ text: 'token=[REDACTED:assignment]', count: 1, kinds: { assignment: 1 } })
    // Inner references inside one long reference value: ; ends each inner value, so every inner value is short.
    expect(redact('token=$A;'.repeat(10_000)).count).toBe(0)
    // Many short reference values: each inner scan stays inside its own value.
    expect(redact('token=$A '.repeat(5_000)).count).toBe(0)
  })
  test('the scans added on 2026-10-24 stay linear on long repeated input', LINEAR_TEST, () => {
    // Quoted keys, command-line flags and the Authorization and Docker auth regexes, added on 2026-10-24
    // after a code review, each run on every masked line.
    expect(notLinear({
      'quoted keys': repeated('"token":"a",'),
      'Go assignments': repeated('secret := '),
      'curl flags': repeated('curl -u a:b --password -x -p '),
      'authorization: token': repeated('authorization: token '),
      'open auth quotes': repeated('"auth": "'),
      'key block headers with no END': repeated('-----BEGIN PRIVATE KEY BLOCK '),
    })).toEqual([])
    // Every value after a credential name is redacted (a rule added on 2026-10-31), the one-letter ones
    // and curl's b included.
    expect(redact('"token":"a",'.repeat(20_000)).count).toBe(20_000)
    expect(redact('secret := '.repeat(20_000)).count).toBe(0)
    expect(redact('curl -u a:b --password -x -p '.repeat(10_000)).count).toBe(10_000)
    // authorization is a credential name (added on 2026-10-31): token is its scheme and the next
    // authorization: is the value, so every other pair holds one.
    expect(redact('authorization: token '.repeat(10_000)).count).toBe(5_000)
    expect(redact('"auth": "'.repeat(10_000)).count).toBe(0)
    expect(redact('-----BEGIN PRIVATE KEY BLOCK '.repeat(10_000)).count).toBe(0)
  })
  test('the scans added on 2026-10-31 stay linear on long repeated input', LINEAR_TEST, () => {
    // Key blocks, PuTTY lines and query values read as spans to redact, and the merge of many spans, added
    // on 2026-10-31 when redaction replaced refusal, run on every masked line too.
    const begin = shape('-----BEGIN ', 'PRIVATE KEY-----')
    const block = `${begin}x${shape('-----END ', 'PRIVATE KEY-----')}`
    expect(notLinear({
      'key headers with no END': repeated(`${begin}\n`),
      'key blocks': repeated(block),
      'PuTTY private lines': repeated('Private-Lines: 99999999\n', 'PuTTY-User-Key-File-3: x\n'),
      'one long query value': repeated('?key='),
      'many short query values': repeated('&sig=a'),
      'many spans to merge': repeated('token=Xk29fjs82kdQ '),
    })).toEqual([])
    // Headers with no END line: the first body runs to the end of the text, and the scan ends there.
    expect(redact(`${begin}\n`.repeat(10_000)).count).toBe(1)
    // Blocks with an END line each: every END search starts after the last block.
    expect(redact(block.repeat(10_000)).count).toBe(10_000)
    // A huge Private-Lines count takes the rest of the text once.
    expect(redact('PuTTY-User-Key-File-3: x\n' + 'Private-Lines: 99999999\n'.repeat(10_000)).count).toBe(1)
    // One query value that runs on, and many short ones.
    expect(redact('?key='.repeat(20_000)).count).toBe(1)
    expect(redact('&sig=a'.repeat(20_000)).count).toBe(0)
    // Many separate secrets: 20,000 spans sorted and merged.
    expect(redact('token=Xk29fjs82kdQ '.repeat(20_000)).count).toBe(20_000)
  })
  test('the quoted-value reader stays linear on long input', LINEAR_TEST, () => {
    // A quoted value runs to its closing quote or the line end, and a backslash run is counted once (both
    // added on 2026-10-31 after a review).
    expect(notLinear({
      'a quote that never closes': repeated('a', 'password: "'),
      'a backslash run before the quote': repeated('\\', 'password: "', '"'),
      'a backslash run in escaped JSON': repeated('\\', 'password: \\"', '"'),
      'escaped names': repeated('\\"api_key\\":'),
    })).toEqual([])
    const size = 200_000
    // A quote that never closes, on one line: one value, the rest of the text.
    expect(redact('password: "' + 'a'.repeat(size)).count).toBe(1)
    // A long run of backslashes before the closing quote, plain and in an escaped JSON line.
    expect(redact('password: "' + '\\'.repeat(size) + '"').count).toBe(1)
    expect(redact('password: \\"' + '\\'.repeat(size) + '"').count).toBe(1)
    // Escaped names, each with its separator: every walk back stops at the previous separator. Each
    // value is the next escaped name, so every separator but the last has one. The name is api_key, not
    // password: since 2026-11-03 the word password is a placeholder, so a value of password is no secret.
    expect(redact('\\"api_key\\":'.repeat(size / 20)).count).toBe(size / 20 - 1)
  })
  test('the scans added in the verify round of 2026-10-31 stay linear on long input', LINEAR_TEST, () => {
    // user:password@host runs, hex runs and Authorization values, added on 2026-10-31, run on every masked line.
    expect(notLinear({
      'one run with no host': repeated('u:p@'),
      'a colon run then @': repeated(':', '', '@'),
      'many user:password@host': repeated('u:p@h.example.com '),
      'hex runs that end in a word': repeated('a'.repeat(70) + 'g '),
      'hex runs of 63': repeated('f'.repeat(63) + ' '),
      'hex runs of 64': repeated('f'.repeat(64) + ' '),
      'Authorization with no known scheme': repeated('Authorization: Custom '),
      'a quoted scheme word': repeated('"token": "Bearer '),
      'bare bearer words': repeated('bearer '),
    })).toEqual([])
    // One run with no host after its @: read once, nothing redacted.
    expect(redact('u:p@'.repeat(50_000)).count).toBe(0)
    expect(redact(':'.repeat(200_000) + '@').count).toBe(0)
    expect(redact('u:p@h.example.com '.repeat(10_000)).count).toBe(10_000)
    // Hex runs that end inside a word, of 63 digits, and of 64.
    expect(redact(('a'.repeat(70) + 'g ').repeat(3_000)).count).toBe(0)
    expect(redact(('f'.repeat(63) + ' ').repeat(3_000)).count).toBe(0)
    expect(redact(('f'.repeat(64) + ' ').repeat(3_000)).count).toBe(3_000)
    // Authorization values and scheme words.
    expect(redact('Authorization: Custom '.repeat(10_000)).count).toBe(10_000)
    expect(redact('"token": "Bearer '.repeat(10_000)).count).toBe(10_000)
    expect(redact('bearer '.repeat(20_000)).count).toBe(10_000)
  })
  test('the scans added on 2026-11-03 stay linear on long input', LINEAR_TEST, () => {
    // cspell:disable
    // The JWT pattern, which was quadratic on -eyJ-eyJ... (every eyJ after a - was a place a scan could
    // start, measured on 2026-11-01), the shapes adapted from secret-shield, the type annotation, names
    // about a secret, and the labels a second redact leaves as they are, all added on 2026-11-03.
    expect(notLinear({
      'JWT starts after a -': repeated('-eyJ'),
      'JWT parts cut short': repeated('eyJx.eyJx.'),
      'PyPI prefixes': repeated('-pypi-AgE'),
      'Stripe webhook prefixes': repeated('whsec_'),
      'type annotations': repeated('apiKey: string = '),
      'names about a secret': repeated('token_url: a '),
      'labels after a name': repeated('token=[REDACTED:assignment] '),
      'PuTTY label lines': repeated('Private-Lines: 1\n[REDACTED:putty-key]\n', 'PuTTY-User-Key-File-3: x\n'),
    })).toEqual([])
    // No JWT in either: a - before eyJ is no start, and each part is cut short by the next dot.
    expect(redact('-eyJ'.repeat(25_000)).count).toBe(0)
    expect(redact('eyJx.eyJx.'.repeat(10_000)).count).toBe(0)
    // One PyPI token, the whole run after its first -: nothing ends the class.
    expect(redact('-pypi-AgE'.repeat(10_000))).toEqual({ text: '-[REDACTED:pypi-token]', count: 1, kinds: { 'pypi-token': 1 } })
    expect(redact('whsec_'.repeat(20_000)).count).toBe(0)
    // Each annotation's value is the next name and its colon, so every other pair holds one.
    expect(redact('apiKey: string = '.repeat(10_000)).count).toBe(5_000)
    expect(redact('token_url: a '.repeat(10_000)).count).toBe(0)
    const labels = 'token=[REDACTED:assignment] '.repeat(10_000)
    expect(redact(labels)).toEqual({ text: labels, count: 0, kinds: {} })
    const putty = 'PuTTY-User-Key-File-3: x\n' + 'Private-Lines: 1\n[REDACTED:putty-key]\n'.repeat(10_000)
    expect(redact(putty)).toEqual({ text: putty, count: 0, kinds: {} })
    // cspell:enable
  })
})
