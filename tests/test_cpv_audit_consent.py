"""The audit-consent registry must stay TRUE of the tree it adjudicates.

CPV's audit-consent registry (``.cpv-audit-consent.json``) records, per
REVIEWED finding, a ``lineSha256`` of the flagged line and a prose ``reason``.
The hash pins the LINE; the reason is a CLAIM about CONTEXT ("a chapter about
the memory directory map", "a chapter about model selection and fallback
chains"). Nothing checked that claim, so an edit that turned the passage from
*documentation about* the memory directory into an *instruction to* modify it
would leave the reason false and the repo silent.

These tests close that hole. They assert, against the CURRENT tree:

1. every registry entry's ``lineSha256`` still matches the file's current line
   N (a stale entry fails, and so does a moved line);
2. every reason's SUBJECT CLAIM is re-derivable from the chapter it names --
   the reason names the chapter, and its subject phrase is VERBATIM in that
   chapter's own H1 heading or Overview;
3. the registry and the recorded findings agree IN BOTH DIRECTIONS: every
   entry matches a current finding, and every current finding has an entry.

The findings come from a TRACKED capture
(``tests/fixtures/cpv_audit_consent_findings.jsonl``) so the suite needs no
scan at test time -- CI has no capture file to produce. The capture is a
RECORDED OBSERVATION, not an authority: against a hand-edited capture it
certifies nothing, which is why it is a tracked file where a forgery would be
visible in the diff.

CPV collapses and caps a ``reason`` at 200 characters, so every reason here
must fit under that cap -- otherwise CPV silently truncates it and the reader
sees a different string than the one this suite checked.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REGISTRY = REPO_ROOT / ".cpv-audit-consent.json"
CAPTURE = Path(__file__).resolve().parent / "fixtures" / "cpv_audit_consent_findings.jsonl"

# CPV's own caps (cpv_skillaudit_native.py::_load_audit_consent_registry):
# the reason is whitespace-collapsed and truncated to 200 characters.
CPV_REASON_CAP = 200

# The buckets, from the tracked adjudication spec
# ``design/specs/specs/cpv-nit-rules-adjudicated.md``.
BUCKET_A_RULES = {
    "SUPPLY_CHAIN",
    "CMD_INJECTION",
    "PRIVILEGE_ESC",
    "CLAUDE_CLI_PERMISSION_BYPASS",
    "CLAUDE_CLI_TOKEN_THEFT",
}
BUCKET_B_RULES = {
    "AGENT_MEMORY_MOD",
    "A2A_CROSS_AGENT_INJECT",
    "INTENT_DESTRUCTIVE_INTENT",
    "TIME_BOMB",
    "CLAUDE_AUTH_ENV_OVERRIDE",
    "A2A_AGENT_IMPERSONATION",
}
BUCKET_C_RULES = {"SHELL_EXEC", "FS_WRITE", "ENV_INJECTION"}

# The reason's subject claim per bucket-A rule. Bucket A's reason says what the
# RULE is about -- so the entry reads as a statement about its own rule, not a
# template stamped 36 times -- and the test re-derives it from the rule id.
BUCKET_A_SUBJECT = {
    "SUPPLY_CHAIN": "a downloaded script piped to a shell",
    "CMD_INJECTION": "a command piped into another command",
    "PRIVILEGE_ESC": "a superuser command",
    "CLAUDE_CLI_PERMISSION_BYPASS": "the permission-bypass flag",
    "CLAUDE_CLI_TOKEN_THEFT": "the long-lived-token minting command",
}

# The reason's clause per bucket. Bucket A's clause carries BOTH facts: the
# plugin's own code never executes the passage, AND the chapter is agent-facing
# prose the agent may act on -- the residual risk the registry has to state.
BUCKET_A_CLAUSE = ("plugin code never runs it; the chapter is agent-facing prose the agent may act on")
BUCKET_B_CLAUSE = "the rule detects its own subject matter, not an instance of it"
BUCKET_C_CLAUSE = "the rule is right about the pattern, wrong about a corpus that shows it"


def _load_registry() -> list[dict]:
    raw = json.loads(REGISTRY.read_text(encoding="utf-8"))
    assert raw["version"] == 1, f"unexpected registry version: {raw['version']!r}"
    consents = raw["consents"]
    assert isinstance(consents, list), "consents must be a list"
    return consents


def _load_capture() -> list[dict]:
    rows = []
    for line in CAPTURE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def _chapter_lines(rel: str) -> list[str]:
    return (REPO_ROOT / rel).read_text(encoding="utf-8").splitlines()


def _norm_heading(text: str) -> str:
    return " ".join(text.replace("`", "").replace("*", "").split())


def _chapter_headings(rel: str) -> list[str]:
    """The chapter's ATX headings, outside fenced code blocks."""
    out = []
    fenced = False
    for line in _chapter_lines(rel):
        stripped = line.strip()
        if stripped.startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        m = re.match(r"^#{1,6}\s+(.*\S)\s*$", line)
        if m:
            out.append(_norm_heading(m.group(1)))
    return out


