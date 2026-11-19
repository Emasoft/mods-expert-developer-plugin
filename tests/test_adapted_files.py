"""The registry of adapted third-party files is complete and each entry is credited (orchestrator ruling 2 of 2026-11-04, TRDD-RD1ISPMN, TRDD-71KVH9PA).

excerpt_lock.ADAPTED_FILES lists the files this plugin adapts (changes) from a third-party file under ruling 2. For each
entry: the path is published (in no *_dev folder) and not a markup file (CSS, SVG, HTML); its source is a key of excerpt_lock.LICENCES and its licence is the one
recorded there, so only a reviewed source can be adapted from; its repository is none of excerpt_lock.NO_COPY_SOURCES;
the file exists and carries among its first THIRD_PARTY_HEADER_LINES lines the ADAPTED_HEADER line naming the entry's
repository, commit, upstream path and licence, and an ADAPTED_CHANGE line saying what changed (Apache License 2.0,
section 4(b); the ruling asks it of every adapted file, whatever its licence); NOTICE names the file's path in one
paragraph with its repository; and the licence obligations ship: the upstream copyright line verbatim with the full
licence text in the entry's licence_file, and for Apache-2.0 the upstream NOTICE text in its notice_file and in NOTICE;
both files must be tracked and published, and the licence one with known full-text markers. The copyright line and the
licence text are checked per file, not per block: a licence_file of NOTICE passes when NOTICE holds both anywhere.
Repositories are compared after normalizing their spelling (scheme, www., the SSH form, case, .git, a trailing slash).
No markup file (CSS, SVG, HTML) may appear in the port folders (PORT_DIRS): the idiom exemptions cover code files only.

A tracked file outside tests/ and design/ (excerpt_lock.NOT_SCANNED_TOP) and the *_dev folders, binary extensions apart,
whose first lines hold a line starting "Adapted from" after a comment or Markdown marker (//, /*, *, #, ##, <!--, - or >)
must have an entry. That catches a port that labels itself; a file that does not label itself is not detected. The files
adapted before ruling 2 (skills/mods-skill-to-mod, hooks/self-command/logic.ts) credit themselves in prose and in NOTICE
and are outside this registry. Standard library plus pytest.
"""

from __future__ import annotations

import importlib.util
import re
import subprocess
from collections.abc import Iterable
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parent.parent
_SPEC = importlib.util.spec_from_file_location("excerpt_lock_adapted", ROOT / "scripts" / "excerpt_lock.py")
assert _SPEC is not None and _SPEC.loader is not None
excerpt_lock = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(excerpt_lock)

# Any line that starts "Adapted from" after a comment or Markdown marker: looser than ADAPTED_HEADER on purpose, so a
# header written in another shape is caught as unregistered or malformed instead of passing unseen.
CLAIMS_ADAPTED = re.compile(r"^\s*(?://+|/?\*+|#+|<!--|-|>)\s*Adapted from\b")


def _published(rel: str) -> bool:
    """Return whether a tracked path is published with the plugin: in no *_dev folder, at any depth."""
    return not any(part.endswith("_dev") for part in rel.split("/"))


def _repo_key(repo: str) -> str:
    """Return a repository address normalized so that spellings GitHub resolves to one repository compare equal.

    Lower case; no trailing slash or .git; no http:// or https:// scheme, no www.; the SSH forms git@github.com:o/r and
    ssh://git@github.com/o/r become github.com/o/r.
    """
    key = repo.strip().lower().removesuffix("/").removesuffix(".git")
    key = re.sub(r"^(?:https?://|ssh://git@|git@)", "", key).removeprefix("www.")
    return key.replace("github.com:", "github.com/", 1)


