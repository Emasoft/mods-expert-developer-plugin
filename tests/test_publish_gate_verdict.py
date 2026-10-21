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


def test_a_clean_verdict_followed_by_a_critical_verdict_is_not_a_pass():
    """The false pass: TWO verdict lines, and the first one is clean.

    The defect: the classifier short-circuited on the FIRST matching verdict
    line and never read the counters, so a clean summary followed by a
    CRITICAL summary released the plugin with three CRITICALs in the output.
    EVERY verdict line is read, and the LAST one is the run's verdict, so
    the run blocks. The exit code here is 0, which the last line's CRITICAL
    counters contradict, so the run is refused as a disagreement and NO
    severity is named - naming one would send the operator hunting a
    finding the exit code says does not exist.
    """
    status, console = _run_gate_verdict(
        0,
        stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n"
               "SUMMARY: CRITICAL=3 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, "a run carrying a CRITICAL verdict was released"
    assert "Validation passed" not in console, (
        f"a run with a CRITICAL verdict was reported as a pass:\n{console}")
    assert "issues found" not in _verdict_lines(console), (
        f"a severity the exit code contradicts was named:\n{console}")


def test_a_critical_verdict_with_the_matching_exit_code_is_labelled_critical():
    """A verdict whose severity and exit code AGREE is reported with that severity.

    This is a regression guard on the severity precedence and on the exit
    code for CRITICAL: the cross-check has already established that the
    verdict's counters and the exit code agree, so the run is blocked and
    the severity is CRITICAL.
    """
    status, console = _run_gate_verdict(
        1, stdout="SUMMARY: CRITICAL=3 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1
    assert "BLOCKED: CRITICAL issues found" in console


def test_a_clean_verdict_followed_by_a_major_verdict_is_not_a_pass():
    """The same false pass for MAJOR.

    The exit code 0 contradicts the last line's MAJOR counters, so the run
    is refused as a disagreement and no severity is named.
    """
    status, console = _run_gate_verdict(
        0,
        stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n"
               "SUMMARY: CRITICAL=0 MAJOR=2 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, "a run carrying a MAJOR verdict was released"
    assert "Validation passed" not in console
    assert "issues found" not in _verdict_lines(console), (
        f"a severity the exit code contradicts was named:\n{console}")


def test_a_verdict_with_critical_and_major_is_labelled_critical():
    """CRITICAL outranks MAJOR, and the label follows the precedence."""
    status, console = _run_gate_verdict(
        1, stdout="SUMMARY: CRITICAL=1 MAJOR=2 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1
    assert "BLOCKED: CRITICAL issues found" in console, (
        f"the severity precedence was not applied:\n{console}")


def test_a_nit_only_verdict_blocks_and_is_labelled_nit():
    """A NIT-only verdict is a finding, and its label is NIT, not UNKNOWN.

    CPV's strict exit code for a NIT-only run is 4, and the gate must block
    on the VERDICT. This is a regression guard on the severity precedence
    and on the exit code for NIT: the verdict's counters and the exit code
    agree, so the run is blocked and the severity is NIT.
    """
    status, console = _run_gate_verdict(
        4, stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=1 WARNING=0\n")
    assert status == 1, "a NIT-only verdict was released"
    assert "Validation passed" not in console
    assert "BLOCKED: NIT issues found" in console, (
        f"the NIT verdict was not labelled NIT:\n{console}")


def test_a_single_all_zero_verdict_line_passes():
    """The ordinary clean case still passes, and says so."""
    status, console = _run_gate_verdict(
        0, stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 0
    assert "Validation passed" in console


def test_a_verdict_line_without_counters_is_refused():
    """A verdict with no counters at all is not a verdict - fail closed."""
    status, console = _run_gate_verdict(0, stdout="SUMMARY:\n")
    assert status == 1, "a verdict with no counters was read as a pass"
    assert "Validation passed" not in console
    assert "no verdict" in console, (
        f"a run with no usable verdict was not reported as such:\n{console}")


def test_the_abort_token_yields_no_severity_label():
    """An abort is an abort: it never carries a severity name."""
    status, console = _run_gate_verdict(
        2, stderr="[CPV integrity] CRITICAL: integrity manifest mismatch\n")
    assert status == 1
    assert "issues found" not in _verdict_lines(console), (
        f"the abort was labelled with a severity:\n{console}")
    assert "could not run" in console


def test_zero_counters_with_a_nonzero_exit_code_is_refused():
    """The exit code CROSS-CHECKS the counters: a disagreement is refused.

    CPV derives its strict exit code from the same counts that produce the
    counters, so "all counters zero but exit 4" means the output and the
    code came from different places. Neither is trusted and the run is
    refused, rather than the code being overridden in the verdict's favour.
    """
    status, console = _run_gate_verdict(
        4, stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, "a verdict that disagrees with the exit code passed"
    assert "Validation passed" not in console
    assert "disagree" in console, (
        f"the disagreement was not reported as one:\n{console}")


def test_nonzero_counters_with_a_zero_exit_code_is_refused():
    """The other direction of the disagreement: counters say CRITICAL, code says 0.

    And the disagreement must NOT name a severity. The counters say CRITICAL
    and the exit code says the run found nothing, so the two accounts
    contradict each other and neither is trusted. Naming CRITICAL here would
    send the operator hunting a finding that the exit code says does not
    exist - the exact defect this classifier exists to remove (TRDD-UD8EC4FK).
    """
    status, console = _run_gate_verdict(
        0, stdout="SUMMARY: CRITICAL=3 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, "a verdict that disagrees with the exit code passed"
    assert "Validation passed" not in console
    assert "disagree" in console, (
        f"the disagreement was not reported as one:\n{console}")
    assert "CRITICAL issues found" not in _verdict_lines(console), (
        f"the disagreement named a severity the exit code contradicts:\n{console}")


def test_the_timeout_path_re_emits_partial_output_that_arrived_as_bytes(monkeypatch):
    """The timeout path hands over BYTES, and the evidence still reaches the console.

    CPython's timeout path raises subprocess.TimeoutExpired with the raw
    captured bytes and does NOT decode them, even when the subprocess was run
    in text mode - MEASURED on this machine with the validator invoked
    exactly as the gate invokes it (capture_output=True, text=True). The
    normal path's CompletedProcess carries str. The re-emit accepts both, so
    the operator still sees what the validator printed before it was killed.
    """
    def fake_run(cmd, **kwargs):
        raise subprocess.TimeoutExpired(cmd, 600.0, output=b"partial stdout\n",
                                        stderr=b"partial stderr\n")

    monkeypatch.setattr(publish.subprocess, "run", fake_run)
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        status = publish._cpv_gate_step(_REPO_ROOT)
    console = buffer.getvalue()

    assert status == 1, "a timeout must block the release"
    assert "timed out" in console
    assert "partial stdout" in console, "the partial stdout was swallowed"
    assert "partial stderr" in console, "the partial stderr was swallowed"


def test_a_critical_verdict_with_a_majors_exit_code_is_refused_without_naming_a_severity():
    """The severity and the exit code can never disagree on the findings path.

    The cross-check compares the verdict's counters against the exit code and
    refuses any run where they do not agree, so the "findings" path is only
    ever reached with a severity and a code that MATCH. This test pins that
    from the other side: a CRITICAL verdict carried by MAJOR's exit code is
    NOT reported as "BLOCKED: CRITICAL issues found" - it is refused as a
    disagreement, and no severity is named, because a severity named here
    sends the operator hunting a finding the exit code says does not exist.
    """
    status, console = _run_gate_verdict(
        2, stdout="SUMMARY: CRITICAL=3 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, "a verdict that disagrees with the exit code passed"
    assert "Validation passed" not in console
    assert "disagree" in console, (
        f"the disagreement was not reported as one:\n{console}")
    for severity in ("CRITICAL", "MAJOR", "MINOR", "NIT"):
        assert f"{severity} issues found" not in _verdict_lines(console), (
            f"the disagreement named a severity:\n{console}")


def test_a_nit_only_verdict_with_a_zero_exit_code_is_a_nit_finding_not_a_disagreement():
    """A NIT with exit 0 is a NIT that does not block, not two accounts disagreeing.

    CPV's strict exit code for a NIT-only run is 4, but WITHOUT --strict it
    exits 0, and the gate then sees a NIT verdict and a 0 code. Calling that
    a disagreement would block the release with a message carrying no
    actionable severity; the run is really a NIT finding, so the gate names
    NIT and says nothing about a disagreement.
    """
    status, console = _run_gate_verdict(
        0, stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=1 WARNING=0\n")
    assert status == 1, "a NIT-only verdict was released"
    assert "Validation passed" not in console
    assert "disagree" not in console, (
        f"a NIT that does not block was reported as a disagreement:\n{console}")
    assert "BLOCKED: NIT issues found" in console, (
        f"the NIT verdict was not labelled NIT:\n{console}")


def test_a_dirty_first_summary_followed_by_a_clean_final_summary_is_not_a_pass():
    """The LAST verdict line is the run's verdict, and a clean one does not clear the rest.

    The defect: a validator that prints a per-phase summary and then a final
    total would have had the per-phase line's MINOR count read as a finding
    belonging to no verdict line, and the run blocked as a disagreement. The
    LAST whole-line verdict is the run's verdict, and the MAXIMUM count per
    severity is a BLOCKING FLOOR: an earlier line reporting a severity the
    final total does not has blocks the run, so a clean final total never
    clears a dirty earlier line.
    """
    status, console = _run_gate_verdict(
        0,
        stdout="SUMMARY: CRITICAL=0 MAJOR=0 MINOR=1 NIT=0 WARNING=0\n"
               "SUMMARY: CRITICAL=0 MAJOR=0 MINOR=0 NIT=0 WARNING=0\n")
    assert status == 1, (
        f"a run with an earlier dirty summary was released:\n{console}")
    assert "Validation passed" not in console, (
        f"a run with an earlier dirty summary was reported as a pass:\n{console}")
    assert "issues found" not in _verdict_lines(console), (
        f"a severity the final total does not carry was named:\n{console}")
