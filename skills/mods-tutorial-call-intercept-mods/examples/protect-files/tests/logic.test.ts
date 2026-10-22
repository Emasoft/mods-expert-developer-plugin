import { expect, test } from 'claude-code/testing'

import { checkTarget, isProtected, normalizePath, parseManage, parseSwitch, readList } from '../hooks/logic.js'

test('readList accepts a missing key and string arrays, and rejects the rest', () => {
  expect(readList(undefined)).toEqual([])
  expect(readList(['a'])).toEqual(['a'])
  expect(readList('oops')).toBeUndefined()
  expect(readList([1])).toBeUndefined()
})

test('normalizePath drops ./, repeated and trailing slashes, resolves ..', () => {
  expect(normalizePath('./a//b/')).toBe('a/b')
  expect(normalizePath('/a/./b/../c/')).toBe('/a/c')
  expect(normalizePath('a\\b')).toBe('a/b')
  expect(normalizePath('../a')).toBe('../a')
  expect(normalizePath('/../a')).toBe('/a')
})

test('an absolute entry protects itself and what is below it, by whole segments', () => {
  expect(isProtected('/p/.env', ['/p/.env'])).toBe(true)
  expect(isProtected('/p/secrets/k.txt', ['/p/secrets/'])).toBe(true)
  expect(isProtected('/p/secrets2/k.txt', ['/p/secrets'])).toBe(false)
  // A relative entry that starts with .. can never match, so adding it is refused and nothing is stored
  expect(parseManage('add ../x', [])).toEqual({
    text: '../x cannot be protected: a relative path that starts with .. never matches a file path',
  })
  expect(parseManage('add a/../../x', ['k'])).not.toHaveProperty('paths')
  expect(parseManage('add ../x/y', [])).not.toHaveProperty('paths')
  expect(parseManage('add /../x', [])).toMatchObject({ paths: ['/x'] })
  expect(parseManage('remove ../x', ['../x'])).toMatchObject({ paths: [] })
  expect(isProtected('/p/sub/../.env', ['/p/.env'])).toBe(true)
})

test('a relative entry protects its segments wherever they appear', () => {
  expect(isProtected('/work/proj/.env', ['./.env'])).toBe(true)
  expect(isProtected('/work/proj/src/a.ts', ['src'])).toBe(true)
  expect(isProtected('/work/proj/src2/a.ts', ['src'])).toBe(false)
})

test('checkTarget fails closed on a missing target or a damaged list', () => {
  expect(checkTarget(undefined, [])).toContain('no file path')
  expect(checkTarget('/a', 'oops')).toContain('damaged')
  expect(checkTarget('/a', [1])).toContain('damaged')
  expect(checkTarget('/a', undefined)).toBeUndefined()
  expect(checkTarget('/a/b', ['/a'])).toContain('is protected')
  // A relative target cannot be compared with an absolute entry, so it is refused
  expect(checkTarget('.env', ['/p/.env'])).toContain('relative path')
  expect(checkTarget('.env', ['.env'])).toContain('is protected')
  expect(checkTarget('.env', ['secrets'])).toBeUndefined()
})

test('parseSwitch toggles, sets, and answers usage', () => {
  expect(parseSwitch('', true)).toEqual({ enabled: false })
  expect(parseSwitch('', false)).toEqual({ enabled: true })
  expect(parseSwitch('on', false)).toEqual({ enabled: true })
  expect(parseSwitch('OFF', true)).toEqual({ enabled: false })
  expect(parseSwitch(' Off ', true)).toEqual({ enabled: false })
  expect(parseSwitch('maybe', true)).toEqual({ usage: 'usage: /protect-files [on|off]' })
})

test('parseManage adds, removes, lists, and answers usage', () => {
  expect(parseManage('add ./a/b/', [])).toMatchObject({ paths: ['a/b'] })
  expect(parseManage('add a/b', ['a/b'])).toMatchObject({ paths: ['a/b'], text: 'a/b is already protected' })
  expect(parseManage('remove a/b', ['a/b', 'c'])).toMatchObject({ paths: ['c'] })
  expect(parseManage('remove zzz', ['c'])).toMatchObject({ paths: ['c'], text: 'zzz was not in the list' })
  expect(parseManage('list', ['c'])).toMatchObject({ text: 'c' })
  expect(parseManage('add', [])).toEqual({ usage: 'usage: /protect-files-paths add <path> | remove <path> | list' })
  expect(parseManage('bogus x', [])).toHaveProperty('usage')
})
