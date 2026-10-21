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


def _verdict_lines(console):
    """The gate's OWN verdict lines - not the re-emitted validator output.

    The re-emitted output legitimately contains the words "CRITICAL",
    "MAJOR", "MINOR" and "NIT" (CPV's counters), so a whole-console search
    for a severity name matches the EVIDENCE rather than the CONCLUSION.

    It ASSERTS that a verdict line was found, so a regression that printed
    something else entirely cannot make a negative assertion vacuous: a
    missing verdict line fails here rather than silently satisfying "the
    bad text is absent".
    """
    lines = [line for line in console.splitlines()
             if "BLOCKED:" in line or "Validation passed" in line]
    assert lines, ("the gate printed no verdict line, so a negative assertion "
                   "about it would be vacuous:\n" + console)
    return "\n".join(lines)


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
    assert "MAJOR issues found" not in _verdict_lines(console), (
        f"the abort was mislabelled as a MAJOR finding:\n{console}")
    assert "could not run" in console, (
        f"the abort was not reported as an abort:\n{console}")


def test_abort_carrying_the_token_on_stdout_is_also_an_abort():
    """The abort token is searched in BOTH streams, not just stderr."""
    status, console = _run_gate_verdict(
        2, stdout="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1
    assert "MAJOR issues found" not in _verdict_lines(console)
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
    assert "issues found" not in _verdict_lines(console), (
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


def test_a_run_quoting_the_abort_heading_is_not_an_abort():
    """A mention of the heading is not the heading.

    The abort is recognised only when the heading is the WHOLE of a line, so a
    run that completes and merely QUOTES the heading in some prose is not
    reported as an abort. A bare substring match would false-block here.
    """
    status, console = _run_gate_verdict(
        0,
        stdout="A finding quoted the old error: [CPV integrity] CRITICAL: "
               "integrity manifest mismatch\n"
               "SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 0, (
        "a passing run that quotes the heading was refused:\n" + console)
    assert "Validation passed" in console


def test_a_stray_mention_of_summary_is_not_a_verdict():
    """The word "SUMMARY:" alone does not stand in for a verdict line.

    A bare substring match on "SUMMARY:" is satisfied by a section header or a
    quoted example. With exit 0 that would let a run that produced no verdict
    be read as a pass - the same defect the card exists to fix, in the
    opposite direction.
    """
    status, console = _run_gate_verdict(
        0, stdout="SUMMARY: see the section titled SUMMARY: below\n")
    assert status == 1, "a stray mention of SUMMARY: was read as a verdict"
    assert "Validation passed" not in console


def test_an_abort_that_also_prints_a_verdict_is_still_an_abort():
    """The abort check wins over the verdict check.

    The order matters and is pinned here: an abort run that also emitted a
    verdict line must be reported as an abort, never as a finding or a pass.
    """
    status, console = _run_gate_verdict(
        2,
        stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n",
        stderr="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1
    # The severity names are asserted on the GATE'S OWN verdict line, not on
    # the console as a whole: the re-emitted validator output legitimately
    # contains the words "CRITICAL", "MAJOR", "MINOR" and "NIT", so a
    # whole-console search for them would match the evidence, not the
    # conclusion.
    assert "MAJOR issues found" not in _verdict_lines(console)
    assert "could not run" in console


def test_the_verdict_line_must_carry_the_severity_counters():
    """A "SUMMARY:" line without the counters is not CPV's verdict line."""
    status, console = _run_gate_verdict(0, stdout="SUMMARY:\n")
    assert status == 1, "a summary line with no counters was read as a verdict"
    assert "Validation passed" not in console


def test_a_quoted_partial_verdict_line_is_not_a_verdict():
    """A quoted, PARTIAL verdict-shaped line does not stand in for a verdict.

    The verdict check requires CPV's whole line shape with numeric counters,
    so a quoted example that happens to start with "SUMMARY:" and carry
    "CRITICAL=" and "MAJOR=" does not satisfy it.
    """
    status, console = _run_gate_verdict(
        0, stdout='the docs quote "SUMMARY: CRITICAL=0 MAJOR=0" as an example\n')
    assert status == 1, "a quoted partial verdict line was read as a verdict"
    assert "Validation passed" not in console


def test_a_verdict_line_with_a_prefix_is_not_a_verdict():
    """A prefixed verdict line is a FORMAT CHANGE, and is refused.

    CPV owns this format, so a release that prefixes its verdict line is a
    release this gate no longer recognises. The refusal is the fail-closed
    direction, and it is pinned here so the behaviour is deliberate rather
    than incidental.
    """
    status, console = _run_gate_verdict(
        0, stdout="[cpv] SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1
    assert "Validation passed" not in console


def test_a_colourised_verdict_line_is_still_a_verdict():
    """ANSI escapes do not defeat the verdict check.

    The capture's pipe normally makes CPV disable colour, and the measured
    outputs carry no escape sequences, but a CPV release that colourises
    unconditionally would otherwise turn a clean run into a refusal.
    """
    status, console = _run_gate_verdict(
        0, stdout="\x1b[1mSUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 "
                  "WARNING=0\x1b[0m\n")
    assert status == 0, "a colourised verdict line was not recognised"
    assert "Validation passed" in console


def test_a_colourised_abort_heading_is_still_an_abort():
    """The same for the abort heading: colour must not hide the abort."""
    status, console = _run_gate_verdict(
        2, stderr="\x1b[1;31m[CPV integrity] CRITICAL: integrity manifest "
                  "mismatch\x1b[0m\n")
    assert status == 1
    assert "could not run" in console