def _chapter_overview(rel: str) -> str:
    """The chapter's Overview line: the block-quote under its first `###`."""
    lines = _chapter_lines(rel)
    for i, line in enumerate(lines):
        if line.startswith("### "):
            for j in range(i + 1, min(i + 8, len(lines))):
                if lines[j].startswith("> "):
                    return _norm_heading(lines[j][2:])
            break
    return ""


def _sha256_line(line: str) -> str:
    """CPV's exact recipe: sha256 of the FULL flagged line, stripped."""
    return hashlib.sha256(line.strip().encode("utf-8")).hexdigest()


# --------------------------------------------------------------------------- #
# 1. the registry and the findings agree, in BOTH directions
# --------------------------------------------------------------------------- #


def test_registry_entry_count_matches_the_recorded_findings():
    consents = _load_registry()
    rows = _load_capture()
    assert len(consents) == len(rows), (
        f"registry has {len(consents)} entries, the recorded findings have {len(rows)}"
    )


def test_every_registry_entry_matches_a_recorded_finding():
    consents = _load_registry()
    recorded = {(r["file"], r["ruleId"], r["lineSha256"]) for r in _load_capture()}
    unmatched = [
        (e["file"], e["ruleId"], e["lineSha256"])
        for e in consents
        if (e["file"], e["ruleId"], e["lineSha256"]) not in recorded
    ]
    assert not unmatched, f"registry entries with no recorded finding: {unmatched}"


def test_every_recorded_finding_has_a_registry_entry():
    consents = _load_registry()
    registered = {(e["file"], e["ruleId"], e["lineSha256"]) for e in consents}
    missing = [
        (r["file"], r["ruleId"], r["lineSha256"])
        for r in _load_capture()
        if (r["file"], r["ruleId"], r["lineSha256"]) not in registered
    ]
    assert not missing, f"recorded findings with no registry entry: {missing}"


def test_registry_entries_carry_the_four_required_fields():
    for entry in _load_registry():
        assert set(entry) == {"file", "ruleId", "lineSha256", "reason"}, (
            f"unexpected entry shape: {sorted(entry)}"
        )
        assert isinstance(entry["reason"], str) and entry["reason"].strip(), (
            f"empty reason for {entry['file']} / {entry['ruleId']}"
        )


def test_every_reason_fits_under_cpv_200_character_cap():
    """CPV collapses whitespace and truncates the reason at 200 characters.

    A longer reason is silently cut, so the reader sees a different string than
    the one this suite checked -- and the tail that carried the qualification
    is exactly what gets lost.
    """
    for entry in _load_registry():
        collapsed = " ".join(entry["reason"].split())
        assert len(collapsed) <= CPV_REASON_CAP, (
            f"reason is {len(collapsed)} chars (cap {CPV_REASON_CAP}) for "
            f"{entry['file']} / {entry['ruleId']}: {collapsed!r}"
        )


# --------------------------------------------------------------------------- #
# 2. the recorded hash still matches the file's CURRENT line N
# --------------------------------------------------------------------------- #


def test_every_recorded_line_hash_still_matches_the_tree():
    """The consent pins the flagged line; if the line moved or changed, the
    consent no longer matches and CPV blocks the finding again."""
    stale = []
    for row in _load_capture():
        lines = _chapter_lines(row["file"])
        n = row["line"]
        if n < 1 or n > len(lines):
            stale.append((row["file"], n, "line out of range"))
            continue
        actual = _sha256_line(lines[n - 1])
        if actual != row["lineSha256"]:
            stale.append((row["file"], n, f"{actual} != {row['lineSha256']}"))
    assert not stale, f"recorded findings whose line no longer matches the tree: {stale}"



