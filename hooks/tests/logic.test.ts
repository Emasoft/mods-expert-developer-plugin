// Unit tests of the requirements-drafts rules (hooks/requirements-drafts/logic.ts), no kit stubs.
import { describe, expect, test } from 'claude-code/testing'

import {
  END_LINE,
  MAX_RECENT,
  MAX_TEXT_BYTES,
  appendRest,
  draftId,
  draftIsComplete,
  draftProjectRoot,
  draftsWithHash,
  existingDraft,
  inProjectScope,
  isUnderPath,
  isoLocal,
  looksSecret,
  parentPath,
  parseSwitch,
  preview,
  pushRecent,
  refusal,
  renderDraft,
  rowIsSaveable,
  shouldRecord,
  storedText,
} from '../requirements-drafts/logic'

const typed = { raisedBy: 'engine', originKind: 'composer', hasCommand: false, isMeta: false, text: 'the list must sort by date' }

describe('shouldRecord', () => {
  test('records text the person typed and sent', () => {
    expect(shouldRecord(typed)).toBe(true)
  })
  test('skips a prompt raised by a plugin, not by Claude Code, whatever its origin', () => {
    for (const originKind of ['composer', 'bridge', 'sdk']) {
      expect(shouldRecord({ ...typed, originKind, raisedBy: 'other-mod' })).toBe(false)
    }
  })
  test('records a message from the composer, Remote Control and an SDK host', () => {
    // User ruling 2026-10-24: the option is on every message the person sends while the plugin is on.
    for (const originKind of ['composer', 'bridge', 'sdk']) {
      expect(shouldRecord({ ...typed, originKind })).toBe(true)
    }
  })
  test('skips every other origin', () => {
    for (const originKind of ['task-notification', 'peer', 'plugin', 'unclassified', 'scheduled-trigger', 'channel']) {
      expect(shouldRecord({ ...typed, originKind })).toBe(false)
    }
  })
  test('skips slash commands, commands flagged by the engine, meta prompts and blank text', () => {
    expect(shouldRecord({ ...typed, text: '/requirements-drafts-save' })).toBe(false)
    expect(shouldRecord({ ...typed, text: '  /compact' })).toBe(false)
    expect(shouldRecord({ ...typed, hasCommand: true })).toBe(false)
    expect(shouldRecord({ ...typed, isMeta: true })).toBe(false)
    expect(shouldRecord({ ...typed, text: '   ' })).toBe(false)
  })
})

describe('pushRecent', () => {
  test('keeps the newest first, once per text, at most MAX_RECENT', () => {
    let list: string[] = []
    for (let i = 0; i < MAX_RECENT + 5; i++) list = pushRecent(list, `m${i}`)
    expect(list.length).toBe(MAX_RECENT)
    expect(list[0]).toBe(`m${MAX_RECENT + 4}`)
    expect(pushRecent(['b', 'a'], 'a')).toEqual(['a', 'b'])
  })
})

describe('rowIsSaveable', () => {
  test('a composer, Remote Control or SDK host row with its real id', () => {
    for (const kind of ['composer', 'bridge', 'sdk']) {
      expect(rowIsSaveable(kind, 'msg-1')).toBe(true)
      expect(rowIsSaveable(kind, 'placeholder')).toBe(false)
      expect(rowIsSaveable(kind, '')).toBe(false)
    }
    for (const kind of ['task-notification', 'peer', 'plugin', 'unclassified']) {
      expect(rowIsSaveable(kind, 'msg-1')).toBe(false)
    }
  })
})

describe('parseSwitch', () => {
  test('no argument toggles, on and off set, anything else is usage', () => {
    expect(parseSwitch('', true)).toEqual({ enabled: false, text: 'requirements-drafts is off.' })
    expect(parseSwitch('', false)).toEqual({ enabled: true, text: 'requirements-drafts is on.' })
    expect(parseSwitch(' ON ', false)).toEqual({ enabled: true, text: 'requirements-drafts is on.' })
    expect(parseSwitch('off', true)).toEqual({ enabled: false, text: 'requirements-drafts is off.' })
    expect(parseSwitch('maybe', true)).toEqual({ usage: 'Usage: /requirements-drafts [on|off]' })
  })
})

