#!/usr/bin/env python3
"""Generate a Claude Code mod plugin from a skill plus a small JSON spec.

Usage (the mods-skill-to-mod skill substitutes the variable on both sides):
  CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" python3 -I \\
    "${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts/scaffold_mod.py" \\
    --skill <skill-folder> --spec <spec.json> --out <new-plugin-folder> [--force]

The skill is copied, untouched, into <out>/skills/<skill-name>/ so the plugin still
carries the full instructions. Around it the script writes:

  .claude-plugin/plugin.json   manifest, with a userConfig switch for every function
  hooks/hooks.json             points at the hooks module
  hooks/register.js            the mod: plain JavaScript, safe to edit by hand
  tests/<plugin>.test.ts       tests that run under `claude plugin test`
  README.md                    what it does, its switches, the debug log, a trust-surface block

The generated mod follows the PRRD of mods-expert-developer-plugin: every function can be
switched off and on (G13), a debug log can be switched on and masks secrets (G14), and it uses no
MCP server (G10). It never writes into the source skill folder or into CLAUDE_PLUGIN_ROOT, which
is replaced on every plugin update. Spec format: references/mod-spec.md of this skill. Covers
trigger-style mods (gate / prime / command); panes, bands, model calls and compaction handoffs
are written by hand (see the skill's SKILL.md).

Adapted from skills/skill-to-mod/scripts/scaffold_mod.py of arm-pz/skill-to-mod (MIT, see NOTICE).
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# The oldest python3 these scripts were run on is the one macOS ships, 3.9.6: stop with the reason on an older one.
if sys.version_info < (3, 9):
    print(f"error: the mods-skill-to-mod scripts need Python 3.9 or later; this python3 is {sys.version.split()[0]}.", file=sys.stderr)
    sys.exit(2)

# CLAUDE_PLUGIN_ROOT is the install folder of mods-expert-developer-plugin. SKILL.md exports it on the
# command line because the Bash tool does not carry it (chapter skill mods-doc-plugin-manifest-reference,
# "Where each variable resolves"). The sibling files are found from it alone, never from this file's own
# location, so an unset or wrong variable stops here with the reason instead of loading another copy.
sys.dont_write_bytecode = True  # the install folder is replaced on every update: no __pycache__ there
_ROOT = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
_SCRIPTS = Path(_ROOT, "skills", "mods-skill-to-mod", "scripts")
if not _ROOT or not (_SCRIPTS / "_common.py").is_file():
    _why = "is not set" if not _ROOT else f"is {_ROOT}, which holds no skills/mods-skill-to-mod/scripts/_common.py"
    print(f"error: CLAUDE_PLUGIN_ROOT {_why}. Run this script the way the mods-skill-to-mod skill shows, "
          'with CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" in front of python3.', file=sys.stderr)
    sys.exit(2)
sys.path.insert(0, str(_SCRIPTS))
from _common import (  # noqa: E402
    SKILL_NAME_RE,
    find_skill_md,
    inside_plugin_root,
    parse_frontmatter,
    plugin_name_problem,
    plugin_root,
    require_same_install,
)

require_same_install(__file__)

# The gate's switch is its own `gate` setting, so `mode` only says how a held command is handled.
MODES = ["ask", "block", "nudge"]
# A command entry with a secret appended; the generated debug test checks it never reaches the log.
TEST_SECRET = " --token=s3cr3t-value-0123"


def js(value):
    return json.dumps(value, ensure_ascii=False)


def js_escape(word):
    return re.sub(r"[.*+?^${}()|\[\]\\/]", lambda m: "\\" + m.group(0), word)


def command_regex(entry):
    """A command entry: words separated by whitespace, matched anywhere a command can start."""
    if entry.startswith("re:"):
        return entry[3:]
    words = entry.split()
    return r"(?:^|[\s;&|(])" + r"\s+".join(js_escape(w) for w in words) + r"(?![\w-])"


def prose_regex(entry):
    if entry.startswith("re:"):
        return entry[3:]
    words = entry.split()
    return r"(?<![\w-])" + r"\s+".join(js_escape(w) for w in words) + r"(?![\w-])"


def regex_list(sources, flags=""):
    # The array literal is built in steps so no line joins a RegExp( call to string concatenation.
    flag_arg = f", {js(flags)}" if flags else ""
    items = "".join(f"  new RegExp({js(s)}{flag_arg}),\n" for s in sources)
    return f"[\n{items}]"


# The Node program that compiles the spec's regular expressions. It reads them as JSON on stdin and never reads its
# command line, so the program text stays one fixed literal and no value of the spec is ever spliced into code.
NODE_COMPILE_CHECK = "const job = JSON.parse(require('fs').readFileSync(0, 'utf8')); for (const s of job.sources) new RegExp(s, job.flags)"


def check_regexes(sources, flags):
    """Compile each regex with Node, so a bad one fails here and not in a session."""
    try:
        r = subprocess.run(
            ["node", "-e", NODE_COMPILE_CHECK],
            input=json.dumps({"sources": sources, "flags": flags}),
            capture_output=True, text=True, timeout=20)
    except (OSError, subprocess.SubprocessError) as exc:
        # Fail fast: a regular expression that was never compiled would only fail inside a session.
        sys.exit(f"node could not run ({exc}); the scaffold test-compiles every regular expression with Node, so install Node.js first")
    if r.returncode != 0:
        lines = [ln for ln in r.stderr.splitlines() if "Error" in ln]
        sys.exit("a regular expression in the spec does not compile: " + (lines[0] if lines else r.stderr.strip()[:200]))


def first_literal(entries):
    for e in entries:
        if not e.startswith("re:"):
            return e
    return None


def command_name(spec, plugin):
    """The slash command's name, or None when the spec turns the command off."""
    command = spec.get("command", {})
    if command is False:
        return None
    # The spec is hand-written JSON: true, a number or a list here is a mistake to name, not a traceback from .get().
    if not isinstance(command, dict):
        sys.exit('spec.command must be an object such as {"name": "my-mod"}, or false to turn the command off')
    name = command.get("name", plugin)
    if not isinstance(name, str):
        sys.exit("spec.command.name must be a string")
    return name