# The folders the Deck and Tokensaver ports write to (TRDD-RD1ISPMN, TRDD-71KVH9PA Scope), and the markup kinds no port
# may ship: the idiom exemptions are for code files only (IDIOM_CODE_EXTENSIONS), and extending them needs a ruling.
PORT_DIRS = ("hooks/deck/", "hooks/tokensaver/")
MARKUP_EXTENSIONS = frozenset({"css", "scss", "less", "svg", "html", "htm"})
# The repositories of the forbidden mods (excerpt_lock.NO_COPY_SOURCES, one per FORBIDDEN mod): nothing may be adapted from them.
FORBIDDEN_REPOS = frozenset(_repo_key(pin.repo) for pins in excerpt_lock.NO_COPY_SOURCES.values() for pin in pins)


def _head(path: Path) -> list[str]:
    with path.open(encoding="utf-8", errors="replace") as handle:
        return [line.rstrip("\n") for _, line in zip(range(excerpt_lock.THIRD_PARTY_HEADER_LINES), handle)]


def _ext(rel: str) -> str:
    return Path(rel).suffix[1:].lower()


def _flat(text: str) -> str:
    return " ".join(text.split())


def _ships(rel_path: str, shipped: set[str]) -> bool:
    """Return whether a path names a tracked, published file of the plugin, without a .. segment."""
    return rel_path in shipped and _published(rel_path) and ".." not in rel_path.split("/")


def obligation_problems(root: Path, rel: str, entry: Any, notice: str, licence: str, shipped: set[str]) -> list[str]:
    """Return one line per obligation of the licence (the reviewed one, so a wrong entry cannot lower it) that does not ship: its licence file, the copyright line in it, the full licence text in it, and for Apache-2.0 the upstream NOTICE text in its notice file and in NOTICE."""
    if entry.licence_file == "NOTICE":
        text = notice
    elif _ships(entry.licence_file, shipped) and (root / entry.licence_file).is_file():
        text = (root / entry.licence_file).read_text(encoding="utf-8")
    else:
        return [f"LICENCE_FILE {rel}: {entry.licence_file!r} is not a tracked, published file; name NOTICE or a shipped licences file"]
    out: list[str] = []
    line = re.compile(rf"^\s*{re.escape(entry.copyright)}(?:\s+\([^)]*\))?\s*$", re.MULTILINE)
    if not entry.copyright.strip() or not line.search(text):
        out.append(f"COPYRIGHT {rel}: {entry.licence_file} has no line {entry.copyright!r}, the upstream copyright line verbatim")
    markers = excerpt_lock.LICENCE_TEXT_MARKERS.get(licence)
    unknown = ["(no full text known for this licence: add it to excerpt_lock.LICENCE_TEXT_MARKERS)"]
    missing = [marker for marker in markers if marker not in _flat(text)] if markers else unknown
    if missing:
        out.append(f"LICENCE_TEXT {rel}: {entry.licence_file} lacks the full {licence} text, starting at {missing[0][:50]!r}")
    if licence == "Apache-2.0":
        path = root / entry.notice_file if entry.notice_file and _ships(entry.notice_file, shipped) else None
        upstream = path.read_text(encoding="utf-8") if path is not None and path.is_file() else ""
        if not upstream.strip():
            out.append(f"NOTICE_TEXT {rel}: an Apache-2.0 file needs notice_file, a tracked and published copy of the upstream NOTICE text (section 4(d))")
        elif _flat(upstream) not in _flat(notice):
            out.append(f"NOTICE_TEXT {rel}: NOTICE does not carry the upstream NOTICE text of {entry.notice_file}")
    return out


