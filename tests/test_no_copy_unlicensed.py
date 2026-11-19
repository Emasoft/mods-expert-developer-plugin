"""Committed no-copy test for the forbidden sources: mods with no licence, or a licence incompatible with MIT (TRDD-K10C193B, TRDD-R2GILGKU).

What is scanned: every file git tracks outside tests/ and design/ (why: below).
- Every *.md file and NOTICE, whole, for word runs and line runs.
- The prose of code and data files, for word runs only: the comments, Python's triple-quoted strings (docstrings) and
  any other string literal of 8 or more words, alone or joined to the literals next to it (side by side in Python, or
  added with + in Python, TS and JS), in .ts, .tsx, .js, .mjs, .py and .sh files; the text between JSX tags in .tsx
  files; in shell, also echo arguments of 8 or more words and here-document bodies; the string values (not the keys) of
  .json files; what follows each key or list dash in .yaml and .yml files (values, block scalars and comments), where a
  run: value is read as a shell script; the comments and string values (not the keys) of .toml files; the comments of
  .gitignore; and .txt files whole. Each is read through a view that blanks the rest but keeps the newlines, so a hit
  names the file's real line. A sentence split around a variable, a join call or separate print arguments is not
  joined, so it escapes the 8-word threshold: the check guards against accidental copying by this plugin's own authors
  and agents, not against deliberate evasion.
- Not scanned: generated lock files (excerpt_lock.LOCK_FILES), files with a binary extension
  (excerpt_lock.BINARY_EXTENSIONS; a test requires each to hold a NUL byte in its first 8000 bytes, git's own binary
  test, so a text file cannot ship unread under a binary name), the NOT_PROSE files, each named by its full path with
  its reason (the LICENSE files, .python-version), and, per file, the verbatim third-party copies of
  excerpt_lock.THIRD_PARTY_FILES (the BeLazy167 example files and the CPV canonical files). A test requires each copy to
  hold the content its entry records (sha256), NOTICE to name each copied file's own path with its repository, and each
  CPV file to carry its template's header line. Another requires every tracked file outside tests/ and design/ to be
  read or left out by one of these rules, so a file of a kind no reader knows fails instead of shipping unread.
- tests/ and design/ are tracked, so a plugin installed from its repository carries them; they are left out for
  measured reasons (2026-11-01, with these readers). design/ quotes sources by design, as analysis records: 8 hits in 2
  cards. tests/ carries code as data: 88 hits (9 ranges in 3 files), each one code inside a prose-shaped container (a
  stand-in git script in a triple-quoted string, mod code in a .txt fixture, a shell line planted in a negative case),
  none copied prose; scanning it would mean rewriting fixtures to dodge the detector.
- Every *_dev folder and every reports/ folder are ignored by .gitignore, so only a force-add tracks a file there, and a
  test fails on any tracked file in one, so it cannot ship unscanned. (The scan itself also leaves *_dev folders out,
  and reads a reports/ folder like any other.)
Why this scope (measured 2026-11-01): a scan of every tracked text file, code included, found no hit in any Markdown
file and 365 ranges in code, configuration and lock files, nearly all shared idioms (import blocks, the __main__ guard,
closing braces, test harness calls, npm lock fields); the one real overlap was a comment that shared 10 words with a
token-optimizer comment. Copied expression in code shows in its prose, so the prose of code is what is compared. Copied
code structure (the same logic under other names and other comments) is not detected by text runs: review has to catch
it, this test cannot.

Each source is a forbidden mod of excerpt_lock.FORBIDDEN at every version its authors read, pinned to a public commit
in excerpt_lock.NO_COPY_SOURCES and read with git at that commit. A source folder holds the whole repository at its
commit, which may be more than the installed plugin (a superset of its files).
`uv run scripts/fetch_no_copy_sources.py` fetches them into downloads_dev/no-copy-sources/, on any machine and on CI;
a source that is not there fails (never skips) and names that command. A forbidden mod with no public source is named
with its reason in excerpt_lock.NO_COPY_AVAILABLE, and a meta-test requires pins or a reason for every forbidden mod.
A shared run of 8 or more consecutive words (lower-cased, punctuation stripped) or of 3 or more consecutive identical
non-blank lines (whitespace normalised) fails, reported as file:line on both sides, with overlapping hits of one file
pair merged into one range. Public API names are not excused when 8 or more words in a row match.

Exemptions, and there are no others and no name list:
- Fragment rule (owner ruling 2026-11-01): a word window counts only when at least 4 of its 8 tokens have 3 or more
  characters, so pieces of a regex character class ("a za z0 9") are not a copy. Line runs are unchanged.
- A 3-line run with no word character at all (stacked closing brackets) holds no expression and is not reported.
- Prior art: a run that also occurs in Anthropic's documentation is not the source's expression (the repos copied their
  API example text from it). Prior art is the text at the baseline commit e7b7df2 (the last commit before the corpus
  was cloned), read by blob hash from tests/fixtures/no-copy-baseline-chapters.txt, never from the live files: the
  Anthropic chapters named by NOTICE (every mods-doc chapter but the one original text) plus
  .claude-plugin/types/**/*.d.ts. The live chapters are scanned like every other shipped file, so they can hit only
  through text added after e7b7df2. The types are generated and gitignored; where they are absent (CI) the scan runs
  without them, which can only report more, and a failure then says so.
- Licensed excerpts: a hit whose shipped-side lines all lie inside one excerpt block ("### <mod> <version>,
  <file>:a-b, <licence>") is not reported when the mod is in excerpt_lock.LICENCES and not in FORBIDDEN, and the
  block's lines hash to its entry in the committed excerpt lock (no cache is read). Reference-module blocks and prose
  never qualify. This rests on the licensor's grant: a licensed mod that itself copied from a forbidden source would
  pass here.
- Markup idioms (orchestrator ruling 1 of 2026-11-04 as re-keyed by its corrections 2 and 3, TRDD-0M2WY8KD): a word run of
  a shipped code file is not reported when it lies wholly inside one occurrence of an IDIOM_PHRASES phrase that
  IDIOM_EXEMPTIONS lists for that file. Each entry names the destination path, the normalized phrase and its exact number
  of occurrences, and test_each_idiom_exemption_matches_its_file asserts all three, so a new occurrence, a new file or a
  phrase outside the closed set fails. The normalization rule is written beside IDIOM_PHRASES. The table lives here, in
- Licence blocks: a hit whose shipped-side lines all lie inside a block of consecutive lines whose normalised
  word sequence occurs contiguously inside excerpt_lock.MIT_PERMISSION_SENTENCES is not reported. The class is
  content-keyed (the MIT permission wording, not a path) and sequence-exact (order and adjacency matter, so a
  bag-of-words test would excuse ordinary prose), and a block must hold WORD_RUN tokens.

The sources are untrusted data: they are only read with git, never checked out or run. Standard library plus pytest.
"""

from __future__ import annotations

import functools
import hashlib
import importlib.util
import io
import json
import os
import re
import subprocess
from collections.abc import Callable, Iterable
from pathlib import Path
from tokenize import COMMENT, FSTRING_END, FSTRING_START, NL, OP, STRING, generate_tokens
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parent.parent
_SPEC = importlib.util.spec_from_file_location("excerpt_lock_registry", ROOT / "scripts" / "excerpt_lock.py")
assert _SPEC is not None and _SPEC.loader is not None
excerpt_lock = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(excerpt_lock)
# Every forbidden source the test reads: each mod's public commits (NO_COPY_SOURCES), fetched by FETCH below. A forbidden
# mod with none is named in NO_COPY_AVAILABLE with its reason.
SOURCES = [
    pytest.param(mod, pin, id=f"{mod}@{pin.version}")
    for mod in sorted(excerpt_lock.FORBIDDEN & excerpt_lock.NO_COPY_SOURCES.keys())
    for pin in excerpt_lock.NO_COPY_SOURCES[mod]
]
WORD_RUN = 8
LINE_RUN = 3
# Fragment rule (owner ruling 2026-11-01, "yes, ignore fragments."): a word window counts only when at least
# MIN_LONG_TOKENS of its WORD_RUN tokens have LONG_TOKEN or more characters. Pieces of regex character classes
# ("a za z0 9") or hex digits are not expression. Line runs are not affected.
MIN_LONG_TOKENS = 4
LONG_TOKEN = 3
MAX_REPORTED = 20
BINARY_EXTENSIONS = excerpt_lock.BINARY_EXTENSIONS  # one list for the clones and the no-copy sources
# Baseline commit: the last commit before the 18-repo corpus was cloned; prior art is its chapter text only.
BASELINE = "e7b7df2"
# The chapters at BASELINE, pinned by blob hash, because the 1.0.0 squash removed BASELINE from public history.
BASELINE_CHAPTERS = ROOT / "tests" / "fixtures" / "no-copy-baseline-chapters.txt"
# Provenance source: NOTICE states that EVERY skills/*/references/chapter.md is adapted from Anthropic's Claude Code
# documentation (https://code.claude.com/docs), copyright Anthropic, with ONE exception, the original Emasoft text below.
# So the prior art is every skills/mods-doc-*/references/chapter.md present at BASELINE except that one.
ORIGINAL_CHAPTER = "skills/mods-doc-run-background-sessions/references/chapter.md"

Words = list[tuple[str, int]]  # (word, 1-based line number)
Lines = list[tuple[str, int]]  # (normalised non-blank line, 1-based line number)
URL = re.compile(r"\b[a-z][a-z0-9+.-]*://\S+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}/\S*")  # a scheme URL, or a bare host path such as github.com/owner/repo
BREAK = "\n"  # stands where a URL was removed; no window may span it (no real word holds a newline)


def _words(text: str) -> Words:
    """Return the lower-cased words of a text with each URL removed and replaced by BREAK, because a URL is a name, not expression, and the words on either side of it must not join into one run."""
    out: Words = []
    for no, line in enumerate(text.splitlines(), 1):
        for k, piece in enumerate(URL.split(line.lower())):
            if k:
                out.append((BREAK, no))
            out.extend((w, no) for w in re.sub(r"[^\w\s]", " ", piece).split())
    return out


def _lines(text: str) -> Lines:
    norm = ((" ".join(line.split()), no) for no, line in enumerate(text.splitlines(), 1))
    return [(s, no) for s, no in norm if s]


def _counts(window: tuple[str, ...]) -> bool:
    """Return True when a word window counts under the fragment rule (MIN_LONG_TOKENS of its tokens have LONG_TOKEN+ characters) and does not span a removed URL."""
    return BREAK not in window and sum(len(token) >= LONG_TOKEN for token in window) >= MIN_LONG_TOKENS


KINDS = (("words", WORD_RUN, _words), ("lines", LINE_RUN, _lines))


def _windows(texts: Iterable[str], size: int, tokenize: Callable[[str], list[tuple[str, int]]]) -> set[tuple[str, ...]]:
    """Return every window of `size` consecutive tokens of the given texts."""
    out: set[tuple[str, ...]] = set()
    for text in texts:
        items = tokenize(text)
        out.update(tuple(s for s, _ in items[i : i + size]) for i in range(len(items) - size + 1))
    return out