def refuse_unreadable(error):
    """os.walk calls this for a folder it cannot list; a folder that is not listed is not checked for symlinks, so stop."""
    sys.exit(f"{error.filename} cannot be read, so it cannot be checked for symlinks ({error})")


def functions_of(spec):
    """The switchable functions, in the order the command lists them (PRRD G13)."""
    gate, prime = spec.get("gate"), spec.get("prime")
    names = []
    if gate:
        names.append("gate")
        if gate.get("staleOnEdit", True):
            names.append("stale")
        names.append("status")
    if prime:
        names.append("prime")
    names.append("debug")
    return names


# Each function's userConfig key and how register() reads it: on unless set false, except the debug log.
SWITCH_INIT = {
    "gate": "  active.gate = options.gate !== false",
    "stale": "  active.stale = options.staleOnEdit !== false",
    "status": "  active.status = options.statusLine !== false",
    "prime": "  active.prime = options.prime !== false",
    "debug": "  active.debug = options.debugLog === true",
}


# ---- templates -------------------------------------------------------------
# Raw strings: the JavaScript holds regular expressions whose backslashes must reach the file as written.

HEADER = r"""// Generated by the mods-skill-to-mod skill of mods-expert-developer-plugin (adapted from
// arm-pz/skill-to-mod) from the skill "__SKILL__". It is plain code: edit it freely.
//
// __SUMMARY__
//
// A reminder, not a security boundary: it reads text and fails open. The skill
// itself, bundled in skills/__SKILL__/, still does the real work.

const NAME = __NAME__
const SKILL = __SKILL_JS__

// Every function can be switched off and on. The plugin settings (userConfig) hold the
// defaults__SWITCH_HELP__.
const FUNCTIONS = __FUNCTIONS__
const active = {}
let snoozed = false

// Snoozing turns every function off for the session except the debug log, which has only its own switch.
function isOn(name) {
  return active[name] === true && (name === 'debug' || !snoozed)
}

function switchesText() {
  return 'Functions: ' + FUNCTIONS.map((name) => name + ' ' + (isOn(name) ? 'on' : 'off')).join(', ') + '.'
}

// The debug log, off by default: errors, warnings and decisions go to Claude Code's debug log only,
// never to the transcript (start Claude Code with --debug or --debug-file <path> to read it).
// Every line passes through redact() first, because a command line or a prompt can carry a secret,
// such as a token in an environment assignment or credentials in a git remote URL. Each secret is
// replaced by a label that names its kind, [REDACTED:<kind>], the style of the debug-log masker
// of mods-expert-developer-plugin (owner ruling of 2026-11-03, the secret-shield style); a kind
// that masker also finds keeps its name there. The patterns run in this order, a specific shape before
// a general one (sk-ant- before sk-).
// cspell:ignore glpat passw
const SECRETS = [
  [/\b(bearer)\s+[\w.~+\/=-]+/gi, '$1 [REDACTED:bearer-token]'],
  [/\b(basic)\s+[\w.~+\/=-]+/gi, '$1 [REDACTED:basic-credentials]'],
  [/\b([\w-]*(?:api[_-]?key|access[_-]?key|token|secret|passw(?:or)?d|pwd|credentials?|authorization)\s*[=:]\s*)("[^"]*"|'[^']*'|\S+)/gi, '$1[REDACTED:assignment]'],
  [/(--?(?:password|passwd|token|secret|api-key)\s+)("[^"]*"|'[^']*'|\S+)/gi, '$1[REDACTED:cli-password]'],
  [/(:\/\/)[^\s\/:@]+:[^\s\/@]+@/g, '$1[REDACTED:url-password]@'],
  [/(:\/\/)[^\s\/:@]{20,}@/g, '$1[REDACTED:url-password]@'],
  [/\bsk-ant-[\w-]{16,}/g, '[REDACTED:anthropic-key]'],
  [/\bsk-[\w-]{16,}/g, '[REDACTED:openai-key]'],
  [/\b(?:pk|rk)-[\w-]{16,}/g, '[REDACTED:api-key]'],
  [/\b(?:ghp|gho|ghu|ghs|ghr)_\w{20,}\b/g, '[REDACTED:github-token]'],
  [/\bgithub_pat_\w{20,}\b/g, '[REDACTED:github-token]'],
  [/\bglpat-[\w-]{20,}\b/g, '[REDACTED:gitlab-token]'],
  [/\bxox(?:a|b|p|r|s)-[\w-]{10,}\b/g, '[REDACTED:slack-token]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED:aws-access-key]'],
  [/\b[A-Fa-f0-9]{32,}\b/g, '[REDACTED:hex-key]'],
  [/\b(?=[\w+-]*\d)(?=[\w+-]*[A-Za-z])[\w+-]{40,}={0,2}/g, '[REDACTED:random-string]'],
]

function redact(text) {
  let out = String(text)
  for (const [pattern, replacement] of SECRETS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

async function debugLog($, level, text) {
  if (!isOn('debug')) {
    return
  }
  try {
    await $.ui.log(NAME + ' ' + level + ': ' + redact(text), { to: 'debug' })
  } catch {
    // A log line that cannot be written must not change what the mod does.
  }
}
"""

GATE_TOP = r"""
const DEFAULT_MODE = __MODE__
const DEFAULT_REQUIRED = __REQUIRED__

// What counts as shipping: a command line that puts work in front of others or into production.
const SHIP = __SHIP__
const MAX_HOLDS = __MAX_HOLDS__

// What has happened since the last edit. Module variables start over when the mod reloads.
const done = new Set()
let acknowledged = false
let holds = 0

function isShip(command) {
  return SHIP.some((re) => re.test(command))
}

function listRequired(options) {
  const raw = typeof options.required === 'string' ? options.required : DEFAULT_REQUIRED
  return raw.split(',').map((part) => part.trim()).filter((part) => part !== '')
}

// A skill reaches skill.prompt as `name`, or `plugin:name` for a plugin's skill.
function sameSkill(seen, wanted) {
  return seen === wanted || seen.endsWith(':' + wanted)
}

// The status line shows the checks still to run; it stays clear while the status function is off.
function showStatus($, text) {
  $.ui.status(isOn('status') ? text : undefined)
}
"""

