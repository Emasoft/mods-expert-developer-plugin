#!/usr/bin/env python3
"""Verify a mod plugin: Claude Code version, `claude plugin validate`, the house rules of
mods-expert-developer-plugin, `claude plugin test`, and a plain-language read of what the mod
can reach.

Usage (the mods-skill-to-mod skill substitutes the variable on both sides):
  CLAUDE_PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}" python3 -I \\
    "${CLAUDE_PLUGIN_ROOT}/skills/mods-skill-to-mod/scripts/verify_mod.py" <plugin-folder> [--update-readme] [--directory]

  --update-readme  write the validator's hooks:/calls: report into README.md between the
                   <!-- trust:start --> and <!-- trust:end --> markers
  --directory      also hold the plugin to the marketplace directory rules (README, LICENSE,
                   icon); without it those are listed as publish-readiness notes only

The house rules come from the PRRD of mods-expert-developer-plugin: no MCP server (G10), at least
one boolean switch in userConfig (G13) and a debug log written with `$.ui.log(text, { to: 'debug' })`
(G14). They are static checks: they show the switches and the log exist, not that every function
has its own switch or that every log line is masked. The plugin folder must be outside
CLAUDE_PLUGIN_ROOT, which is replaced on every plugin update, because the test run and the README
update write there.

Exit status 0 only when validation, the house rules and every test pass.

Adapted from skills/skill-to-mod/scripts/verify_mod.py of arm-pz/skill-to-mod (MIT, see NOTICE).
"""

import json
import os
import re
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
from _common import MIN_CLAUDE_CODE, claude_version, inside_plugin_root, plugin_root, require_same_install  # noqa: E402

require_same_install(__file__)

# The validator prints its static report as `  ❯ ./register.ts calls: $.ui.log, ...` (older releases used >).
LINE = re.compile(r"^\s*[>❯]\s+(\S+)\s+(hooks|calls|env reads|env writes|state reads|state writes|answers its own command|gating hook with \.catch|gating hook without \.catch):\s*(.*)$")
READY = re.compile(r"^\s*[>❯]\s+(.+?):\s+.*?\(([A-Z_]+)\)")
SOURCE_SUFFIXES = {".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts", ".cts", ".tsx"}
DEBUG_LOG_RE = re.compile(r"""\bto\s*:\s*['"]debug['"]""")

# What each call means for the person installing the mod.
CALL_NOTES = {
    "process.run": "starts programs on your machine, outside any sandbox",
    "process.spawn": "starts long-running programs on your machine, outside any sandbox",
    "http.fetch": "makes network requests: anything the mod can read could leave the machine",
    "fs.read": "reads files as you",
    "fs.write": "writes files as you",
    "env.get": "reads environment variables, which can hold API keys",
    "env.set": "changes environment variables",
    "mcp.call": "calls tools on your connected MCP servers",
    "mcp.connect": "connects an MCP server",
    "model.complete": "spends your plan or API usage on its own model calls",
    "model.fork": "spends your plan or API usage and sends the conversation to a model",
    "prompt.submit": "can start a turn as if you had typed it",
    "session.send": "sends messages to your other sessions",
    "session.messages": "reads the whole transcript",
    "tool.register": "adds a tool Claude can call",
    "agent.spawn": "starts subagents",
    "settings.read": "reads your settings files",
}
HOOK_NOTES = {
    "tool.check": "can approve or refuse tool calls before you are asked: review it line by line",
    "telemetry.log": "sees usage records",
    "plugin.register": "judges other mods as they load",
    "engine.create": "changes the API other mods receive",
    "session.append": "rewrites what the transcript stores",
}


def run(cmd, timeout=300):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except (OSError, subprocess.SubprocessError) as exc:
        return 127, "", str(exc)
    return p.returncode, p.stdout, p.stderr


def mod_sources(plugin):
    """The mod's own code files: everything but tests, bundled skills and installed packages."""
    skip = {"node_modules", "tests", "skills", ".git"}
    for f in sorted(plugin.rglob("*")):
        rel = f.relative_to(plugin)
        if f.is_file() and f.suffix in SOURCE_SUFFIXES and not (set(rel.parts[:-1]) & skip) and ".test." not in f.name:
            yield f