describe('refusal', () => {
  test('secret-looking text is refused', () => {
    // cspell:disable
    const samples = [
      'key REDACTED-FIXTURE here',
      'token REDACTED-FIXTURE',
      'use REDACTED-FIXTURE',
      'password = hunter2hunter2',
      'Authorization: Bearer abcdefghijklmnopqrstuvwxyz012345',
      '-----BEGIN OPENSSH PRIVATE KEY-----',
      'export aws_secret_access_key=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY',
      'GITHUB_ACCESS_TOKEN: abcdefgh12345678',
      'OPENAI_API_KEY=REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'NPM_TOKEN=abcd1234efgh5678',
      'dbpassword=s3cretValue99',
      // A base64 secret holds / and still counts (the AWS documentation's example secret key).
      'aws_secret_access_key=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      // A dot or a $ inside a value does not make it a reference (second fix round, 2026-10-23).
      'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123def456',
      'password=Hunter2.Xk9fj',
      'my password=Xk29fjs82kdQ.',
      'password=$ecretPa55word',
      // A short JWT with no credential name before it: the unconditional pattern takes 8 or more per part.
      'the cookie holds eyJabcd1234.efgh5678.ijkl9012 after login',
      // A / start is a path only in a path shape; base64 secrets can start with / (CPV round, 2026-10-23).
      'aws_secret_access_key=/K7MDENGbPxRfiCYEXAMPLEKEYwJalrXUtnFEMI',
      'password=/Xk29fjs82kdQ',
      // Pins for the path shape: two or more segments, and one of them all lowercase letters.
      'aws_secret_access_key=/K7MDENG/bPxRfiCYEXAMPLEKEY',
      'password=/qwertyuiopasdfghjk',
      // Credentials inside a URL, after a credential name or anywhere in the message.
      'secret: postgres://admin:S3cr3tPass@db:5432/app',
      'connect with postgres://admin:S3cr3tPass@db:5432/app today',
      // The Redis form has an empty user; a quoted value is read inside its quotes.
      'cache at redis://:S3cr3tPass@cache:6379',
      'password: "Xk29fjs82kdQ"',
      // A credential inside a value that counts as a reference is still judged (last fix round, 2026-10-23).
      'token_url: https://app.example.com/cb?access_token=Xk29fjs82kdQabc',
      'password=$OPENAI_KEY;token=Xk29fjs82kdQ',
      // Short and compound credential names; the long words still match inside a name (PGPASSWORD).
      'DB_PASS=Xk29fjs82kdQ',
      'pwd=Xk29fjs82kdQ',
      'PRIVATE_KEY=Xk29fjs82kdQabc',
      'db_credential: Xk29fjs82kdQ',
      'PGPASSWORD=Xk29fjs82kdQ',
      // HTTP basic auth: base64 of user:password after "Basic".
      'Authorization: Basic dXNlcjpwYXNzd29yZA==',
      // The reference prefixes count only at the start of a value.
      'password=Xk29fjs82kdQprocess.env.X',
      'password=Xk29fjs82kdQos.environ',
      'password=Xk29fjs82kdQsecrets.x',
      // Inside a reference, & and ; end each inner value: a later :// does not hide the credential.
      'token_url: https://app/cb?access_token=Xk29fjs82kdQabc&redirect=https://app/home',
      'password=$A;token=$B;secret=Xk29fjs82kdQ',
      // Basic auth after authorization and : or =, even with a token of letters only.
      'Authorization: Basic QWxhZGRpbjpvcGVuSesame',
      'authorization=basic QWxhZGRpbjpvcGVuSesame',
      // Basic auth anywhere when the token decodes to user:password: plain, with a + or / inside, or padded with ==.
      'send Basic YWRtaW46czNjcjN0UGFzcw with curl',
      'send Basic QWxhZGRpbjpvcGVu+SesameAB with curl',
      'send Basic QWxhZGRpbjpvcGVu/SesameAB with curl',
      'send Basic QWxhZGRpbjpvcGVuSesameAB== with curl',
      // The credential names passphrase and credentials (2026-10-24): both were saved before.
      'passphrase=Xk29fjs82kdQ7pLm',
      'aws_credentials=Xk29fjs82kdQ7pLm',
      // A JSON header: the quote before "Basic" hides authorization, and the token decodes to user:password.
      '"Authorization": "Basic QWxhZGRpbjpvcGVuU2VzYW1l"',
      '{"Authorization": "Basic QWxhZGRpbjpvcGVuSesame"}',
      // A letters-only token that decodes to user:password counts with no authorization before it.
      'send Basic QWxhZGRpbjpvcGVuSesameAB with curl',
      // A UTF-8 user name: the colon comes after bytes above 0x7E, which do not end the run (2026-10-24).
      'send Basic Sm9zw6k6czNjcmV0UGFzc3cwcmQ with curl',
      // A 3-byte UTF-8 user name (CJK): the E1..EF lead branch of the UTF-8 check must accept it, so this is refused.
      'send Basic 5bGx55SwOnMzY3JldFBhc3N3MHJk with curl',
      // The empty-user shape of a personal access token: a leading colon and 8 or more bytes after it.
      'send Basic OmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMw with curl',
      // A space before the separator, and Proxy-Authorization, with a token that decodes to no colon,
      // so only the authorization rule can refuse them.
      'Authorization : Basic QWxhZGRpbk9wZW5TZXNhbWU',
      'Proxy-Authorization: Basic QWxhZGRpbk9wZW5TZXNhbWU',
      // Quoted keys: JSON, a Python dict, quoted YAML (review finding H1, 2026-10-24).
      '{"password": "Xk29fjs82kdQ"}',
      '{"api_key":"abcd1234efgh5678"}',
      '"token":"Xk29fjs82kdQabc"',
      "creds = {'password': 'Xk29fjs82kdQ'}",
      // Go := and Ruby/PHP => with a quoted value, and a fullwidth colon.
      'secret := "Xk29fjs82kdQ"',
      'password => "Xk29fjs82kdQ"',
      'password：Xk29fjs82kdQ',
      // An OpenPGP private key block and a PuTTY private key file.
      '-----BEGIN PGP PRIVATE KEY BLOCK-----\nlQOYBF0abc\n-----END PGP PRIVATE KEY BLOCK-----',
      'PuTTY-User-Key-File-3: ssh-ed25519\nEncryption: none\nPublic-Lines: 2\nAAAAC3NzaC1lZDI1NTE5AAAAIA\nPrivate-Lines: 1\nAAAAIGZpcnN0c2VjcmV0a2V5Ynl0ZXM',
      // An Authorization Token header, plain and quoted; curl -u and mysql/docker password flags.
      'Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b',
      '"Authorization": "Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"',
      'curl -u admin:S3cr3tPass https://api.example.com',
      'curl --user=admin:S3cr3tPass https://api.example.com',
      'curl -uadmin:S3cr3tPass https://api.example.com',
      'mysql --password Xk29fjs82kdQ -h db',
      'mysql -uroot -pXk29fjs82kdQ',
      'docker login --password Xk29fjs82kdQ ghcr.io',
      // camelCase forms of the credential words.
      'secretKey: "Xk29fjs82kdQ"',
      'secretAccessKey=wJalrXUtnFEMIK7MDENGbPxRfiCYEXAMPLEKEY',
      'privateKey=Xk29fjs82kdQabc',
      'apiKey: "Xk29fjs82kdQ"',
      'authToken: "Xk29fjs82kdQ"',
      'dbPass=Xk29fjs82kdQ',
      // Vendor prefixes with no credential name before them (review finding M1).
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'use REDACTED-FIXTURE in CI',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'REDACTED-FIXTURE',
      'https://api.telegram.org/REDACTED-FIXTURE/getMe',
      'key REDACTED-FIXTURE here',
      // A Docker config auth entry that decodes to user:password (auth is not a credential word).
      '{"auths":{"ghcr.io":{"auth":"dXNlcjpwYXNzd29yZA=="}}}',
    ]
    // cspell:enable
    // One assertion over the list, so a red run names every sample that slipped through.
    expect(samples.filter((text) => !looksSecret(text))).toEqual([])
    for (const text of samples) expect(refusal(text)).toMatch(/secret/)
  })
  test('ordinary requirements pass', () => {
    expect(looksSecret('The password field must hide what is typed.')).toBe(false)
    // Schema-style requirement text names credential fields without holding one.
    // One assertion over the list, so a red run names every sample wrongly refused.
    const ordinary = [
      'auth_token: optional string',
      'password: required, min length',
      'access_token: `string`',
      'Secretary: Jennifer, the project lead',
      'Secretary: Office2025B on the third floor',
      'passwords=encrypted at rest',
      'the secret: keep it short',
      'api_key: string in the config schema',
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
      // An inner value ends at &, so a short value plus the rest of the query is not one random value.
      'token_url: https://x/cb?token_type=bearer&scope=read',
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
      'passphrase: required, min length',
      'credentials: see the vault documentation',
      // cspell:disable
      // Next to each 2026-10-24 refusal, the ordinary text that must stay saved.
      'the password field is required',
      '"password": "required"',
      '{"api_key": "string"}',
      'secret := os.Getenv("X")',
      'secret := loadFromVaultWithRetries(ctx)',
      'password => hashPasswordWithSalt(password)',
      'const f = token => token.trim()',
      'the password：field is required',
      'use a PGP key to sign',
      '-----BEGIN PGP PUBLIC KEY BLOCK-----',
      'convert the PuTTY-User-Key-File-3 file; its Private-Lines: field holds the key',
      'Authorization: Token <your-token-here>',
      'Authorization: Token AuthenticationRequiredForAll',
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
      'secretKey: "required"',
      'apiKey: string in the config schema',
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
      '{"auth": "required"}',
      // cspell:enable
    ]
    expect(ordinary.filter((text) => looksSecret(text))).toEqual([])
    expect(refusal('Add a search box to the drafts list')).toBeUndefined()
  })
  test('a Basic token with no authorization before it counts only when it decodes to user:password', () => {
    // cspell:disable
    // The token behind the authorization samples decodes to no colon at all, so alone it is saved.
    expect(looksSecret('send Basic QWxhZGRpbk9wZW5TZXNhbWU with curl')).toBe(false)
    // A leading colon with 7 printable bytes after it before a control byte: too short for a token.
    expect(looksSecret('send Basic OmFiY2RlZmcBQUJD with curl')).toBe(false)
    // A leading colon with 8 printable bytes after it: the empty-user shape counts.
    expect(looksSecret('send Basic OmFiY2RlZmdoAUFC with curl')).toBe(true)
    // A leading colon with a space among the next 8 bytes: not a token's shape, so saved.
    expect(looksSecret('send Basic OmFiYyBkZWZnaGlq with curl')).toBe(false)
    // The token of ":openSesameAbcd": a leading colon and 8 printable bytes, so refused.
    expect(looksSecret('send Basic Om9wZW5TZXNhbWVBYmNk with curl')).toBe(true)
    // The colon comes after a control byte (0x01), outside the leading run.
    expect(looksSecret('send Basic AWFiOm9wZW5TZXNhbWU with curl')).toBe(false)
    // DEL (0x7F) ends the run too.
    expect(looksSecret('send Basic QX9iOm9wZW5TZXNhbWU with curl')).toBe(false)
    // High bytes before the colon that are not valid UTF-8 (0xFF 0xFE): not a user name, so saved.
    expect(looksSecret('send Basic //5hOm9wZW5TZXNhbWU5OQ with curl')).toBe(false)
    // A 4n+1 token decodes its first 4n characters: user:password there still counts.
    expect(looksSecret('send Basic QWxhZGRpbjpvcGVuSesameABC with curl')).toBe(true)
    // Missing padding is tolerated: the same user:password token with and without its ==.
    expect(looksSecret('send Basic YWRtaW46b3BlblNlc2FtZQ== with curl')).toBe(true)
    expect(looksSecret('send Basic YWRtaW46b3BlblNlc2FtZQ with curl')).toBe(true)
    // cspell:enable
  })
  test('empty and oversize text are refused', () => {
    expect(refusal('  ')).toMatch(/empty/)
    expect(refusal('x'.repeat(MAX_TEXT_BYTES + 1))).toMatch(/4 MiB/)
  })
  test('a long run with many separators is scanned once, not once per separator', () => {
    // The credential scan runs on every save; a quadratic scan of a 1 MB line would hang the press (review, 2026-10-23).
    const started = Date.now()
    // Sizes chosen so a linear scan takes milliseconds and a quadratic one takes seconds: a regression
    // then fails the 2000 ms bound below instead of hanging the run (review, 2026-10-23).
    expect(looksSecret('a=1&'.repeat(20_000))).toBe(false)
    // Credential names inside one long reference value: the scan resumes after the value.
    expect(looksSecret('token=a://'.repeat(10_000))).toBe(false)
    // A long value that is itself a credential is refused at once.
    expect(looksSecret('token='.repeat(20_000))).toBe(true)
    // Inner references inside one long reference value: ; ends each inner value, so every inner value is short.
    expect(looksSecret('token=$A;'.repeat(10_000))).toBe(false)
    // Many short reference values: each inner scan stays inside its own value.
    expect(looksSecret('token=$A '.repeat(5_000))).toBe(false)
    expect(Date.now() - started).toBeLessThan(2000)
  })
  test('the 2026-10-24 scans stay linear on long repeated input', () => {
    // Quoted keys, command-line flags and the Authorization and Docker auth regexes each run on every
    // save; a regression to a quadratic scan fails the 2000 ms bound instead of hanging the run.
    const started = Date.now()
    expect(looksSecret('"token":"a",'.repeat(20_000))).toBe(false)
    expect(looksSecret('secret := '.repeat(20_000))).toBe(false)
    expect(looksSecret('curl -u a:b --password -x -p '.repeat(10_000))).toBe(false)
    expect(looksSecret('authorization: token '.repeat(10_000))).toBe(false)
    expect(looksSecret('"auth": "'.repeat(10_000))).toBe(false)
    expect(looksSecret('-----BEGIN PRIVATE KEY BLOCK '.repeat(10_000))).toBe(false)
    expect(Date.now() - started).toBeLessThan(2000)
  })
})