def find_hits(
    refs: dict[str, str],
    sources: dict[str, str],
    prior: dict[str, str] | None = None,
    excused: dict[str, set[int]] | None = None,
    kinds: tuple[str, ...] = ("words", "lines"),
    idioms: dict[str, list[tuple[str, ...]]] | None = None,
    licence: dict[str, list[set[int]]] | None = None,
) -> list[str]:
    """Return one message per shared word run or line run between the references and the source files.

    Overlapping hits of the same file pair (same alignment) are merged into one range. A line run made only of
    punctuation (stacked closing brackets) holds no word and is not copyable content, so it is not reported, and a word
    window that fails the fragment rule (_counts) is not counted. A run that also occurs in any text of `prior`
    (Anthropic's bundled documentation, the MIT licence wording every MIT project shares) is prior art, not the source's
    expression, and is not reported either. A merged
    run whose reference-side lines all lie in `excused` (file -> line numbers of lock-verified licensed excerpt blocks,
    see _licensed_excerpt_lines) is not reported. A merged run whose shipped-side lines all lie inside one `licence`
    block (file -> line-number blocks of MIT permission wording, from _licence_lines) is not reported. A merged word
    run that lies wholly inside one occurrence of a phrase `idioms` lists for its reference file (file -> phrases as
    word tuples, from IDIOM_EXEMPTIONS) is not reported. Only the run kinds named in `kinds` ("words", "lines") are
    looked for.
    """
    found: list[tuple[str, int, str, int, str]] = []
    for kind, size, tokenize in [k for k in KINDS if k[0] in kinds]:
        src_items = {name: tokenize(text) for name, text in sources.items()}
        known = _windows((prior or {}).values(), size, tokenize)
        index: dict[tuple[str, ...], list[tuple[str, int]]] = {}
        for sname, items in src_items.items():
            for j in range(len(items) - size + 1):
                index.setdefault(tuple(s for s, _ in items[j : j + size]), []).append((sname, j))
        for name, text in refs.items():
            items = tokenize(text)
            # The (first, last) token indexes of each occurrence of an idiom phrase listed for this file; word runs only.
            spans = _phrase_spans(items, (idioms or {}).get(name, [])) if kind == "words" else []
            # (source, alignment) -> start index of each matching window, ascending.
            diagonals: dict[tuple[str, int], list[int]] = {}
            for i in range(len(items) - size + 1):
                key = tuple(s for s, _ in items[i : i + size])
                if key in known or (kind == "lines" and not re.search(r"\w", "".join(key))) or (kind == "words" and not _counts(key)):
                    continue
                for sname, j in index.get(key, []):
                    diagonals.setdefault((sname, j - i), []).append(i)
            for (sname, shift), starts in diagonals.items():
                runs = [[starts[0], starts[0]]]
                for i in starts[1:]:
                    if i < runs[-1][1] + size:  # the window overlaps the previous one
                        runs[-1][1] = i
                    else:
                        runs.append([i, i])
                for first, last in runs:
                    end = last + size - 1
                    # Excused only when every reference-side line of the merged run is inside a qualifying excerpt block,
                    # so a run reaching into a heading, a fence line or prose is still reported.
                    if set(range(items[first][1], items[end][1] + 1)) <= (excused or {}).get(name, set()):
                        continue
                    # A licence-block excuse: the run's shipped-side lines all lie inside ONE block of consecutive
                    # lines whose word sequence occurs contiguously in the MIT permission wording. Sequence-keyed and
                    # block-scoped on purpose: a bag-of-words test would excuse ordinary prose, and a per-line union
                    # would excuse a run that merely starts and ends in MIT text.
                    if any(
                        set(range(items[first][1], items[end][1] + 1)) <= block
                        for block in (licence or {}).get(name, [])
                    ):
                        continue
                    # A markup idiom excuses only a run wholly inside one occurrence of its phrase, so a run reaching one
                    # word past the phrase, or the phrase in a file with no entry, is still reported.
                    if any(start <= first and end <= stop for start, stop in spans):
                        continue
                    src = src_items[sname]
                    text_start = " ".join(s for s, _ in items[first : first + size]) if kind == "words" else items[first][0]
                    found.append(
                        (
                            name,
                            items[first][1],
                            sname,
                            src[first + shift][1],
                            f"{name}:{items[first][1]}-{items[end][1]} shares {end - first + 1} {kind} with "
                            f"{sname}:{src[first + shift][1]}-{src[end + shift][1]}: {text_start}",
                        )
                    )
    return [msg for *_, msg in sorted(found)]


def _phrase_spans(items: list[tuple[str, int]], phrases: Iterable[tuple[str, ...]]) -> list[tuple[int, int]]:
    """Return the (first, last) token indexes of every occurrence of each phrase among the tokens of a text."""
    words = [s for s, _ in items]
    out: list[tuple[int, int]] = []
    for phrase in phrases:
        n = len(phrase)
        out.extend((i, i + n - 1) for i in range(len(words) - n + 1) if tuple(words[i : i + n]) == phrase)
    return out


# Markup idioms (orchestrator ruling 1 of 2026-11-04, re-keyed by its corrections 2 and 3; recorded on TRDD-0M2WY8KD).
# Each phrase is a markup idiom a ported file shares with a forbidden source; the scan reports it, and an entry of
# IDIOM_EXEMPTIONS excuses it in one named file only.
# Normalization, the scan's own for word runs (_words): a file is read through its prose view (_prose_view); every URL is
# removed; the text is lower-cased; every character that is not a letter, a digit, an underscore or whitespace becomes a
# space; what is left is split on whitespace. A phrase is those words joined by single spaces, and a run is excused only
# when every one of its words lies inside one occurrence of a phrase listed for its file.
# The set is closed (test_the_idiom_phrases_are_exactly_the_ruled_set). Each value is the phrase's provenance note, which
# a new phrase needs together with a ruling. Measured 2026-11-04 against all five token-optimizer pins (5.13.58 to
# 5.13.63): each pin shares exactly these runs with upstream Deck 0.4.12 hooks/styles-desktop.js and Tokensaver 0.5.1
# src/ui/band.ts and src/ui/clawd.ts, each run once in its file. A run is matched in the prose view, so a port that separates or
# reorders the literals a phrase spans changes the run, and the COUNT check of its entry then fails.
# cspell:ignore segoe vitest linecap linejoin reown appkit attributename roboto  (the idiom phrases, their provenance, the test fixtures)
IDIOM_PHRASES: dict[str, str] = {
    "ui sans serif system ui apple system segoe ui": (
        "a CSS system-font stack; its first 7 words are also in @vitest/ui 4.0.18 (MIT), dist/client/assets/index-DlhE0rqZ.css,"
        " where BlinkMacSystemFont comes before Segoe UI, so the 9-word run is not (checked 2026-11-04)"
    ),
    "stroke linecap round stroke linejoin round text x": (
        "SVG stroke attributes and the start of the next text element; the first 6 words are also in @reown/appkit-ui 1.8.9,"
        " dist/esm/src/assets/visual/pencil.js, where no text element follows, so the 8-word run is not (checked 2026-11-04)"
    ),
    "animate attributename opacity values 0 1 dur 0": (
        "an SVG SMIL fade (a one-shot 0.35 s fade with fill freeze); provenance unknown, on the owner's list (corrections 2 and 3)"
    ),
    "claude plugin types claude code index d ts": (
        "the generated-types file path .claude-plugin/types/claude-code/index.d.ts that both files name independently as the generated-types path;"
        " token-optimizer's typecheck-engine.mjs names the same path (desktop/token-optimizer-desktop/scripts/typecheck-engine.mjs:35),"
        " so the 8-word run is the API path, not copied expression (checked 2026-11-10)"
    ),
}
# Destination path of a shipped code file -> {phrase: exact number of its occurrences in the file's prose view}. Each port adds
# the entries of its own files in the same commit as the files: the Deck port's here (TRDD-RD1ISPMN), measured with this test's
# own readers on the ported file; the Tokensaver port adds its own.
IDIOM_EXEMPTIONS: dict[str, dict[str, int]] = {
    "hooks/deck/styles-desktop.js": {"stroke linecap round stroke linejoin round text x": 1},
    "hooks/mod-manager/cli.ts": {"claude plugin types claude code index d ts": 1},
    # The Tokensaver port's (TRDD-71KVH9PA): ui/band.ts keeps upstream src/ui/band.ts's two runs, ui/draw.ts the font stack of
    # src/ui/clawd.ts's shared stylesheet, which keeps its first line as upstream wrote it.
    "hooks/tokensaver/ui/band.ts": {"ui sans serif system ui apple system segoe ui": 1, "animate attributename opacity values 0 1 dur 0": 1},
    "hooks/tokensaver/ui/draw.ts": {"ui sans serif system ui apple system segoe ui": 1},
}
# Only shipped code files may carry an exemption (correction 3, point 4): never Markdown, NOTICE, docs, tests or design/.
IDIOM_CODE_EXTENSIONS = frozenset({"ts", "tsx", "js", "mjs", "py", "sh"})
IDIOM_UPDATE = (
    "To update an entry, set IDIOM_EXEMPTIONS[path][phrase] in tests/test_no_copy_unlicensed.py to the count found, after"
    " reading each occurrence and finding it is the idiom and not copied text. A new phrase or a new file needs a ruling,"
    " and a new phrase needs its provenance note in IDIOM_PHRASES."
)


def _idioms(exemptions: dict[str, dict[str, int]]) -> dict[str, list[tuple[str, ...]]]:
    """Return, per exempted file, its phrases as word tuples, the form find_hits takes."""
    return {rel: [tuple(phrase.split()) for phrase in counts] for rel, counts in exemptions.items()}


def _idiom_problems(texts: dict[str, str], views: dict[str, str], exemptions: dict[str, dict[str, int]], phrases: dict[str, str]) -> list[str]:
    """Return one line per exemption that does not hold: a path that is not a shipped code file read through its prose view, a phrase outside the closed set, or a count that differs from the file's."""
    out: list[str] = []
    for rel, counts in sorted(exemptions.items()):
        name = rel.rsplit("/", 1)[-1]
        ext = name.rsplit(".", 1)[1].lower() if "." in name else ""
        if rel in texts or rel not in views or ext not in IDIOM_CODE_EXTENSIONS:
            out.append(f"PATH {rel}: not a shipped code file the scan reads through its prose view, the only kind an idiom exemption may name. {IDIOM_UPDATE}")
            continue
        items = _words(views[rel])
        for phrase, want in sorted(counts.items()):
            if phrase not in phrases:
                out.append(f"PHRASE {rel}: {phrase!r} is not in IDIOM_PHRASES. {IDIOM_UPDATE}")
                continue
            got = len(_phrase_spans(items, [tuple(phrase.split())]))
            if got != want:
                out.append(f"COUNT {rel}: {phrase!r} occurs {got} time(s), the entry says {want}. {IDIOM_UPDATE}")
    return out


# Prose views (TRDD-R2GILGKU T1, G2, G4). A code or data file is compared through a view that keeps its prose and blanks
# every other character except newlines, so a run found in a view names the file's real line. Prose is: comments; in
# Python, triple-quoted strings (docstrings); any other string literal, or run of literals the language joins (side by
# side in Python, + in Python, TS and JS), of MIN_STRING_WORDS or more words; JSX text in .tsx; in shell, echo arguments
# of MIN_STRING_WORDS or more words and here-document bodies; in JSON, string values (not keys); in YAML, what follows
# each key or list dash (values, block scalars and comments), with a run: value read as a shell script; in TOML,
# comments and string values (not keys); in .gitignore, comments.
MIN_STRING_WORDS = WORD_RUN
Span = tuple[int, int]
# A "/" after one of these tokens (or at the start) opens a regular expression literal; after anything else it divides.
REGEX_AFTER = frozenset("(,=:[!&|?{};+-*%<>~^") | frozenset(
    {"", "return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await", "instanceof"}
)


def _word_count(text: str) -> int:
    return sum(w != BREAK for w, _ in _words(text))


def _mask(text: str, spans: Iterable[Span]) -> str:
    """Return the text with every character outside the spans blanked to a space, newlines kept."""
    out = [c if c == "\n" else " " for c in text]
    for a, b in spans:
        out[a:b] = text[a:b]
    return "".join(out)


