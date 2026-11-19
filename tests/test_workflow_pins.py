"""Pin tests for the GitHub Actions workflows (TRDD-TR37CWQ7).

Every third-party action must be pinned to a full 40-hex commit SHA followed by a `# v...` comment naming the
release, and one action must use one SHA across all workflows, so a pin bump can never be applied to a single file.
"""

from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS = ROOT / ".github/workflows"
USES = re.compile(r"^\s*(?:-\s+)?uses:\s*(?P<action>[^@\s]+)@(?P<ref>\S+)(?P<rest>.*)$")
SHA = re.compile(r"[0-9a-f]{40}")
# TODO(TRDD-TR37CWQ7 c3): ci.yml-only actions deferred from c2 because their majors need their own review.
# Remove an entry when its pin lands; megalinter is still on the tag-only `@v8`.
KNOWN_UNPINNED = {"oxsecurity/megalinter"}


def _uses() -> list[tuple[str, str, str, str, int]]:
    """Return (file, action, ref, trailing text, line number) for every remote `uses:` in the workflows."""
    found = []
    for wf in sorted(WORKFLOWS.glob("*.yml")):
        for n, line in enumerate(wf.read_text().splitlines(), 1):
            m = USES.match(line)
            if m is None or m["action"].startswith("./") or m["action"].startswith("docker://"):
                continue
            found.append((wf.name, m["action"], m["ref"], m["rest"], n))
    return found


def test_workflows_use_at_least_one_remote_action() -> None:
    """The scan finds remote actions, so the pin assertions below cannot pass vacuously."""
    assert _uses()


def test_every_action_is_pinned_to_a_sha_with_a_version_comment() -> None:
    """Each remote `uses:` is `@<40-hex sha>` followed by a `# v...` comment."""
    bad = [
        f"{f}:{n} {a}@{r}{rest}"
        for f, a, r, rest, n in _uses()
        if a not in KNOWN_UNPINNED and not (SHA.fullmatch(r) and re.match(r"\s*#\s*v\d", rest))
    ]
    assert not bad, "unpinned or uncommented actions:\n" + "\n".join(bad)


def test_each_action_uses_one_sha_across_all_workflows() -> None:
    """The same action is never pinned to two different SHAs in different workflows."""
    shas: dict[str, set[str]] = {}
    for _f, a, r, _rest, _n in _uses():
        if SHA.fullmatch(r):
            shas.setdefault(a, set()).add(r)
    split = {a: sorted(s) for a, s in shas.items() if len(s) > 1}
    assert not split, f"actions pinned to several SHAs: {split}"


def test_no_run_step_interpolates_an_expression() -> None:
    """No `run:` script contains `${{`; expressions reach the shell only through `env:` variables. Scope: `run:` steps of workflow jobs only; composite actions and github-script `script:` inputs are not covered."""
    bad = []
    for wf in sorted(WORKFLOWS.glob("*.yml")):
        for job, spec in (yaml.safe_load(wf.read_text()).get("jobs") or {}).items():
            for i, step in enumerate(spec.get("steps") or []):
                if "${{" in str(step.get("run", "")):
                    bad.append(f"{wf.name} job {job!r} step {step.get('name', i)!r}")
    assert not bad, "expressions interpolated into run: scripts:\n" + "\n".join(bad)