def adapted_problems(root: Path, table: dict[str, Any], notice: str, tracked: Iterable[str]) -> list[str]:
    """Return one line per problem: an entry that is not published, names an unreviewed source, a licence other than its source's or a forbidden repository, or whose file, header, change notice or NOTICE paragraph is missing or wrong; then a tracked file claiming to be adapted with no entry."""
    out: list[str] = []
    tracked = sorted(tracked)
    shipped = set(tracked)
    for rel, entry in sorted(table.items()):
        if not _published(rel):
            out.append(f"NOT_SHIPPED {rel}: a *_dev folder is never published; register the file at its published path")
        if _ext(rel) in MARKUP_EXTENSIONS:
            out.append(f"KIND {rel}: a markup file may not be adapted; the idiom exemptions cover code files only, and a wider set needs a ruling")
        reviewed = excerpt_lock.LICENCES.get(entry.source)
        if reviewed is None:
            out.append(f"SOURCE {rel}: {entry.source!r} is not a reviewed source; add it to excerpt_lock.LICENCES with the licence its LICENSE file names")
        elif entry.licence != reviewed:
            out.append(f"LICENCE {rel}: the entry says {entry.licence!r}, the reviewed licence of {entry.source!r} is {reviewed!r}")
        if _repo_key(entry.repo) in FORBIDDEN_REPOS:
            out.append(f"FORBIDDEN {rel}: {entry.repo} is a NO_COPY_SOURCES repository, whose text may not be copied or adapted")
        path = root / rel
        if not path.is_file():
            out.append(f"MISSING {rel}: no such file; remove its ADAPTED_FILES entry or restore the file")
            continue
        head = _head(path)
        headers = [m.groups() for m in map(excerpt_lock.ADAPTED_HEADER.match, head) if m]
        want = (entry.repo, entry.commit, entry.upstream_path, entry.licence)
        if headers != [want]:
            out.append(
                f"HEADER {rel}: its first {excerpt_lock.THIRD_PARTY_HEADER_LINES} lines must hold exactly one line "
                f"'Adapted from {entry.repo} at {entry.commit}, {entry.upstream_path}, {entry.licence}.' in a comment; found {headers}"
            )
        if not any(excerpt_lock.ADAPTED_CHANGE.match(line) for line in head):
            out.append(f"CHANGE {rel}: no 'Changed for mods-expert-developer-plugin: <what changed>' comment line in its header")
        if not excerpt_lock.notice_names(notice, rel, entry.repo):
            out.append(f"NOTICE {rel}: no NOTICE paragraph names this path with {entry.repo}")
        out.extend(obligation_problems(root, rel, entry, notice, reviewed or entry.licence, shipped))
    for rel in tracked:
        if rel.startswith(PORT_DIRS) and rel not in table and _ext(rel) in MARKUP_EXTENSIONS:
            out.append(f"KIND {rel}: a markup file in a port folder; the idiom exemptions cover code files only, and a wider set needs a ruling")
        top = rel.split("/")[0]
        if top in excerpt_lock.NOT_SCANNED_TOP or not _published(rel) or rel in table or _ext(rel) in excerpt_lock.BINARY_EXTENSIONS:
            continue
        path = root / rel
        if path.is_file() and any(CLAIMS_ADAPTED.match(line) for line in _head(path)):
            out.append(f"UNREGISTERED {rel}: its header says it is adapted, so it needs an ADAPTED_FILES entry in scripts/excerpt_lock.py")
    return out


def _tracked() -> list[str]:
    out = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z"], capture_output=True, check=True).stdout
    return [raw.decode("utf-8") for raw in filter(None, out.split(b"\0"))]


def test_every_adapted_file_is_registered_and_credited() -> None:
    """Every ADAPTED_FILES entry passes every check, and no tracked file outside tests/ and design/ claims adaptation without an entry."""
    problems = adapted_problems(ROOT, excerpt_lock.ADAPTED_FILES, (ROOT / "NOTICE").read_text(encoding="utf-8"), _tracked())
    assert problems == [], "\n".join(problems)


REPO = "https://github.com/example/upstream"
COPYRIGHT = "Copyright (c) 2026 Example Author"
ENTRY = excerpt_lock.AdaptedFile(REPO, "0123abc", "src/a.ts", "MIT", "deck", COPYRIGHT, "NOTICE")
GOOD_HEAD = f"// Adapted from {REPO} at 0123abc, src/a.ts, MIT.\n// Changed for mods-expert-developer-plugin: re-keyed the store.\n"
CREDIT = f"- hooks/x/a.ts, adapted from {REPO} (MIT)."
MIT_BLOCK = "MIT License\n\n" + COPYRIGHT + " (example)\n\n" + "\n\n".join(excerpt_lock.MIT_PERMISSION_SENTENCES) + "\n"
GOOD_NOTICE = f"Intro.\n\n{CREDIT}\n\n{MIT_BLOCK}"
# The repository of a forbidden mod (token-optimizer, PolyForm Noncommercial), and its path on GitHub.
TOKEN_REPO = excerpt_lock.NO_COPY_SOURCES["token-optimizer"][0].repo
TOKEN_PATH = TOKEN_REPO.removeprefix("https://github.com/")


