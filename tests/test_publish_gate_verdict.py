"""The release gate must tell a validator ABORT from a finding (TRDD-UD8EC4FK).

The defect: CPV's GitHub-integrity check ABORTS the run before any validation
happens, and that abort's exit code lands INSIDE CPV's 0..4 verdict range --
the observed run exits 2. The gate used to map the exit code straight to a
severity name, so it printed "BLOCKED: MAJOR issues found" when NOTHING had
been validated. The refusal was correct; the DIAGNOSIS was a lie, and it sent
the next person hunting for a MAJOR finding that did not exist.

So the gate must not trust the exit code on its own. It must establish that
the validator PRODUCED A VERDICT, and it must establish that from a capture of
BOTH stdout AND stderr -- because the two cases carry their marker on
DIFFERENT streams: the completed run's SUMMARY line is on stdout, and the
observed abort's heading is on stderr.

Every test below asserts the NEGATIVE outcome. A test that only exercised the
passing path would prove nothing about the defect: the bug is a REFUSAL that
carries the wrong reason, and a passing-path test cannot see it.
"""

import contextlib
import importlib.util
import io
import pathlib
import subprocess
import sys

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]


def _load_publish():
    """Import scripts/publish.py as a module, without executing the CLI."""
    spec = importlib.util.spec_from_file_location(
        "_publish_under_test", _REPO_ROOT / "scripts" / "publish.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


publish = _load_publish()


def _run_gate_verdict(returncode, stdout="", stderr=""):
    """Run the gate's validator reporting and return (exit_status, console)."""
    proc = subprocess.CompletedProcess(
        args=["uvx"], returncode=returncode, stdout=stdout, stderr=stderr)
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        status = publish._emit_cpv_result(proc)
    return status, buffer.getvalue()


def test_abort_inside_the_verdict_range_is_not_reported_as_a_finding():
    """An abort exiting 2 must not be labelled MAJOR - that is the defect."""
    status, console = _run_gate_verdict(
        2, stderr="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1, "an abort must still block the release"
    assert "MAJOR" not in console, (
        f"the abort was mislabelled as a MAJOR finding:\n{console}")
    assert "could not run" in console, (
        f"the abort was not reported as an abort:\n{console}")


def test_abort_carrying_the_token_on_stdout_is_also_an_abort():
    """The abort token is searched in BOTH streams, not just stderr."""
    status, console = _run_gate_verdict(
        2, stdout="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1
    assert "MAJOR" not in console
    assert "could not run" in console


def test_exit_zero_carrying_the_abort_token_is_not_a_pass():
    """A validator exiting 0 while carrying the abort token must NOT pass.

    This is the case a fix that checks only the exit code would let through:
    the code says 0, so the gate would print "Validation passed" and release.
    """
    status, console = _run_gate_verdict(
        0, stdout="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1, "an abort must not be read as a pass"
    assert "Validation passed" not in console, (
        f"an aborted run was reported as a pass:\n{console}")


def test_a_severity_shaped_code_with_no_verdict_line_is_refused():
    """Exit 2 with no SUMMARY in EITHER stream is not a finding either.

    The exit code is INSIDE the verdict range but no verdict was produced, so
    the run is refused on that ground rather than accepted on the code.
    """
    status, console = _run_gate_verdict(2, stdout="some output\n")
    assert status == 1, "a run with no verdict must be refused"
    assert "MAJOR" not in console, (
        f"a run with no verdict was labelled with a severity:\n{console}")
    assert "no verdict" in console


def test_exit_zero_with_no_verdict_line_is_refused():
    """Exit 0 without a SUMMARY means nothing was validated, so refuse."""
    status, console = _run_gate_verdict(0, stdout="")
    assert status == 1, "a run with no verdict must be refused"
    assert "Validation passed" not in console


def test_a_real_finding_is_still_labelled_with_its_severity():
    """The fix must not break the ordinary case: a finding keeps its name."""
    status, console = _run_gate_verdict(
        2, stdout="SUMMARY: CRITICAL=0 MAJOR=1 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1
    assert "BLOCKED: MAJOR issues found" in console


def test_a_clean_run_with_a_verdict_passes():
    """The ordinary passing case still passes, and says so."""
    status, console = _run_gate_verdict(
        0, stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 0
    assert "Validation passed" in console


def test_the_validator_output_is_re_emitted_before_the_verdict():
    """The capture must not hide the operator's evidence.

    The gate used to let the validator's output stream straight to the
    console; capturing it without re-emitting it would give the operator an
    empty console and no way to check the gate's conclusion. The re-emit
    happens BEFORE the verdict, so the evidence sits above the conclusion.
    """
    stdout = "SUMMARY: CRITICAL=0 MAJOR=1 MINOR=0 NIT=0 WARNING=0\n"
    stderr = "[cpv-phase] START validate_manifest\n"
    _status, console = _run_gate_verdict(2, stdout=stdout, stderr=stderr)

    assert stdout in console, "the validator's stdout was swallowed"
    assert stderr in console, "the validator's stderr was swallowed"
    assert console.index(stdout) < console.index("BLOCKED:"), (
        "the evidence must be re-emitted BEFORE the verdict:\n" + console)
    assert console.index(stderr) < console.index("BLOCKED:"), (
        "the evidence must be re-emitted BEFORE the verdict:\n" + console)


def test_a_failing_to_run_validator_outside_the_range_still_says_so():
    """Exit >= 5 is not a verdict at all - the wording must survive."""
    status, console = _run_gate_verdict(127)
    assert status == 1
    assert "FAILED TO RUN" in console
    assert "UNKNOWN is not clean" in console


def test_the_validator_is_run_with_its_output_captured(monkeypatch):
    """The CAPTURE is the fix's load-bearing part - assert it is still there.

    The classification logic is only correct while the validator's output is
    captured. Without the capture the gate has no string to inspect and can
    only read an exit code, which cannot tell an abort from a finding. A test
    of the classifier alone would not notice the capture being dropped, so
    this test pins the call site's own arguments.
    """
    seen = {}

    def fake_run(cmd, **kwargs):
        seen["cmd"] = cmd
        seen["kwargs"] = kwargs
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

    monkeypatch.setattr(publish.subprocess, "run", fake_run)
    publish._run_cpv_validator(_REPO_ROOT)

    assert seen["kwargs"].get("capture_output") is True, (
        "the validator's output is no longer captured: " + repr(seen["kwargs"]))
    assert seen["kwargs"].get("text") is True, (
        "the captured output is bytes, so the token search would not match: "
        + repr(seen["kwargs"]))


def test_a_signal_death_is_reported_as_a_failure_to_run():
    """A negative return code is a signal death, not a severity code."""
    status, console = _run_gate_verdict(-9)
    assert status == 1
    assert "FAILED TO RUN" in console


def test_the_timeout_path_re_emits_the_partial_output(monkeypatch):
    """A timeout must not swallow what the validator printed before it died.

    The capture would otherwise hide the partial output the operator used to
    see when the streams were inherited, so the timeout handler re-emits it.
    """
    def fake_run(cmd, **kwargs):
        raise subprocess.TimeoutExpired(cmd, 600.0, output="partial stdout\n",
                                        stderr="partial stderr\n")

    monkeypatch.setattr(publish.subprocess, "run", fake_run)
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        status = publish._cpv_gate_step(_REPO_ROOT)
    console = buffer.getvalue()

    assert status == 1, "a timeout must block the release"
    assert "timed out" in console
    assert "partial stdout" in console, "the partial stdout was swallowed"
    assert "partial stderr" in console, "the partial stderr was swallowed"
    assert console.index("partial stdout") < console.index("timed out"), (
        "the evidence must appear BEFORE the verdict:\n" + console)