PRIME_TOP = r"""
// Prompts that say the moment has come.
const PRIME = __PRIME__
"""

REGISTER_OPEN_GATE = r"""
export function register(on, options = {}) {
  const mode = typeof options.mode === 'string' ? options.mode : DEFAULT_MODE
  const required = listRequired(options)
__SWITCH_INIT__

  function outstanding() {
    return required.filter((name) => !done.has(name))
  }
"""

REGISTER_OPEN_PLAIN = r"""
export function register(on, options = {}) {
__SWITCH_INIT__
"""

COMMAND_REGISTER = r"""
  on('session.start', async ($, e, next) => {
    // The command is the session's switchboard; the `command` setting leaves it out entirely.
    if (options.command !== false) {
      await $.command.register({
        name: __CMD__,
        description: 'Show __NAME_TEXT__ state, switch one function with "<function> off|on", or snooze all with "off"',
        argumentHint: '[off|on] | <function> off|on',
        immediate: true,
      })
    }
    return next(e)
  }).catch(async ($, e, next) => {
    await debugLog($, 'error', 'registering the command failed (' + next.error.kind + ')')
    return next(e)
  })
"""

SKILL_TRACKER = r"""
  on('skill.prompt', async ($, e, next) => {
    for (const name of required) {
      if (sameSkill(e.skill, name)) {
        done.add(name)
        holds = 0
        await debugLog($, 'info', 'recorded a run of ' + name)
      }
    }
    showStatus($, outstanding().length === 0 ? undefined : NAME + ': ' + outstanding().join(', ') + ' still to run')
    return next(e)
  }).catch(async ($, e, next) => {
    await debugLog($, 'error', 'recording a skill run failed (' + next.error.kind + ')')
    return next(e)
  })
"""

STALE_ON_EDIT = r"""
  on('tool.call', { tool: ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'] }, async ($, e, next) => {
    const ran = await next(e)
    const changed = ran.deny === undefined && ran.isError !== true
    if (isOn('stale') && changed && (done.size > 0 || acknowledged)) {
      done.clear()
      acknowledged = false
      holds = 0
      showStatus($, NAME + ': checks are stale after edits (' + required.join(', ') + ')')
      await debugLog($, 'info', 'an edit made the checks stale')
    }
    return ran
  }).catch(async ($, e, next) => {
    // fail open: a reminder must never block an edit
    await debugLog($, 'error', 'the stale-on-edit hook failed (' + next.error.kind + '); the edit went on as it would without the mod')
    return next(e)
  })
"""

GATE_HOOK = r"""
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const command = String(e.command ?? '')
    if (!isOn('gate') || required.length === 0 || !isShip(command)) {
      return next(e)
    }
    const missing = outstanding()
    if (missing.length === 0 || acknowledged) {
      return next(e)
    }
    // Never trap the session: after a couple of holds, let the command through.
    if (holds >= MAX_HOLDS) {
      $.ui.toast(NAME + ': let it through after ' + MAX_HOLDS + ' holds')
      await debugLog($, 'warn', 'let a ship command through after ' + MAX_HOLDS + ' holds: ' + command)
      return next(e)
    }
    const instruction =
      NAME + ' held this command: ' + missing.join(', ') + ' has not run__SINCE__. ' +
      'Run ' + (missing.length === 1 ? 'that skill' : 'those skills') + ' on the current changes, fix what it finds, then retry. ' +
      'If a skill is not available, tell the user instead of retrying.'

    if (mode === 'nudge') {
      const ran = await next(e)
      if (ran.deny !== undefined) {
        return ran
      }
      await debugLog($, 'warn', 'a ship command ran before ' + missing.join(', ') + ': ' + command)
      return { ...ran, context: [...(ran.context ?? []), NAME + ': that ran before ' + missing.join(', ') + ' had run__SINCE__. Run ' + (missing.length === 1 ? 'it' : 'them') + ' now.'] }
    }

    if (mode === 'ask') {
      // A question nobody answers counts as "run the checks first".
      let answer = 'Run checks first'
      try {
        answer = await $.ui.ask(
          missing.join(', ') + ' has not run__SINCE__. Run this anyway? ' + command.slice(0, 120),
          ['Run checks first', 'Ship anyway'],
        )
      } catch {
        await debugLog($, 'warn', 'the question was dismissed or could not be asked, so it counts as "Run checks first"')
      }
      if (answer === 'Ship anyway') {
        acknowledged = true
        await debugLog($, 'info', 'shipping acknowledged by the user: ' + command)
        return next(e)
      }
    }

    holds += 1
    await debugLog($, 'warn', 'held a ship command (' + missing.join(', ') + ' has not run): ' + command)
    return { deny: instruction }
  }).catch(async ($, e, next) => {
    // fail open: if the guard breaks, the command runs as it would without it
    await debugLog($, 'error', 'the gate hook failed (' + next.error.kind + '); the command went on as it would without the mod')
    return next(e)
  })
"""

PRIME_HOOK = r"""
  on('prompt.submit', async ($, e, next) => {
    if (!isOn('prime')__PRIME_GUARD__ || !PRIME.some((re) => re.test(e.text))) {
      return next(e)
    }
    const line = __PRIME_LINE__
    await debugLog($, 'info', 'added one line of context to the prompt: ' + String(e.text).slice(0, 200))
    return next({ ...e, context: [...(e.context ?? []), line] })
  }).catch(async ($, e, next) => {
    // fail open: the prompt goes on unchanged
    await debugLog($, 'error', 'the prompt hint failed (' + next.error.kind + '); the prompt went on unchanged')
    return next(e)
  })
"""

