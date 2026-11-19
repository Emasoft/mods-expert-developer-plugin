"""Runs the mod's own kit tests (hooks/tests) through `claude plugin test`, so the publish gate and CI run them (TRDD-O5LUMKPW, review M5).

publish.py runs only `pytest tests/` (after one local addition, the no-copy fetch of TRDD-R2GILGKU, which adds no
other step), and it is otherwise a canonical copy that is not edited here, so this test is
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
_EXAMPLES = sorted(ROOT.glob("skills/*/examples/*/"))


def _run_plugin_test_once(stage: Path, tmp_path: Path, attempt: int) -> tuple[int, str]:
    """Run `claude plugin test` once. Return (pass_count, output). Raise AssertionError on real failure."""
    claude = shutil.which("claude")
    if claude is None:
        pytest.fail(
            "the claude CLI is not on PATH: install it (npm install -g @anthropic-ai/claude-code) to run the mod tests"
        )
    # A fresh home dir PER ATTEMPT (home-1, home-2, ...): the CLI writes config under HOME, so
    # reusing attempt 1's home would test a different environment than the fresh-HOME one the
    # module docstring promises — a pass on leftover state is not a clean pass (review M2).
    home = tmp_path / f"home-{attempt}"
    (home / ".claude").mkdir(parents=True, exist_ok=True)
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
        # 1200 s, not 900: under heavy machine load (LA >100 on 14 cores) the kit's per-test
        # 5000 ms default timeouts fire on scheduling latency, not on real hangs. 900 s was
        # enough at LA 18-89, but the kit re-runs the whole suite on retry and needs more room.
        # This bound covers every caller — the plugin's own tests AND the per-example-mod
        # tests below, which run the same CLI with the same load sensitivity. 1200 s still
        # leaves the 25-minute CI test shard room.
        timeout=1200,
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
    return int(passed.group(1)), output


# Max attempts for the kit test: the kit tests are deterministic in isolation but
# environmentally flaky under heavy machine load (per-test 5000 ms timeouts fire on
# scheduling latency, not on real hangs — measured 2026-11-11 at LA 151 on 14 cores).
# 3 attempts absorb a transient load spike without masking a real defect: a deterministic
# failure fails all 3 times.
_KIT_TEST_MAX_ATTEMPTS = 3


def _run_plugin_test(stage: Path, tmp_path: Path) -> int:
    """Run `claude plugin test` with retry. A real defect fails every attempt; a load-spike timeout does not."""
    outputs: list[str] = []
    for attempt in range(1, _KIT_TEST_MAX_ATTEMPTS + 1):
        try:
            pass_count, _ = _run_plugin_test_once(stage, tmp_path, attempt)
            return pass_count
        except (AssertionError, subprocess.TimeoutExpired) as exc:
            # TimeoutExpired is retried like a load-spike assertion: a hard subprocess timeout
            # under machine load is the same flake the retry exists for (review M1). Every
            # attempt's output is kept, so the final raise reports the whole history, not just
            # the last attempt (review M3).
            output = str(exc).strip() or f"(no output, {type(exc).__name__})"
            outputs.append(f"--- attempt {attempt}/{_KIT_TEST_MAX_ATTEMPTS}: {output}")
            if attempt < _KIT_TEST_MAX_ATTEMPTS:
                # Re-stage hooks/ before retry: a test that wrote files in the stage dir
                # leaves state a fresh run must not inherit. A failure here must surface as a
                # named error naming the cause, not an unrelated shutil traceback (review M4).
                try:
                    shutil.rmtree(stage / "hooks")
                    shutil.copytree(ROOT / "hooks", stage / "hooks")
                except OSError as stage_exc:
                    raise AssertionError(f"re-staging hooks/ for retry failed: {stage_exc}") from stage_exc
                print(f"  kit test attempt {attempt}/{_KIT_TEST_MAX_ATTEMPTS} failed, retrying: {output[:200]}")
            else:
                raise AssertionError(
                    f"kit test failed all {_KIT_TEST_MAX_ATTEMPTS} attempts.\n" + "\n".join(outputs)
                ) from exc
    return 0  # unreachable


def test_the_mod_kit_tests_pass_under_claude_plugin_test(tmp_path: Path) -> None:
    """Stage plugin.json and hooks/, run `claude plugin test` there, and require a nonzero pass count and no failure."""
    stage = tmp_path / "stage"
    (stage / ".claude-plugin").mkdir(parents=True)
    shutil.copy2(ROOT / ".claude-plugin/plugin.json", stage / ".claude-plugin/plugin.json")
    shutil.copytree(ROOT / "hooks", stage / "hooks")
    _run_plugin_test(stage, tmp_path)



def test_discovery_finds_every_example_mod() -> None:
    """Require the discovered example list to be the set of skills/*/examples/* mods holding a plugin.json, and at least 8."""
    discovered = _EXAMPLES
    marked = sorted(path.parent.parent for path in ROOT.glob("skills/*/examples/*/.claude-plugin/plugin.json"))
    assert len(discovered) >= 8, f"expected at least 8 example mods, discovery found {len(discovered)}: {discovered}"
    assert discovered == marked, f"discovered {discovered} but plugin.json marks {marked}"


@pytest.mark.parametrize(
    "example",
    _EXAMPLES,
    ids=lambda example: str(example.relative_to(ROOT)),
)
def test_each_example_mod_tests_pass_under_claude_plugin_test(example: Path, tmp_path: Path) -> None:
    """Copy one tutorial example mod to a stage, run `claude plugin test` there, and require a nonzero pass count and no failure."""
    stage = tmp_path / "stage"
    shutil.copytree(example, stage)
    _run_plugin_test(stage, tmp_path)