def _case(tmp_path: Path, head: str = GOOD_HEAD, notice: str = GOOD_NOTICE, entry: Any = ENTRY, extra: str | None = None) -> list[str]:
    (tmp_path / "hooks/x").mkdir(parents=True)
    (tmp_path / "hooks/x/a.ts").write_text(head + "export const a = 1\n", encoding="utf-8")
    tracked = ["hooks/x/a.ts"]
    if extra is not None:
        (tmp_path / "hooks/x/b.ts").write_text(extra, encoding="utf-8")
        tracked.append("hooks/x/b.ts")
    return adapted_problems(tmp_path, {"hooks/x/a.ts": entry}, notice, tracked)


def _kinds(problems: list[str]) -> list[str]:
    return [p.split(" ", 1)[0] for p in problems]


def test_a_complete_entry_passes(tmp_path: Path) -> None:
    """A file with the header, the change notice and its NOTICE paragraph raises no problem."""
    assert _case(tmp_path) == []


def test_a_block_comment_header_passes(tmp_path: Path) -> None:
    """The header and change notice may be written as /* ... */ block comments, the natural form for JS, TS and CSS."""
    head = f"/* Adapted from {REPO} at 0123abc, src/a.ts, MIT. */\n/* Changed for mods-expert-developer-plugin: re-keyed the store. */\n"
    assert _case(tmp_path, head=head) == []


@pytest.mark.parametrize(
    ("change", "kind"),
    [
        pytest.param({"head": GOOD_HEAD.replace("0123abc", "4567def")}, "HEADER", id="header-names-another-commit"),
        pytest.param({"head": GOOD_HEAD.split("\n", 1)[1]}, "HEADER", id="no-header"),
        pytest.param({"head": GOOD_HEAD + GOOD_HEAD.split("\n", 1)[0] + "\n"}, "HEADER", id="two-headers"),
        pytest.param({"head": GOOD_HEAD.split("\n", 1)[0] + "\n"}, "CHANGE", id="no-change-notice"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, "- hooks/x/a.ts, adapted from elsewhere.")}, "NOTICE", id="notice-without-the-repo"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, CREDIT.replace("a.ts", "a.tsx"))}, "NOTICE", id="notice-names-another-path"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, CREDIT.replace("hooks/", "lib/hooks/"))}, "NOTICE", id="notice-names-a-longer-path"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, CREDIT.replace(REPO, REPO + "c"))}, "NOTICE", id="notice-names-a-longer-repository"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, CREDIT.replace(REPO, REPO + ".c"))}, "NOTICE", id="notice-names-a-dotted-repository"),
        pytest.param({"notice": GOOD_NOTICE.replace(CREDIT, CREDIT.replace(REPO, "x" + REPO))}, "NOTICE", id="notice-names-a-prefixed-repository"),
        pytest.param({"notice": GOOD_NOTICE.replace(COPYRIGHT, "Copyright (c) 2026 Someone Else")}, "COPYRIGHT", id="copyright-line-missing"),
        pytest.param({"notice": GOOD_NOTICE.replace(COPYRIGHT, COPYRIGHT + "ity")}, "COPYRIGHT", id="copyright-line-of-another-holder"),
        pytest.param({"notice": GOOD_NOTICE.replace(excerpt_lock.MIT_PERMISSION_SENTENCES[2], "")}, "LICENCE_TEXT", id="licence-text-incomplete"),
        pytest.param({"entry": ENTRY._replace(licence_file="hooks/x/LICENSE.txt")}, "LICENCE_FILE", id="licence-file-missing"),
        pytest.param({"entry": ENTRY._replace(source="example__upstream")}, "SOURCE", id="source-not-reviewed"),
        pytest.param({"entry": ENTRY._replace(source="token-optimizer")}, "SOURCE", id="source-forbidden"),
        pytest.param(
            {"entry": ENTRY._replace(licence="Apache-2.0"), "head": GOOD_HEAD.replace(", MIT.", ", Apache-2.0.")},
            "LICENCE",
            id="licence-differs-from-the-reviewed-one",
        ),
    ],
)
def test_each_broken_entry_is_reported(tmp_path: Path, change: dict[str, Any], kind: str) -> None:
    """Each broken credit (header, change notice, NOTICE paragraph), an unreviewed source, a licence other than the source's and a missing licence obligation is reported by its kind."""
    problems = _case(tmp_path, **change)
    assert _kinds(problems) == [kind], problems