def _js_spans(text: str, jsx: bool = False) -> list[Span]:
    """Return the comments, and the string and template literals of TS or JS code that hold MIN_STRING_WORDS or more words alone or joined by + to the literals next to them (a long message is often written as short literals added together); with jsx, also the text between JSX tags.

    A small scanner, not a parser: a string or template is skipped as a unit, so a // inside it opens no comment; a
    regular expression literal is skipped as a unit when the token before its / allows one (REGEX_AFTER) and it closes on
    its line with a / that does not open a comment (else the / divides); ++, -- and a postfix ! (TS's non-null assertion)
    end an operand, so a / after them divides; a template's ${...} is read as code (a nested template included), and its
    text pieces count as one literal. With jsx (a .tsx file), a < where an expression may start that reads as a JSX tag
    opens an element: its text is kept and its {...} children are read as code.
    """
    spans: list[Span] = []
    # Each string or template literal read: (where it starts, where it ends, the spans of its text).
    units: list[tuple[int, int, list[Span]]] = []
    n = len(text)
    # The text the scanner left for a {...} of code, innermost last: (` for a template's ${...} or < for a JSX child's
    # {...}, the template's text pieces so far, [open braces in the code], where the template starts or how many JSX
    # elements are open).
    open_texts: list[tuple[str, list[Span], list[int], int]] = []

    def template(start: int, pieces: list[Span], opened: int) -> int:
        """Read template text from start; return the index after its closing backtick or after a ${ it opens."""
        k = start
        while k < n and text[k] != "`" and not text.startswith("${", k):
            k += 2 if text[k] == "\\" else 1
        pieces.append((start, min(k, n)))
        if k < n and text[k] == "$":
            open_texts.append(("`", pieces, [0], opened))
            return k + 2
        units.append((opened, k + 1, pieces))
        return k + 1

    def jsx_tag(start: int) -> tuple[int, bool] | None:
        """Read a JSX tag from the < at start; return (the index after its >, whether it closes itself), or None when it is not one (a generic, a comparison)."""
        name = JSX_NAME.match(text, start + 1)
        k = name.end() if name else start + 1
        if k < n and not (text[k].isspace() or text[k] in "/>"):
            return None
        while k < n:
            c = text[k]
            if text.startswith("/>", k):
                return k + 2, True
            if c == ">":
                return k + 1, False
            if c in "'\"":
                k = text.find(c, k + 1)
                if k < 0:
                    return None
            elif c == "{":
                depth = 1
                while depth and k + 1 < n:
                    k += 1
                    depth += {"{": 1, "}": -1}.get(text[k], 0)
                if depth:
                    return None
            elif not (c.isspace() or c.isalnum() or c in "_$-:.="):
                return None
            k += 1
        return None

    def jsx_children(start: int, elements: int) -> tuple[int, bool]:
        """Read JSX children from start, keeping their text; return (the index after the tag that closes the last open element, or after a { that opens code, and whether it was a {)."""
        k = start
        while k < n:
            first = k
            while k < n and text[k] not in "<{":
                k += 1
            spans.append((first, k))
            if k == n:
                break
            if text[k] == "{":
                open_texts.append(("<", [], [0], elements))
                return k + 1, True
            if text.startswith("</", k):
                k = text.find(">", k) + 1 or n
                elements -= 1
                if not elements:
                    return k, False
            elif (tag := jsx_tag(k)) is None:
                k += 1  # a < that opens no tag is text
            else:
                k, closed = tag
                elements += 0 if closed else 1
        return n, False

    i, prev = 0, ""
    while i < n:
        c = text[i]
        if c.isspace():
            i += 1
        elif text.startswith("//", i):
            end = text.find("\n", i)
            end = n if end < 0 else end
            spans.append((i + 2, end))
            i = end
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            end = n if end < 0 else end
            spans.append((i + 2, end))
            i = end + 2
        elif c == "/" and prev in REGEX_AFTER:
            k, in_class = i + 1, False
            while k < n and text[k] != "\n" and (in_class or text[k] != "/"):
                if text[k] == "\\":
                    k += 1
                elif text[k] in "[]":
                    in_class = text[k] == "["
                k += 1
            # A regular expression closes on its line, and its closing / is not the start of a comment; otherwise this
            # / divides (after an object literal's } or a postfix !), and a comment later on the line stays a comment.
            if k < n and text[k] == "/" and not text.startswith(("//", "/*"), k):
                i, prev = k + 1, "regex"
            else:
                i, prev = i + 1, c
        elif c in "'\"":
            k = i + 1
            while k < n and text[k] not in (c, "\n"):
                k += 2 if text[k] == "\\" else 1
            units.append((i, k + 1, [(i + 1, k)]))
            i, prev = k + 1, "string"
        elif c == "`" or (c == "}" and open_texts and open_texts[-1][2][0] == 0):
            if c == "`":
                i = template(i + 1, [], i)
                prev = "{" if text[i - 2 : i] == "${" else "string"
            else:
                kind, pieces, _, held = open_texts.pop()
                if kind == "`":
                    i = template(i + 1, pieces, held)
                    prev = "{" if text[i - 2 : i] == "${" else "string"
                else:
                    i, code = jsx_children(i + 1, held)
                    prev = "{" if code else "jsx"
        elif c in "{}":
            if open_texts:
                open_texts[-1][2][0] += 1 if c == "{" else -1
            i, prev = i + 1, c
        elif c == "<" and jsx and prev in REGEX_AFTER and (tag := jsx_tag(i)) is not None:
            i, closed = tag
            if closed:
                prev = "jsx"
            else:
                i, code = jsx_children(i, 1)
                prev = "{" if code else "jsx"
        elif c.isalnum() or c in "_$":
            k = i
            while k < n and (text[k].isalnum() or text[k] in "_$"):
                k += 1
            i, prev = k, text[i:k]
        elif text.startswith(("++", "--"), i):
            i, prev = i + 2, "++"
        elif c == "!" and i and not text[i - 1].isspace() and prev not in REGEX_AFTER and not text.startswith("!=", i):
            i, prev = i + 1, "postfix!"
        else:
            i, prev = i + 1, c
    spans.extend(_joined_prose(text, units, JS_JOIN))
    return spans


# What may stand between two literals that JS and TS join: one + and whitespace.
JS_JOIN = re.compile(r"\s*\+\s*")
# A JSX tag name: an element, a component, a member (a.b) or a namespaced name (a:b); none for a fragment (<>).
JSX_NAME = re.compile(r"[A-Za-z_$][\w$.:-]*")


def _joined_prose(text: str, units: list[tuple[int, int, list[Span]]], join: re.Pattern[str]) -> list[Span]:
    """Return the text spans of every run of literals that holds MIN_STRING_WORDS or more words in all.

    Each unit is (start, end, text spans) of one literal; two units in a row belong to one run when only what `join`
    matches stands between them. A literal inside another one's ${...} is judged alone and leaves that run as it was.
    """
    out: list[Span] = []
    run: list[Span] = []
    last = -1
    for start, end, pieces in sorted(units):
        if start < last:  # inside the ${...} of the literal read before it
            if _word_count(" ".join(text[a:b] for a, b in pieces)) >= MIN_STRING_WORDS:
                out.extend(pieces)
            continue
        if run and not join.fullmatch(text, last, start):
            if _word_count(" ".join(text[a:b] for a, b in run)) >= MIN_STRING_WORDS:
                out.extend(run)
            run = []
        run.extend(pieces)
        last = end
    if _word_count(" ".join(text[a:b] for a, b in run)) >= MIN_STRING_WORDS:
        out.extend(run)
    return out


def _py_spans(text: str) -> list[Span]:
    """Return the comments, the triple-quoted strings (docstrings) and the string literals of Python code that hold MIN_STRING_WORDS or more words alone or joined to the literals next to them (written side by side, which Python joins, or added with +), read with tokenize."""
    starts = [0]
    for line in text.splitlines(keepends=True):
        starts.append(starts[-1] + len(line))

    def offset(pos: tuple[int, int]) -> int:
        return starts[pos[0] - 1] + pos[1]

    def triple(literal: str) -> bool:
        return literal.lstrip("rRbBuUfF")[:3] in ('"""', "'''")

    def prose(literals: list[Span]) -> bool:
        return any(triple(text[a:b]) for a, b in literals) or _word_count(" ".join(text[a:b].lstrip("rRbBuUfF") for a, b in literals)) >= MIN_STRING_WORDS

    spans: list[Span] = []
    run: list[Span] = []  # the top-level literals read since the last token that is not a literal, a + after one, a comment or a line break
    plus = False  # the run's last literal is followed by a +
    fstring_starts: list[int] = []
    for tok in generate_tokens(io.StringIO(text).readline):
        if tok.type == FSTRING_START:
            fstring_starts.append(offset(tok.start))
        elif tok.type == FSTRING_END:
            literal = (fstring_starts.pop(), offset(tok.end))
            if fstring_starts:  # an f-string inside another one's {...} is judged alone
                spans.extend([literal] if prose([literal]) else [])
            else:
                run.append(literal)
                plus = False
        elif fstring_starts:  # what stands inside an f-string's {...} is judged alone
            if tok.type == COMMENT or (tok.type == STRING and prose([(offset(tok.start), offset(tok.end))])):
                spans.append((offset(tok.start), offset(tok.end)))
        elif tok.type == COMMENT:
            spans.append((offset(tok.start), offset(tok.end)))
        elif tok.type == STRING:
            run.append((offset(tok.start), offset(tok.end)))
            plus = False
        elif tok.type == OP and tok.string == "+" and run and not plus:
            plus = True
        elif tok.type != NL:
            spans.extend(run if prose(run) else [])
            run, plus = [], False
    spans.extend(run if prose(run) else [])
    return spans

def _sh_spans(text: str) -> list[Span]:
    """Return the prose of a shell script: its comments, its quoted strings and echo arguments of MIN_STRING_WORDS or more words, and its here-document bodies.

    A # opens a comment only at the start of a word, so $# and ${#x} do not. An echo is read where a command starts (a
    line's start, after ; & | ( { or after then, do or else), up to the end of its command, quoted parts included. A
    here-document (<<WORD, <<-WORD, <<'WORD') runs from the next line to the line that holds only WORD; its indent is
    ignored, since a run: script in YAML is indented as a whole. A << with no such line is not a here-document.
    """
    spans: list[Span] = []
    jumps: dict[int, int] = {}  # the newline before a here-document body: where the scan resumes after it
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if i in jumps:
            i = jumps.pop(i)
        elif c == "\\":
            i += 2
        elif c == "#" and (i == 0 or text[i - 1] in " \t\n;&|()"):
            end = text.find("\n", i)
            end = n if end < 0 else end
            spans.append((i + 1, end))
            i = end
        elif c in "'\"":
            k = i + 1
            while k < n and text[k] != c:
                k += 2 if c == '"' and text[k] == "\\" else 1
            if _word_count(text[i + 1 : k]) >= MIN_STRING_WORDS:
                spans.append((i + 1, k))
            i = k + 1
        elif (doc := SH_HEREDOC.match(text, i)) and text[i - 1 : i] != "<":
            body = text.find("\n", doc.end()) + 1 or n
            line = body
            while line < n and text[line : text.find("\n", line) % (n + 1)].strip() != doc.group(3):
                line = text.find("\n", line) + 1 or n
            if line < n:
                spans.append((body, line))
                jumps[body - 1] = text.find("\n", line) + 1 or n
            i = doc.end()
        elif text.startswith("echo", i) and SH_ECHO_START.search(text[text.rfind("\n", 0, i) + 1 : i]) and text[i + 4 : i + 5] in (" ", "\t"):
            k = i + 4
            while k < n and text[k] not in "\n;&|<>" and not (text[k] == "#" and text[k - 1] in " \t"):
                if text[k] in "'\"":
                    k = text.find(text[k], k + 1) % (n + 1)
                k += 2 if text[k : k + 1] == "\\" else 1
            k = min(k, n)
            if _word_count(text[i + 4 : k]) >= MIN_STRING_WORDS:
                spans.append((i + 4, k))
            i += 4
        else:
            i += 1
    return spans


# A here-document operator and its delimiter word, quoted or not: <<EOF, <<-EOF, << 'EOF'.
SH_HEREDOC = re.compile(r"<<(-?)[ \t]*(['\"]?)([A-Za-z_]\w*)\2")
# What may stand before an echo on its line for the echo to start a command.
SH_ECHO_START = re.compile(r"(?:^|[;&|({]|\b(?:then|do|else))[ \t]*$")


YAML_KEY = re.compile(r"\s*(?:-\s+)?([^\s#:'\"][^:#]*?):(?=\s|$)")
YAML_ITEM = re.compile(r"\s*-(?:\s+|$)")
YAML_BLOCK = re.compile(r"\s*[|>][-+0-9]*\s*(?:#.*)?$")


def _yaml_spans(text: str) -> list[Span]:
    """Return what follows each key or list dash (its value and any comment), and every line with neither; a block scalar (| or >, after a key or a list dash) is kept whole, except that the value of a run: key is a shell script, so only its _sh_spans count."""
    spans: list[Span] = []
    pos = 0
    block: tuple[int, bool, int] | None = None  # the open block scalar: (indent of its key line, a run: script?, first offset)

    def close(end: int) -> None:
        if block is not None and block[1]:
            spans.extend((block[2] + a, block[2] + b) for a, b in _sh_spans(text[block[2] : end]))

    for line in text.splitlines(keepends=True):
        body = line.rstrip("\r\n")
        indent = len(body) - len(body.lstrip())
        if block is not None and (not body.strip() or indent > block[0]):
            if not block[1]:
                spans.append((pos, pos + len(body)))
        else:
            close(pos)
            block = None
            m = YAML_KEY.match(body) or YAML_ITEM.match(body)
            start = m.end() if m else 0
            script = m is not None and m.re is YAML_KEY and m.group(1).strip() == "run"
            if m and YAML_BLOCK.match(body, start):
                block = (indent, script, pos + len(line))
            elif script:
                spans.extend((pos + start + a, pos + start + b) for a, b in _sh_spans(body[start:]))
            else:
                spans.append((pos + start, pos + len(body)))
        pos += len(line)
    close(pos)
    return spans


TOML_KEY_END = re.compile(r"\s*=")


def _toml_spans(text: str) -> list[Span]:
    """Return the comments and the string values of a TOML file (a multi-line string whole); a quoted string followed by = is a key and is left out."""
    spans: list[Span] = []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if c == "#":
            end = text.find("\n", i)
            end = n if end < 0 else end
            spans.append((i + 1, end))
            i = end
        elif text.startswith(('"""', "'''"), i):
            end = text.find(text[i : i + 3], i + 3)
            end = n if end < 0 else end
            spans.append((i + 3, end))
            i = end + 3
        elif c in "'\"":
            k = i + 1
            while k < n and text[k] not in (c, "\n"):
                k += 2 if c == '"' and text[k] == "\\" else 1
            if not TOML_KEY_END.match(text, k + 1):
                spans.append((i + 1, k))
            i = k + 1
        else:
            i += 1
    return spans


def _gitignore_spans(text: str) -> list[Span]:
    """Return the comments of a .gitignore file: a # opens one only at the start of a line."""
    return [m.span(1) for m in re.finditer(r"(?m)^#(.*)$", text)]


JSON_STRING = re.compile(r'"(?:[^"\\\n]|\\.)*"')
JSON_KEY_END = re.compile(r"\s*:")


