// Behaviour of the account-registry-file reference module: parsing refusals, identity, upsert and the folder name.
import { describe, expect, test } from 'claude-code/testing'

import {
  REGISTRY_VERSION,
  findByAlias,
  findByEmail,
  findByIdentity,
  findByUuid,
  parseRegistry,
  safeFolderName,
  sameLogin,
  serialiseRegistry,
  upsertAccount,
} from '../account-registry-file'

const FILE = 'registry.json'
const NOW = new Date('2026-10-29T12:00:00Z')
const file = (value: unknown) => JSON.stringify(value)
const entry = (alias: string, email: string, more: Record<string, unknown> = {}) => ({ alias, email, ...more })
const registryOf = (...accounts: unknown[]) => parseRegistry(file({ version: REGISTRY_VERSION, accounts }), FILE)

describe('parseRegistry refusals', () => {
  test('no file at all (undefined) is an empty registry', () => {
    expect(parseRegistry(undefined, FILE)).toEqual({ version: REGISTRY_VERSION, accounts: [] })
  })
  test('a file with no text, or only whitespace, is an error that names the file, never an empty list', () => {
    expect(() => parseRegistry('', FILE)).toThrow(/registry\.json: the registry file is empty/)
    expect(() => parseRegistry('  \n', FILE)).toThrow(/registry\.json: the registry file is empty/)
  })
  test('text that is not JSON throws an error that names the file', () => {
    expect(() => parseRegistry('not json', FILE)).toThrow(/registry\.json is not valid JSON/)
  })
  test('valid JSON that is not an object throws', () => {
    for (const text of ['[]', 'null', '3', '"x"']) expect(() => parseRegistry(text, FILE)).toThrow(/registry\.json: the registry is not a JSON object/)
  })
  test('a missing or non-array accounts list throws', () => {
    expect(() => parseRegistry(file({ version: 1 }), FILE)).toThrow(/no accounts list/)
    expect(() => parseRegistry(file({ version: 1, accounts: {} }), FILE)).toThrow(/no accounts list/)
  })
  test('a version that is missing, not a number, not an integer or below 1 throws', () => {
    for (const version of [undefined, '1', 0, -1, 1.5]) {
      expect(() => parseRegistry(file({ version, accounts: [] }), FILE)).toThrow(/no valid version number/)
    }
  })
  test('a version newer than this code reads throws', () => {
    expect(() => parseRegistry(file({ version: REGISTRY_VERSION + 1, accounts: [] }), FILE)).toThrow(/newer than/)
  })
  test('an entry without an alias or an email throws and names its index', () => {
    expect(() => registryOf(entry('a', 'a@x.test'), { email: 'b@x.test' })).toThrow(/entry 1: a saved account needs an alias and an email/)
    expect(() => registryOf({ alias: 'b' })).toThrow(/entry 0/)
    expect(() => registryOf(null)).toThrow(/entry 0/)
  })
  test('an alias or an email made only of spaces counts as missing', () => {
    expect(() => registryOf(entry('  ', 'a@x.test'))).toThrow(/entry 0: a saved account needs/)
    expect(() => registryOf(entry('a', ' \t'))).toThrow(/entry 0: a saved account needs/)
  })
  test('a repeated alias throws, whatever its case', () => {
    expect(() => registryOf(entry('Work', 'a@x.test'), entry('work', 'b@x.test'))).toThrow(/entry 1 repeats the alias of entry 0/)
  })
  test('two entries for one login throw: same account and organisation id, or no account id on one side and the same email', () => {
    expect(() => registryOf(entry('a', 'a@x.test', { accountUuid: 'u', orgUuid: 'o' }), entry('b', 'other@x.test', { accountUuid: 'u', orgUuid: 'o' }))).toThrow(
      /entry 1 is the same login as entry 0/,
    )
    expect(() => registryOf(entry('a', 'a@x.test'), entry('b', 'A@X.test'))).toThrow(/same login/)
    expect(() => registryOf(entry('a', 'a@x.test'), entry('b', 'a@x.test', { accountUuid: 'u' }))).toThrow(/same login/)
  })
  test('two organisations under one email stay distinct when both entries carry an account id', () => {
    const registry = registryOf(entry('a', 'a@x.test', { accountUuid: 'u', orgUuid: 'o1' }), entry('b', 'a@x.test', { accountUuid: 'u', orgUuid: 'o2' }))
    expect(registry.accounts).toHaveLength(2)
  })
})

describe('parseRegistry and serialiseRegistry', () => {
  test('an entry is cleaned: name falls back to the email name, installs lose repeats, ids default to null', () => {
    const [a] = registryOf(entry('a', 'ann@x.test', { name: '  ', installs: ['i1', 'i1', '', 5] })).accounts
    expect(a).toEqual({ alias: 'a', email: 'ann@x.test', name: 'ann', accountUuid: null, orgUuid: null, installs: ['i1'], savedAt: null })
  })
  test('what is serialised parses back to the same registry and ends with a newline', () => {
    const registry = registryOf(entry('a', 'a@x.test'), entry('b', 'b@x.test'))
    const text = serialiseRegistry(registry)
    expect(text.endsWith('\n')).toBe(true)
    expect(parseRegistry(text, FILE)).toEqual(registry)
  })
  test('serialising a registry with a repeated alias throws', () => {
    const one = registryOf(entry('a', 'a@x.test')).accounts[0]!
    expect(() => serialiseRegistry({ version: REGISTRY_VERSION, accounts: [one, { ...one }] })).toThrow(/repeats the alias/)
  })
})