def _forbidden_case(tmp_path: Path, repo: str) -> list[str]:
    return _case(tmp_path, entry=ENTRY._replace(repo=repo), head=GOOD_HEAD.replace(REPO, repo), notice=GOOD_NOTICE.replace(REPO, repo))


@pytest.mark.parametrize("repo", sorted({pin.repo for pins in excerpt_lock.NO_COPY_SOURCES.values() for pin in pins}))
def test_every_forbidden_repository_is_refused(tmp_path: Path, repo: str) -> None:
    """An entry naming the repository of any forbidden mod is reported, whichever mod it is."""
    assert _kinds(_forbidden_case(tmp_path, repo)) == ["FORBIDDEN"]


@pytest.mark.parametrize(
    "repo",
    [
        TOKEN_REPO.upper() + ".git/",
        f"http://github.com/{TOKEN_PATH}",
        f"https://www.github.com/{TOKEN_PATH}",
        f"git@github.com:{TOKEN_PATH}.git",
        f"ssh://git@github.com/{TOKEN_PATH}",
    ],
)
def test_a_forbidden_repository_is_refused_in_any_spelling(tmp_path: Path, repo: str) -> None:
    """Case, .git, a trailing slash, http or https, www. and the two SSH forms all name the same forbidden repository."""
    assert _kinds(_forbidden_case(tmp_path, repo)) == ["FORBIDDEN"]


def test_an_html_comment_header_passes(tmp_path: Path) -> None:
    """The header and change notice may be written as <!-- ... --> comments, closing on the same line."""
    head = f"<!-- Adapted from {REPO} at 0123abc, src/a.ts, MIT. -->\n<!-- Changed for mods-expert-developer-plugin: re-keyed the store. -->\n"
    assert _case(tmp_path, head=head) == []


APACHE = ENTRY._replace(source="token-weather-usage", licence="Apache-2.0", licence_file="hooks/x/LICENSE-APACHE.txt", notice_file="hooks/x/NOTICE-upstream.txt")
APACHE_TEXT = f"Apache License\nVersion 2.0, January 2004\n\nTERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION\n\n...\n\nEND OF TERMS AND CONDITIONS\n\n{COPYRIGHT}\n"
UPSTREAM_NOTICE = "Example upstream\nCopyright 2026 Example Author\n"
# The licence file and the upstream NOTICE copy of the Apache entry, both tracked.
BOTH = ("hooks/x/LICENSE-APACHE.txt", "hooks/x/NOTICE-upstream.txt")