COMMAND_HOOK = r"""
  on('command.run', { command: __CMD__ }, async ($, e) => {
    const words = String(e.args ?? '').trim().split(/\s+/).filter((word) => word !== '')
    if (words.length === 1 && (words[0] === 'off' || words[0] === 'on')) {
      snoozed = words[0] === 'off'
__ON_SNOOZE__      await debugLog($, 'info', snoozed ? 'snoozed' : 'resumed')
      return { text: snoozed ? NAME + ': snoozed. Run /' + __CMD__ + ' on to resume.' : NAME + ': back on.' }
    }
    if (words.length === 2 && FUNCTIONS.includes(words[0]) && (words[1] === 'off' || words[1] === 'on')) {
      active[words[0]] = words[1] === 'on'
__ON_SWITCH__      await debugLog($, 'info', words[0] + ' switched ' + words[1])
      return { text: NAME + ': ' + words[0] + ' is ' + words[1] + ' for this session.' }
    }
    if (words.length > 0) {
      return { text: 'Usage: /' + __CMD__ + ' [off|on], or /' + __CMD__ + ' <' + FUNCTIONS.join('|') + '> off|on' }
    }
__STATE__
  }).catch(async ($, e) => {
    await debugLog($, 'error', 'the command failed (' + e.command + ')')
    return { text: NAME + ': the command failed. Turn the debug log on to see why.' }
  })
"""

STATE_GATE = r"""    const left = outstanding()
    return {
      text:
        NAME + ' (' + mode + (snoozed ? ', snoozed' : '') + '): ' +
        (required.length - left.length) + ' of ' + required.length + ' checks run__SINCE__' +
        (left.length > 0 ? ', still to run: ' + left.join(', ') : '') +
        (acknowledged ? '. Shipping was acknowledged. ' : '. ') + switchesText(),
    }"""

STATE_PLAIN = r"""    return { text: NAME + (snoozed ? ' (snoozed)' : '') + ': nudges Claude toward the ' + SKILL + ' skill when a prompt matches. ' + switchesText() }"""


def fill(template, **kw):
    for k, v in kw.items():
        template = template.replace("__" + k + "__", v)
    return template


def build_register(spec, skill_name, plugin):
    gate, prime = spec.get("gate"), spec.get("prime")
    cmd = command_name(spec, plugin)
    since = " since the last edit" if (gate or {}).get("staleOnEdit", True) else " yet"
    functions = functions_of(spec)

    bits = []
    if gate:
        bits.append("gate: holds a ship command until the required skills have run" + since)
    if prime:
        bits.append("prime: adds one line of context when a prompt matches")
    if cmd:
        bits.append("/" + cmd + ": shows state, switches one function, snoozes with off")
    bits.append("debug: an opt-in debug log with secrets masked")
    switch_help = (", and /" + cmd + " <function> off|on changes one for this session") if cmd else ""
    out = fill(HEADER, SKILL=skill_name, NAME=js(plugin), SKILL_JS=js(skill_name), SUMMARY="Hooks: " + "; ".join(bits),
               SWITCH_HELP=switch_help, FUNCTIONS=js(functions))
    if gate:
        out += fill(GATE_TOP, MODE=js(gate["mode"]), REQUIRED=js(",".join(gate["required"])),
                    SHIP=regex_list([command_regex(m) for m in gate["match"]]), MAX_HOLDS=str(gate.get("maxHolds", 2)))
    if prime:
        out += fill(PRIME_TOP, PRIME=regex_list([prose_regex(m) for m in prime["match"]], "i"))
    switch_init = "\n".join(SWITCH_INIT[name] for name in functions)
    out += fill(REGISTER_OPEN_GATE if gate else REGISTER_OPEN_PLAIN, SWITCH_INIT=switch_init)
    if cmd:
        out += fill(COMMAND_REGISTER, CMD=js(cmd), NAME_TEXT=plugin)
    if gate:
        out += SKILL_TRACKER
        if gate.get("staleOnEdit", True):
            out += STALE_ON_EDIT
        out += fill(GATE_HOOK, SINCE=since)
    if prime:
        if gate:
            guard = " || required.length === 0 || outstanding().length === 0"
            default_line = "NAME + ': before shipping, run ' + outstanding().join(', ') + ' on the current changes.'"
        else:
            guard = ""
            default_line = "NAME + ': the ' + SKILL + ' skill applies here. Use it.'"
        line = js(prime["text"]) if prime.get("text") else default_line
        out += fill(PRIME_HOOK, PRIME_GUARD=guard, PRIME_LINE=line)
    if cmd:
        on_snooze = "      if (snoozed) {\n        $.ui.status(undefined)\n      }\n" if gate else ""
        on_switch = ("      if (words[0] === 'status' && words[1] === 'off') {\n        $.ui.status(undefined)\n      }\n"
                     if gate else "")
        body = fill(COMMAND_HOOK, STATE=STATE_GATE if gate else STATE_PLAIN, ON_SNOOZE=on_snooze, ON_SWITCH=on_switch)
        out += fill(body, CMD=js(cmd), SINCE=since)
    out += "}\n"
    return out


TEST_HEAD = r"""import { expect, test } from 'claude-code/testing'

// Stands in for Claude Code beneath the mod: every tool "runs" and answers ok, a question to the
// user (AskUserQuestion) is answered from `answer`, and the status and debug-log lines are kept.
function engine(on: any, answer: { value: string } = { value: 'Run checks first' }) {
  const seen = { logs: [] as string[], statuses: [] as unknown[], commands: [] as string[] }
  on('command.register', ($: any, e: any) => {
    seen.commands.push(String(e.name))
    return { value: undefined }
  })
  on('tool.call', ($: any, e: any) =>
    e.tool === 'AskUserQuestion'
      ? { result: { answers: { [e.questions[0].question]: answer.value } } }
      : { result: 'ok' },
  )
  on('skill.prompt', ($: any, e: any) => ({ text: e.text }))
  on('ui.status', ($: any, e: any) => {
    seen.statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.toast', () => ({ value: undefined }))
  on('ui.log', ($: any, e: any) => {
    seen.logs.push(String(e.text))
    return { value: undefined }
  })
  return seen
}

const FUNCTIONS = __FUNCTIONS__
const SECRET = __SECRET__
"""