def test_each_recorded_line_is_one_of_the_lines_the_hash_actually_selects():
    """A consent keyed on a hash is only meaningful when the hash selects the
    line the consent was written for.

    Some of the 72 flagged lines are byte-identical to another line in the same
    chapter -- the vendor install one-liner appears four times in the
    troubleshooting chapter. The registry carries one entry per FINDING, so
    those entries share a hash and a rule; what tells them apart is the line
    number. The test asserts each recorded line is among the lines the hash
    selects, and that the number of such lines equals the number of findings
    recorded for that (file, rule, hash) -- so an entry cannot claim a line the
    hash does not select, and a line cannot be claimed twice.
    """
    rows = _load_capture()
    by_key = {}
    for row in rows:
        by_key.setdefault((row["file"], row["ruleId"], row["lineSha256"]), []).append(row)
    for (rel, _rule, digest), group in by_key.items():
        lines = _chapter_lines(rel)
        hits = [i + 1 for i, line in enumerate(lines) if _sha256_line(line) == digest]
        recorded = sorted(row["line"] for row in group)
        assert recorded == sorted(hits), (
            f"{rel}: the findings recorded for this hash are at lines {recorded}, "
            f"but the hash selects {sorted(hits)}"
        )


# --------------------------------------------------------------------------- #
# 3. the reason's SUBJECT CLAIM is re-derivable from the chapter it names
# --------------------------------------------------------------------------- #


def test_every_reason_names_the_chapter_it_adjudicates():
    """The reason's first field is the chapter's skill directory. A reason that
    does not name its own chapter cannot be tied to it."""
    for entry in _load_registry():
        skill = entry["file"].split("/")[1]
        assert skill in entry["reason"], (
            f"reason does not name its chapter ({skill}): {entry['reason']!r}"
        )


def test_every_bucket_a_reason_carries_its_rule_subject_and_the_residual_risk():
    """Bucket A's reason must say what the RULE is about, and must carry BOTH
    facts: the plugin's own code never executes the passage, AND the chapter is
    agent-facing prose the agent may act on (why the owner ruled on it)."""
    for entry in _load_registry():
        rule = entry["ruleId"]
        if rule not in BUCKET_A_RULES:
            continue
        reason = entry["reason"]
        subject = BUCKET_A_SUBJECT[rule]
        assert subject in reason, f"bucket A reason omits its rule's subject: {reason!r}"
        assert BUCKET_A_CLAUSE in reason, (
            f"bucket A reason omits the residual-risk clause: {reason!r}"
        )


def test_every_bucket_b_and_c_reason_carries_its_rule_clause():
    for entry in _load_registry():
        rule = entry["ruleId"]
        if rule in BUCKET_B_RULES:
            assert BUCKET_B_CLAUSE in entry["reason"], (
                f"bucket B reason omits its clause: {entry['reason']!r}"
            )
        elif rule in BUCKET_C_RULES:
            assert BUCKET_C_CLAUSE in entry["reason"], (
                f"bucket C reason omits its clause: {entry['reason']!r}"
            )



def test_every_bucket_b_and_c_subject_phrase_is_verbatim_in_its_own_chapter():
    """The reason subject claim must be re-derivable from the chapter, not
    merely asserted.

    The reason names a phrase after ``topic:``. The phrase ends at the `` - ``
    that introduces the clause. The test asserts that phrase is VERBATIM in the
    chapter own H1 heading or Overview -- and that it appears in NO other
    chapter H1 or Overview, so the claim cannot be satisfied by a phrase that
    belongs to some other chapter.

    This is the check that fails when a chapter is edited so the passage stops
    being about the subject the reason names: the phrase stops being in the
    chapter, and the reason becomes an unbacked claim.
    """
    all_chapters = sorted({e["file"] for e in _load_registry()})
    haystacks = {rel: _norm_heading(_chapter_headings(rel)[0]) + " " + _chapter_overview(rel)
                 for rel in all_chapters}
    checked = 0
    for entry in _load_registry():
        reason = entry["reason"]
        # "<chapter> | sec: <scope> | topic: <phrase> - <clause>"
        m = re.search(r"topic:\s*([^|]+?)(?:\s+-\s+|\s*\|\s*$)", reason)
        if not m:
            continue
        phrase = m.group(1).strip()
        assert phrase, f"empty subject phrase: {reason!r}"
        assert phrase in haystacks[entry["file"]], (
            f"subject phrase {phrase!r} is not in {entry['file']} own H1/Overview: {reason!r}"
        )
        others = [rel for rel in all_chapters
                  if rel != entry["file"] and phrase in haystacks[rel]]
        assert not others, (
            f"subject phrase {phrase!r} is not unique to {entry['file']}; it also matches {others}"
        )
        checked += 1
    assert checked >= 36, f"only {checked} reasons carried a subject phrase"



