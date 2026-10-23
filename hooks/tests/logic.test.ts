// Unit tests of the requirements-drafts rules (hooks/requirements-drafts/logic.ts), no kit stubs.
import { describe, expect, test } from 'claude-code/testing'

import {
  END_LINE,
  MAX_RECENT,
  MAX_TEXT_BYTES,
  draftId,
  existingDraft,
  isoLocal,
  looksSecret,
  parseSwitch,
  preview,
  pushRecent,
  refusal,
  renderDraft,
  rowIsSaveable,
  shouldRecord,
} from '../requirements-drafts/logic'

const typed = { raisedBy: 'engine', originKind: 'composer', hasCommand: false, isMeta: false, text: 'the list must sort by date' }

describe('shouldRecord', () => {
  test('records text the person typed and sent', () => {
    expect(shouldRecord(typed)).toBe(true)
  })
  test('skips a prompt raised by a plugin, not by Claude Code', () => {
    expect(shouldRecord({ ...typed, raisedBy: 'other-mod' })).toBe(false)
  })
  test('skips every origin other than the composer', () => {
    for (const originKind of ['bridge', 'sdk', 'task-notification', 'peer', 'plugin', 'unclassified']) {
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
  test('only a composer row with its real id', () => {
    expect(rowIsSaveable('composer', 'msg-1')).toBe(true)
    expect(rowIsSaveable('composer', 'placeholder')).toBe(false)
    expect(rowIsSaveable('composer', '')).toBe(false)
    expect(rowIsSaveable('task-notification', 'msg-1')).toBe(false)
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
      // Basic auth anywhere when the token holds a digit, +, / or = (one sample per character kind).
      'send Basic YWRtaW46czNjcjN0UGFzcw with curl',
      'send Basic QWxhZGRpbjpvcGVu+SesameAB with curl',
      'send Basic QWxhZGRpbjpvcGVu/SesameAB with curl',
      'send Basic QWxhZGRpbjpvcGVuSesameAB== with curl',
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
    ]
    expect(ordinary.filter((text) => looksSecret(text))).toEqual([])
    expect(refusal('Add a search box to the drafts list')).toBeUndefined()
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