def house_rules(plugin, manifest, calls):
    """Problems against PRRD G10, G13 and G14 of mods-expert-developer-plugin, as text lines."""
    problems = []
    if manifest.get("mcpServers") or (plugin / ".mcp.json").is_file():
        problems.append("G10: the plugin declares an MCP server; mods made with this plugin use none. "
                        "Register the tool with $.tool.register, or ship a skill, a CLI or a script")
    for name in sorted(calls & {"mcp.call", "mcp.connect"}):
        problems.append(f"G10: the mod calls $.{name}; mods made with this plugin use no MCP server")
    config = manifest.get("userConfig") or {}
    if not any(isinstance(v, dict) and v.get("type") == "boolean" for v in config.values()):
        problems.append("G13: userConfig has no boolean option, so no function can be switched off and on in the settings")
    sources = list(mod_sources(plugin))
    if not any(DEBUG_LOG_RE.search(f.read_text(encoding="utf-8", errors="replace")) for f in sources):
        problems.append("G14: no debug log: no $.ui.log(text, { to: 'debug' }) call in the mod's code "
                        "(" + (", ".join(str(f.relative_to(plugin)) for f in sources) or "no code files found") + ")")
    return problems


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    plugin = Path(args[0]).expanduser().resolve()
    if not (plugin / ".claude-plugin" / "plugin.json").is_file():
        print(f"not a plugin folder (no .claude-plugin/plugin.json): {plugin}")
        return 2
    if inside_plugin_root(plugin):
        print(f"{plugin} is inside CLAUDE_PLUGIN_ROOT ({plugin_root()}), which is replaced on every plugin update; "
              "the test run and the README update write into the plugin folder, so copy it to a folder you name first")
        return 2
    manifest = json.loads((plugin / ".claude-plugin" / "plugin.json").read_text(encoding="utf-8"))

    version = claude_version()
    if version is None:
        print("claude is not on PATH, so nothing can be validated or tested here.")
        return 2
    if version < MIN_CLAUDE_CODE:
        print("Claude Code {} is too old: mods need {} or later. Update Claude Code first.".format(
            ".".join(map(str, version)), ".".join(map(str, MIN_CLAUDE_CODE))))
        return 2
    print("Claude Code " + ".".join(map(str, version)))

    # 1. validate
    cmd = ["claude", "plugin", "validate", str(plugin)]
    if "--directory" in argv:
        cmd += ["--profile", "directory"]
    code, out, err = run(cmd, 120)
    text = out + err
    findings = {}
    for line in text.splitlines():
        m = LINE.match(line)
        if m:
            findings.setdefault(m.group(2), []).append(f"{m.group(1)} {m.group(3)}")
    ok_validate = code == 0 and "Validation passed" in text
    print("\n[validate] " + ("passed" if ok_validate else "FAILED"))
    if not ok_validate:
        print(text.strip()[-2500:])
    for key in ("hooks", "calls", "env reads", "env writes", "state reads", "state writes"):
        for item in findings.get(key, []):
            print(f"  {key}: {item}")
    for item in findings.get("gating hook without .catch", []):
        print(f"  note: gating hook without .catch: {item} (if it fails, Claude Code skips it and the call proceeds; add a .catch if it must fail closed)")

    # 2. what the mod can reach
    calls = set()
    for item in findings.get("calls", []):
        for c in re.findall(r"\$\.([\w.]+)", item):
            calls.add(c)
    hooked = set()
    for item in findings.get("hooks", []):
        for h in re.split(r",\s*(?![^{]*\})", item.split(" ", 1)[1] if " " in item else item):
            hooked.add(re.sub(r"\{.*", "", h).strip())
    print("\n[reach]")
    notes = [f"  $.{c}: {CALL_NOTES[c]}" for c in sorted(calls) if c in CALL_NOTES]
    notes += [f"  hooks {h}: {HOOK_NOTES[h]}" for h in sorted(hooked) if h in HOOK_NOTES]
    if findings.get("env reads"):
        notes.append("  reads environment variables: " + "; ".join(findings["env reads"]))
    print("\n".join(notes) if notes else "  Nothing outside Claude Code: no files, processes, network, environment variables or other sessions.")

    # 3. house rules of mods-expert-developer-plugin (PRRD G10, G13, G14)
    problems = house_rules(plugin, manifest, calls)
    ok_rules = not problems
    print("\n[house rules] " + ("passed" if ok_rules else "FAILED"))
    for problem in problems:
        print("  " + problem)
    if ok_rules:
        print("  still to check by hand: every function has its own switch, and every debug line is masked")

    # 4. publish readiness (does not affect the result)
    ready = [m.groups() for line in text.splitlines() if not LINE.match(line) for m in [READY.match(line)] if m]
    if ready:
        print("\n[publish readiness] (not needed to run it)")
        for where, code_name in ready:
            print(f"  {code_name}: {where}")

    # 5. tests
    tests = sorted(plugin.rglob("*.test.ts")) + sorted(plugin.rglob("*.test.tsx"))
    ok_tests = True
    print()
    if not tests:
        ok_tests = False
        print("[test] no *.test.ts files  <- FAILED: add tests before you rely on this mod")
    else:
        code, out, err = run(["claude", "plugin", "test", str(plugin)], 300)
        text = out + err
        m_pass = re.search(r"(\d+) pass", text)
        m_fail = re.search(r"(\d+) fail", text)
        passed, failed = int(m_pass.group(1)) if m_pass else 0, int(m_fail.group(1)) if m_fail else 0
        ok_tests = code == 0 and failed == 0 and passed > 0
        print(f"[test] {passed} passed, {failed} failed" + ("" if ok_tests else "  <- FAILED"))
        if not ok_tests:
            print(text.strip()[-3000:])

    # 6. README trust block
    if "--update-readme" in argv:
        readme = plugin / "README.md"
        block = "```text\n" + "\n".join(f"{k}: {v}" for k in ("hooks", "calls") for v in findings.get(k, [])) + "\n```"
        if readme.is_file() and "<!-- trust:start -->" in readme.read_text(encoding="utf-8"):
            body = readme.read_text(encoding="utf-8")
            body = re.sub(r"<!-- trust:start -->.*?<!-- trust:end -->", lambda _m: "<!-- trust:start -->\n" + block + "\n<!-- trust:end -->", body, flags=re.S)
            readme.write_text(body, encoding="utf-8")
            print("\nREADME trust block updated.")
        else:
            print("\nREADME has no trust markers; left alone.")

    ok = ok_validate and ok_rules and ok_tests
    print("\nRESULT: " + ("PASS" if ok else "FAIL"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