TEST_COMMAND_SWITCH = r"""
test('the slash command is registered when a session starts', async ($: any, on: any) => {
  const seen = engine(on)
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(seen.commands).toEqual([__CMD__])
})

test('with the command switched off in the settings, no command is registered', { options: { command: false } }, async ($: any, on: any) => {
  const seen = engine(on)
  on('session.start', () => ({ cwd: '/work' }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(seen.commands).toEqual([])
})
"""

TEST_GATE = r"""
const SHIP = __SHIP_EXAMPLE__
const REQUIRED = __REQUIRED_LIST__
const CHECK = REQUIRED[0]

test('block: a ship command is refused until the required skill has run', { options: { mode: 'block', required: REQUIRED.join(',') } }, async ($: any, on: any) => {
  engine(on)
  const held = await $.tool.call({ tool: 'Bash', command: SHIP })
  expect(held.deny).toMatch(new RegExp(CHECK))

  for (const skill of REQUIRED) await $.skill.prompt({ skill, text: 'checks' })
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})

test('block: a command that does not ship is never held', { options: { mode: 'block' } }, async ($: any, on: any) => {
  engine(on)
  expect(await $.tool.call({ tool: 'Bash', command: 'echo hello && ls' })).toEqual({ result: 'ok' })
})

test('a plugin skill name counts as the check', { options: { mode: 'block', required: CHECK } }, async ($: any, on: any) => {
  engine(on)
  await $.skill.prompt({ skill: 'some-plugin:' + CHECK, text: 'checks' })
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})

test('after the holds are used up the command is let through, so a missing skill cannot trap the session', { options: { mode: 'block' } }, async ($: any, on: any) => {
  engine(on)
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})

test('ask: "Ship anyway" lets it through', { options: { mode: 'ask' } }, async ($: any, on: any) => {
  engine(on, { value: 'Ship anyway' })
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})

test('ask: "Run checks first" refuses with an instruction Claude can act on', { options: { mode: 'ask' } }, async ($: any, on: any) => {
  engine(on, { value: 'Run checks first' })
  const held = await $.tool.call({ tool: 'Bash', command: SHIP })
  expect(held.deny).toMatch(/Run (that skill|those skills)/)
})

test('nudge: the command runs and Claude is reminded afterwards', { options: { mode: 'nudge' } }, async ($: any, on: any) => {
  engine(on)
  const ran = await $.tool.call({ tool: 'Bash', command: SHIP })
  expect(ran.result).toBe('ok')
  expect(ran.context[0]).toMatch(new RegExp(CHECK))
})

test('the gate switched off in the settings holds nothing', { options: { mode: 'block', gate: false } }, async ($: any, on: any) => {
  engine(on)
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})

test('the status line names the checks still to run', { options: { mode: 'block', required: REQUIRED.join(',') } }, async ($: any, on: any) => {
  const seen = engine(on)
  await $.skill.prompt({ skill: 'unrelated-skill', text: 'x' })
  expect(String(seen.statuses[seen.statuses.length - 1])).toMatch(new RegExp(CHECK))
})

test('with the status line switched off, it stays clear', { options: { mode: 'block', statusLine: false } }, async ($: any, on: any) => {
  const seen = engine(on)
  await $.skill.prompt({ skill: 'unrelated-skill', text: 'x' })
  expect(seen.statuses.length).toBeGreaterThan(0)
  expect(seen.statuses.every((text) => text === undefined)).toBe(true)
})

test('the debug log is off by default', { options: { mode: 'block' } }, async ($: any, on: any) => {
  const seen = engine(on)
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
  expect(seen.logs).toEqual([])
})

test('with the debug log on, a held command is logged with its secret masked', { options: { mode: 'block', debugLog: true } }, async ($: any, on: any) => {
  const seen = engine(on)
  expect((await $.tool.call({ tool: 'Bash', command: SHIP + SECRET })).deny).toBeDefined()
  expect(seen.logs.some((line) => line.includes('held'))).toBe(true)
  expect(seen.logs.join('\n')).not.toMatch(/s3cr3t/)
  expect(seen.logs.join('\n')).toMatch(/--token=\[REDACTED:assignment\]/)
})
"""

TEST_STALE = r"""
test('an edit after the checks makes them stale', { options: { mode: 'block', required: REQUIRED.join(',') } }, async ($: any, on: any) => {
  engine(on)
  for (const skill of REQUIRED) await $.skill.prompt({ skill, text: 'checks' })
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })

  await $.tool.call({ tool: 'Edit', file_path: 'src/app.ts', old_string: 'a', new_string: 'b' })
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
})

test('with stale-on-edit switched off, an edit leaves the checks standing', { options: { mode: 'block', required: REQUIRED.join(','), staleOnEdit: false } }, async ($: any, on: any) => {
  engine(on)
  for (const skill of REQUIRED) await $.skill.prompt({ skill, text: 'checks' })
  await $.tool.call({ tool: 'Edit', file_path: 'src/app.ts', old_string: 'a', new_string: 'b' })
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })
})
"""

TEST_GATE_COMMAND = r"""
const CMD = __CMD__

test('the command snoozes and resumes it', { options: { mode: 'block' } }, async ($: any, on: any) => {
  engine(on)
  const off = await $.command.run({ command: CMD, args: 'off' })
  expect(off.text).toMatch(/snoozed/)
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })

  await $.command.run({ command: CMD, args: 'on' })
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
})

test('the command switches the gate off and on for the session', { options: { mode: 'block' } }, async ($: any, on: any) => {
  engine(on)
  expect((await $.command.run({ command: CMD, args: 'gate off' })).text).toMatch(/gate is off/)
  expect(await $.tool.call({ tool: 'Bash', command: SHIP })).toEqual({ result: 'ok' })

  await $.command.run({ command: CMD, args: 'gate on' })
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
})

test('the command switches the debug log on for the session', { options: { mode: 'block' } }, async ($: any, on: any) => {
  const seen = engine(on)
  await $.command.run({ command: CMD, args: 'debug on' })
  expect((await $.tool.call({ tool: 'Bash', command: SHIP })).deny).toBeDefined()
  expect(seen.logs.some((line) => line.includes('held'))).toBe(true)
})

test('the command lists every function and whether it is on', { options: { mode: 'block' } }, async ($: any, on: any) => {
  engine(on)
  const state = await $.command.run({ command: CMD, args: '' })
  for (const name of FUNCTIONS) expect(state.text).toMatch(new RegExp(`${name} (on|off)`))
})
"""

