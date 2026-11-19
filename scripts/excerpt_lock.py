#!/usr/bin/env python3
# The shebang is here only because CPV flags a .py in scripts/ without one: a validator false positive,
# reworded (strict MINOR, Emasoft/claude-plugins-validation#269, open). This module is import-only and
# does nothing when run; 7bf754a had removed the shebang for that reason.
"""Parsing, verification and lock helpers for the third-party mod excerpts in skills/mods-example-*/references/*.md.

Standard library only, so scripts/update_excerpt_lock.py runs without the dev extra. The tests monkeypatch CACHE
and MOD_DIRS on this module, so every function reads them from the module globals at call time.
An excerpt is a heading "### <mod> <version>, <file>:<start>-<end>, <licence>" followed by the next fenced block.
A mod has one of two source kinds: "cache" (the installed plugin cache, version folder in the heading) or "clone"
(a git clone of a community repo, listed in CLONE_PINS; the version slot is the full 40-character upstream commit
and the file is read with `git -C <clone> cat-file blob <commit>:<file>`).
The cache and the clones are untrusted data: they are only read, and nothing in them is ever run.
Forbidden mods are pinned to public commits (NO_COPY_SOURCES), fetched by scripts/fetch_no_copy_sources.py into
NO_COPY_ROOT; only the no-copy test reads them. THIRD_PARTY_FILES and LOCK_FILES name the files that test does not scan.
"""

from __future__ import annotations

import hashlib
import os
import re
import subprocess
from pathlib import Path
from typing import NamedTuple

ROOT = Path(__file__).resolve().parent.parent
CACHE = Path.home() / ".claude/plugins/cache"
CLONES = ROOT / "downloads_dev/mod-corpus-2026-10-29"
# Commit each community repo was cloned at (TRDD-2XFV601A, Corpus pins). The plugin redistributes excerpts of these
# repos, so an excerpt heading must carry exactly this commit: the lock then proves the text equals upstream at it.
CLONE_PINS = {
    "Amnesiac9__claude-mods": "199a91026a202e456f00db751dd2ccc1732a5f0f",
    "anantraghunath__claude-code-usage-quota-mod": "5444bb3fdf523e561f397355055c11dc95224ace",
    "bully911210__claude-code-mods": "bf4e5297845df85e7c678260c8a2b8e3734120a6",
    "dionlima1__account-sync-for-claude": "1e447c888b7114f343036074e64d0fc636dbb80c",
    "endavis__claude-code-usage-quota-mod": "1a0f370e074cf752b2c692458324c1632d95ff57",
    "fanoisme__claude-mods": "4891b8f75f8dc0a7253dc1a32fb0be0e3f7237e9",
    "ivokund__claude-account-rotator": "3481f0feb5161fac0826336b2b0ad68eb0e225fd",
    "jrlprost__claude-code-mods": "9f789939f4b0fabbc9309b8c84df358536a2619b",
    "manuacl__claude-mods": "03d552c6faa294d2abe24cdfc60c0cc7bdf35a46",
    "MarvelCollin__ClaudeDeck": "eb9b064a72b4cc1cf3bc2a3fa6c77550666bd62e",
    "moabualruz__rice-session-accounts": "af30e671ec5164c32848477bc51d3072876d2682",
    "plexxed__claude-desktop-account-switcher": "1035f712cd0f45dfd9f9904546cccc3e5f350013",
    "sam-ruff__account-switcher-claude-code-mod": "3f47d2b23bcda686aae86bf8f1db30cfa8c32c9c",
    "simplecore-inc__claude-mods": "bbaba993776913888aa02a9e21e101a46b1f0bce",
    "trongtaiz__account-swap": "8153e6b671bce9786b6a4efe189febdf08426667",
}
MOD_DIRS = {
    "tokensaver": CACHE / "claude-tokensaver/tokensaver",
    "deck": CACHE / "deck/deck",
    "ponytail": CACHE / "ponytail/ponytail",
    "context-harness": CACHE / "context-harness/context-harness",
    "token-weather-usage": CACHE / "augiefra-mods/token-weather-usage",
    **{repo: CLONES / repo for repo in CLONE_PINS},
}
# Mods whose licence does not allow copying text out of them: token-optimizer is PolyForm Noncommercial, and the three
# community repos carry no licence grant. None is excerpted; the no-copy test reads each at its public commits
# (NO_COPY_SOURCES), and none of them is a clone pin.
FORBIDDEN = {
    "token-optimizer",
    "IlyaPryzhykau__claude-keep-sessions",
    "raoofaltaher__claude-code-mods",
    "qodfathr__ccwhoami",
}
LICENCES = {
    "tokensaver": "MIT",
    "deck": "MIT",
    "ponytail": "MIT",
    "context-harness": "MIT",
    "token-weather-usage": "Apache-2.0",
    # An owner risk acceptance, not a licence file: barmkin-mod's plugin.json says MIT, its repository has no LICENSE
    # file and the copyright holder is unknown. Owner ruling 2026-11-01: "consider barmkin MIT".
    "barmkin-mod": "MIT",
    # The LICENSE file of https://github.com/purpleheads2026/Mod_claude at f30974ef0d0b985931af5865529e0809143b4ff2
    # (blob bfa744d, "Copyright (c) 2026 Samuel", present since 2026-10-11) is MIT.
    "regia": "MIT",
    "Amnesiac9__claude-mods": "MIT",
    "anantraghunath__claude-code-usage-quota-mod": "MIT",
    "bully911210__claude-code-mods": "MIT",
    "dionlima1__account-sync-for-claude": "MIT",
    "endavis__claude-code-usage-quota-mod": "MIT",
    "fanoisme__claude-mods": "MIT",
    "ivokund__claude-account-rotator": "MIT",
    "jrlprost__claude-code-mods": "MIT",
    "manuacl__claude-mods": "Apache-2.0",
    "MarvelCollin__ClaudeDeck": "MIT",
    "moabualruz__rice-session-accounts": "MIT",
    "plexxed__claude-desktop-account-switcher": "MIT",
    "sam-ruff__account-switcher-claude-code-mod": "MIT",
    "simplecore-inc__claude-mods": "MIT",
    "trongtaiz__account-swap": "MIT",
    # Caveman by Julius Brussee (https://github.com/juliusbrussee/caveman), Apache-2.0 since 3.0.0: the source of the
    # caveman voice tokensaver adapted into src/core/caveman.ts, which the Tokensaver port carries (TRDD-71KVH9PA). The
    # license, the earlier MIT notice and the NOTICE ship as hooks/tokensaver/caveman-*.txt, as tokensaver ships them.
    "caveman": "Apache-2.0",
}
# File extensions read as binary, never as text, in the clones and the no-copy sources alike (tests/test_no_copy_unlicensed.py).
BINARY_EXTENSIONS = frozenset({"png", "gif", "jpg", "jpeg", "ico", "wav", "mp3", "mp4", "woff", "woff2", "ttf", "zip"})


