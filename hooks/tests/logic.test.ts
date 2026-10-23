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
    ]
    for (const text of samples) {
      expect(looksSecret(text)).toBe(true)
      expect(refusal(text)).toMatch(/secret/)
    }
  })
  test('ordinary requirements pass', () => {
    expect(looksSecret('The password field must hide what is typed.')).toBe(false)
    // Schema-style requirement text names credential fields without holding one.
    for (const text of [
      'auth_token: optional string',
      'password: required, min length',
      'access_token: `string`',
      'Secretary: Jennifer, the project lead',
      'Secretary: Office2025B on the third floor',
      'passwords=encrypted at rest',
      'the secret: keep it short',
      'api_key: string in the config schema',
    ]) {
      expect(looksSecret(text)).toBe(false)
    }
    expect(refusal('Add a search box to the drafts list')).toBeUndefined()
  })
  test('empty and oversize text are refused', () => {
    expect(refusal('  ')).toMatch(/empty/)
    expect(refusal('x'.repeat(MAX_TEXT_BYTES + 1))).toMatch(/4 MiB/)
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