TEST_PRIME = r"""
const PRIME_EXAMPLE = __PRIME_EXAMPLE__

function capturePrompt(on: any) {
  const box: { event?: any } = {}
  on('prompt.submit', ($: any, e: any) => {
    box.event = e
    return { text: e.text }
  })
  return box
}

test('a matching prompt gets one line of context', __PRIME_OPTIONS__async ($: any, on: any) => {
  engine(on)
  const submitted = capturePrompt(on)
  await $.prompt.submit({ text: 'ok, ' + PRIME_EXAMPLE + ' now' })
  expect(submitted.event.context[0]).toMatch(__PRIME_EXPECT__)
})

test('an unrelated prompt is left alone', __PRIME_OPTIONS__async ($: any, on: any) => {
  engine(on)
  const submitted = capturePrompt(on)
  await $.prompt.submit({ text: 'please rename the heading in the readme' })
  expect(submitted.event.context).toBeUndefined()
})

test('with the prompt hint switched off, a matching prompt is left alone', __PRIME_OFF_OPTIONS__async ($: any, on: any) => {
  engine(on)
  const submitted = capturePrompt(on)
  await $.prompt.submit({ text: 'ok, ' + PRIME_EXAMPLE + ' now' })
  expect(submitted.event.context).toBeUndefined()
})

test('the prompt hint writes no debug line by default', __PRIME_OPTIONS__async ($: any, on: any) => {
  const seen = engine(on)
  capturePrompt(on)
  await $.prompt.submit({ text: 'ok, ' + PRIME_EXAMPLE + ' now' })
  expect(seen.logs).toEqual([])
})

test('with the debug log on, the prompt hint is logged with its secret masked', __PRIME_DEBUG_OPTIONS__async ($: any, on: any) => {
  const seen = engine(on)
  capturePrompt(on)
  await $.prompt.submit({ text: 'ok, ' + PRIME_EXAMPLE + ' now' + SECRET })
  expect(seen.logs.some((line) => line.includes('context'))).toBe(true)
  expect(seen.logs.join('\n')).not.toMatch(/s3cr3t/)
})
"""

TEST_PLAIN_COMMAND = r"""
const CMD = __CMD__

test('the command snoozes the nudge', async ($: any, on: any) => {
  engine(on)
  const off = await $.command.run({ command: CMD, args: 'off' })
  expect(off.text).toMatch(/snoozed/)
})

test('the command switches the prompt hint off for the session', async ($: any, on: any) => {
  engine(on)
  const submitted = capturePrompt(on)
  expect((await $.command.run({ command: CMD, args: 'prime off' })).text).toMatch(/prime is off/)
  await $.prompt.submit({ text: 'ok, ' + PRIME_EXAMPLE + ' now' })
  expect(submitted.event.context).toBeUndefined()
})

test('the command lists every function and whether it is on', async ($: any, on: any) => {
  engine(on)
  const state = await $.command.run({ command: CMD, args: '' })
  for (const name of FUNCTIONS) expect(state.text).toMatch(new RegExp(`${name} (on|off)`))
})
"""


def options_arg(options):
    """The options argument of a generated test, or nothing when it has no options."""
    return "{ options: " + js(options) + " }, " if options else ""


def build_tests(spec, skill_name, plugin):
    gate, prime = spec.get("gate"), spec.get("prime")
    cmd = command_name(spec, plugin)
    out = fill(TEST_HEAD, FUNCTIONS=js(functions_of(spec)), SECRET=js(TEST_SECRET))
    if cmd:
        out += fill(TEST_COMMAND_SWITCH, CMD=js(cmd))
    if gate:
        example = gate.get("example") or first_literal(gate["match"])
        out += fill(TEST_GATE, SHIP_EXAMPLE=js(example), REQUIRED_LIST=js(gate["required"]))
        if gate.get("staleOnEdit", True):
            out += TEST_STALE
        if cmd:
            out += fill(TEST_GATE_COMMAND, CMD=js(cmd))
    if prime:
        example = prime.get("example") or first_literal(prime["match"])
        base = {"mode": "block"} if gate else {}
        if gate:
            expect = "/" + re.escape(gate["required"][0]) + "/"
        else:
            expect = "/" + re.escape(prime["text"][:20]) + "/" if prime.get("text") else "/" + re.escape(skill_name) + "/"
        out += fill(TEST_PRIME, PRIME_EXAMPLE=js(example), PRIME_EXPECT=expect, PRIME_OPTIONS=options_arg(base),
                    PRIME_OFF_OPTIONS=options_arg({**base, "prime": False}),
                    PRIME_DEBUG_OPTIONS=options_arg({**base, "debugLog": True}))
        if cmd and not gate:
            out += fill(TEST_PLAIN_COMMAND, CMD=js(cmd))
    return out