def _json_spans(text: str) -> list[Span]:
    """Return the string values of a JSON file; a string followed by a colon is a key and is left out."""
    return [(m.start() + 1, m.end() - 1) for m in JSON_STRING.finditer(text) if not JSON_KEY_END.match(text, m.end())]


SPANS: dict[str, Callable[[str], list[Span]]] = {
    "ts": _js_spans,
    "tsx": functools.partial(_js_spans, jsx=True),
    "js": _js_spans,
    "mjs": _js_spans,
    "py": _py_spans,
    "sh": _sh_spans,
    "json": _json_spans,
    "yaml": _yaml_spans,
    "yml": _yaml_spans,
    "toml": _toml_spans,
    "gitignore": _gitignore_spans,
}


def _prose_view(name: str, text: str) -> str:
    """Return the prose view of a code or data file, by its extension's SPANS reader; any other file (a .txt) is its own view."""
    ext = name.rsplit("/", 1)[-1].rsplit(".", 1)[-1].lower()
    return _mask(text, SPANS[ext](text)) if ext in SPANS else text


def _git_env() -> dict[str, str]:
    """Return the environment of every git call here: the caller's, with replace refs off (GIT_NO_REPLACE_OBJECTS).

    A replace ref (refs/replace/<object>) makes git return another object in place of the one named, so a restored
    no-copy source could hide a forbidden file behind one, or pass an absent commit as present (TRDD-R2GILGKU G1).
    """
    return {**os.environ, "GIT_NO_REPLACE_OBJECTS": "1"}


def _named(repo: Path) -> list[str]:
    """Return the options that name the repository and working tree of `repo` to git, so git never searches the folders above it: a no-copy source with a partial .git would otherwise be read from the enclosing repository, the project's own (TRDD-R2GILGKU M1)."""
    return ["-C", str(repo), f"--git-dir={repo / '.git'}", f"--work-tree={repo}"]


def _git(repo: Path, *args: str, stdin: bytes | None = None) -> bytes:
    return subprocess.run(["git", *_named(repo), *args], check=True, capture_output=True, input=stdin, env=_git_env()).stdout


FETCH = "uv run scripts/fetch_no_copy_sources.py"


def _repo(pin: Any) -> Path:
    """Return the fetched repository of a pin; fail (never skip) naming the fetch command when it does not hold the commit."""
    # excerpt_lock is loaded dynamically, so its attributes are Any; the annotation gives mypy the real type.
    repo: Path = excerpt_lock.no_copy_dir(pin)
    found = (repo / ".git").is_dir() and subprocess.run(
        ["git", *_named(repo), "cat-file", "-e", f"{pin.commit}^{{commit}}"], capture_output=True, check=False, env=_git_env()
    ).returncode == 0
    if not found:
        pytest.fail(f"no-copy source {pin.repo} at {pin.commit} is not in {repo}; fetch it with: {FETCH}")
    return repo


@functools.cache
def _source(pin: Any) -> dict[str, str]:
    """Read every text file of the pin's commit with one `git cat-file --batch`; a known binary extension is skipped, any other non-UTF-8 file fails."""
    repo = _repo(pin)
    blobs: list[tuple[str, str]] = []
    for entry in filter(None, _git(repo, "ls-tree", "-r", "-z", pin.commit).split(b"\0")):
        meta, path = entry.split(b"\t", 1)
        _, kind, object_id = meta.split()
        name = path.decode("utf-8")
        # A submodule entry is a commit, not a file, and a fetch brings no submodule.
        if kind == b"blob" and name.rsplit(".", 1)[-1].lower() not in BINARY_EXTENSIONS:
            blobs.append((name, object_id.decode("ascii")))
    out = _git(repo, "cat-file", "--batch", stdin="".join(f"{sha}\n" for _, sha in blobs).encode("ascii"))
    files: dict[str, str] = {}
    pos = 0
    for name, sha in blobs:
        # Each answer is "<sha> blob <size>\n", then <size> bytes, then "\n".
        header_end = out.index(b"\n", pos)
        got, _, size = out[pos:header_end].split()
        assert got.decode("ascii") == sha, f"cat-file answered {got!r} for {sha}"
        data = out[header_end + 1 : header_end + 1 + int(size)]
        pos = header_end + 1 + int(size) + 1
        try:
            files[name] = data.decode("utf-8")
        except UnicodeDecodeError:
            pytest.fail(f"{pin.repo}:{name} at {pin.commit} is not UTF-8 and not a known binary extension")
    assert files, f"no text files read from {pin.repo} at {pin.commit}"
    # No licence-named file is skipped: licence boilerplate is excused content-wise by the MIT wording in
    # _prior_art (runs inside it are not reported), so prose appended after a licence block is still scanned.
    return files


def _label(mod: str, pin: Any) -> str:
    """Name a source in a failure message: the mod, its version, and the repository and commit it was read at."""
    return f"{mod} {pin.version} ({pin.repo} at {pin.commit})"


# Tracked top folders the scan leaves out, for the reasons the module docstring measures: design/ quotes sources as
# analysis records, and tests/ carries code as data (fixtures, a stand-in git script) that the prose readers would read
# as prose. A plugin installed from its repository does carry them.
NOT_SCANNED_TOP = excerpt_lock.NOT_SCANNED_TOP  # one value, shared with tests/test_adapted_files.py
# Why a licence file is not read: its wording would match any source under the same licence.
LICENCE_TEXT = "licence text: the MIT wording every MIT project shares, so it would match any MIT-licensed source"
# Shipped files the scan does not read although their kind is known, each by its full path with the reason (TRDD-R2GILGKU
# G4, M4): a path, not a file name, so a file named LICENSE in another folder is read or reported, never skipped unseen.
# Any other file the scan cannot read fails test_every_tracked_file_is_read_or_left_out_for_a_reason, which also
# requires each path here to be tracked.
NOT_PROSE = {
    "LICENSE": LICENCE_TEXT,
    "skills/mods-tutorial-call-intercept-mods/examples/LICENSE": LICENCE_TEXT,
    "skills/mods-tutorial-call-intercept-mods/examples/protect-files/LICENSE": LICENCE_TEXT,
    "skills/mods-tutorial-interface-mods/examples/LICENSE": LICENCE_TEXT,
    "skills/mods-tutorial-interface-mods/examples/git-poller/LICENSE": LICENCE_TEXT,
    "skills/mods-tutorial-interface-mods/examples/turn-timer/LICENSE": LICENCE_TEXT,
    "git-hooks/pre-commit": "this project's own pre-commit hook, a shell script with no file extension, so the prose scan (which reads only known text kinds) does not read it",
    ".python-version": "one Python version number, no prose",
}


# The canonical MIT licence wording (https://opensource.org/license/mit — write it exactly as below), the fixed legal
# boilerplate every MIT project shares. NOTICE must reproduce it for each MIT-licensed excerpt it credits, and a
# forbidden source may embed it in a file not named LICENSE (token-optimizer 5.13.68+ vendors tomli as
# _tomli.py with the licence as a comment block), so a shared run of this wording is the licence, not copied
# expression — the same reason LICENCE_TEXT gives for NOT_PROSE on the shipped side; on the source side no
# licence-named file is skipped at all, so the wording itself carries the excuse wherever it appears.
MIT_LICENCE_WORDING = """\
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""


def _left_out(rel: str) -> bool:
    """Return whether the scan leaves a tracked path out on purpose: a folder it does not scan (NOT_SCANNED_TOP, *_dev), a generated lock file, a listed third-party copy, a file with a binary extension or a NOT_PROSE path."""
    parts = rel.split("/")
    ext = parts[-1].rsplit(".", 1)[1].lower() if "." in parts[-1] else ""
    return (
        parts[0] in NOT_SCANNED_TOP
        or any(part.endswith("_dev") for part in parts)
        or parts[-1] in excerpt_lock.LOCK_FILES
        or rel in excerpt_lock.THIRD_PARTY_FILES
        or ext in BINARY_EXTENSIONS
        or rel in NOT_PROSE
    )


def _scanned_kind(rel: str) -> str | None:
    """Return how the scan reads a tracked path: "text" (word and line runs over the whole file), "prose" (word runs over its _prose_view) or None (not read: left out on purpose, or of a kind no reader knows)."""
    if _left_out(rel):
        return None
    name = rel.rsplit("/", 1)[-1]
    ext = name.rsplit(".", 1)[1].lower() if "." in name else ""
    if ext == "md" or rel == "NOTICE":
        return "text"
    return "prose" if ext in SPANS or ext == "txt" else None


def _unread_without_reason(paths: Iterable[str]) -> list[str]:
    """Return, sorted, the paths the scan does not read and does not leave out on purpose: files of a kind no reader knows, which would ship unread."""
    return sorted(rel for rel in paths if not _left_out(rel) and _scanned_kind(rel) is None)


def _where_only_a_force_add_puts_a_file(paths: Iterable[str]) -> list[str]:
    """Return, sorted, the tracked paths inside a folder .gitignore ignores by name (any *_dev folder, any reports/ folder): only a force-add tracks such a file, and none may ship unseen (TRDD-R2GILGKU M3)."""
    return sorted(rel for rel in paths if any(part.endswith("_dev") or part == "reports" for part in rel.split("/")[:-1]))


# git's own test for binary content: a NUL byte in the first 8000 bytes.
BINARY_PROBE = 8000


def _text_under_a_binary_name(root: Path, paths: Iterable[str]) -> list[str]:
    """Return, sorted, the paths with a BINARY_EXTENSIONS extension whose first BINARY_PROBE bytes hold no NUL byte: text the scan would leave unread because of its name (TRDD-R2GILGKU M4). A path missing from the working tree is not shipped, so it is skipped."""
    out: list[str] = []
    for rel in paths:
        name = rel.rsplit("/", 1)[-1]
        if "." in name and name.rsplit(".", 1)[1].lower() in BINARY_EXTENSIONS and (root / rel).is_file():
            with (root / rel).open("rb") as handle:
                if b"\0" not in handle.read(BINARY_PROBE):
                    out.append(rel)
    return sorted(out)


@functools.cache
def _shipped() -> tuple[dict[str, str], dict[str, str]]:
    """Return (texts, views) of every file git tracks that the scan reads, keyed by root-relative path: the whole texts (for word and line runs) and the prose views (for word runs).

    A tracked file deleted from the working tree is not shipped, so it is skipped.
    """
    assert excerpt_lock.references(ROOT), "no skills/mods-example-*/references/*.md found"
    texts: dict[str, str] = {}
    views: dict[str, str] = {}
    for raw in filter(None, _git(ROOT, "ls-files", "-z").split(b"\0")):
        rel = raw.decode("utf-8")
        kind = _scanned_kind(rel)
        if kind is None or not (ROOT / rel).is_file():
            continue
        try:
            text = (ROOT / rel).read_text(encoding="utf-8")
        except UnicodeDecodeError:
            pytest.fail(f"{rel} is not UTF-8")
        if kind == "text":
            texts[rel] = text
        else:
            views[rel] = _prose_view(rel, text)
    assert texts and views, "no shipped files found"
    return texts, views


def _third_party_problems(root: Path, table: dict[str, Any], notice: str) -> list[str]:
    """Return one line per THIRD_PARTY_FILES entry whose exclusion is not earned, sorted by path.

    The file must exist with the content its entry records (the sha256 of its bytes, so a file changed after its review
    is scanned or reviewed again instead of passing on its header line), and the entry must name exactly one credit: a
    copied file's repository, which some paragraph of NOTICE must name together with the file's own path, or a CPV
    template's header line, which must be one of the file's first THIRD_PARTY_HEADER_LINES lines.
    """
    lines = excerpt_lock.THIRD_PARTY_HEADER_LINES
    out: list[str] = []
    for rel, entry in sorted(table.items()):
        path = root / rel
        if not path.is_file():
            out.append(f"MISSING {rel}: no such file")
        elif (actual := hashlib.sha256(path.read_bytes()).hexdigest()) != entry.sha256:
            out.append(
                f"CHANGED {rel}: its sha256 is {actual}, not the reviewed {entry.sha256 or '(none recorded)'}; remove its entry"
                " so the scan reads it, or review it again and record the new sha256"
            )
        elif bool(entry.repo) == bool(entry.marker):
            out.append(f"CREDIT {rel}: needs exactly one of repo and marker")
        elif entry.repo:
            if not excerpt_lock.notice_names(notice, rel, entry.repo):
                out.append(f"NOTICE {rel}: no NOTICE paragraph names this path with {entry.repo}")
        elif entry.marker not in [line.strip() for line in path.read_text(encoding="utf-8").splitlines()[:lines]]:
            out.append(f"HEADER {rel}: its first {lines} lines do not include {entry.marker!r}")
    return out


def _baseline_chapters() -> list[tuple[str, str]]:
    """Return (blob hash, path) of each Anthropic-adapted chapter present at BASELINE, as BASELINE_CHAPTERS lists them."""
    # Why a pinned list and not `git ls-tree BASELINE`: the 1.0.0 squash removed e7b7df2 from public history, so a clone
    # (CI) cannot read that commit (TRDD-ELJXAKU6). Its chapter blobs are still in public history, so the list pins the
    # same prior art by hash. Reading the live chapters instead would let an edited chapter excuse its own copied text.
    chapters: list[tuple[str, str]] = []
    for line in BASELINE_CHAPTERS.read_text(encoding="utf-8").splitlines():
        if line.startswith("#"):
            continue
        blob, path = line.split("\t")
        assert re.fullmatch(r"[0-9a-f]{40}", blob), f"{BASELINE_CHAPTERS.name}: not a blob hash: {line!r}"
        assert re.fullmatch(r"skills/mods-doc-[^/]+/references/chapter\.md", path) and path != ORIGINAL_CHAPTER, path
        chapters.append((blob, path))
    assert chapters, f"no mods-doc chapters listed in {BASELINE_CHAPTERS}"
    return chapters


def _types_dir() -> Path:
    return ROOT / ".claude-plugin" / "types"


# The types are generated by Claude Code and gitignored, so CI has none. Prior art only ever removes hits, so a scan
# without them can report a hit they would excuse, but never misses one: a pass stays sound, a failure says so.
TYPES_ABSENT = (
    "Note: .claude-plugin/types is absent, so its declarations were not read as prior art; a hit above may be an API name"
    " they declare. Load the plugin once in Claude Code to generate them, then rerun."
)


@functools.cache
def _prior_art() -> dict[str, str]:
    """Return Anthropic's documentation as it was at BASELINE (NOTICE-listed chapters), the canonical MIT licence wording, and the generated .claude-plugin/types declarations, when present."""
    texts: dict[str, str] = {}
    for blob, rel in _baseline_chapters():
        held = subprocess.run(
            ["git", *_named(ROOT), "cat-file", "-e", f"{blob}^{{blob}}"], capture_output=True, check=False, env=_git_env()
        ).returncode == 0
        if not held:
            pytest.fail(f"{rel} at {BASELINE} (blob {blob}) is not in this clone; the no-copy test needs the full history")
        texts[f"{BASELINE}:{rel}"] = _git(ROOT, "cat-file", "blob", blob).decode("utf-8")
    texts["(the MIT licence wording)"] = MIT_LICENCE_WORDING
    if not _types_dir().is_dir():
        return texts
    declarations = sorted(_types_dir().rglob("*.d.ts"))
    assert declarations, f"no *.d.ts found under {_types_dir()}"
    for p in declarations:
        texts[str(p.relative_to(ROOT))] = p.read_text(encoding="utf-8")
    return texts