@pytest.mark.parametrize(
    ("notice_file_text", "carried", "licence_text", "listed", "kinds"),
    [
        pytest.param(UPSTREAM_NOTICE, True, APACHE_TEXT, BOTH, [], id="complete"),
        pytest.param(UPSTREAM_NOTICE, False, APACHE_TEXT, BOTH, ["NOTICE_TEXT"], id="notice-text-not-carried-into-NOTICE"),
        pytest.param(None, True, APACHE_TEXT, BOTH, ["NOTICE_TEXT"], id="no-upstream-notice-file"),
        pytest.param("  \n", True, APACHE_TEXT, BOTH, ["NOTICE_TEXT"], id="empty-upstream-notice-file"),
        pytest.param(UPSTREAM_NOTICE, True, APACHE_TEXT, (), ["LICENCE_FILE"], id="licence-and-notice-files-not-tracked"),
        pytest.param(UPSTREAM_NOTICE, True, APACHE_TEXT, BOTH[:1], ["NOTICE_TEXT"], id="notice-file-not-tracked"),
        pytest.param(UPSTREAM_NOTICE, True, APACHE_TEXT.replace("END OF TERMS AND CONDITIONS", ""), BOTH, ["LICENCE_TEXT"], id="apache-text-incomplete"),
    ],
)
def test_an_apache_file_ships_the_upstream_notice(
    tmp_path: Path, notice_file_text: str | None, carried: bool, licence_text: str, listed: tuple[str, ...], kinds: list[str]
) -> None:
    """An Apache-2.0 entry needs its full licence text with the copyright line, and the upstream NOTICE text both in its own tracked file and in NOTICE (section 4(d))."""
    (tmp_path / "hooks/x").mkdir(parents=True)
    (tmp_path / "hooks/x/LICENSE-APACHE.txt").write_text(licence_text, encoding="utf-8")
    if notice_file_text is not None:
        (tmp_path / "hooks/x/NOTICE-upstream.txt").write_text(notice_file_text, encoding="utf-8")
    (tmp_path / "hooks/x/a.ts").write_text(GOOD_HEAD.replace(", MIT.", ", Apache-2.0."), encoding="utf-8")
    notice = f"Intro.\n\n{CREDIT}\n" + (f"\n{UPSTREAM_NOTICE}" if carried else "")
    files = ["hooks/x/a.ts", *listed]
    assert _kinds(adapted_problems(tmp_path, {"hooks/x/a.ts": APACHE}, notice, files)) == kinds


@pytest.mark.parametrize(
    ("licence_file", "listed", "kinds"),
    [
        pytest.param("hooks/x/LICENSE.txt", True, [], id="tracked-and-published"),
        pytest.param("hooks/x/LICENSE.txt", False, ["LICENCE_FILE"], id="not-tracked"),
        pytest.param("docs_dev/LICENSE.txt", True, ["LICENCE_FILE"], id="in-a-dev-folder"),
        pytest.param("hooks/x/../x/LICENSE.txt", True, ["LICENCE_FILE"], id="named-through-a-parent-segment"),
    ],
)
def test_a_licence_file_must_ship(tmp_path: Path, licence_file: str, listed: bool, kinds: list[str]) -> None:
    """A licence file carries the obligations only when git tracks it at a published path named without ..; a file that is merely on disk does not ship."""
    (tmp_path / "hooks/x").mkdir(parents=True)
    (tmp_path / "docs_dev").mkdir()
    (tmp_path / "hooks/x/LICENSE.txt").write_text(MIT_BLOCK, encoding="utf-8")
    (tmp_path / "docs_dev/LICENSE.txt").write_text(MIT_BLOCK, encoding="utf-8")
    (tmp_path / "hooks/x/a.ts").write_text(GOOD_HEAD, encoding="utf-8")
    files = ["hooks/x/a.ts"] + ([licence_file] if listed else [])
    entry = ENTRY._replace(licence_file=licence_file)
    assert _kinds(adapted_problems(tmp_path, {"hooks/x/a.ts": entry}, f"Intro.\n\n{CREDIT}\n", files)) == kinds


def test_a_licence_with_no_known_full_text_fails() -> None:
    """A licence with no full-text markers cannot pass the licence-text check, and every licence LICENCES accepts has them."""
    assert _kinds(obligation_problems(Path("."), "hooks/x/a.ts", ENTRY, GOOD_NOTICE, "BSD-3-Clause", {"NOTICE"})) == ["LICENCE_TEXT"]
    assert set(excerpt_lock.LICENCES.values()) <= set(excerpt_lock.LICENCE_TEXT_MARKERS)


