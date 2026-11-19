import { describe, expect, test } from 'claude-code/testing'

import { isEditorHost, isQuiet, nextQuietSetting, notifyChannel, parseQuietSetting } from '../host-aware-quiet-mode'

describe('isEditorHost', () => {
  test('neither variable set, or both empty, is not an editor', () => {
    expect(isEditorHost({})).toBe(false)
    expect(isEditorHost({ TERM_PROGRAM: '', CLAUDE_CODE_ENTRYPOINT: '' })).toBe(false)
  })
  test('the terminal name counts by its whole value, in any case', () => {
    expect(isEditorHost({ TERM_PROGRAM: 'vscode' })).toBe(true)
    expect(isEditorHost({ TERM_PROGRAM: 'VSCode' })).toBe(true)
    expect(isEditorHost({ TERM_PROGRAM: 'iTerm.app' })).toBe(false)
    expect(isEditorHost({ TERM_PROGRAM: 'not-vscode' })).toBe(false)
  })
  test('the entry point counts when it contains a word of the rule', () => {
    expect(isEditorHost({ CLAUDE_CODE_ENTRYPOINT: 'claude-vscode' })).toBe(true)
    expect(isEditorHost({ CLAUDE_CODE_ENTRYPOINT: 'Cursor-extension' })).toBe(true)
    expect(isEditorHost({ CLAUDE_CODE_ENTRYPOINT: 'cli' })).toBe(false)
  })
  test('either variable alone is enough', () => {
    expect(isEditorHost({ TERM_PROGRAM: 'Apple_Terminal', CLAUDE_CODE_ENTRYPOINT: 'vscode' })).toBe(true)
    expect(isEditorHost({ TERM_PROGRAM: 'vscode', CLAUDE_CODE_ENTRYPOINT: 'cli' })).toBe(true)
  })
  test('a rule of the caller replaces the defaults, and an empty word in it matches nothing', () => {
    const zed = { termPrograms: ['zed'], entrypointWords: [''] }
    expect(isEditorHost({ TERM_PROGRAM: 'zed' }, zed)).toBe(true)
    expect(isEditorHost({ TERM_PROGRAM: 'vscode' }, zed)).toBe(false)
    expect(isEditorHost({ CLAUDE_CODE_ENTRYPOINT: 'cli' }, zed)).toBe(false)
    expect(isEditorHost({ TERM_PROGRAM: 'zed' })).toBe(false)
  })
})

describe('isQuiet', () => {
  test('on is quiet and off is loud, whatever the host', () => {
    expect([isQuiet('on', false), isQuiet('on', true)]).toEqual([true, true])
    expect([isQuiet('off', false), isQuiet('off', true)]).toEqual([false, false])
  })
  test('auto follows the host', () => {
    expect(isQuiet('auto', true)).toBe(true)
    expect(isQuiet('auto', false)).toBe(false)
  })
})

describe('parseQuietSetting and nextQuietSetting', () => {
  test('the three words are read in any case with outer spaces dropped', () => {
    expect([parseQuietSetting(' ON '), parseQuietSetting('Auto'), parseQuietSetting('off')]).toEqual(['on', 'auto', 'off'])
  })
  test('another word or a value that is not text gives undefined', () => {
    expect([parseQuietSetting('subtle'), parseQuietSetting(''), parseQuietSetting(1), parseQuietSetting(null)]).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ])
  })
  test('an empty argument flips what the person sees now', () => {
    expect(nextQuietSetting('', true)).toBe('off')
    expect(nextQuietSetting('  ', false)).toBe('on')
  })
  test('a named word sets it whatever the person sees now, and an unknown word gives undefined', () => {
    expect(nextQuietSetting('auto', true)).toBe('auto')
    expect(nextQuietSetting('on', true)).toBe('on')
    expect(nextQuietSetting('loud', false)).toBeUndefined()
  })
})

describe('notifyChannel', () => {
  test('quiet sends an unrequested message to the log, loud to a toast', () => {
    expect(notifyChannel(true)).toBe('log')
    expect(notifyChannel(false)).toBe('toast')
  })
})

describe('the default when no editor signal is in the environment', () => {
  test('auto with no signal, or empty ones, sends an unrequested message to a toast (loud)', () => {
    for (const env of [{}, { TERM_PROGRAM: undefined, CLAUDE_CODE_ENTRYPOINT: undefined }, { TERM_PROGRAM: '', CLAUDE_CODE_ENTRYPOINT: '' }]) {
      expect(notifyChannel(isQuiet('auto', isEditorHost(env)))).toBe('toast')
    }
  })
  test('an unrelated real value in either variable is no editor signal: auto goes to a toast', () => {
    for (const env of [{ TERM_PROGRAM: 'iTerm.app' }, { TERM_PROGRAM: 'Apple_Terminal' }, { CLAUDE_CODE_ENTRYPOINT: 'cli' }]) {
      expect(notifyChannel(isQuiet('auto', isEditorHost(env)))).toBe('toast')
    }
  })
  test('the same holds with a rule of the caller whose lists are empty', () => {
    const none = { termPrograms: [], entrypointWords: [] }
    expect(notifyChannel(isQuiet('auto', isEditorHost({ TERM_PROGRAM: 'vscode', CLAUDE_CODE_ENTRYPOINT: 'vscode' }, none)))).toBe('toast')
  })
})
