// Tests of the debug log (TRDD-RWD5PW76, PRRD G14.1): the masking against real secret shapes, the data-folder name,
// the cap and the rotation, and, through the plugin as it loads, that an event a mod raises is masked wherever it goes,
// is written to the mod's file only while its debug-log switch is on, and never in the project or the working folder.
// The secrets are fake but have the real shapes; each is joined at run time so no scanner of this repository reads a
// whole one in the source.
import { describe, expect, test } from 'claude-code/testing'

import { DEBUG_LOG_CAP, appendedFiles, cleanMasked, dataFolderId, debugLogSwitch, isAbsolutePath, logLine, maskForLog, urlUserinfoMasked } from '../debug-log/logic'
import { RUN } from '../dev-tools'
import { HISTORY_KEY } from '../self-command/logic'
import { HOME, PLUGIN, TOOL, agentSets, keyFor, run, signed, signedOn, start, world, type World } from './switch-world'

// The mod whose events these tests raise: self-command, which sends a failure through logEvent and owns a debug log.
const DEBUG = 'self-command.debug-log'
// The kit runs the plugin from a folder of its own, not from an install under plugins/cache, so its data folder is
// <name>@inline with the @ replaced.
const LOG = `${HOME}/.claude/plugins/data/${PLUGIN}-inline/debug/self-command.log`
// The time a line starts with. Settling the clock may move it to a timer another mod set, so the time is read, not set.
const AT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z /gm
const untimed = (file: string | undefined): string | undefined => file?.replace(AT, '')