def test_a_markup_file_is_never_a_port(tmp_path: Path) -> None:
    """A markup entry, or a markup file in a port folder, is reported: CSS, SVG and HTML idioms would need a ruling first."""
    (tmp_path / "hooks/deck").mkdir(parents=True)
    head = GOOD_HEAD.replace("// ", "/* ").replace(".\n", ". */\n").replace("store.", "store")
    (tmp_path / "hooks/deck/style.css").write_text(head, encoding="utf-8")
    (tmp_path / "hooks/deck/icon.svg").write_text("<svg/>\n", encoding="utf-8")
    notice = GOOD_NOTICE.replace("hooks/x/a.ts", "hooks/deck/style.css")
    tracked = ["hooks/deck/style.css", "hooks/deck/icon.svg"]
    problems = adapted_problems(tmp_path, {"hooks/deck/style.css": ENTRY}, notice, tracked)
    assert sorted(_kinds(problems)) == ["KIND", "KIND"], problems


@pytest.mark.parametrize(
    "claim",
    [
        f"// Adapted from {REPO}, src/b.ts (MIT)",
        f"/* Adapted from {REPO} at 0123abc, src/b.ts, MIT. */",
        f" * Adapted from {REPO}",
        f"# Adapted from {REPO}",
        f"## Adapted from {REPO}",
        f"<!-- Adapted from {REPO} -->",
        f"- Adapted from {REPO}",
        f"> Adapted from {REPO}",
    ],
)
def test_an_unregistered_claim_is_reported(tmp_path: Path, claim: str) -> None:
    """A tracked file whose header says it is adapted, in any comment or Markdown form, needs an entry."""
    assert _kinds(_case(tmp_path, extra=f"{claim}\nexport const b = 2\n")) == ["UNREGISTERED"]


def test_a_registered_file_that_is_gone_is_reported(tmp_path: Path) -> None:
    """An entry whose file does not exist is reported, so the registry cannot keep a stale entry."""
    assert _kinds(adapted_problems(tmp_path, {"hooks/x/a.ts": ENTRY}, GOOD_NOTICE, [])) == ["MISSING"]


def test_tests_design_and_dev_folders_are_not_read_for_claims(tmp_path: Path) -> None:
    """A claim of adaptation under tests/, design/ or a *_dev folder at any depth needs no entry: those trees hold this check's fixtures, the cards and unpublished scratch."""
    paths = ["tests/fixtures/a.ts", "design/specs/a.ts", "docs_dev/a.ts", "hooks/x_dev/a.ts"]
    for rel in paths:
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_text(f"// Adapted from {REPO} at 0123abc, src/a.ts, MIT.\n", encoding="utf-8")
    assert adapted_problems(tmp_path, {}, GOOD_NOTICE, paths) == []


@pytest.mark.parametrize(("rel", "kinds"), [("docs_dev/a.ts", ["NOT_SHIPPED"]), ("hooks/x_dev/a.ts", ["NOT_SHIPPED"]), ("tests/x/a.ts", [])])
def test_an_entry_in_an_unpublished_folder_is_reported(tmp_path: Path, rel: str, kinds: list[str]) -> None:
    """An entry in a *_dev folder, at any depth, is reported: it is never published. An entry under tests/ is published and allowed."""
    (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
    (tmp_path / rel).write_text(GOOD_HEAD, encoding="utf-8")
    assert _kinds(adapted_problems(tmp_path, {rel: ENTRY}, f"- {rel}, adapted from {REPO}.\n\n{MIT_BLOCK}", [rel])) == kinds


def test_a_binary_file_is_not_read_for_a_claim(tmp_path: Path) -> None:
    """A tracked file with a binary extension, in any letter case, is not read for an "Adapted from" line, so its bytes cannot raise a claim."""
    (tmp_path / "assets").mkdir()
    for name in ("logo.png", "LOGO.PNG"):
        (tmp_path / "assets" / name).write_bytes(f"// Adapted from {REPO} at 0123abc, {name}, MIT.\n".encode())
    assert adapted_problems(tmp_path, {}, GOOD_NOTICE, ["assets/logo.png", "assets/LOGO.PNG"]) == []