describe('names and dates', () => {
  const hash = 'abcdef0123456789'.padEnd(64, '0')
  test('the draft id is local time, offset and the first 12 hash characters', () => {
    // 2026-10-23T16:01:09Z at +02:00
    const ms = Date.UTC(2026, 9, 23, 16, 1, 9)
    expect(draftId(ms, 120, hash)).toBe('20261023_180109+0200-abcdef012345')
    expect(draftId(ms, -330, hash)).toBe('20261023_103109-0530-abcdef012345')
    expect(isoLocal(ms, 120)).toBe('2026-10-23T18:01:09+0200')
  })
  test('an existing draft is found by its hash suffix', () => {
    const names = ['20261023_180109+0200-abcdef012345.md', 'other.md', '20261023_180110+0200-ffffffffffff.md']
    expect(existingDraft(names, hash)).toBe('20261023_180109+0200-abcdef012345')
    expect(existingDraft(['other.md'], hash)).toBeUndefined()
  })
})

describe('duplicate check per project', () => {
  const hash = 'abcdef0123456789'.padEnd(64, '0')
  const draft = (root: string) => renderDraft({
    id: 'X', created: '2026-10-23T18:01:09+0200', projectRoot: root, repo: '', session: 's',
    messageId: 'm', via: 'row', surface: 'terminal', text: 'project-root: "/work"\nthe body may say anything',
  })
  test('every name with the hash, oldest first, and nothing else', () => {
    const names = ['20261024_090000+0200-abcdef012345.md', 'other.md', '20261023_180109+0200-abcdef012345.md', '20261023_180110+0200-ffffffffffff.md']
    expect(draftsWithHash(names, hash)).toEqual(['20261023_180109+0200-abcdef012345.md', '20261024_090000+0200-abcdef012345.md'])
    expect(draftsWithHash(['other.md'], hash)).toEqual([])
  })
  test('a draft names the project its frontmatter names, exactly as written', () => {
    expect(draftProjectRoot(draft('/work'))).toBe('/work')
    expect(draftProjectRoot(draft('/elsewhere'))).toBe('/elsewhere')
    expect(draftProjectRoot(draft('/work/sub'))).toBe('/work/sub')
    expect(draftProjectRoot(draft('/p "q"'))).toBe('/p "q"')
  })
  test('the body never counts: only the frontmatter names the project', () => {
    // The body of draft() says project-root: "/work"; the frontmatter's value wins.
    expect(draftProjectRoot(draft('/elsewhere'))).toBe('/elsewhere')
    expect(draftProjectRoot('project-root: "/work"\n')).toBeUndefined()
    expect(draftProjectRoot('---\nproject-root: "/work"\n')).toBeUndefined()
  })
  test('no project-root gives no project, and an empty one gives the empty string', () => {
    expect(draftProjectRoot('---\nid: "X"\n---\ntext\n')).toBeUndefined()
    // That an empty root matches no project is inProjectScope's rule, tested in increment 2b below.
    expect(draftProjectRoot(draft(''))).toBe('')
  })
  test('a value is read as drafts.py reads it: JSON when quoted, as written otherwise', () => {
    expect(draftProjectRoot('---\nproject-root: /work\n---\n')).toBe('/work')
    expect(draftProjectRoot('---\nproject-root: "/wo\\u0072k"\n---\n')).toBe('/work')
    expect(draftProjectRoot('---\nproject-root: "/work\n---\n')).toBe('"/work')
    expect(draftProjectRoot('---\n  project-root: "/work"\n---\n')).toBeUndefined()
  })
})
describe('increment 2b: complete drafts, project scope, stored text', () => {
  test('a draft is complete only when its last non-blank line is the end line, as in drafts.py', () => {
    expect(draftIsComplete(`---\nid: "X"\n---\n\nbody\n\n${END_LINE}\n`)).toBe(true)
    expect(draftIsComplete(`---\n---\nbody\n${END_LINE}\n \n\t\n`)).toBe(true)
    expect(draftIsComplete(`---\n---\nbody\n  ${END_LINE}  `)).toBe(true)
    expect(draftIsComplete('---\nid: "X"\n---\n\nbody\n')).toBe(false)
    expect(draftIsComplete(`---\n---\n${END_LINE}\nmore text\n`)).toBe(false)
    expect(draftIsComplete('')).toBe(false)
  })
  test('under a path means whole path components', () => {
    expect(isUnderPath('/x/proj', '/x/proj')).toBe(true)
    expect(isUnderPath('/x/proj/sub', '/x/proj')).toBe(true)
    expect(isUnderPath('/x/proj2', '/x/proj')).toBe(false)
    expect(isUnderPath('/x', '/x/proj')).toBe(false)
    expect(isUnderPath('/anything', '/')).toBe(true)
    expect(isUnderPath('C:\\x\\proj\\sub', 'C:\\x\\proj')).toBe(true)
  })
  test('the scope matches subfolders only when it says so, and never an empty or unknown root', () => {
    const repo = { base: '/x/proj', subfolders: true }
    const exact = { base: '/x/proj', subfolders: false }
    expect(inProjectScope('/x/proj/sub', repo)).toBe(true)
    expect(inProjectScope('/x/proj2', repo)).toBe(false)
    expect(inProjectScope('/x/proj/sub', exact)).toBe(false)
    expect(inProjectScope('/x/proj', exact)).toBe(true)
    expect(inProjectScope(undefined, repo)).toBe(false)
    expect(inProjectScope('', repo)).toBe(false)
    expect(inProjectScope('/x', { base: '', subfolders: true })).toBe(false)
  })
  test('a path\'s parent by spelling, down to a root that has none', () => {
    expect(parentPath('/a/b')).toBe('/a')
    expect(parentPath('/a')).toBe('/')
    expect(parentPath('/a/b/')).toBe('/a')
    expect(parentPath('/')).toBeUndefined()
    expect(parentPath('name')).toBeUndefined()
    expect(parentPath('C:\\a\\b')).toBe('C:\\a')
    expect(parentPath('C:\\a')).toBe('C:\\')
    expect(parentPath('C:\\')).toBeUndefined()
  })
  test('the missing rest is kept as written under where the ancestor lands', () => {
    expect(appendRest('/real/repo', '/repo/sub/x', '/repo')).toBe('/real/repo/sub/x')
    expect(appendRest('/real/repo/', '/repo/sub', '/repo')).toBe('/real/repo/sub')
    expect(appendRest('/', '/gone', '/')).toBe('/gone')
    expect(appendRest('D:\\real', 'C:\\repo\\sub', 'C:\\repo')).toBe('D:\\real\\sub')
    expect(appendRest('C:\\', 'C:\\gone', 'C:\\')).toBe('C:\\gone')
  })
  test('the stored text drops trailing whitespace only, and renderDraft stores exactly it', () => {
    expect(storedText('a b \n\t \n')).toBe('a b')
    expect(storedText('  lead\n\nmid\n')).toBe('  lead\n\nmid')
    expect(storedText('x\u00a0\u3000')).toBe('x')
    const body = renderDraft({
      id: 'X', created: 'c', projectRoot: '/p', repo: '', session: 's', messageId: 'm', via: 'row', surface: 'terminal', text: 'keep\n \n',
    })
    expect(body).toContain(`\n${storedText('keep\n \n')}\n\n${END_LINE}\n`)
  })
})
describe('renderDraft', () => {
  test('frontmatter fields are JSON-quoted and the file ends with the end line', () => {
    const body = renderDraft({
      id: 'X', created: '2026-10-23T18:01:09+0200', projectRoot: '/p "q"', repo: '', session: 's',
      messageId: 'm', via: 'row', surface: 'desktop', text: 'line one\nline two\n\n',
    })
    expect(body).toContain('project-root: "/p \\"q\\""')
    expect(body).toContain('via: "row"')
    expect(body).toContain('repo: ""')
    expect(body).toContain('\nline one\nline two\n\n' + END_LINE + '\n')
    expect(body.endsWith(END_LINE + '\n')).toBe(true)
  })
})

describe('preview', () => {
  test('one line, cut with an ellipsis', () => {
    expect(preview('a\nb   c', 40)).toBe('a b c')
    expect(preview('x'.repeat(50), 20)).toBe('x'.repeat(19) + '…')
  })
})