def _licensed_excerpt_lines(root: Path, lock: dict[str, dict[str, str]]) -> dict[str, set[int]]:
    """Return, per reference file under `root`, the line numbers of the excerpt blocks the licensed-excerpt class excuses.

    A block qualifies only when its heading names a mod that is in LICENCES and not in FORBIDDEN, and its lines hash to the
    sha256 of its entry in `lock` (the committed lock, so no cache is read). Reference-module blocks and prose never qualify.
    """
    lines: dict[str, set[int]] = {}
    for ref in excerpt_lock.references(root):
        for m, block, _, first in excerpt_lock.excerpt_spans(ref.read_text(encoding="utf-8")):
            mod = m.group(1)
            if block is None or mod not in excerpt_lock.LICENCES or mod in excerpt_lock.FORBIDDEN:
                continue
            entry = lock.get(excerpt_lock.lock_key(root, ref, m))
            if entry is None or entry.get("sha256") != excerpt_lock.lines_sha256(block):
                continue
            lines.setdefault(str(ref.relative_to(root)), set()).update(range(first, first + len(block)))
    return lines


@functools.cache
def _excused() -> dict[str, set[int]]:
    """Return the lines the licensed-excerpt class excuses in the shipped references, checked against the committed lock."""
    return _licensed_excerpt_lines(ROOT, json.loads(excerpt_lock.LOCK.read_text(encoding="utf-8")))


def _licence_lines(texts: dict[str, str], views: dict[str, str]) -> dict[str, list[set[int]]]:
    """Return, per shipped file, a list of blocks: each block is the line numbers of one maximal run of consecutive
    lines whose combined normalised word sequence occurs contiguously inside excerpt_lock.MIT_PERMISSION_SENTENCES
    (>= WORD_RUN tokens).

    Content-keyed, not path-keyed: the MIT permission wording is the one paragraph every MIT project shares, so it
    reaches NOTICE, the vendored licence copies and excerpt_lock's own constant whenever a forbidden source vendors
    an MIT licence. A block must hold WORD_RUN tokens, so no short line qualifies, and a run is excused only when it
    lies inside ONE block, never when its lines are merely each in some block.
    """
    mit = [w for w, _ in _words(" ".join(excerpt_lock.MIT_PERMISSION_SENTENCES))]
    n = len(mit)
    seqs = {tuple(mit[i:i + size]) for size in range(WORD_RUN, n + 1) for i in range(n - size + 1)}
    out: dict[str, list[set[int]]] = {}
    for rel, text in {**texts, **views}.items():
        lines = text.splitlines()
        blocks: list[set[int]] = []
        i = 0
        while i < len(lines):
            words: list[str] = []
            best = None
            for b in range(i, len(lines)):
                words = words + [w for w, _ in _words(lines[b])]
                if tuple(words) not in seqs:
                    break
                if len(words) >= WORD_RUN:
                    best = b
            if best is None:
                i += 1
            else:
                blocks.append(set(range(i + 1, best + 2)))
                i = best + 1
        if blocks:
            out[rel] = blocks
    return out


@pytest.mark.parametrize(("mod", "pin"), SOURCES)
def test_shipped_files_copy_nothing_from_forbidden_source(mod: str, pin: Any) -> None:
    """No shipped file shares 8 words (4 of them of 3 or more characters) with a forbidden source at a pinned commit, in its whole text or its prose view, and no Markdown file or NOTICE shares 3 lines in a row."""
    texts, views = _shipped()
    source, prior, excused = _source(pin), _prior_art(), _excused()
    licence = _licence_lines(texts, views)
    hits = find_hits({**texts, **views}, source, prior, excused, kinds=("words",), idioms=_idioms(IDIOM_EXEMPTIONS), licence=licence)
    hits += find_hits(texts, source, prior, excused, kinds=("lines",), licence=licence)
    shown = hits[:MAX_REPORTED]
    more = f"\n... and {len(hits) - len(shown)} more" if len(hits) > len(shown) else ""
    note = f"\n{TYPES_ABSENT}" if not _types_dir().is_dir() else ""
    assert not hits, f"{len(hits)} verbatim overlap(s) with {_label(mod, pin)}:\n" + "\n".join(shown) + more + note


@pytest.mark.parametrize(("mod", "pin"), SOURCES)
def test_detector_reports_a_planted_word_run(mod: str, pin: Any, tmp_path: Path) -> None:
    """The detector can fail: an 8-word run the fragment rule counts, lifted from a real file of the source, is reported at both file:line sides."""
    sources = _source(pin)
    for name, text in sources.items():
        ws = _words(text)
        starts = [i for i in range(2, len(ws) - WORD_RUN + 1) if _counts(tuple(w for w, _ in ws[i : i + WORD_RUN]))]
        if starts:
            first = starts[0]
            break
    else:
        pytest.fail(f"no file with an 8-word window the fragment rule counts in {_label(mod, pin)}")
    run = " ".join(w for w, _ in ws[first : first + WORD_RUN])
    ref = tmp_path / "reference.md"
    ref.write_text(f"Intro of our own.\n\n{run}\n", encoding="utf-8")
    hits = find_hits({"reference.md": ref.read_text(encoding="utf-8")}, sources)
    want = f"{name}:{ws[first][1]}-{ws[first + WORD_RUN - 1][1]}"
    assert any(h.startswith("reference.md:3-3 shares 8 words with ") and want in h for h in hits), hits


@pytest.mark.parametrize(("mod", "pin"), SOURCES)
def test_detector_reports_a_planted_line_run(mod: str, pin: Any, tmp_path: Path) -> None:
    """The detector can fail: 3 consecutive code lines lifted from a real file of the forbidden source are reported at both file:line sides."""
    sources = _source(pin)
    for name, text in sources.items():
        ls = _lines(text)
        starts = [i for i in range(len(ls) - LINE_RUN + 1) if all(re.search(r"\w", s) for s, _ in ls[i : i + LINE_RUN])]
        if starts:
            trio = ls[starts[0] : starts[0] + LINE_RUN]
            break
    else:
        pytest.fail(f"no file with {LINE_RUN} consecutive non-blank lines holding word characters in {_label(mod, pin)}")
    ref = tmp_path / "reference.md"
    ref.write_text("Intro of our own.\n\n" + "\n".join(s for s, _ in trio) + "\n", encoding="utf-8")
    hits = find_hits({"reference.md": ref.read_text(encoding="utf-8")}, sources)
    want = f"{name}:{trio[0][1]}-{trio[-1][1]}"
    assert any(h.startswith("reference.md:3-5 shares 3 lines with ") and want in h for h in hits), hits


def test_a_run_of_mit_vocabulary_in_another_order_is_still_reported() -> None:
    """A run of 8 MIT-vocabulary words in a non-MIT order is not contiguous in the MIT wording, so _licence_lines does not mark it and find_hits still reports it."""
    run = "software copy person any to charge free granted"
    texts = {"ours.md": f"intro\n{run}\n"}
    views = {"ours.md": f"intro\n{run}\n"}
    sources = {"repo.md": f"intro\n{run}\n"}
    licence = _licence_lines(texts, views)
    hits = find_hits(texts, sources, licence=licence)
    assert any("software copy person" in h for h in hits), (licence, hits)


def test_a_run_reaching_between_two_licence_blocks_is_still_reported() -> None:
    """A run whose lines are each inside some licence block but which spans two separate blocks is still reported."""
    run = "alpha bravo charlie delta echo foxtrot golf hotel"
    sources = {"repo.md": f"intro\n{run}\n"}
    refs = {"ours.md": f"intro\n{run}\n"}
    licence = {"ours.md": [{2}, {4}]}
    hits = find_hits(refs, sources, licence=licence)
    assert any("alpha bravo" in h for h in hits), (licence, hits)


def test_run_present_in_a_chapter_and_the_repo_is_not_reported() -> None:
    """A word run and a line run present in both a bundled chapter and the repo are prior art and are not reported, while a run absent from the chapters still is."""
    shared_words = "register the session start handler before the first tool call fires"
    shared_lines = "alpha = compute(one)\nbeta = compute(two)\ngamma = compute(three)"
    own_words = "completely different words appear only in the repository file here"
    sources = {"repo.md": f"{shared_words}\n{shared_lines}\n{own_words}\n"}
    chapter = {"skills/mods-doc-x/references/chapter.md": f"{shared_words}\n{shared_lines}\n"}
    refs = {"ref.md": f"{shared_words}\n{shared_lines}\n{own_words}\n"}
    hits = find_hits(refs, sources, chapter)
    assert not any("register the session" in h or "alpha = compute" in h for h in hits), hits
    assert any("completely" in h for h in hits), hits  # windows reaching into text absent from the chapters still hit
    assert find_hits(refs, sources), "without the chapter the shared runs must be reported"


# A word run planted in a synthetic reference file, in three places: a licensed excerpt (line 7), a reference module
# (line 15) and prose (line 19), and in a forbidden source.
PLANTED_RUN = "alpha bravo charlie delta echo foxtrot golf hotel india"
EXCERPT_REF = "skills/mods-example-x/references/x.md"


def _excerpt_case(tmp_path: Path, mod: str, version: str, licence: str, lock_matches: bool) -> tuple[dict[str, str], dict[str, set[int]]]:
    """Write a reference file holding PLANTED_RUN in an excerpt of `mod`, a reference module and prose; return it and its excused lines."""
    root = tmp_path / "root"
    ref = root / EXCERPT_REF
    ref.parent.mkdir(parents=True)
    heading = f"### {mod} {version}, hooks/a.ts:1-3, {licence}"
    block = ["const note = 'x'", f"// {PLANTED_RUN}", "export {}"]
    module = ["### Reference module, demo-module, MIT (this plugin)", "", "```ts", *block, "```"]
    text = "\n".join(["Prose of our own.", "", heading, "", "```ts", *block, "```", "", *module, "", f"Prose again: {PLANTED_RUN}.", ""])
    ref.write_text(text, encoding="utf-8")
    m = excerpt_lock.HEAD.match(heading)
    assert m is not None
    lock = {excerpt_lock.lock_key(root, ref, m): {"sha256": excerpt_lock.lines_sha256(block) if lock_matches else "0" * 64}}
    return {EXCERPT_REF: text}, _licensed_excerpt_lines(root, lock)


PLANTED_SOURCE = {"src/a.ts": f"// {PLANTED_RUN}\n"}