describe('lookup and identity', () => {
  const registry = registryOf(entry('work', 'W@x.test', { accountUuid: 'u1', orgUuid: 'o1' }), entry('home', 'h@x.test'))
  test('lookups by alias and email ignore case; by account id they are exact', () => {
    expect(findByAlias(registry, 'WORK')?.alias).toBe('work')
    expect(findByEmail(registry, 'w@X.test')?.alias).toBe('work')
    expect(findByUuid(registry, 'u1')?.alias).toBe('work')
    expect(findByUuid(registry, 'U1')).toBeUndefined()
  })
  test('sameLogin compares account and organisation ids when both sides have an id, else the email', () => {
    const base = { email: 'a@x.test', accountUuid: 'u', orgUuid: 'o' }
    expect(sameLogin(base, { email: 'b@x.test', accountUuid: 'u', orgUuid: 'o' })).toBe(true)
    expect(sameLogin(base, { email: 'a@x.test', accountUuid: 'u', orgUuid: 'other' })).toBe(false)
    expect(sameLogin(base, { email: 'A@X.test', accountUuid: null, orgUuid: null })).toBe(true)
    expect(sameLogin(base, { email: 'c@x.test', accountUuid: null, orgUuid: null })).toBe(false)
  })
  test('findByIdentity matches on the login, not on the alias', () => {
    expect(findByIdentity(registry, { email: 'other@x.test', accountUuid: 'u1', orgUuid: 'o1' })?.alias).toBe('work')
    expect(findByIdentity(registry, { email: 'H@x.test', accountUuid: null, orgUuid: null })?.alias).toBe('home')
    expect(findByIdentity(registry, { email: 'w@x.test', accountUuid: 'u1', orgUuid: 'other' })).toBeUndefined()
  })
})

describe('upsertAccount', () => {
  test('a new alias is appended with the save time', () => {
    const next = upsertAccount(registryOf(entry('a', 'a@x.test')), entry('b', 'b@x.test'), NOW)
    expect(next.accounts.map(account => account.alias)).toEqual(['a', 'b'])
    expect(next.accounts[1]?.savedAt).toBe(NOW.toISOString())
  })
  test('a known alias is replaced in place and its installs are merged', () => {
    const start = registryOf(entry('a', 'a@x.test', { installs: ['i1'] }), entry('b', 'b@x.test'))
    const next = upsertAccount(start, entry('A', 'a@x.test', { name: 'Ann', installs: ['i2', 'i1'] }), NOW)
    expect(next.accounts.map(account => account.email)).toEqual(['a@x.test', 'b@x.test'])
    expect(next.accounts[0]).toMatchObject({ alias: 'A', name: 'Ann', installs: ['i1', 'i2'] })
  })
  test('a second alias for a login already saved is refused, also when one side has no account id', () => {
    const start = registryOf(entry('a', 'a@x.test', { accountUuid: 'u', orgUuid: 'o' }))
    expect(() => upsertAccount(start, entry('b', 'other@x.test', { accountUuid: 'u', orgUuid: 'o' }), NOW)).toThrow(/already saved as "a"/)
    expect(() => upsertAccount(registryOf(entry('a', 'a@x.test')), entry('b', 'A@X.test'), NOW)).toThrow(/already saved as "a"/)
    expect(() => upsertAccount(registryOf(entry('a', 'e@x.test')), entry('b', 'e@x.test', { accountUuid: 'u' }), NOW)).toThrow(/already saved as "a"/)
  })
  test('the same alias may be saved again for its own login', () => {
    const start = registryOf(entry('a', 'a@x.test', { accountUuid: 'u' }))
    expect(upsertAccount(start, entry('a', 'a@x.test', { accountUuid: 'u', name: 'New' }), NOW).accounts).toHaveLength(1)
  })
  test('an account without an alias or an email is refused', () => {
    expect(() => upsertAccount(registryOf(), { alias: 'a' }, NOW)).toThrow(/needs an alias and an email/)
  })
})

describe('safeFolderName', () => {
  test('a label becomes a lower-case folder name of a-z, 0-9, dot, underscore and hyphen, at most 32 characters', () => {
    expect(safeFolderName('  Marvel Collin  ')).toBe('marvel-collin')
    expect(safeFolderName('work@example.com')).toBe('work-example.com')
    expect(safeFolderName('***side***')).toBe('side')
    expect(safeFolderName('a'.repeat(80))).toHaveLength(32)
  })
  test('non-ASCII letters collapse to a hyphen, and a label with no ASCII letter or digit throws', () => {
    expect(safeFolderName('Élan')).toBe('lan')
    expect(() => safeFolderName('***')).toThrow(/Cannot build a folder name/)
    expect(() => safeFolderName('éé')).toThrow(/Cannot build a folder name/)
  })
})