class NoCopySource(NamedTuple):
    """One forbidden mod's source at one public commit, which the no-copy test reads (TRDD-R2GILGKU)."""

    repo: str  # the public repository, https://github.com/<owner>/<repo>
    commit: str  # the full 40-character commit
    plugin: str  # the name in its plugin.json; the cache test matches cached versions by it, whatever their folder name
    version: str  # the version in its plugin.json at that commit
    manifest: str  # the path of its plugin.json inside the repository


# The no-copy sources live here, one folder per pin (no_copy_dir), fetched by scripts/fetch_no_copy_sources.py.
# A folder of its own, never the corpus root above, so the corpus checks never see these repos.
NO_COPY_ROOT = ROOT / "downloads_dev/no-copy-sources"
# Every version of a forbidden mod this plugin's authors read, pinned to the public commit it was released at. Each folder
# holds the whole repository at that commit, which may be more than the installed plugin (a superset of its files).
NO_COPY_SOURCES: dict[str, tuple[NoCopySource, ...]] = {
    "token-optimizer": (
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "491efe89c48961e3864f9f6a41d8a29d341124fb",
            "token-optimizer",
            "5.13.58",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "65c823a4bde4f0756a6396777f15deecc93557cd",
            "token-optimizer",
            "5.13.60",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "077bf10dcf442762c85f026e41ec8e0817e3e5e3",
            "token-optimizer",
            "5.13.61",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "5054ceaece25caf16ba4622ffcdb92e3b2ce89cf",
            "token-optimizer",
            "5.13.62",
            ".claude-plugin/plugin.json",
        ),
        # Each cached restricted-source version needs independently verified provenance (TRDD-R2GILGKU).
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "3f29392d69525d4b5c324c7075bfdba3a83effe9",
            "token-optimizer",
            "5.13.63",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "55da0b1179afa98455fa1b1c6e3dd372afa8ec3f",
            "token-optimizer",
            "5.13.64",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "4544720cc1fb155feac1ca816ee53005b872b433",
            "token-optimizer",
            "5.13.65",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "86d9374b29c5e25e3d15e19f8765dd75b535817c",
            "token-optimizer",
            "5.13.66",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "02f4387c2b5717533d6a8331a3b661a0cb74c240",
            "token-optimizer",
            "5.13.67",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "86e2daa524def9613199a1291c3c81a94adaa0bb",
            "token-optimizer",
            "5.13.68",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "414a1dba0e685d6bf3ec8b27d37244b8735417d3",
            "token-optimizer",
            "5.13.69",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/alexgreensh/token-optimizer",
            "1d9cdaee843050ba9ab34aa4dd4a9d55a688495d",
            "token-optimizer",
            "5.13.70",
            ".claude-plugin/plugin.json",
        ),
    ),
    "IlyaPryzhykau__claude-keep-sessions": (
        NoCopySource(
            "https://github.com/IlyaPryzhykau/claude-keep-sessions",
            "ee9d3afe5bb43c4eb1797b177d1785429c66bc17",
            "keep-sessions",
            "0.1.0",
            ".claude-plugin/plugin.json",
        ),
        NoCopySource(
            "https://github.com/IlyaPryzhykau/claude-keep-sessions",
            "4d3476aa316deccf38f7df43cb5fa4c2f122895f",
            "keep-sessions",
            "0.2.0",
            ".claude-plugin/plugin.json",
        ),
    ),
    "qodfathr__ccwhoami": (
        NoCopySource(
            "https://github.com/qodfathr/ccwhoami",
            "8071d18866780d53ed8598f19e5e817c5ea7f158",
            "ccwhoami",
            "0.1.0",
            ".claude-plugin/plugin.json",
        ),
    ),
    "raoofaltaher__claude-code-mods": (
        NoCopySource(
            "https://github.com/raoofaltaher/claude-code-mods",
            "6d7f12029d67e7a7a6cb72b284c40512090b828b",
            "tool-icons",
            "0.1.0",
            "tool-icons/.claude-plugin/plugin.json",
        ),
    ),
}
# Forbidden mods with no public source to compare against, each with the reason. Empty: every forbidden mod has one.
NO_COPY_AVAILABLE: dict[str, str] = {}