def test_a_run_inside_a_lock_verified_licensed_excerpt_is_not_a_hit(tmp_path: Path) -> None:
    """A run inside an excerpt of a licensed mod whose lines match the committed lock is excused, though a forbidden source has it too."""
    refs, excused = _excerpt_case(tmp_path, "deck", "0.4.12", "MIT", lock_matches=True)
    assert any(h.startswith(f"{EXCERPT_REF}:7-7 ") for h in find_hits(refs, PLANTED_SOURCE)), "the run must hit without the excuse"
    assert not any(h.startswith(f"{EXCERPT_REF}:7-7 ") for h in find_hits(refs, PLANTED_SOURCE, excused=excused))


def test_the_same_run_in_a_reference_module_or_prose_is_a_hit(tmp_path: Path) -> None:
    """The excuse covers only the excerpt block: the same run in a reference-module block or in prose is still a hit."""
    refs, excused = _excerpt_case(tmp_path, "deck", "0.4.12", "MIT", lock_matches=True)
    hits = find_hits(refs, PLANTED_SOURCE, excused=excused)
    assert any(h.startswith(f"{EXCERPT_REF}:15-15 ") for h in hits), hits
    assert any(h.startswith(f"{EXCERPT_REF}:19-19 ") for h in hits), hits


def test_an_excerpt_whose_lock_entry_does_not_match_is_not_excused(tmp_path: Path) -> None:
    """An excerpt whose lines do not hash to its committed lock entry is not excused."""
    refs, excused = _excerpt_case(tmp_path, "deck", "0.4.12", "MIT", lock_matches=False)
    assert any(h.startswith(f"{EXCERPT_REF}:7-7 ") for h in find_hits(refs, PLANTED_SOURCE, excused=excused))