// cspell:ignore IOSFODNN
const GITHUB = ['ghp', '_', 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8'].join('')
const AWS = ['AK', 'IA', 'IOSFODNN7EXAMPLE'].join('')
const JWT = ['eyJ', 'hbGciOiJIUzI1NiJ9', '.', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0', '.', 'dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'].join('')
const ANTHROPIC = ['sk-', 'ant-', 'api03-', 'AbCdEfGhIjKlMnOpQrStUvWx'].join('')
const BEARER = ['abc', '.def', '.ghi'].join('')
const PASSWORD = ['hunter2', 'hunter2'].join('')
const API_KEY = ['zzTop', 'SecretValue99'].join('')
const EMAIL = ['alice.smith+ci', '@', 'example.co.uk'].join('')

/** Every secret and private part a raised event can carry, in one line, as an error message would. */
const DIRTY = [
  `refused for ${EMAIL}:`,
  `token ${GITHUB}, key ${AWS}, session ${JWT}, ${ANTHROPIC},`,
  `Authorization: Bearer ${BEARER}, password=${PASSWORD} API_KEY=${API_KEY}`,
  `in ${HOME}/.config/app and /Users/alice/notes and C:\\Users\\carol\\x`,
].join(' ')
const SECRETS = [EMAIL, GITHUB, AWS, JWT, ANTHROPIC, BEARER, PASSWORD, API_KEY, HOME, 'alice', 'carol']

function expectClean(text: string): void {
  for (const secret of SECRETS) expect(text).not.toContain(secret)
}

/** The $.ui.log lines one mod or the plugin raised, by the prefix the line starts with. */
const raised = (w: World, prefix: string): string[] => w.logs.filter((text) => text.startsWith(prefix))

const RUN_TOOL = `mcp__${PLUGIN}__run`
/** The event the tests below raise: the line self-command logs when the store refuses the record of a run. */
const SENT = 'self-command: the run of /compact was not added to the history:'

/**
 * The engine as the run tool needs it: the command list holds /compact, its run and the send of its outcome go through,
 * and the store refuses the record of the run in the history with the reason `nextReason` gives, which self-command
 * raises through logEvent. Call it before world(): the first registered store.set answer wins (./masters.ts), so the
 * history's refusal must come before the world's plain one. A refused send would not do: the kit skips a command.run
 * hook that throws and rejects with its own text, so the reason, and the secrets a test puts in it, never reach the line.
 */
function refusingHistory(on: any, nextReason: () => string | undefined): void {
  on('store.set', { key: HISTORY_KEY }, () => ({ deny: nextReason() ?? 'refused' }))
  on('command.list', () => ({ value: [{ name: 'compact', description: 'Summarize the conversation', source: 'builtin' }] }))
  on('command.run', () => ({}))
}

/** The agent calls the run tool for /compact; self-command runs it from a timer, sends the outcome, then records it. */
const queueRun = ($: any) => $.tool.call({ tool: RUN_TOOL, command: 'compact' } as any)

/**
 * The debug file is written after the event returns, through calls a test cannot await. Move the clock by `step` (0
 * settles it) until the condition holds, each move letting the event loop run; running out of moves fails the test,
 * naming what it waited for. Five settles were measured too few at a host load of 140 (one run of three).
 */
async function until(w: World, what: string, holds: () => boolean, step = 0): Promise<void> {
  for (let look = 0; look < 2000; look++) {
    await w.clock.advance(step)
    if (holds()) return
  }
  throw new Error(`timed out waiting until ${what}`)
}

/**
 * Whether the debug-log switch was read after the last log line that starts with the prefix. An event whose log is off
 * ends with that read, so once it is seen no write of that event can still come.
 */
function switchReadAfter(w: World, prefix: string): boolean {
  let line = -1
  w.trace.forEach((entry, at) => {
    if (entry.startsWith(`ui.log:${prefix}`)) line = at
  })
  return line >= 0 && w.trace.slice(line + 1).includes(`store.get:${keyFor(DEBUG)}`)
}

describe('masking', () => {
  test('every secret shape, every e-mail address and every home folder is masked; what is not one stays', () => {
    const masked = maskForLog(`${DIRTY} with typescript@5 and actions/checkout@v4`, HOME)
    expectClean(masked)
    for (const label of ['github-token', 'aws-access-key', 'jwt', 'anthropic-key', 'bearer-token', 'email']) {
      expect(masked).toContain(`[REDACTED:${label}]`)
    }
    expect(masked).toContain('password=[REDACTED:')
    expect(masked).toContain('API_KEY=[REDACTED:')
    expect(masked).toContain('in ~/.config/app and /Users/<user>/notes and C:\\Users\\<user>\\x')
    expect(masked).toContain('with typescript@5 and actions/checkout@v4')
  })

  test('a home folder outside the standard places is masked as ~; without one the standard places still are', () => {
    expect(maskForLog('at /srv/me/project', '/srv/me')).toBe('at ~/project')
    // Masked, then printable: a control character inside the home path does not hide the path from the mask (review of d623b53).
    expect(cleanMasked('at /srv/a\u0007b/project \u001b[2K', '/srv/a\u0007b')).toBe('at ~/project ?[2K')
    // Masked, then collapsed, then printable (M4c item 1): a home with a run of white space in its name is still found,
    // and the line break and tab after it become one space, so the line stays one line. Collapsed before the mask, the
    // generic pattern would leave ' b' in clear; printable before the collapse, the break would be a '?'. The path is
    // joined at run time, as below, for tests/test_no_absolute_paths.py.
    const spaced = ['', 'Users', 'a  b'].join('/')
    expect(cleanMasked(`at ${spaced}/project\n\tdone`, spaced)).toBe('at ~/project done')
    expect(maskForLog('at /srv/me/project', '/srv/me/')).toBe('at ~/project')
    expect(maskForLog('at /home/tester/x and /Users/alice/y', undefined)).toBe('at /home/<user>/x and /Users/<user>/y')
    // A home of one character would turn every slash into ~.
    expect(maskForLog('a/b', '/')).toBe('a/b')
  })

  // Orchestrator ruling (d) on the item 3 sweep: a pause reason is masked where it is born and again where it is read, so
  // masking must not change a text it already masked: no label of a [REDACTED:...] is replaced, no ~ or <user> moves.
  test('masking a masked line changes nothing, so a text masked twice reads as it did after the first mask', () => {
    const once = maskForLog(DIRTY, HOME)
    expect(maskForLog(once, HOME)).toBe(once)
    const clean = cleanMasked(`${DIRTY}\n\tand more`, HOME)
    expect(cleanMasked(clean, HOME)).toBe(clean)
  })

  test('the home is replaced only where a path segment ends; any case and either Windows slash are masked', () => {
    // A home that begins another user's name must not cut that name in two and leave its end in clear. The paths are
    // joined at run time: tests/test_no_absolute_paths.py reads a home of a user name it does not know as a machine's.
    const al = ['', 'home', 'al'].join('/')
    expect(maskForLog(`${al}ice/x and ${al}/y and ${al}`, al)).toBe('/home/<user>/x and ~/y and ~')
    expect(maskForLog('C:\\Users/carol/x and /users/alice/y and /HOME/alice', undefined)).toBe(
      'C:\\Users/<user>/x and /users/<user>/y and /HOME/<user>',
    )
  })

  // Orchestrator, item 3 sweep step 1 (2026-11-05): a scheme URL's whole userinfo is a credential, a token alone as much
  // as user:password, and the re-pointed source line of the default log carries git URLs. The first two hosts have no
  // top-level domain, so the e-mail rule cannot hide the token in place of this rule.
  test('a scheme URL loses all of its userinfo, a lone token as well as user:password; a URL without one and an scp-style git address keep theirs', () => {
    expect(urlUserinfoMasked('clone https://ghp_abc123@10.0.0.5/org/repo.git')).toBe('clone https://[REDACTED:url-userinfo]@10.0.0.5/org/repo.git')
    expect(urlUserinfoMasked('git+ssh://ann:hunter2@localhost:2222/repo')).toBe('git+ssh://[REDACTED:url-userinfo]@localhost:2222/repo')
    const kept = 'https://example.com/a@b?x=1@2, https://@host/x, git@github.com:org/repo.git and a://'
    expect(urlUserinfoMasked(kept)).toBe(kept)
    // Lead 3 of the review of the staged change: a run before the scheme that starts with a digit, a dash or a dot no
    // longer skips the URL; lead 8: the scheme in capitals is a scheme.
    for (const before of ['1.', 'see -', '.', '']) {
      const scheme = before === '' ? 'HTTPS' : 'https'
      expect(urlUserinfoMasked(`${before}${scheme}://TOKEN@host/x`)).toBe(`${before}${scheme}://[REDACTED:url-userinfo]@host/x`)
    }
    // Lead 5: a character no URI holds ends the authority, so an @ after it is no user and the host stays.
    expect(urlUserinfoMasked('see <https://example.com>bob@corp.example')).toBe('see <https://example.com>bob@corp.example')
    // Lead 4, a residual pinned here: an unencoded / or # inside the userinfo ends it early, and the rest stays in clear.
    expect(urlUserinfoMasked('https://ann:pa/ss@host/x and https://tok#en@host')).toBe('https://ann:pa/ss@host/x and https://tok#en@host')
    // Through the whole mask: the token and the password are gone, and a host with a domain keeps its name. The password URL
    // is built from parts so the secret scanner does not read the fixture as a live credential (TRDD-5F1FO5WP).
    expect(maskForLog(`from https://TOKEN123@github.com/org/repo and https://${['ann', 'hunter2'].join(':')}@git.example.com/x`, HOME)).toBe(
      'from https://[REDACTED:url-userinfo]@github.com/org/repo and https://[REDACTED:url-userinfo]@git.example.com/x',
    )
  })
})

describe('the data folder, the file and its cap', () => {
  test('the data folder is named after the install, or inline', () => {
    const table: Array<[string, string]> = [
      [`/Users/alice/.claude/plugins/cache/emasoft-plugins/${PLUGIN}/0.7.0`, `${PLUGIN}-emasoft-plugins`],
      [`/Users/alice/.claude/plugins/cache/emasoft-plugins/${PLUGIN}/0.7.0/`, `${PLUGIN}-emasoft-plugins`],
      [`C:\\Users\\a\\.claude\\plugins\\cache\\emasoft-plugins\\${PLUGIN}\\0.7.0`, `${PLUGIN}-emasoft-plugins`],
      [`/srv/config/plugins/cache/my.market/${PLUGIN}/1.0.0`, `${PLUGIN}-my-market`],
      [`/work/${PLUGIN}`, `${PLUGIN}-inline`],
      ['/Users/alice/.claude/plugins/cache/emasoft-plugins/other-plugin/0.7.0', `${PLUGIN}-inline`],
      [`/cache/m/${PLUGIN}/1`, `${PLUGIN}-inline`],
    ]
    for (const [root, id] of table) expect(dataFolderId(PLUGIN, root)).toBe(id)
  })

  test('a line is added; past the cap the file moves to .1; a line larger than the cap is cut whole characters', () => {
    expect(appendedFiles(undefined, 'a\n', 100)).toEqual({ write: 'a\n' })
    expect(appendedFiles('a\n', 'b\n', 100)).toEqual({ write: 'a\nb\n' })
    const full = `${'x'.repeat(89)}\n`
    expect(appendedFiles(full, `${'b'.repeat(9)}\n`, 100)).toEqual({ write: `${full}${'b'.repeat(9)}\n` })
    expect(appendedFiles(full, `${'b'.repeat(10)}\n`, 100)).toEqual({ write: `${'b'.repeat(10)}\n`, rotate: full })
    const bytes = (text: string): number => new TextEncoder().encode(text).length
    for (const long of ['y'.repeat(500), `a${'€'.repeat(100)}`]) {
      const { write, rotate } = appendedFiles('', long, 100)
      expect(rotate).toBeUndefined()
      expect(bytes(write)).toBeLessThanOrEqual(100)
      expect(write.endsWith('… (cut)\n')).toBe(true)
      expect(write).not.toContain('\uFFFD')
    }
    expect(DEBUG_LOG_CAP).toBe(256 * 1024)
  })

  test('a line holds the time and the mod; its own line breaks, a lone carriage return too, are indented under it', () => {
    expect(logLine('2026-11-04T10:00:00.000Z', 'self-command', 'one\ntwo\r\nthree\rfour')).toBe(
      '2026-11-04T10:00:00.000Z self-command one\n    two\n    three\n    four\n',
    )
  })

  test('only an absolute folder is a place to write', () => {
    for (const path of ['/home/tester/.claude', 'C:\\Users\\<user>\\.claude', 'C:/Users/<user>/.claude', '\\\\server\\share']) {
      expect(isAbsolutePath(path)).toBe(true)
    }
    for (const path of ['.claude', 'tester/.claude', '~/.claude', 'C:relative', '']) expect(isAbsolutePath(path)).toBe(false)
  })

  test('the debug log of a mod is off by default', () => {
    expect(debugLogSwitch('m')).toEqual({ id: 'm.debug-log', mod: 'm', label: 'Debug log of errors and warnings', defaultOn: false })
  })
})

describe('an event a mod raises', () => {
  for (const isOn of [false, true]) {
    const name = isOn ? 'on, the same line is written masked to the mod file' : 'off, the line is masked and nothing is written'
    test(name, async ($, on) => {
      refusingHistory(on, () => DIRTY)
      const w = world(on, { ...(await signedOn([RUN])), ...(isOn ? { [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) } : {}) })
      await start($)
      await queueRun($)
      await until(w, 'the event was raised', () => raised(w, SENT).length > 0)
      const lines = raised(w, SENT)
      expect(lines.length).toBe(1)
      // The refusal's own text reached the line, masked: without it, the clean check below would pass on any line.
      expect(lines[0]).toContain('[REDACTED:github-token]')
      expectClean(raised(w, 'self-command').join('\n'))
      if (!isOn) {
        await until(w, 'the event read its switch', () => switchReadAfter(w, SENT))
        expect(w.writes.filter((path) => path.includes('/plugins/data/'))).toEqual([])
        return
      }
      await until(w, 'the file was written', () => w.files.has(LOG))
      // More settles, so a second write of the same event, if one came, would be in writes by now.
      for (let i = 0; i < 20; i++) await w.clock.settle()
      expect(w.writes).toEqual([LOG])
      expect(String(w.files.get(LOG))).toMatch(new RegExp(AT.source))
      expect(untimed(w.files.get(LOG))).toBe(`self-command ${lines[0]}\n`)
    })
  }

  test('the agent turns the log on mid-session and the next event is written; off again, the next one is not', async ($, on) => {
    refusingHistory(on, () => `disk full for ${EMAIL} at ${HOME}/outbox`)
    const w = world(on, await signedOn([RUN]))
    await start($)
    await queueRun($)
    await until(w, 'the first event read its switch', () => switchReadAfter(w, SENT))
    expect(w.files.has(LOG)).toBe(false)
    await agentSets($, DEBUG, true)
    expect(w.toasts).toContain('The agent turned on self-command: Debug log of errors and warnings.')
    await queueRun($)
    await until(w, 'the file was written', () => w.files.has(LOG))
    const written = String(w.files.get(LOG))
    expect(untimed(written)).toBe(`self-command ${raised(w, SENT)[1]}\n`)
    expectClean(written)
    expect(written).toContain('~/outbox')
    await agentSets($, DEBUG, false)
    await queueRun($)
    await until(w, 'the third event was raised', () => raised(w, SENT).length === 3)
    await until(w, 'the third event read its switch', () => switchReadAfter(w, SENT))
    expect(raised(w, SENT).length).toBe(3)
    expect(w.files.get(LOG)).toBe(written)
  })

  // /mods-dev-tools sets the dev functions together (DEV_FUNCTIONS); the debug logs switch only by themselves.
  test('it is listed off among the mod functions, and /mods-dev-tools on or off never sets it', async ($, on) => {
    refusingHistory(on, () => 'disk full')
    const w = world(on)
    await start($)
    expect(String((await $.tool.call({ tool: TOOL, switch: DEBUG } as any)).result)).toContain(
      `  ${DEBUG}  off  Debug log of errors and warnings`,
    )
    await run($, 'mods-dev-tools', 'off')
    await run($, 'mods-dev-tools', 'on')
    expect(w.store.has(keyFor(DEBUG))).toBe(false)
    await queueRun($)
    await until(w, 'the event was raised', () => raised(w, SENT).length > 0)
    await until(w, 'the event read its switch', () => switchReadAfter(w, SENT))
    expect(w.files.has(LOG)).toBe(false)
  })

  for (const [name, before, rotated] of [
    ['an earlier file keeps its lines', 'an earlier line\n', false],
    ['a file at the cap moves to .log.1 and the new line starts a file', 'z'.repeat(DEBUG_LOG_CAP - 10), true],
  ] as const) {
    test(name, async ($, on) => {
      refusingHistory(on, () => 'refused')
      const w = world(on, { ...(await signedOn([RUN])), [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) })
      w.files.set(LOG, before)
      await start($)
      await queueRun($)
      await until(w, 'the file was written', () => w.files.get(LOG) !== before)
      const [raisedLine] = raised(w, SENT)
      const line = `self-command ${raisedLine}\n`
      expect(untimed(w.files.get(LOG))).toBe(rotated ? line : before + line)
      expect(w.files.get(`${LOG}.1`)).toBe(rotated ? before : undefined)
    })
  }

  test('a debug file that cannot be written is said in the debug log, masked, and the session still starts', async ($, on) => {
    refusingHistory(on, () => 'refused')
    const w = world(on, { ...(await signedOn([RUN])), [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) })
    w.refuseWrite = (path) => (path.includes('/plugins/data/') ? `no room at ${HOME}/.claude\n\tfor ${GITHUB}` : undefined)
    await start($)
    await queueRun($)
    const failed = 'self-command: the debug log could not be written:'
    await until(w, 'the failed write was said', () => raised(w, failed).length > 0)
    expect(w.logSinks[w.logs.findIndex((text) => text.startsWith(failed))]).toBe('debug')
    // On one printable line (item 3 sweep, G1): the break and the tab of the refusal are one space.
    expect(raised(w, failed)[0]).toContain('no room at ~/.claude for [REDACTED:')
    expectClean(raised(w, 'self-command').join('\n'))
    // The switches tool still answers after the failed write.
    expect(String((await agentSets($, DEBUG, false)).result)).toBe(`${DEBUG} is now off.`)
  })

  test('two events raised together both reach the file, in the order they were raised', async ($, on) => {
    refusingHistory(on, () => reasons.shift())
    const w = world(on, { ...(await signedOn([RUN])), [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) })
    w.files.set(LOG, 'an earlier line\n')
    // Each read of the file waits until the clock moves, so the second event is raised while the first still reads:
    // without one write after the other, both would read the earlier line and the second write would drop the first.
    w.readsWait = 10
    const reasons = ['first refusal', 'second refusal']
    await start($)
    await queueRun($)
    await queueRun($)
    await until(w, 'both events were raised', () => raised(w, SENT).length === 2)
    const lines = raised(w, SENT)
    expect(lines.length).toBe(2)
    await until(w, 'both lines were written', () => (w.files.get(LOG)?.match(AT) ?? []).length === 2, 10)
    expect(untimed(w.files.get(LOG))).toBe(`an earlier line\n${lines.map((line) => `self-command ${line}\n`).join('')}`)
  })

  test('a configuration folder that is not absolute is refused, so nothing is written under the working folder', async ($, on) => {
    refusingHistory(on, () => 'refused')
    const w = world(on, { ...(await signedOn([RUN])), [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) })
    w.env.CLAUDE_CONFIG_DIR = 'relative/config'
    await start($)
    await queueRun($)
    const failed = 'self-command: the debug log could not be written:'
    await until(w, 'the refusal was said', () => raised(w, failed).length > 0)
    expect(raised(w, failed)).toEqual([`${failed} the configuration folder is not an absolute path, so nothing is written`])
    expect(w.writes).toEqual([])
  })

  // Item 3 sweep, G1: the copy logEvent sends to $.ui.log is masked, on one line and printable, so a break or a control
  // in an error from outside forges no transcript line; the file keeps the line's own break, indented.
  test('a raised line reaches $.ui.log on one printable line, and the file keeps its own break', async ($, on) => {
    refusingHistory(on, () => `refused at ${HOME}/x\n\tsecond line \u001b[2K`)
    const w = world(on, { ...(await signedOn([RUN])), [`switch.${DEBUG}`]: await signed(DEBUG, true, 5_000) })
    await start($)
    await queueRun($)
    await until(w, 'the file was written', () => w.files.has(LOG))
    const [line] = raised(w, SENT)
    expect(line).toContain('refused at ~/x second line ?[2K')
    expect(untimed(w.files.get(LOG))).toContain('refused at ~/x\n    \tsecond line \u001b[2K')
  })

  test('a start failure of a mod without a debug log is masked too', async ($, on) => {
    const w = world(on)
    w.refuseCommand = (name) => (name === 'mods-switches' ? DIRTY : undefined)
    await start($)
    const lines = raised(w, 'mods-switches: start failed:')
    expect(lines.length).toBe(1)
    expectClean(lines[0]!)
  })
})