class ThirdPartyFile(NamedTuple):
    """A verbatim third-party file the no-copy test does not scan, the credit a test checks for it and the content it excuses (TRDD-R2GILGKU)."""

    reason: str
    repo: str = ""  # a copied file: the repository NOTICE names in the same paragraph as the file's own path
    marker: str = ""  # a CPV canonical file: a line among its first THIRD_PARTY_HEADER_LINES lines
    sha256: str = ""  # the sha256 of the file's bytes when its exclusion was reviewed; any other content is scanned


COPIED_EXAMPLES_REPO = "https://github.com/BeLazy167/claude-mods-skill"
_COPIED_EXAMPLES_REASON = "verbatim copy of BeLazy167/claude-mods-skill at 396f0d4 (MIT), credited in NOTICE"
# Deck 0.4.12, the reviewed source "deck" of LICENCES, at the commit its cached plugin equals file for file (checked
# 2026-11-04 with git hash-object against the repository's blobs): the source of the Deck port (TRDD-RD1ISPMN).
DECK_REPO = "https://github.com/nvr0x5/claude-deck"
DECK_COMMIT = "1ecf6deb9199d3b1fa570bf08a57e69772bbb5af"
DECK_COPYRIGHT = "Copyright (c) 2026 nvr0x5"
_DECK_SOUNDS_REASON = "verbatim copy of nvr0x5/claude-deck sounds/ at 1ecf6de (MIT), credited in NOTICE"
THIRD_PARTY_HEADER_LINES = 15
# The files the no-copy test does not scan, one entry per FILE and only for a verbatim third-party copy: the BeLazy167
# example files that equal upstream at 396f0d4 byte for byte (hello-mod/smoke.sh was edited, so it stays scanned, as do
# the examples written for this plugin), the Deck sounds in assets/deck/ (TRDD-RD1ISPMN), and the CPV canonical files,
# whose changes belong in CPV. A test requires each
# path to exist with the sha256 recorded here, NOTICE to name each copied file's own path in one paragraph with its
# repository, and each CPV file to carry its template's header line, so the list cannot grow silently and a file edited
# after its review (a local change, a new CPV template) fails until it is scanned or reviewed again. publish.py carries
# two comments of this plugin (its "Local addition" lines), which this exclusion leaves unscanned.
THIRD_PARTY_FILES: dict[str, ThirdPartyFile] = {
    **{
        path: ThirdPartyFile(_COPIED_EXAMPLES_REASON, repo=COPIED_EXAMPLES_REPO, sha256=sha256)
        for path, sha256 in {
            "skills/mods-tutorial-call-intercept-mods/examples/dice-tool/.claude-plugin/plugin.json": "25b21277219ef1c30f593325a90c69aeb89ae893805534331f8368b3234eb543",
            "skills/mods-tutorial-call-intercept-mods/examples/dice-tool/hooks/hooks.json": "c835c92d8e1159d20a40ca78ad654da7433942c3694ffeda0b376b0c4dfd52cf",
            "skills/mods-tutorial-call-intercept-mods/examples/dice-tool/hooks/register.ts": "5654872389263a3381a5ab539b48a524bfad4705582b5c25698687173af07458",
            "skills/mods-tutorial-call-intercept-mods/examples/dice-tool/tests/register.test.ts": "4b4bec55e950633925687360db1a3df84ad0d865ae7d68a653f95bd44f5f5dce",
            "skills/mods-tutorial-call-intercept-mods/examples/dice-tool/tsconfig.json": "4087cf0ba92fde503ed0e7c56f37bcb26ad0c085873f10219d0336c0f19b5a8f",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/.claude-plugin/plugin.json": "f8c1dcac17939ecec4a4de76a6db0d256edbd50f19e7423a772468fd69ac7ee6",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/README.md": "25d110061f069cf8695fe6792e75dfe366f84e45404c577c005513e3d7eb446c",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/hooks/hooks.json": "641feded2976cd40074c6f681c40cf98289a7d9721e1bacdc1586be1157c13f6",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/hooks/register.ts": "e0330396cdd0865a4e26199d007fd40307f599dd67711b12c30df4a09e22499a",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/tests/register.test.ts": "cec9b73c187da2088211a0289e8bc987b0ffe6265bca6da4be06547bcccac767",
            "skills/mods-tutorial-call-intercept-mods/examples/hello-mod/tsconfig.json": "4087cf0ba92fde503ed0e7c56f37bcb26ad0c085873f10219d0336c0f19b5a8f",
            "skills/mods-tutorial-call-intercept-mods/examples/redact-output/.claude-plugin/plugin.json": "bc6fc7f198f03428bfafffd8f707984e802b0cb5a5b224503fe7df36f3481c1e",
            "skills/mods-tutorial-call-intercept-mods/examples/redact-output/hooks/hooks.json": "c835c92d8e1159d20a40ca78ad654da7433942c3694ffeda0b376b0c4dfd52cf",
            "skills/mods-tutorial-call-intercept-mods/examples/redact-output/hooks/register.ts": "9d686ad6adc9ae5d32c5903d8cd901904afdd4438ee80ba0dbdffd2030672ec0",
            "skills/mods-tutorial-call-intercept-mods/examples/redact-output/tests/register.test.ts": "92e27a58747939be49b21c45d9f96b7435428eac03f042d75a23d556ae6a1866",
            "skills/mods-tutorial-call-intercept-mods/examples/redact-output/tsconfig.json": "4087cf0ba92fde503ed0e7c56f37bcb26ad0c085873f10219d0336c0f19b5a8f",
            "skills/mods-tutorial-interface-mods/examples/branch-band/.claude-plugin/plugin.json": "957b0203ba80e26d0766848fbcff40b30f0848ad915f57f642be15600fcb9d90",
            "skills/mods-tutorial-interface-mods/examples/branch-band/hooks/hooks.json": "d842d789476d67282d0f04b7e5fdc68a3d981ccec65dd79cfa2d11eed13fb828",
            "skills/mods-tutorial-interface-mods/examples/branch-band/hooks/register.tsx": "eff6cc8e0d589c0b2a2889b2c342c62e8e9ff0cb507fe753478e53bd7878c28e",
            "skills/mods-tutorial-interface-mods/examples/branch-band/tests/register.test.ts": "10a4fdc10a92fbfbcc25ef22018d3e917c8e34d9aa663af8878539e16921e0fa",
            "skills/mods-tutorial-interface-mods/examples/branch-band/tsconfig.json": "4087cf0ba92fde503ed0e7c56f37bcb26ad0c085873f10219d0336c0f19b5a8f",
            "skills/mods-tutorial-interface-mods/examples/branch-band/types/index.d.ts": "8c0513e22a3a41488fab763482f8e15ee146f56ce926083cc89ca447bd1e8d76",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/.claude-plugin/plugin.json": "1831b8b1a5315edb659caf77ac3be900066ea609dd0334b6d3ba80cc1ee5b444",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/hooks/hooks.json": "d842d789476d67282d0f04b7e5fdc68a3d981ccec65dd79cfa2d11eed13fb828",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/hooks/register.tsx": "cbc6bcdec2cee49232ea9bf40fb04f142e8614f5b77856fcc6aba63c6661607f",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/tests/register.test.ts": "7d1511eb8c5acef2e13788c2ed4235ae21ee5dacd8a532ecf3a73b0bce6af93c",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/tsconfig.json": "4087cf0ba92fde503ed0e7c56f37bcb26ad0c085873f10219d0336c0f19b5a8f",
            "skills/mods-tutorial-interface-mods/examples/notes-pane/types/index.d.ts": "15cc636a1d5fbf4cf69eb3129df0adb5ec68e60059d6c23ecdbf6579591bd543",
        }.items()
    },
    "scripts/publish.py": ThirdPartyFile(
        "CPV canonical copy of gen_publish_py's template (Emasoft/claude-plugins-validation), with two local edits: the test-suite budget raised from 1800 s to 5400 s for the 3x1200 s kit-test retry loop (TRDD-RD1ISPMN, 2026-11-12), and the no-copy fetch of TRDD-R2GILGKU pinned sources added as a pre-test step (2026-11-11)",
        marker='"""Unified publish pipeline: bypass-guard -> lint -> validate (remote CPV) -> test -> bump -> badge -> changelog -> commit -> push -> release.',
        sha256="f7306311060339364ef6db8c8c21a96ff35bb456e940ffbec3130938b265ad2a",
    ),
    "scripts/cpv_network_resilience.py": ThirdPartyFile(
        "CPV canonical copy of CPV's own module, shipped verbatim by gen_cpv_network_resilience_py",
        marker='"""Network-resilience helpers for CPV.',
        sha256="870f127028567c8ac8764a158ee7e6ea479967cc494efb3f2e75b4ee17628572",
    ),
    "git-hooks/pre-push": ThirdPartyFile(
        "CPV canonical copy of gen_pre_push_hook's template",
        marker="# Auto-generated from claude-plugins-validation's gen_pre_push_hook template.",
        sha256="e4e7b206534e96912e5f2659b74756864f8eaaeb7fe2bb6d9ecea12c5526405f",
    ),
    **{
        path: ThirdPartyFile(_DECK_SOUNDS_REASON, repo=DECK_REPO, sha256=sha256)
        for path, sha256 in {
            "assets/deck/alert.wav": "a88401119c93c9904ae2420e9ae49c212a4df6cb430fe1005986bb5cab4a41dd",
            "assets/deck/chime.wav": "e2ef47eb4021ede00d5f0cba5ec4833b3036330ead704ce285d3ab026636632d",
            "assets/deck/error.wav": "ff2972f3dda92404581b69f66759b574a6d2dcdd0f864993c997b988e4d1e67e",
            "assets/deck/fanfare.wav": "47fe0bab08461e66f59bf21eaca2d9694c3ffb202426f7330c3018440151ba05",
            "assets/deck/tick.wav": "2ce394eb579c62b3f1d6cb251e006273bf2f020f5f7e1f635744ab577c78b224",
        }.items()
    },
}