def test_an_excerpt_naming_a_forbidden_mod_is_not_excused(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """An excerpt headed with a forbidden mod is not excused, even with a licence entry and a matching lock."""
    monkeypatch.setattr(excerpt_lock, "LICENCES", {**excerpt_lock.LICENCES, "token-optimizer": "MIT"})
    refs, excused = _excerpt_case(tmp_path, "token-optimizer", "5.13.61", "MIT", lock_matches=True)
    assert any(h.startswith(f"{EXCERPT_REF}:7-7 ") for h in find_hits(refs, PLANTED_SOURCE, excused=excused))


# Fragments: a regex character class written two ways, which share an 8-token run of short tokens only.
FRAGMENT_REF = "Accept a name matching `^[A-Za-z0-9][A-Za-z0-9._-]*@[A-Za-z0-9._-]+$` and nothing else.\n"
FRAGMENT_SOURCE = {"src/names.py": "NAME = re.compile(r'^[A-Za-z0-9][A-Za-z0-9]+@[A-Za-z0-9]+$')\n"}


def test_a_word_run_made_of_regex_fragments_is_not_a_hit() -> None:
    """An 8-token run in which fewer than 4 tokens have 3 or more characters (a regex character class) is not a hit."""
    assert not find_hits({"ref.md": FRAGMENT_REF}, FRAGMENT_SOURCE)


@pytest.mark.parametrize(
    ("shared", "counts"),
    [
        ("ab cd ef gh abc def ghi jkl", True),  # 4 tokens of 3+ characters: counted
        ("ab cd ef gh ij abc def ghi", False),  # 3 tokens of 3+ characters: a fragment run
    ],
)
def test_a_word_window_counts_from_four_tokens_of_three_characters(shared: str, counts: bool) -> None:
    """The fragment rule's boundary: an 8-token window counts with 4 tokens of 3 or more characters and not with 3."""
    hits = find_hits({"ref.md": f"Our own words first.\n{shared}\nOur own words last.\n"}, {"src.txt": f"{shared}\n"})
    assert bool(hits) is counts, hits


def test_a_line_run_of_short_tokens_is_still_a_hit() -> None:
    """The fragment rule applies to word windows only: 3 shared code lines made of short tokens are still a line-run hit."""
    trio = "a = 1\nb = 2\nc = 3\n"
    hits = find_hits({"ref.md": f"Our own words first.\n{trio}"}, {"src.py": trio})
    assert any(h.startswith("ref.md:2-4 shares 3 lines with src.py:1-3") for h in hits), hits

URL_SOURCE = {"src/PRIVACY.md": "See [token-optimizer](https://github.com/alexgreensh/token-optimizer) for details.\n"}
PROSE_8 = "register the session start handler before the first tool call"


def test_a_markdown_link_repeating_a_source_url_is_not_a_hit() -> None:
    """A URL is a name, not expression: a link whose URL repeats the source URL shares no words."""
    assert not find_hits({"ref.md": "Credit: [token-optimizer](https://github.com/alexgreensh/token-optimizer) for ideas.\n"}, URL_SOURCE, kinds=("words",))


def test_an_eight_word_sentence_copied_next_to_a_url_is_still_a_hit() -> None:
    """Removing URLs does not hide prose: 8 copied words beside a URL are reported."""
    source = {"src/a.md": f"{PROSE_8} https://example.com/x done\n"}
    assert find_hits({"ref.md": f"Our own words. {PROSE_8} (https://other.org/y) end.\n"}, source, kinds=("words",))


def test_a_sentence_that_is_eight_words_only_across_a_url_is_not_a_hit() -> None:
    """The words on either side of a removed URL are not joined: 4 words, a URL, 4 words is no 8-word run."""
    source = {"src/a.md": "register the session start https://example.com/x handler before the first\n"}
    assert not find_hits({"ref.md": "register the session start https://example.com/x handler before the first\n"}, source, kinds=("words",))


# Prose views: one shared 12-word run (written @@ in a case) planted in each kind of file. A case with no line must not hit
# through the view, and the same file read whole must hit, so every case can fail.
SHARED = "the guard refuses a token that runs past the end of the buffer"
VIEW_CASES = [
    ("ts line comment", "a.ts", "const a = 1 // @@\n", "@@", 1),
    ("ts block comment over lines", "a.ts", "/**\n * the guard refuses a token\n * that runs past the end of the buffer\n */\nexport {}\n", "@@", 2),
    ("py comment", "a.py", "x = 1\n# @@\n", "@@", 2),
    ("py docstring", "a.py", 'def f():\n    """Explain.\n\n    @@.\n    """\n', "@@", 4),
    ("sh comment", "a.sh", "set -e\n# @@\n", "@@", 2),
    ("ts string of exactly 8 words", "a.ts", "x('alpha bravo charlie delta echo foxtrot golf hotel')\n", "alpha bravo charlie delta echo foxtrot golf hotel", 1),
    ("py f-string of 8 or more words", "a.py", 'name = "x"\nraise SystemExit(f"{name}: @@")\n', "@@", 2),
    ("ts template with an expression", "a.ts", "const t = `the guard refuses ${kind} a token that runs past the end of the buffer`\n", "@@", 1),
    ("comment after a division", "a.ts", "const r = a / b // @@\n", "@@", 1),
    ("json value", "a.json", '{\n  "description": "@@"\n}\n', "@@", 2),
    ("yaml value", "a.yaml", "interface:\n  description: @@\n", "@@", 2),
    ("yaml run comment", "a.yml", "steps:\n  - run: |\n      set -e\n      # @@\n", "@@", 4),
    ("yaml run string", "a.yml", 'steps:\n  - run: echo "@@"\n', "@@", 2),
    ("txt file", "a.txt", "Intro.\n@@\n", "@@", 2),
    ("py implicit concatenation over lines", "a.py", 'msg = ("the guard refuses a token "\n       "that runs past the end "\n       "of the buffer")\n', "@@", 1),
    ("py + chain", "a.py", 'msg = "the guard refuses a token " + "that runs past the end " + f"of the {kind} buffer"\n', "@@", 1),
    ("ts + chain over lines", "a.ts", "const m = 'the guard refuses a token ' +\n  'that runs past the end ' +\n  `of the buffer`\n", "@@", 1),
    ("ts + chain after a template holding a literal", "a.ts", "const m = `the guard refuses ${f('x')} a token ` +\n  'that runs past the end of the buffer'\n", "@@", 1),
    ("tsx text between tags", "a.tsx", "export const A = () => <p>@@</p>\n", "@@", 1),
    ("tsx text after an expression child", "a.tsx", 'export const A = () => (\n  <div className="x">\n    {count}\n    @@\n  </div>\n)\n', "@@", 4),
    ("tsx generic type, not an element", "a.tsx", "const a: Array<string> = f(the, guard, refuses, a, token, that, runs, past, the, end, of, the, buffer)\n", "@@", None),
    ("comment after a postfix increment and a division", "a.ts", "i++ / 2 // @@\n", "@@", 1),
    ("comment after an object and a division on the next line", "a.ts", "const o = {a:1}\n/ 2; // @@\n", "@@", 2),
    ("comment after a non-null assertion and a division", "a.ts", "x = y!\n/ 2; // @@\n", "@@", 2),
    ("string after a postfix increment and a division", "a.ts", "n = i++ / 2; f('x / @@')\n", "@@", 1),
    ("string after a non-null assertion and a division", "a.ts", "n = y! / 2; f('x / @@')\n", "@@", 1),
    ("sh unquoted echo", "a.sh", "set -e\necho @@\n", "@@", 2),
    ("sh heredoc", "a.sh", "cat <<'EOF'\n@@\nEOF\n", "@@", 2),
    ("yaml list item block scalar", "a.yaml", "- |\n  See the guard refuses a token that runs past: the end of the buffer\n", "@@", 2),
    ("yaml run: echo", "a.yaml", "steps:\n  - run: echo @@\n", "@@", 2),
    ("yaml run: block with a heredoc", "a.yaml", "steps:\n  - run: |\n      cat <<EOF\n      @@\n      EOF\n", "@@", 4),
    ("toml comment", "a.toml", "# @@\nx = 1\n", "@@", 1),
    ("toml multi-line string", "a.toml", 'body = """\n@@\n"""\n', "@@", 2),
    ("toml quoted key", "a.toml", '"@@" = 1\n', "@@", None),
    ("gitignore comment", ".gitignore", "# @@\n*.log\n", "@@", 1),
    ("gitignore pattern", ".gitignore", "@@\n", "@@", None),
    ("identical code line", "a.ts", "const result = compute(alpha, bravo, charlie, delta, echo, foxtrot)\n",
     "const result = compute(alpha, bravo, charlie, delta, echo, foxtrot)", None),
    ("ts strings under 8 words", "a.ts", "t('alpha bravo charlie delta', 'echo foxtrot golf hotel')\n",
     "alpha bravo charlie delta echo foxtrot golf hotel", None),
    ("// inside a string", "a.ts", 'const u = "http:" + "//"; f(alpha, bravo, charlie, delta, echo, foxtrot, golf, hotel)\n',
     "alpha bravo charlie delta echo foxtrot golf hotel", None),
    ("regex with // in a class", "a.ts", "const re = /[//]/; f(alpha, bravo, charlie, delta, echo, foxtrot, golf, hotel)\n",
     "alpha bravo charlie delta echo foxtrot golf hotel", None),
    ("json key", "a.json", '{\n  "@@": true\n}\n', "@@", None),
    ("yaml keys", "a.yml", "alpha:\n  bravo:\n    charlie:\n      delta:\n        echo:\n          foxtrot:\n            golf:\n              hotel: 1\n",
     "alpha bravo charlie delta echo foxtrot golf hotel", None),
    ("yaml run line", "a.yml", 'steps:\n  - run: |\n      gh release view "$TAG" >/dev/null 2>&1 && echo ok\n', "gh release view tag dev null 2 1", None),
]


@pytest.mark.parametrize(("name", "text", "source", "line"), [pytest.param(*case[1:], id=case[0]) for case in VIEW_CASES])
def test_a_prose_view_keeps_prose_and_blanks_code(name: str, text: str, source: str, line: int | None) -> None:
    """A run shared with a source hits through a file's prose view at its real line when it is in prose (a comment, a docstring, a string of 8 or more words, a JSON or YAML value), and not when it is in code."""
    text, source = text.replace("@@", SHARED), source.replace("@@", SHARED) + "\n"
    hits = find_hits({name: _prose_view(name, text)}, {"src.txt": source}, kinds=("words",))
    if line is None:
        assert not hits, hits
        assert find_hits({name: text}, {"src.txt": source}, kinds=("words",)), "the whole text must hit, or this case proves nothing"
    else:
        assert any(h.startswith(f"{name}:{line}-") for h in hits), hits


@pytest.mark.parametrize(
    ("rel", "kind"),
    [
        ("README.md", "text"),
        ("NOTICE", "text"),
        ("skills/mods-x/references/a.md", "text"),
        ("hooks/self-command/logic.ts", "prose"),
        ("hooks/mod-manager/pane.ts", "prose"),
        ("scripts/probe.py", "prose"),
        ("skills/mods-tutorial-call-intercept-mods/examples/hello-mod/smoke.sh", "prose"),
        ("skills/mods-tutorial-interface-mods/examples/git-poller/types/index.d.ts", "prose"),
        ("skills/mods-x/agents/openai.yaml", "prose"),
        (".claude-plugin/plugin.json", "prose"),
        ("skills/mods-x/references/a-LICENSE.txt", "prose"),
        ("skills/mods-tutorial-call-intercept-mods/examples/hello-mod/README.md", None),
        ("skills/mods-tutorial-interface-mods/examples/branch-band/hooks/register.tsx", None),
        ("scripts/publish.py", None),
        (".github/claude-cli/package-lock.json", None),
        ("tests/test_x.py", None),
        ("design/tasks/x.md", None),
        ("reports/x/y.md", "text"),
        ("docs_dev/x.md", None),
        ("pyproject.toml", "prose"),
        ("cliff.toml", "prose"),
        (".gitignore", "prose"),
        ("uv.lock", None),
        ("LICENSE", None),
        ("skills/mods-tutorial-interface-mods/examples/git-poller/LICENSE", None),
        (".python-version", None),
        ("assets/logo.png", None),
    ],
)
def test_the_scope_reads_each_path_by_its_kind(rel: str, kind: str | None) -> None:
    """Markdown and NOTICE are read whole; code, JSON, YAML, TOML, .gitignore and .txt files through their prose view; tests/ and design/ (left out for the measured reasons of the module docstring), *_dev folders, lock files, the listed third-party copies, files with a binary extension and NOT_PROSE paths are not read; a reports/ folder is read like any other (and test_no_file_is_tracked_where_only_a_force_add_puts_one fails on a tracked file there)."""
    assert _scanned_kind(rel) == kind


def test_every_tracked_file_is_read_or_left_out_for_a_reason() -> None:
    """Every file git tracks is read by the scan or left out for a stated reason, so a file of a new kind cannot ship unread, and every NOT_PROSE path is a tracked file, so no stale entry waits for a new file to skip."""
    tracked = [raw.decode("utf-8") for raw in filter(None, _git(ROOT, "ls-files", "-z").split(b"\0"))]
    assert _unread_without_reason(tracked) == []
    assert sorted(set(NOT_PROSE) - set(tracked)) == []


def test_a_tracked_file_of_a_kind_no_reader_knows_is_reported() -> None:
    """A tracked file the scan cannot read and no rule leaves out is reported; a file in a skipped folder, a lock file, a third-party copy, a binary file and a NOT_PROSE path are not, while a file named LICENSE at a path NOT_PROSE does not list is."""
    tracked = [
        "site/page.html",
        "site/style.css",
        "hooks/a.ts",
        "README.md",
        "tests/fixture.html",
        "docs_dev/x.html",
        "uv.lock",
        "scripts/publish.py",
        "assets/logo.png",
        "skills/x/LICENSE",
        "skills/mods-tutorial-interface-mods/examples/git-poller/LICENSE",
        ".python-version",
    ]
    assert _unread_without_reason(tracked) == ["site/page.html", "site/style.css", "skills/x/LICENSE"]


def test_no_file_is_tracked_where_only_a_force_add_puts_one() -> None:
    """No tracked file sits in a *_dev folder or a reports/ folder, which .gitignore ignores by name, so a file a force-add tracked there cannot ship unscanned (TRDD-R2GILGKU M3)."""
    tracked = [raw.decode("utf-8") for raw in filter(None, _git(ROOT, "ls-files", "-z").split(b"\0"))]
    assert _where_only_a_force_add_puts_a_file(tracked) == []


def test_a_file_tracked_in_an_ignored_folder_is_reported() -> None:
    """A path inside any *_dev folder or any reports/ folder, at the top or deeper, is reported; a file whose own name ends in _dev, or a folder whose name only contains reports, is not."""
    tracked = ["docs_dev/x.md", "skills/x/foo_dev/copy.md", "reports/copy.md", "skills/x/reports/a.ts", "notes_dev", "skills/reports-viewer/a.md"]
    assert _where_only_a_force_add_puts_a_file(tracked) == ["docs_dev/x.md", "reports/copy.md", "skills/x/foo_dev/copy.md", "skills/x/reports/a.ts"]


def test_every_tracked_file_with_a_binary_name_is_binary() -> None:
    """Every tracked file the scan leaves out for its binary extension holds a NUL byte in its first 8000 bytes, as git's own binary test asks, so no text ships unread under a binary name (TRDD-R2GILGKU M4)."""
    tracked = [raw.decode("utf-8") for raw in filter(None, _git(ROOT, "ls-files", "-z").split(b"\0"))]
    assert _text_under_a_binary_name(ROOT, tracked) == []


def test_a_text_file_under_a_binary_name_is_reported(tmp_path: Path) -> None:
    """A file named like an image or an archive that holds no NUL byte in its first 8000 bytes is reported, whatever the case of its extension; a real PNG header, a NUL just inside the probe, a file of another kind and a path not on disk are not."""
    files = {
        "a/notes.png": b"plain prose under an image name\n",
        "a/LOUD.ZIP": b"more prose\n",
        "a/real.png": b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR",
        "a/late.gif": b"x" * (BINARY_PROBE - 1) + b"\0",
        "a/text.md": b"prose\n",
    }
    for rel, data in files.items():
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_bytes(data)
    assert _text_under_a_binary_name(tmp_path, [*files, "a/missing.png"]) == ["a/LOUD.ZIP", "a/notes.png"]


def test_every_excluded_third_party_file_is_credited() -> None:
    """Every file THIRD_PARTY_FILES leaves unscanned exists with the content its entry records and is credited: NOTICE names its own path with its repository, or it carries its CPV template's header line."""
    notice = (ROOT / "NOTICE").read_text(encoding="utf-8")
    assert _third_party_problems(ROOT, excerpt_lock.THIRD_PARTY_FILES, notice) == []


def test_an_unearned_exclusion_is_reported(tmp_path: Path) -> None:
    """An exclusion is reported when its file is missing, its content is not the one its entry records, no NOTICE paragraph names its path with its repository, a CPV file lacks its header line, or the entry names no credit."""
    header = '"""Header of the template.'
    files = {
        "a/copied.ts": "x\n",
        "a/unnamed.ts": "x\n",
        "a/other-paragraph.ts": "x\n",
        "a/edited.ts": "x, then a line added after the review\n",
        "b/cpv.py": f"#!/usr/bin/env python3\n{header}\n",
        "b/edited.py": '"""Another header.\n',
        "c/bare.ts": "x\n",
    }
    for rel, text in files.items():
        (tmp_path / rel).parent.mkdir(parents=True, exist_ok=True)
        (tmp_path / rel).write_text(text, encoding="utf-8")
    sha = {rel: hashlib.sha256(text.encode("utf-8")).hexdigest() for rel, text in files.items()}
    reviewed = hashlib.sha256(b"x\n").hexdigest()
    repo, entry = "https://example.com/upstream", excerpt_lock.ThirdPartyFile
    table = {
        "a/copied.ts": entry("copy", repo=repo, sha256=sha["a/copied.ts"]),
        "a/unnamed.ts": entry("copy", repo=repo, sha256=sha["a/unnamed.ts"]),
        "a/other-paragraph.ts": entry("copy", repo=repo, sha256=sha["a/other-paragraph.ts"]),
        "a/edited.ts": entry("copy", repo=repo, sha256=reviewed),
        "a/gone.ts": entry("copy", repo=repo, sha256=reviewed),
        "b/cpv.py": entry("cpv", marker=header, sha256=sha["b/cpv.py"]),
        "b/edited.py": entry("cpv", marker=header, sha256=sha["b/edited.py"]),
        "c/bare.ts": entry("neither", sha256=sha["c/bare.ts"]),
    }
    notice = f"Copied from {repo}:\n  - a/copied.ts\n  - a/edited.ts\n  - a/unnamed.tsx\n\nThis paragraph names a/other-paragraph.ts.\n"
    lines = excerpt_lock.THIRD_PARTY_HEADER_LINES
    assert _third_party_problems(tmp_path, table, notice) == [
        f"CHANGED a/edited.ts: its sha256 is {sha['a/edited.ts']}, not the reviewed {reviewed}; remove its entry so the scan"
        " reads it, or review it again and record the new sha256",
        "MISSING a/gone.ts: no such file",
        f"NOTICE a/other-paragraph.ts: no NOTICE paragraph names this path with {repo}",
        f"NOTICE a/unnamed.ts: no NOTICE paragraph names this path with {repo}",
        f"HEADER b/edited.py: its first {lines} lines do not include {header!r}",
        "CREDIT c/bare.ts: needs exactly one of repo and marker",
    ]
def test_every_forbidden_mod_has_a_source_or_a_reason() -> None:
    """Every forbidden mod has public commit pins, or else a "no copy available" reason (never both, never an empty pin list), so none goes unchecked silently."""
    pinned = set(excerpt_lock.NO_COPY_SOURCES)
    reasons = set(excerpt_lock.NO_COPY_AVAILABLE)
    assert sorted(excerpt_lock.FORBIDDEN - pinned - reasons) == [], "forbidden mods with neither pins nor a reason"
    assert sorted(pinned & reasons) == [], "forbidden mods with pins and a reason"
    assert sorted((pinned | reasons) - excerpt_lock.FORBIDDEN) == [], "pins or reasons for mods that are not in FORBIDDEN"
    assert all(reason.strip() for reason in excerpt_lock.NO_COPY_AVAILABLE.values())
    empty = sorted(mod for mod, pins in excerpt_lock.NO_COPY_SOURCES.items() if not pins)
    assert not empty, f"pin entries with no pin, which would cover their mod with nothing: {empty}"
    assert not excerpt_lock.FORBIDDEN & set(excerpt_lock.CLONE_PINS), "a forbidden repo is also a clone pin"


def test_no_copy_pins_record_a_public_commit() -> None:
    """Each pin names a public GitHub repository, a full commit, the plugin's name and version and its plugin.json path, and no two pins share a commit."""
    pins = [(mod, pin) for mod, entries in excerpt_lock.NO_COPY_SOURCES.items() for pin in entries]
    assert pins, "no no-copy pins"
    for mod, pin in pins:
        assert re.fullmatch(r"https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9._-]+", pin.repo), (mod, pin)
        assert re.fullmatch(r"[0-9a-f]{40}", pin.commit), (mod, pin)
        assert re.fullmatch(r"[a-z0-9][a-z0-9.-]*", pin.plugin), (mod, pin)
        assert re.fullmatch(r"\d+\.\d+\.\d+", pin.version), (mod, pin)
        assert pin.manifest == ".claude-plugin/plugin.json" or pin.manifest.endswith("/.claude-plugin/plugin.json"), (mod, pin)
    assert len({(pin.repo, pin.commit) for _, pin in pins}) == len(pins), "two pins name one commit"


@pytest.mark.parametrize(("mod", "pin"), SOURCES)
def test_the_pinned_manifest_has_the_pin_name_and_version(mod: str, pin: Any) -> None:
    """git show <commit>:<manifest> in the fetched repository reports the pin's plugin name and version."""
    manifest = json.loads(_git(_repo(pin), "show", f"{pin.commit}:{pin.manifest}"))
    assert (manifest.get("name"), manifest.get("version")) == (pin.plugin, pin.version), (mod, pin)


def test_a_missing_source_fails_naming_the_fetch_command(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A pinned source that is absent, or present without its commit, fails (never skips) and names the fetch command."""
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    pin = excerpt_lock.NO_COPY_SOURCES["qodfathr__ccwhoami"][0]
    folder: Path = excerpt_lock.no_copy_dir(pin)
    for state in ("absent", "empty repository"):
        if state == "empty repository":
            folder.mkdir(parents=True)
            subprocess.run(["git", "init", "--quiet", str(folder)], check=True)
        try:
            with pytest.raises(pytest.fail.Exception, match=re.escape(FETCH)):
                _repo(pin)
        except pytest.skip.Exception as skipped:
            # Reachable and needed: pytest.raises does not catch a skip (a skip is not a failure), so without this branch
            # a source that skips instead of failing would turn this check into a skip.
            pytest.fail(f"a missing source ({state}) skipped instead of failing: {skipped}")



def test_a_replace_ref_in_a_source_changes_nothing_the_test_reads(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A replace ref in a fetched source, which a restored cache can carry, changes nothing the test reads: a show and the batch read of the pinned commit's files return its own blob, not the substitute the ref names."""
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", tmp_path / "no-copy-sources")
    # Deliberately without GIT_NO_REPLACE_OBJECTS, unlike every other git call of this test and of the scripts: this
    # control shows what a git that honours replace refs reads.
    honouring = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1"}

    def run(repo: Path, *args: str, stdin: bytes | None = None) -> str:
        """Run git in `repo` the way a user's git would, replace refs honoured, and return its output."""
        return subprocess.run(["git", "-C", str(repo), *args], check=True, capture_output=True, input=stdin, env=honouring).stdout.decode().strip()

    staging = tmp_path / "staging"
    staging.mkdir()
    (staging / "a.md").write_text("original\n", encoding="utf-8")
    run(staging, "init", "--quiet")
    run(staging, "add", "a.md")
    run(staging, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "--quiet", "-m", "x")
    commit = run(staging, "rev-parse", "HEAD")
    run(staging, "replace", run(staging, "rev-parse", "HEAD:a.md"), run(staging, "hash-object", "-w", "--stdin", stdin=b"substituted\n"))
    pin = excerpt_lock.NO_COPY_SOURCES["qodfathr__ccwhoami"][0]._replace(repo="https://github.com/someone/replaced", commit=commit)
    folder: Path = excerpt_lock.no_copy_dir(pin)
    folder.parent.mkdir(parents=True)
    staging.rename(folder)
    # The test can fail: a git that honours replace refs reads the substitute.
    assert run(folder, "show", f"{commit}:a.md") == "substituted"
    assert _git(folder, "show", f"{commit}:a.md") == b"original\n"
    assert _source(pin) == {"a.md": "original\n"}


def _plain_git(folder: Path, *args: str, stdin: bytes | None = None) -> str:
    """Run git in `folder` as a user's git would (only the user's and the system configuration off, replace refs honoured, the repository found by searching upward) and return its output."""
    env = {**os.environ, "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_NOSYSTEM": "1"}
    return subprocess.run(["git", "-C", str(folder), *args], check=True, capture_output=True, input=stdin, env=env).stdout.decode().strip()


def _repo_with_one_file(folder: Path, text: str) -> str:
    """Make `folder` a repository with one commit holding a.md with `text`, and return the commit."""
    folder.mkdir(parents=True)
    (folder / "a.md").write_text(text, encoding="utf-8")
    _plain_git(folder, "init", "--quiet")
    _plain_git(folder, "add", "a.md")
    _plain_git(folder, "-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "--quiet", "-m", "x")
    return _plain_git(folder, "rev-parse", "HEAD")


def test_a_replace_ref_in_a_corpus_clone_changes_nothing_read_source_reads(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """excerpt_lock.read_source reads a corpus clone with replace refs off, so a replace ref in a clone cannot pass another text off as the pinned file an excerpt is checked against (TRDD-R2GILGKU L1)."""
    clone = tmp_path / "clone"
    commit = _repo_with_one_file(clone, "original\n")
    _plain_git(clone, "replace", _plain_git(clone, "rev-parse", "HEAD:a.md"), _plain_git(clone, "hash-object", "-w", "--stdin", stdin=b"substituted\n"))
    mod = "someone__clone"
    monkeypatch.setitem(excerpt_lock.CLONE_PINS, mod, commit)
    monkeypatch.setitem(excerpt_lock.MOD_DIRS, mod, clone)
    # The test can fail: a git that honours replace refs reads the substitute.
    assert _plain_git(clone, "show", f"{commit}:a.md") == "substituted"
    assert excerpt_lock.read_source(mod, commit, "a.md") == ["original"]


def test_a_partial_source_folder_is_never_read_from_the_repository_around_it(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A source folder whose .git holds only a configuration, inside another repository that holds the pinned commit, fails naming the fetch command: the test names each source's repository to git, so it never reads the enclosing one, as the project checkout around downloads_dev would be (TRDD-R2GILGKU M1)."""
    outer = tmp_path / "outer"
    commit = _repo_with_one_file(outer, "outer\n")
    monkeypatch.setattr(excerpt_lock, "NO_COPY_ROOT", outer / "no-copy-sources")
    # Any pin will do: its repository and commit are replaced.
    pin = next(iter(excerpt_lock.NO_COPY_SOURCES.values()))[0]._replace(repo="https://github.com/someone/partial", commit=commit)
    folder: Path = excerpt_lock.no_copy_dir(pin)
    (folder / ".git").mkdir(parents=True)
    (folder / ".git" / "config").write_text(f'[remote "origin"]\n\turl = {pin.repo}\n', encoding="utf-8")
    # The test can fail: git run in the folder without its repository named finds the enclosing one, and the commit there.
    assert _plain_git(folder, "cat-file", "-t", commit) == "commit"
    with pytest.raises(pytest.fail.Exception, match=re.escape(FETCH)):
        _repo(pin)


def _unpinned_cached_versions(cache: Path) -> list[tuple[str, str]]:
    """Return (plugin, version), sorted, of each cached version of a plugin the pins name that no pin covers.

    `cache` holds <marketplace>/<plugin>/<version> folders. A version is named by the "name" of its
    .claude-plugin/plugin.json, not by its folder, because a marketplace can list a plugin under another folder name; a
    version with no plugin.json falls back to its folder name, and a plugin.json that is not JSON fails loudly.
    """
    pinned = {(pin.plugin, pin.version) for entries in excerpt_lock.NO_COPY_SOURCES.values() for pin in entries}
    names = {plugin for plugin, _ in pinned}
    cached: set[tuple[str, str]] = set()
    for version in cache.glob("*/*/*"):
        if not version.is_dir():
            continue
        manifest = version / ".claude-plugin" / "plugin.json"
        name = json.loads(manifest.read_text(encoding="utf-8")).get("name") if manifest.is_file() else None
        name = name or version.parent.name
        if name in names:
            cached.add((name, version.name))
    return sorted(cached - pinned)


def test_every_cached_version_of_a_forbidden_plugin_is_pinned() -> None:
    """Every version in the plugin cache of a plugin the pins name, under any marketplace or folder name, has a pin with that version.

    Without the plugin cache (CI) this skips loudly. Where the cache exists it fails as soon as a new version of a
    forbidden plugin is installed, until that version's public commit is added to NO_COPY_SOURCES.
    """
    cache: Path = excerpt_lock.CACHE
    if not cache.is_dir():
        pytest.skip(f"SKIPPED, NOT VERIFIED: plugin cache {cache} is absent, cached versions not checked")
    assert _unpinned_cached_versions(cache) == [], "cached versions of a forbidden plugin with no pin in NO_COPY_SOURCES"


def test_a_cached_version_is_matched_by_the_name_in_its_plugin_json(tmp_path: Path) -> None:
    """A cached version counts by the name in its plugin.json, not by its folder name, and by its folder name when it has no plugin.json."""
    names = {"claude-keep-sessions/0.2.0": "keep-sessions", "claude-keep-sessions/0.9.9": "keep-sessions", "keep-sessions/0.8.0": None}
    for folder, name in names.items():
        version = tmp_path / "some-marketplace" / folder
        version.mkdir(parents=True)
        if name is not None:
            (version / ".claude-plugin").mkdir()
            (version / ".claude-plugin" / "plugin.json").write_text(json.dumps({"name": name, "version": version.name}), encoding="utf-8")
    # 0.2.0 is pinned; 0.9.9 sits under another folder name and 0.8.0 has no plugin.json, and neither is pinned.
    assert _unpinned_cached_versions(tmp_path) == [("keep-sessions", "0.8.0"), ("keep-sessions", "0.9.9")]


def test_the_mit_licence_wording_is_notice_s_licence_block() -> None:
    """MIT_LICENCE_WORDING is exactly the licence block NOTICE reproduces, so the prior-art excuse tracks the shipped text.

    NOTICE must reproduce the MIT licence for every MIT-licensed excerpt it credits, so if the constant drifts
    (a typo, a paraphrase, a widened paragraph) the two disagree: the excuse stops matching the runs that need
    it, or silently excuses wording NOTICE does not carry. The NOTICE block runs from the "Permission is hereby
    granted" line to the closing "SOFTWARE." line of its first licence reproduction.
    """
    notice = (ROOT / "NOTICE").read_text(encoding="utf-8")
    assert MIT_LICENCE_WORDING in notice, "MIT_LICENCE_WORDING is not verbatim in NOTICE; align it with NOTICE's licence block"


def test_the_idiom_phrases_are_exactly_the_ruled_set() -> None:
    """The idiom set is closed: exactly the phrases ruling 1 names plus the generated-types path (2026-11-10), each with a provenance note and written normalized.

    It catches a phrase added by accident. A phrase added on purpose changes this set in the same diff, so the review of
    that diff, with the ruling and the provenance note it needs, is the guard against it.
    """
    assert set(IDIOM_PHRASES) == {
        "ui sans serif system ui apple system segoe ui",
        "stroke linecap round stroke linejoin round text x",
        "animate attributename opacity values 0 1 dur 0",
        "claude plugin types claude code index d ts",
    }, f"IDIOM_PHRASES changed. {IDIOM_UPDATE}"
    assert all(note.strip() for note in IDIOM_PHRASES.values()), "every idiom phrase needs its provenance note"
    assert all(phrase == " ".join(w for w, _ in _words(phrase)) for phrase in IDIOM_PHRASES), "a phrase must be written normalized"


def test_each_idiom_exemption_matches_its_file() -> None:
    """Every IDIOM_EXEMPTIONS entry names a shipped code file, a phrase of the closed set and the exact number of its occurrences there."""
    texts, views = _shipped()
    problems = _idiom_problems(texts, views, IDIOM_EXEMPTIONS, IDIOM_PHRASES)
    assert problems == [], "\n".join(problems)


IDIOM = "ui sans serif system ui apple system segoe ui"
IDIOM_LINE = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI"'  # normalizes to IDIOM exactly


def _idiom_case(ref_text: str, source_text: str, exempt: list[str] | None = None) -> list[str]:
    refs = {"hooks/x/a.ts": ref_text, "hooks/x/b.ts": ref_text}
    idioms = {"hooks/x/a.ts": [tuple(p.split()) for p in (exempt if exempt is not None else [IDIOM])]}
    return find_hits(refs, {"src/theme.css": source_text}, kinds=("words",), idioms=idioms)


def test_an_exempted_idiom_is_not_a_hit_in_its_own_file_only() -> None:
    """The exact phrase in its exempted file is not reported; the same phrase in a file with no entry still is."""
    hits = _idiom_case(f"alpha {IDIOM_LINE} omega\n", f"zulu {IDIOM_LINE} yankee\n")
    assert [h.split(":", 1)[0] for h in hits] == ["hooks/x/b.ts"], hits


def test_a_run_reaching_past_the_idiom_is_still_a_hit() -> None:
    """A shared run one word longer than the phrase is reported even in the exempted file."""
    hits = _idiom_case(f"alpha {IDIOM_LINE}, Roboto\n", f"zulu {IDIOM_LINE}, Roboto\n")
    assert any(h.startswith("hooks/x/a.ts:") for h in hits), hits


def test_a_run_reaching_before_the_idiom_is_still_a_hit() -> None:
    """A shared run that starts one word before the phrase is reported even in the exempted file."""
    hits = _idiom_case(f"alpha Roboto, {IDIOM_LINE}\n", f"zulu Roboto, {IDIOM_LINE}\n")
    assert any(h.startswith("hooks/x/a.ts:") for h in hits), hits


def test_another_run_in_an_exempted_file_is_still_a_hit() -> None:
    """A different shared run in the exempted file is reported: the entry excuses its phrase only."""
    other = "the guard refuses a token that runs past the end of the buffer"
    hits = _idiom_case(f"{other}\n", f"{other}\n")
    assert any(h.startswith("hooks/x/a.ts:") for h in hits), hits


@pytest.mark.parametrize(
    ("exemptions", "kind"),
    [
        pytest.param({"hooks/x/a.ts": {IDIOM: 2}}, "COUNT", id="count-too-high"),
        pytest.param({"hooks/x/a.ts": {IDIOM: 0}}, "COUNT", id="count-too-low"),
        pytest.param({"hooks/x/a.ts": {"alpha bravo charlie delta echo foxtrot golf hotel": 1}}, "PHRASE", id="phrase-outside-the-set"),
        pytest.param({"README.md": {IDIOM: 1}}, "PATH", id="markdown-file"),
        pytest.param({"hooks/x/gone.ts": {IDIOM: 1}}, "PATH", id="file-not-shipped"),
        pytest.param({"hooks/x/a.json": {IDIOM: 1}}, "PATH", id="data-file-not-code"),
    ],
)
def test_a_wrong_idiom_exemption_is_reported(exemptions: dict[str, dict[str, int]], kind: str) -> None:
    """A count that differs from the file, a phrase outside the closed set, and a path that is not a shipped code file are each reported, with how to update the entry."""
    texts = {"README.md": f"{IDIOM_LINE}\n"}
    views = {"hooks/x/a.ts": f"{IDIOM_LINE}\n", "hooks/x/a.json": f"{IDIOM_LINE}\n"}
    problems = _idiom_problems(texts, views, exemptions, IDIOM_PHRASES)
    assert [p.split(" ", 1)[0] for p in problems] == [kind], problems
    assert "provenance note" in problems[0] and "IDIOM_EXEMPTIONS[path][phrase]" in problems[0], problems


def test_a_correct_idiom_exemption_passes() -> None:
    """An entry with the right path, phrase and count raises no problem."""
    assert _idiom_problems({}, {"hooks/x/a.ts": f"{IDIOM_LINE}\n"}, {"hooks/x/a.ts": {IDIOM: 1}}, IDIOM_PHRASES) == []
