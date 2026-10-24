"""Runs the mod's own kit tests (hooks/tests) through `claude plugin test`, so the publish gate and CI run them (TRDD-O5LUMKPW, review M5).

publish.py runs only `pytest tests/` and is a canonical copy that is not edited here, so this test is
how hooks/tests reaches the pre-publish gate; CI's test matrix installs the claude CLI for it. The
mod is staged in a tmp dir holding only .claude-plugin/plugin.json and hooks/: `claude plugin test`
collects every *.test.ts under the folder it is given, and the repo root also holds the tutorial
examples' tests. The gitignored types folder is not needed to run the tests, only to type-check
them. The CLI runs with a fresh HOME and config dir, so no login is used and the developer's own
~/.claude is never touched.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SUMMARY_PASS = re.compile(r"^ *(\d+) pass$", re.MULTILINE)
SUMMARY_FAIL = re.compile(r"^ *(\d+) fail$", re.MULTILINE)


def test_the_mod_kit_tests_pass_under_claude_plugin_test(tmp_path: Path) -> None:
    """Stage plugin.json and hooks/, run `claude plugin test` there, and require a nonzero pass count and no failure."""
    claude = shutil.which("claude")
    if claude is None:
        pytest.fail("the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run hooks/tests")
    stage = tmp_path / "stage"
    (stage / ".claude-plugin").mkdir(parents=True)
    shutil.copy2(ROOT / ".claude-plugin/plugin.json", stage / ".claude-plugin/plugin.json")
    shutil.copytree(ROOT / "hooks", stage / "hooks")
    home = tmp_path / "home"
    (home / ".claude").mkdir(parents=True)
    # DISABLE_AUTOUPDATER: the CLI makes no update download during the run (a downloaded update
    # would apply only on the next launch, so the version under test is the installed one either way).
    env = {
        "PATH": os.environ["PATH"],
        "HOME": str(home),
        "CLAUDE_CONFIG_DIR": str(home / ".claude"),
        "DISABLE_AUTOUPDATER": "1",
    }
    result = subprocess.run(
        [claude, "plugin", "test"],
        cwd=stage,
        env=env,
        capture_output=True,
        text=True,
        timeout=600,
        check=False,
    )
    output = result.stdout + result.stderr
    passed = SUMMARY_PASS.search(output)
    failed = SUMMARY_FAIL.search(output)
    assert result.returncode == 0, output
    # A stage that collected nothing must not pass: require the summary and a nonzero pass count.
    assert passed is not None and failed is not None, output
    assert int(passed.group(1)) > 0, output
    assert int(failed.group(1)) == 0, output