def build_manifest(spec, plugin, description):
    manifest = {"name": plugin, "version": spec.get("version", "0.1.0"), "description": description}
    if spec.get("author"):
        manifest["author"] = {"name": spec["author"]}
    manifest["keywords"] = ["mods"] + spec.get("keywords", [])
    config = {}
    gate, prime = spec.get("gate"), spec.get("prime")
    if gate:
        config["gate"] = {
            "type": "boolean", "title": "Gate",
            "description": "Hold a ship command until the required skills have run. Off: ship commands are never held.",
            "default": True,
        }
        config["mode"] = {
            "type": "string", "title": "Gate mode",
            "description": "ask: hold a ship command and ask whether to run the checks first. block: refuse until the checks have run. nudge: let it run and remind Claude afterwards.",
            "default": gate["mode"], "options": MODES,
        }
        config["required"] = {
            "type": "string", "title": "Required check skills",
            "description": "Comma-separated names of the skills that must have run before a ship command. All of them must have run.",
            "default": ",".join(gate["required"]),
        }
        if gate.get("staleOnEdit", True):
            config["staleOnEdit"] = {
                "type": "boolean", "title": "Stale after edits",
                "description": "A successful edit clears the checks that already ran, so they must run again before shipping.",
                "default": True,
            }
        config["statusLine"] = {
            "type": "boolean", "title": "Status line",
            "description": "Show the checks still to run in the status line.",
            "default": True,
        }
    if prime:
        config["prime"] = {
            "type": "boolean", "title": "Prompt hint",
            "description": "Add one line of context naming the skill when a prompt matches.",
            "default": True,
        }
    cmd = command_name(spec, plugin)
    if cmd:
        config["command"] = {
            "type": "boolean", "title": "Slash command",
            "description": f"Register /{cmd}, which shows the state and switches the functions for the session.",
            "default": True,
        }
    config["debugLog"] = {
        "type": "boolean", "title": "Debug log",
        "description": "Write errors, warnings and decisions to Claude Code's debug log (start Claude Code with --debug to read it). Secrets are masked first.",
        "default": False,
    }
    manifest["userConfig"] = config
    return manifest


README = """# __PLUGIN__

__DESCRIPTION__

This plugin is a Claude Code **mod** (needs Claude Code 2.1.287 or later). It bundles the
`__SKILL__` skill, unchanged, in `skills/__SKILL__/`, and adds code that runs inside Claude Code
to trigger it at the right moment. It was generated by the `mods-skill-to-mod` skill of
mods-expert-developer-plugin, and it uses no MCP server.

## What it does

__BEHAVIOUR__

## Switches

Each function can be switched off and on. Its default is a plugin setting
(`/plugin configure __PLUGIN__@<marketplace>`, or its row in `/config`), which stays until you
change it:

| Function | Setting | Default | What it does |
| --- | --- | --- | --- |
__SWITCH_ROWS__
__SESSION_SWITCHES__
## Debug log

With the `debugLog` setting on, the mod writes its errors, warnings and decisions to Claude Code's
debug log, never to the transcript. Start Claude Code with `--debug`, or `--debug-file <path>`, to
read it, and filter the lines for `__PLUGIN__`. Every line is masked first: values of keys that
name a secret, Bearer and Basic credentials, credentials in URLs, well-known token prefixes and
long random-looking strings are each replaced by a label that names the kind of secret, such as
`[REDACTED:assignment]` or `[REDACTED:github-token]`. The masking matches patterns, so treat the
log as sensitive anyway.

## Try it

```
claude --plugin-dir ./__PLUGIN__
```

Run `/plugin` and look for "1 mod active". To share it, list it in a marketplace and install
with `/plugin install __PLUGIN__@<marketplace>`.

## Trust surface

Mods are not sandboxed: they run with your permissions inside Claude Code. This block is the
report from `claude plugin validate`, refreshed by the verify step of the `mods-skill-to-mod`
skill (`verify_mod.py <this folder> --update-readme`). Read the `calls:` line before you install.

<!-- trust:start -->
(run the verify step of the mods-skill-to-mod skill with --update-readme to fill this in)
<!-- trust:end -->

## Tests

```
claude plugin test ./__PLUGIN__
```

## Licence

Choose one before publishing and add a LICENSE file or a `license` field in `plugin.json`.
"""

SWITCH_ROWS = {
    "gate": "| gate | `gate` | on | holds a ship command until the required skills have run |",
    "stale": "| stale | `staleOnEdit` | on | a successful edit makes the checks that already ran stale |",
    "status": "| status | `statusLine` | on | shows the checks still to run in the status line |",
    "prime": "| prime | `prime` | on | adds one line of context when a prompt matches |",
    "debug": "| debug | `debugLog` | off | writes the debug log described below |",
}


def behaviour(spec, cmd):
    lines = []
    gate, prime = spec.get("gate"), spec.get("prime")
    if gate:
        lines.append("- **Gate.** A Bash command that matches one of the ship patterns is held until the required skills "
                     f"({', '.join('`' + s + '`' for s in gate['required'])}) have run"
                     + (" since the last edit" if gate.get("staleOnEdit", True) else "") + ". "
                     "The `mode` setting says how: `ask`, `block` or `nudge`. After " + str(gate.get("maxHolds", 2))
                     + " holds it lets the command through, so a missing skill can never trap a session.")
    if prime:
        lines.append("- **Prime.** When a prompt matches, one line of context tells Claude which skill applies.")
    if cmd:
        lines.append(f"- **/{cmd}** shows the state and switches the functions listed below.")
    lines.append("- It reads the text of commands and prompts, so it is a reminder, not a security control. It fails open.")
    return "\n".join(lines)