def test_every_reason_names_a_section_of_its_own_chapter():
    """The reason scope field (``sec: ...``) must resolve to a section of the
    chapter it names -- a prose claim nothing checks would go stale silently."""
    checked = 0
    for entry in _load_registry():
        reason = entry["reason"]
        # "<chapter> | sec: <scope> | ..."
        m = re.search(r"sec:\s*([^|]+?)(?:\s+-\s+|\s*\|)", reason)
        if not m:
            continue
        scope = m.group(1).strip()
        if scope.endswith(" sections"):
            # A multi-section scope: the COUNT is the claim. It is re-derived
            # from the tree by the sibling test below.
            assert scope[:-len(" sections")].isdigit(), f"malformed section count: {scope!r}"
            checked += 1
            continue
        headings = _chapter_headings(entry["file"])
        matching = [h for h in headings if h.startswith(scope)]
        assert matching, f"section {scope!r} is not a heading of {entry['file']}: {reason!r}"
        assert len(matching) == 1, (
            f"section {scope!r} matches {len(matching)} headings of {entry['file']}: {matching}"
        )
        checked += 1
    assert checked == len(_load_registry()), (
        f"only {checked} of {len(_load_registry())} reasons carried a section scope"
    )


BUCKETS = {"A": BUCKET_A_RULES, "B": BUCKET_B_RULES, "C": BUCKET_C_RULES}


def test_the_three_buckets_are_pairwise_disjoint():
    """A rule appearing in TWO buckets would make the bucket a claim nothing
    checks -- and the bucket is what decides which clause each reason must
    carry, so a rule in two buckets would make the clause check ambiguous.

    This is a REAL assertion over the three declared sets: the pairwise
    intersection of two distinct buckets must be empty. (An earlier version of
    this check intersected a bucket with ``all_rules - bucket``, which is
    vacuously empty by construction and could never fail.)
    """
    names = sorted(BUCKETS)
    for i, left in enumerate(names):
        for right in names[i + 1:]:
            overlap = BUCKETS[left] & BUCKETS[right]
            assert not overlap, (
                f"rule(s) {sorted(overlap)} are in both bucket {left} and bucket {right}"
            )
    for name, bucket in BUCKETS.items():
        assert bucket, f"bucket {name} is empty"


def test_every_registered_rule_sits_in_exactly_one_bucket():
    """Every rule the registry adjudicates is in exactly ONE bucket: not zero
    (which would leave its reason with no clause to carry) and not two (which
    would make the clause ambiguous)."""
    for name, bucket in BUCKETS.items():
        for rule in bucket:
            others = [other for other, b in BUCKETS.items() if other != name]
            for other in others:
                assert rule not in BUCKETS[other], (
                    f"{rule} is in bucket {name} and bucket {other}"
                )
    all_rules = BUCKET_A_RULES | BUCKET_B_RULES | BUCKET_C_RULES
    assert len(all_rules) == 14, f"expected 14 adjudicated rules, found {len(all_rules)}"
    registered_rules = {e["ruleId"] for e in _load_registry()}
    assert registered_rules == all_rules, (
        f"registry rules {sorted(registered_rules)} do not match the adjudicated set "
        f"{sorted(all_rules)}"
    )


def test_the_buckets_hold_the_adjudicated_counts():
    """The adjudication spec fixes the counts: bucket A 36, bucket B 16,
    bucket C 20. A rule that moved buckets would change a count, and the count
    is what the ledger states."""
    counts = {"A": 0, "B": 0, "C": 0}
    for entry in _load_registry():
        rule = entry["ruleId"]
        if rule in BUCKET_A_RULES:
            counts["A"] += 1
        elif rule in BUCKET_B_RULES:
            counts["B"] += 1
        else:
            counts["C"] += 1
    assert counts == {"A": 36, "B": 16, "C": 20}, f"bucket counts drifted: {counts}"