class AdaptedFile(NamedTuple):
    """A file this plugin adapted from a third-party file, where it came from, the reviewed source whose licence covers it and where its licence obligations ship (TRDD-RD1ISPMN, TRDD-71KVH9PA)."""

    repo: str  # the upstream repository URL, named again in the file's header and in a NOTICE paragraph with the file's path
    commit: str  # the upstream commit the file was adapted from, 7 to 40 hex digits
    upstream_path: str  # the file's path in that repository at that commit
    licence: str  # the upstream licence, as its LICENSE file names it; must equal LICENCES[source]
    source: str  # the LICENCES key of the reviewed source this file comes from: only a reviewed source may be adapted
    copyright: str  # the upstream copyright line, verbatim, as the upstream LICENSE file writes it
    licence_file: str  # the shipped file ("NOTICE" or a path) holding that copyright line and the full licence text
    notice_file: str = ""  # Apache-2.0 only: the shipped copy of the upstream NOTICE text (section 4(d)), carried into NOTICE too


# Files this plugin adapts from a third-party file under orchestrator ruling 2 of 2026-11-04, one entry per FILE, added in
# the same commit as the file. Unlike THIRD_PARTY_FILES, which holds byte-verbatim copies the no-copy scan leaves out,
# these files are changed here and stay scanned. Each must carry among its first THIRD_PARTY_HEADER_LINES lines the
# ADAPTED_HEADER line naming the entry's repository, commit, upstream path and licence, and an ADAPTED_CHANGE line saying
# what changed (Apache License 2.0, section 4(b), requires such a notice in a modified file; the ruling asks it of every
# adapted file, whatever its licence), and NOTICE must name the file's path with its repository in one paragraph
# (notice_names). The path must be published (in no *_dev folder) and not a markup file (CSS, SVG, HTML: the idiom
# exemptions cover code files only, and widening them needs a ruling); the source a LICENCES key with the entry's
# licence; the repository none of NO_COPY_SOURCES, whose mods forbid copying. The licence obligations ship too: the
# copyright line verbatim with the full licence text (LICENCE_TEXT_MARKERS) in licence_file, and for Apache-2.0 the
# upstream NOTICE text in notice_file and in NOTICE (section 4(d)). tests/test_adapted_files.py checks every entry, and
# fails on a tracked file whose header claims adaptation with no entry. The files adapted before ruling 2
# (skills/mods-skill-to-mod and hooks/self-command/logic.ts) credit themselves in prose and in NOTICE and are not listed.
# The Deck port's files (TRDD-RD1ISPMN); the Tokensaver port adds its own in the same commit as its files.
ADAPTED_FILES: dict[str, AdaptedFile] = {
    path: AdaptedFile(DECK_REPO, DECK_COMMIT, upstream, "MIT", "deck", DECK_COPYRIGHT, "NOTICE")
    for path, upstream in {
        "hooks/deck/register.js": "hooks/register.js",
        "hooks/deck/styles-desktop.js": "hooks/styles-desktop.js",
        "hooks/deck/styles-terminal.js": "hooks/styles-terminal.js",
        "hooks/deck/theme.js": "hooks/theme.js",
        "hooks/tests/deck.test.ts": "tests/deck.test.ts",
    }.items()
}
# Tokensaver 0a4ba5c, the reviewed source "tokensaver" of LICENCES: the source of the Tokensaver port (TRDD-71KVH9PA). Its
# caveman voice is Caveman's (the source "caveman", Apache-2.0), so that file ships Caveman's licence and NOTICE.
# Named TSAVER_, not TOKENSAVER_: gitleaks' generic-api-key rule reads a 40-hex value given to a name holding "token" as a
# key, and the commit is no secret.
TSAVER_REPO = "https://github.com/AGregDev/claude-tokensaver"
TSAVER_COMMIT = "0a4ba5c4c0745521de09a12cbc2a6b7751854a18"
TSAVER_COPYRIGHT = "Copyright (c) 2026 Gregory Albert"
ADAPTED_FILES |= {
    **{
        path: AdaptedFile(TSAVER_REPO, TSAVER_COMMIT, upstream, "MIT", "tokensaver", TSAVER_COPYRIGHT, "NOTICE")
        for path, upstream in {
            "hooks/tokensaver/register.tsx": "hooks/register.tsx",
            **{f"hooks/tokensaver/{group}/{name}.ts": f"src/{group}/{name}.ts" for group, names in {
                "core": ("delegate", "escalate", "guardian", "log", "route", "savings", "score", "tiers", "trim", "tune"),
                "runtime": ("assistant", "commands", "config", "session"),
                "ui": ("band", "format", "theme", "view"),
            }.items() for name in names},
            "hooks/tokensaver/ui/draw.ts": "src/ui/clawd.ts",
            # Its tests that run on the kit with their imports changed, and ui/ui, adapted to draw.ts.
            **{f"hooks/tests/tokensaver/{name}.test.ts": f"tests/{name}.spec.ts" for name in (
                "core/assistant", "core/caveman", "core/delegate", "core/route", "core/trim",
                "integration/agent-types", "integration/flow", "integration/hints", "ui/band", "ui/ui",
            )},
            "hooks/tests/tokensaver/helpers.ts": "tests/helpers.ts",
        }.items()
    },
    "hooks/tokensaver/core/caveman.ts": AdaptedFile(
        TSAVER_REPO,
        TSAVER_COMMIT,
        "src/core/caveman.ts",
        "Apache-2.0",
        "caveman",
        "Copyright 2026 Julius Brussee",
        "hooks/tokensaver/caveman-LICENSE.txt",
        "hooks/tokensaver/caveman-NOTICE.txt",
    ),
}
# The header lines, after a comment marker (//, /*, *, # or <!--) among a file's first THIRD_PARTY_HEADER_LINES lines; a
# block or HTML comment may close on the same line.
ADAPTED_HEADER = re.compile(r"^\s*(?://|/?\*|#|<!--)\s*Adapted from (\S+) at ([0-9a-f]{7,40}), (\S+), (.+?)\.\s*(?:\*/|-->)?\s*$")
ADAPTED_CHANGE = re.compile(r"^\s*(?://|/?\*|#|<!--)\s*Changed for mods-expert-developer-plugin: \S.*$")
# The MIT permission text a file crediting an MIT source must reproduce in full, whitespace-normalised (NOTICE for the
# tutorial source, tests/test_plugin_structure.py; the licence_file of each MIT ADAPTED_FILES entry).
MIT_PERMISSION_SENTENCES = (
    "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated"
    ' documentation files (the "Software"), to deal in the Software without restriction, including without limitation'
    " the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and"
    " to permit persons to whom the Software is furnished to do so, subject to the following conditions:",
    "The above copyright notice and this permission notice shall be included in all copies or substantial portions of"
    " the Software.",
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO'
    " THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE"
    " AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF"
    " CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER"
    " DEALINGS IN THE SOFTWARE.",
)
# What the full text of each licence in LICENCES must contain, whitespace-normalised: every MIT sentence, and the title,
# version line and both ends of the Apache License 2.0 terms.
LICENCE_TEXT_MARKERS: dict[str, tuple[str, ...]] = {
    "MIT": MIT_PERMISSION_SENTENCES,
    "Apache-2.0": (
        "Apache License",
        "Version 2.0, January 2004",
        "TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION",
        "END OF TERMS AND CONDITIONS",
    ),
}
# Tracked top folders neither the no-copy scan nor the adapted-files claim scan reads: design/ quotes sources as analysis
# records and the header form, and tests/ carries code as data (the checks' own fixtures). A plugin installed from its
# repository does carry them.
NOT_SCANNED_TOP = frozenset({"tests", "design"})
# Generated lock files, never scanned: their text is written by a package manager, not by anyone. Only lock formats the
# no-copy scan would otherwise read (JSON and YAML), or would report as a kind it cannot read (uv.lock), need a name here.
LOCK_FILES = frozenset({"package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "uv.lock"})
HEAD = re.compile(r"^### (\S+) (\S+), (\S+):(\d+)-(\d+), (.+)$")
# Own code of this plugin (not a third-party excerpt): a fenced block under this heading is a compilable module that
# tests/test_reference_modules.py type-checks. It is never locked or compared with a source.
MODULE = re.compile(r"^### Reference module, ([a-z0-9]+(?:-[a-z0-9]+)*), MIT \(this plugin\)$")
LOCK = ROOT / "tests/fixtures/example-excerpts.lock.json"
RERUN = 'run "uv run scripts/update_excerpt_lock.py" after re-verifying'


# One fence grammar for excerpts(), reference_modules() and unclaimed(): a block opens at a column-0 line of 3+ backticks
# and closes at the next column-0 line of 3+ backticks with nothing after optional whitespace. Without this, a line such
# as a template literal starting with three backticks and text would close a block early in one function but not in another.
FENCE_OPEN = re.compile(r"^`{3,}")
FENCE_CLOSE = re.compile(r"^`{3,}\s*$")


def fence_end(lines: list[str], opening: int) -> int | None:
    """Return the index of the line closing the fence opened at lines[opening], or None when it is never closed."""
    for k in range(opening + 1, len(lines)):
        if FENCE_CLOSE.match(lines[k]):
            return k
    return None


def notice_names(notice: str, rel: str, repo: str) -> bool:
    """Return whether one paragraph of NOTICE names the file path rel together with the repository repo.

    Both must stand alone: a.ts is not named by a.tsx or by x/a.ts, and github.com/a/b is not named by github.com/a/bc or
    github.com/a/b.c (a path after the repository, github.com/a/b/tree/x, still names it). THIRD_PARTY_FILES and
    ADAPTED_FILES credit their files this way, and their tests share this check.
    """
    named = re.compile(rf"(?<![\w./-]){re.escape(rel)}(?![\w/-])")
    credited = re.compile(rf"(?<![\w.-]){re.escape(repo)}(?![\w-]|\.[\w-])")
    return any(named.search(paragraph) and credited.search(paragraph) for paragraph in re.split(r"\n[ \t]*\n", notice))


MD_FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")


def _scan_fences(lines: list[str]) -> tuple[set[int], int | None, list[int]]:
    """Return (fenced line indexes, index of the opener left unclosed at end of file or None, hidden module heading indexes).

    A fence opens with 3+ backticks or tildes (a backtick fence's info string holds no backtick, so a prose line that is
    all inline code such as ```x``` opens nothing) and closes only on a line of the SAME character, at least as long as
    the opener, with nothing after it but spaces. A hidden module heading is a line of the "### Reference module,"
    form inside a fence opened by exactly three backticks: example text needs a longer or tilde fence to show a nested
    fence, so such a line is more likely a module swallowed by a stray fence than an example.
    """
    fenced: set[int] = set()
    hidden: list[int] = []
    opener: str | None = None
    opened_at = 0
    for i, line in enumerate(lines):
        m = MD_FENCE.match(line)
        if opener is None:
            if m and not (m.group(1)[0] == "`" and "`" in m.group(2)):
                opener, opened_at = m.group(1), i
                fenced.add(i)
            continue
        fenced.add(i)
        if m and m.group(1)[0] == opener[0] and len(m.group(1)) >= len(opener) and not m.group(2).strip():
            opener = None
        elif opener == "```" and line.startswith("### Reference module,"):
            hidden.append(i)
    return fenced, (opened_at if opener is not None else None), hidden


def fenced_lines(lines: list[str]) -> set[int]:
    """Return the indexes of the lines that open, sit inside or close a CommonMark fenced block.

    A ```ts line inside a four-backtick fence, or backticks inside a tilde fence, do not close it. Headings on these
    lines are example text, not headings, and both the heading count (tests) and reference_modules() must skip them alike.
    """
    return _scan_fences(lines)[0]


def fence_problems(root: Path) -> list[str]:
    """Return one line per reference whose fences cannot be trusted: an unclosed fence, or a module heading inside a three-backtick fence.

    Sharing fenced_lines between the heading count and the parser means a stray unclosed fence hides a module from both,
    so the count check cannot see it; this reports the stray itself.
    """
    out = []
    for ref in references(root):
        _, unclosed, hidden = _scan_fences(ref.read_text(encoding="utf-8").splitlines())
        rel = ref.relative_to(root)
        if unclosed is not None:
            out.append(f"UNCLOSED FENCE {rel}:{unclosed + 1}: a fenced block is never closed, so everything after it is read as code")
        out += [f"HIDDEN MODULE HEADING {rel}:{n + 1}: inside a three-backtick fence (a stray unclosed fence before it?)" for n in hidden]
    return out


def references(root: Path) -> list[Path]:
    return sorted(root.glob("skills/mods-example-*/references/*.md"))


def excerpt_spans(text: str):
    """Yield (heading match, block lines or None, 1-based heading line, 1-based first block line or None) per excerpt heading.

    Headings inside a fenced example are skipped. The first block line is the line after the opening fence, and is None
    exactly when the block is None.
    """
    lines = text.splitlines()
    fenced = fenced_lines(lines)
    for i, line in enumerate(lines):
        m = HEAD.match(line)
        if not m or i in fenced:
            continue
        j = i + 1
        while j < len(lines) and not FENCE_OPEN.match(lines[j]) and not lines[j].startswith("### "):
            j += 1
        if j >= len(lines) or not FENCE_OPEN.match(lines[j]):
            yield m, None, i + 1, None
            continue
        k = fence_end(lines, j)
        yield m, (lines[j + 1 : k] if k is not None else None), i + 1, (j + 2 if k is not None else None)


def excerpts(text: str):
    """Yield (heading match, block lines or None, 1-based heading line) for each excerpt heading outside a fenced example."""
    for m, block, line_no, _ in excerpt_spans(text):
        yield m, block, line_no


def all_excerpts(root: Path):
    for ref in references(root):
        for m, block, line_no in excerpts(ref.read_text(encoding="utf-8")):
            yield ref, m, block, f"{ref.relative_to(root)}:{line_no}"


def modules_in(lines: list[str]):
    """Yield (name, language tag, block lines, 0-based heading index) for each reference-module block in the lines of one file.

    The fence must follow the heading with only blank lines between, and must be closed (fence_end): anything else
    yields no block. Headings inside a fenced example are skipped (fenced_lines).
    """
    fenced = fenced_lines(lines)
    for i, line in enumerate(lines):
        m = MODULE.match(line)
        if not m or i in fenced:
            continue
        j = i + 1
        while j < len(lines) and not lines[j].strip():
            j += 1
        if j >= len(lines) or not FENCE_OPEN.match(lines[j]):
            continue
        k = fence_end(lines, j)
        if k is None:
            continue
        yield m.group(1), lines[j].lstrip("`").strip(), lines[j + 1 : k], i


def reference_modules(root: Path):
    """Yield (reference file, name, language tag, block lines, "relpath:line") for each reference-module block.

    The line is that of the heading. The caller detects a heading that yielded no block by counting headings that
    start with "Reference module," against the blocks yielded. Only the first fence is yielded; a second one under the
    same heading is reported by unclaimed(), so exactly one block per module heading is ever compiled.
    """
    for ref in references(root):
        for name, lang, block, i in modules_in(ref.read_text(encoding="utf-8").splitlines()):
            yield ref, name, lang, block, f"{ref.relative_to(root)}:{i + 1}"


def checked(mod: str) -> bool:
    """Return True when the mod has a source to compare against; a forbidden repo is never compared, only reported."""
    return mod in MOD_DIRS and mod not in FORBIDDEN


def clone_present(mod: str) -> bool:
    """Return True when the clone folder of a pinned repo, with its .git, exists."""
    return (MOD_DIRS[mod] / ".git").exists()


def absent_source(mod: str, where: str) -> str | None:
    """Return the ABSENT line for an excerpt whose source tree (clone or plugin cache) is not there, else None."""
    if mod in CLONE_PINS:
        return None if clone_present(mod) else f"CLONE ABSENT {where}: {MOD_DIRS[mod]}"
    return None if CACHE.is_dir() else f"CACHE ABSENT {where}: {CACHE}"


def read_source(mod: str, version: str, file: str) -> list[str] | None:
    """Return the lines of the file an excerpt heading cites, or None when that source is not available.

    A cache mod reads <MOD_DIRS[mod]>/<version>/<file>. A clone mod reads `git -C <clone> cat-file blob <version>:<file>`,
    and only when version is the pinned commit: a heading that names another revision must fail (see pins), never be
    compared against a revision the lock does not vouch for, and the unpinned string never reaches git.
    """
    mod_dir = MOD_DIRS.get(mod, Path("/nonexistent"))
    if mod in CLONE_PINS:
        if version != CLONE_PINS[mod] or not clone_present(mod):
            return None
        # Replace refs off (GIT_NO_REPLACE_OBJECTS): a replace ref in a clone would make git return another blob for
        # the pinned file, and the lock would then vouch for text that is not upstream's (TRDD-R2GILGKU L1).
        blob = subprocess.run(
            ["git", "-C", str(mod_dir), "cat-file", "blob", f"{version}:{file}"],
            capture_output=True,
            check=False,
            timeout=30,
            env={**os.environ, "GIT_NO_REPLACE_OBJECTS": "1"},
        )
        return blob.stdout.decode("utf-8", errors="replace").splitlines() if blob.returncode == 0 else None
    src = mod_dir / version / file
    return src.read_text(encoding="utf-8", errors="replace").splitlines() if src.is_file() else None


def missing(root: Path) -> list[str]:
    """Return CLONE/CACHE ABSENT when the source tree is not there, MISSING when it is there but lacks the cited file."""
    out = []
    for _, m, _, where in all_excerpts(root):
        mod = m.group(1)
        if not checked(mod):
            continue
        absent = absent_source(mod, where)
        if absent is not None:
            out.append(absent)
        elif read_source(mod, m.group(2), m.group(3)) is None:
            out.append(f"MISSING {where}: {mod} {m.group(2)} {m.group(3)}")
    return out


def pins(root: Path) -> list[str]:
    """Return a PIN line for each clone excerpt whose version slot is not the pinned upstream commit; needs no clone."""
    return [
        f"PIN {where}: {m.group(1)} version {m.group(2)} is not the pinned commit {CLONE_PINS[m.group(1)]}"
        for _, m, _, where in all_excerpts(root)
        if checked(m.group(1)) and m.group(1) in CLONE_PINS and m.group(2) != CLONE_PINS[m.group(1)]
    ]


def differing(root: Path) -> list[str]:
    out = []
    for _, m, block, where in all_excerpts(root):
        mod, version, file, start, end = m.group(1), m.group(2), m.group(3), int(m.group(4)), int(m.group(5))
        if not checked(mod):
            continue
        absent = absent_source(mod, where)
        if absent is not None:
            out.append(absent)
            continue
        source = read_source(mod, version, file)
        if block is None or source is None:
            continue
        want = source[start - 1 : end]
        if block != want:
            out.append(f"DIFFERS {where}: {mod} {file}:{start}-{end} ({len(block)} vs {len(want)} lines)")
    return out


def source_range(m: re.Match[str]) -> list[str] | None:
    """Return the source lines an excerpt heading cites, or None when the cached file or the clone is absent."""
    source = read_source(m.group(1), m.group(2), m.group(3))
    return None if source is None else source[int(m.group(4)) - 1 : int(m.group(5))]


def lines_sha256(lines: list[str]) -> str:
    """Return the sha256 of lines joined by newlines with no trailing newline."""
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def no_copy_dir(pin: NoCopySource) -> Path:
    """Return the folder one no-copy pin is fetched into: NO_COPY_ROOT/<owner>__<repo>/<commit>, a git repository with nothing checked out."""
    owner, repo = pin.repo.removeprefix("https://github.com/").split("/")
    return NO_COPY_ROOT / f"{owner}__{repo}" / pin.commit


def unclaimed(root: Path) -> list[str]:
    bad = []
    for ref in references(root):
        lines = ref.read_text(encoding="utf-8").splitlines()
        heading, used, n = None, False, 0
        while n < len(lines):
            line = lines[n]
            if not FENCE_OPEN.match(line):
                # Only a line outside a block can be a heading: a "# comment" inside a block must not reset it.
                if line.startswith("#"):
                    heading, used = line, False
                n += 1
                continue
            # A module heading owns exactly one block: a second fence under it is unclaimed (it would
            # otherwise ship uncompiled text next to the compiled module).
            owned = heading and (HEAD.match(heading) or (MODULE.match(heading) and not used))
            if not owned:
                bad.append(f"UNCLAIMED {ref.relative_to(root)}:{n + 1}: fenced block under {heading!r}")
            used = True
            end = fence_end(lines, n)
            if end is None:
                bad.append(f"UNCLOSED {ref.relative_to(root)}:{n + 1}: fenced block never closed")
                break
            n = end + 1
    return bad


def forbidden(root: Path) -> list[str]:
    return [f"FORBIDDEN {where}: {m.group(1)}" for _, m, _, where in all_excerpts(root) if m.group(1) in FORBIDDEN]


def unknown(root: Path) -> list[str]:
    bad = []
    for _, m, block, where in all_excerpts(root):
        if m.group(1) in FORBIDDEN:
            continue
        if m.group(1) not in MOD_DIRS:
            bad.append(f"UNKNOWN {where}: mod {m.group(1)}")
        elif block is None:
            bad.append(f"NO BLOCK {where}")
    return bad


def licences(root: Path) -> list[str]:
    return [
        f"LICENCE {where}: heading says {m.group(6)!r}, {m.group(1)} is {LICENCES[m.group(1)]}"
        for _, m, _, where in all_excerpts(root)
        if m.group(1) in LICENCES and m.group(6).strip() != LICENCES[m.group(1)]
    ]


def verification_failures(root: Path) -> list[str]:
    """Return every reason the excerpts under root are not fully verified against the cache and clones; empty means verified."""
    bad = unclaimed(root) + fence_problems(root) + forbidden(root) + unknown(root) + licences(root) + pins(root)
    for _, m, _, where in all_excerpts(root):
        mod = m.group(1)
        # Each kind is gated on its own source: a missing cache must not hide clone failures, nor the reverse.
        # A forbidden repo is reported as FORBIDDEN only, so its source is never looked at.
        if not checked(mod) or mod in CLONE_PINS or not CACHE.is_dir():
            continue
        if not (MOD_DIRS[mod] / m.group(2)).is_dir():
            bad.append(f"VERSION ABSENT {where}: {MOD_DIRS[mod] / m.group(2)}")
    # missing() and differing() both report an absent cache or clone, with the same line, so keep the first.
    return list(dict.fromkeys(bad + missing(root) + differing(root)))


def lock_key(root: Path, ref: Path, m: re.Match[str]) -> str:
    return f"{ref.relative_to(root)}|{m.group(1)} {m.group(2)} {m.group(3)}:{m.group(4)}-{m.group(5)}"


def current_lock(root: Path) -> dict[str, dict[str, str]]:
    """Return the lock entries (sha256 of each block joined by newlines, no trailing newline) for the references.

    A clone excerpt also records upstream_commit, the full hash its source was read at, so the lock itself names the
    fixed upstream revision the redistributed text was proven equal to.
    """
    lock: dict[str, dict[str, str]] = {}
    for ref, m, block, _ in all_excerpts(root):
        if block is None:
            continue
        entry = {"sha256": lines_sha256(block)}
        if m.group(1) in CLONE_PINS:
            entry["upstream_commit"] = m.group(2)
        lock[lock_key(root, ref, m)] = entry
    return lock
