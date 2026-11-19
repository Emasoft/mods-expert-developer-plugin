// Behaviour of the machine-login-source-detection reference module: a pure function of the three variable values.
import { describe, expect, test } from 'claude-code/testing'

import { detectLoginSource } from '../machine-login-source-detection'

describe('detectLoginSource', () => {
  test('no variable set means the stored login', () => {
    expect(detectLoginSource({})).toEqual({ source: 'stored', set: [] })
  })
  test('an empty value counts as unset', () => {
    expect(detectLoginSource({ ANTHROPIC_API_KEY: '', CLAUDE_CODE_OAUTH_TOKEN: undefined })).toEqual({ source: 'stored', set: [] })
  })
  test('a value of spaces counts as set, on purpose', () => {
    expect(detectLoginSource({ CLAUDE_CODE_OAUTH_TOKEN: '  ' })).toEqual({ source: 'oauth-token', set: ['oauth-token'] })
  })
  test('each variable alone gives its own source', () => {
    expect(detectLoginSource({ ANTHROPIC_API_KEY: 'k' })).toEqual({ source: 'api-key', set: ['api-key'] })
    expect(detectLoginSource({ ANTHROPIC_AUTH_TOKEN: 't' })).toEqual({ source: 'auth-token', set: ['auth-token'] })
    expect(detectLoginSource({ CLAUDE_CODE_OAUTH_TOKEN: 'o' })).toEqual({ source: 'oauth-token', set: ['oauth-token'] })
  })
  test('several variables are all listed and the source is the first in the reading order', () => {
    const found = detectLoginSource({ CLAUDE_CODE_OAUTH_TOKEN: 'o', ANTHROPIC_API_KEY: 'k', ANTHROPIC_AUTH_TOKEN: 't' })
    expect(found).toEqual({ source: 'api-key', set: ['api-key', 'auth-token', 'oauth-token'] })
  })
})