def session_switches(spec, cmd):
    if not cmd:
        return ""
    return (f"\nFor this session only: `/{cmd} <function> off` and `/{cmd} <function> on` switch one function, "
            f"`/{cmd} off` snoozes every function except the debug log, `/{cmd} on` resumes, and `/{cmd}` "
            "lists each function and whether it is on.\n")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--skill", required=True, help="folder holding SKILL.md")
    ap.add_argument("--spec", required=True, help="mod spec JSON (see references/mod-spec.md of this skill)")
    ap.add_argument("--out", required=True, help="new plugin folder to create, in a folder the user named")
    ap.add_argument("--force", action="store_true", help="write into an existing, non-empty folder")
    a = ap.parse_args()

    skill_md = find_skill_md(a.skill)
    if skill_md is None:
        sys.exit("no SKILL.md in " + a.skill)
    src = skill_md.parent
    fm, _, problems = parse_frontmatter(skill_md.read_text(encoding="utf-8", errors="replace"))
    skill_name = fm.get("name") or src.name
    if problems or not fm.get("name"):
        sys.exit("the skill's frontmatter needs fixing first: " + "; ".join(problems or ["no name"]))

    # The name comes from the frontmatter of an untrusted skill and becomes a folder under --out and text in the
    # generated code, so only a plain name may pass: a path would leave the folder, and a line break would move the rest
    # of the name out of a comment and into the code.
    if not SKILL_NAME_RE.fullmatch(skill_name):
        sys.exit(f"the skill name {skill_name!r} in SKILL.md: use lowercase letters, digits and hyphens, 1 to 64 characters, first character a letter or digit")
    # A symlink would be copied as the file or folder it points at (copytree copies what a link points at), so a downloaded
    # skill could pull a private folder of the user into a plugin meant for publishing: refuse before anything is written.
    for dirpath, dirnames, filenames in os.walk(src, onerror=refuse_unreadable):  # a linked folder is listed in dirnames and not entered
        for entry in dirnames + filenames:
            link = os.path.join(dirpath, entry)
            if os.path.islink(link):
                sys.exit(f"{link} is a symlink: the skill folder must hold no symlinks, because the copy would take in what they point at")

    spec = json.loads(Path(a.spec).read_text(encoding="utf-8"))
    plugin = spec.get("plugin") or skill_name + "-mod"
    bad = plugin_name_problem(plugin)
    if bad:
        sys.exit(f"plugin name '{plugin}': {bad}")
    if not spec.get("gate") and not spec.get("prime"):
        sys.exit("the spec needs at least a gate or a prime section; for anything else, hand-write the mod (see SKILL.md of this skill)")
    if "mcpServers" in spec or "mcp" in spec:
        sys.exit("the spec asks for an MCP server; mods made with this plugin use none (PRRD G10): register a tool with $.tool.register instead")
    gate, prime = spec.get("gate"), spec.get("prime")
    if gate:
        gate.setdefault("required", [skill_name])
        gate.setdefault("mode", "ask")
        if gate["mode"] == "off":
            sys.exit("gate.mode 'off' is gone: the gate has its own switch, the gate setting; use ask, block or nudge")
        if gate["mode"] not in MODES:
            sys.exit("gate.mode must be one of " + ", ".join(MODES))
        if not gate.get("match"):
            sys.exit("gate.match needs at least one command, such as \"git push\"")
        if not (gate.get("example") or first_literal(gate["match"])):
            sys.exit("gate.match is all regular expressions: add gate.example, a command that matches")
        check_regexes([command_regex(m) for m in gate["match"]], "")
    if prime:
        if not prime.get("match"):
            sys.exit("prime.match needs at least one phrase")
        if not (prime.get("example") or first_literal(prime["match"])):
            sys.exit("prime.match is all regular expressions: add prime.example, a phrase that matches")
        check_regexes([prose_regex(m) for m in prime["match"]], "i")

    cmd = command_name(spec, plugin)
    # The command name is pasted raw into generated text and into the README, so it gets the same rule as the skill name.
    # None means the spec turns the command off.
    if cmd is not None and not SKILL_NAME_RE.fullmatch(cmd):
        sys.exit(f"the command name {cmd!r} in the spec: use lowercase letters, digits and hyphens, 1 to 64 characters, first character a letter or digit")
    if cmd and (cmd == skill_name):
        sys.exit(f"command '{cmd}' would collide with the skill's own /{skill_name}; choose another name")
    description = spec.get("description") or f"Mod for the {skill_name} skill: triggers it at the right moment."

    out = Path(a.out).expanduser()
    if inside_plugin_root(out):
        sys.exit(f"--out {out} is inside CLAUDE_PLUGIN_ROOT ({plugin_root()}), which is replaced on every plugin update; choose a folder the user named")
    if out.resolve() == src.resolve() or src.resolve() in out.resolve().parents:
        sys.exit("--out must not be inside the source skill folder")
    if out.exists() and any(out.iterdir()) and not a.force:
        sys.exit(f"{out} already exists and is not empty (use --force to write into it)")

    (out / ".claude-plugin").mkdir(parents=True, exist_ok=True)
    (out / "hooks").mkdir(exist_ok=True)
    (out / "tests").mkdir(exist_ok=True)
    dest_skill = out / "skills" / skill_name
    if dest_skill.exists():
        # Only with --force: the copy from an earlier run is replaced by a fresh copy of the source skill.
        shutil.rmtree(dest_skill)
    shutil.copytree(src, dest_skill, ignore=shutil.ignore_patterns(".git", "node_modules", "__pycache__", ".DS_Store"))

    functions = functions_of(spec)
    (out / ".claude-plugin" / "plugin.json").write_text(json.dumps(build_manifest(spec, plugin, description), indent=2) + "\n", encoding="utf-8")
    (out / "hooks" / "hooks.json").write_text(json.dumps({"description": f"{plugin}: triggers the {skill_name} skill at the right moment.", "modules": ["./register.js"]}, indent=2) + "\n", encoding="utf-8")
    (out / "hooks" / "register.js").write_text(build_register(spec, skill_name, plugin), encoding="utf-8")
    (out / "tests" / f"{plugin}.test.ts").write_text(build_tests(spec, skill_name, plugin), encoding="utf-8")
    rows = [SWITCH_ROWS[name] for name in functions]
    if cmd:
        rows.append(f"| /{cmd} | `command` | on | registers the slash command; settings only |")
    readme = fill(README, PLUGIN=plugin, DESCRIPTION=description, SKILL=skill_name, BEHAVIOUR=behaviour(spec, cmd),
                  SWITCH_ROWS="\n".join(rows), SESSION_SWITCHES=session_switches(spec, cmd))
    (out / "README.md").write_text(readme, encoding="utf-8")

    # The hint names CLAUDE_PLUGIN_ROOT as the skill substituted it, never resolved: the allowed-tools grant of
    # SKILL.md is matched against the command text, so a resolved symlink in the path would no longer match it.
    named = os.environ["CLAUDE_PLUGIN_ROOT"]
    verify = named + "/skills/mods-skill-to-mod/scripts/verify_mod.py"
    print(f"wrote {out}")
    print(f"  skill copied to skills/{skill_name}/ (original untouched)")
    print("  switches: " + ", ".join(functions) + " (debug is off by default)")
    print(f'  next: CLAUDE_PLUGIN_ROOT="{named}" python3 -I "{verify}" "{out.resolve()}" --update-readme')


if __name__ == "__main__":
    main()
