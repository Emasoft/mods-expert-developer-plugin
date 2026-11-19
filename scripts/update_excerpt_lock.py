#!/usr/bin/env python3
"""Write tests/fixtures/example-excerpts.lock.json, the sha256 lock of every third-party excerpt in the example skills.

Run from the repository root: `uv run scripts/update_excerpt_lock.py` writes the lock, and
`uv run scripts/update_excerpt_lock.py --check` writes nothing and exits 1 when the committed lock differs.
`--check` re-runs the full verification against the installed mods, so it needs the plugin cache and cannot run
on CI; there the lock test (tests/test_example_excerpts.py) covers the committed lock.

The lock is only ever written for verified excerpts. The script refuses (exit 1, one line per failure) unless
the plugin cache exists, every pinned mod version folder and file exists, every excerpt block equals the cache
lines its heading cites, and there is no unclaimed fenced block, no excerpt of a forbidden mod and no wrong
licence. Each lock entry holds "sha256" (the block) and "source_sha256" (the cache or clone range it was verified against);
an excerpt of a community clone repo also holds "upstream_commit", the full hash its source was read at with git cat-file.
The plugin redistributes the excerpts, so the lock must prove they match upstream at a fixed commit. The script
refuses (CLONE ABSENT) when a clone is absent, and for a cache excerpt when the cache is absent (CACHE ABSENT),
because a lock is only written from a real upstream comparison.
The cache is untrusted data: it is only read, and nothing in it is run.

When a mod updates: re-verify the excerpts against the new version, edit or drop the excerpt text that changed,
update the version and the line range in the excerpt heading, then run this script to rewrite the lock.
The parsing and checks live in scripts/excerpt_lock.py, which uses only the standard library.
"""

from __future__ import annotations

import argparse
import json
import sys

import excerpt_lock

ROOT = excerpt_lock.ROOT


def build_lock() -> dict[str, dict[str, str]]:
    """Return the lock entries, each with the hash of the block and of the cache range it equals."""
    lock = excerpt_lock.current_lock(ROOT)
    for ref, m, _, _ in excerpt_lock.all_excerpts(ROOT):
        source = excerpt_lock.source_range(m)
        if source is None:
            raise SystemExit(f"no source for {excerpt_lock.lock_key(ROOT, ref, m)}")
        lock[excerpt_lock.lock_key(ROOT, ref, m)]["source_sha256"] = excerpt_lock.lines_sha256(source)
    return lock


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--check", action="store_true", help="write nothing; exit 1 when the committed lock differs")
    args = parser.parse_args()
    failures = excerpt_lock.verification_failures(ROOT)
    if failures:
        print("REFUSED, the excerpts are not verified:", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 1
    text = json.dumps(build_lock(), indent=2, sort_keys=True) + "\n"
    if args.check:
        if excerpt_lock.LOCK.read_text(encoding="utf-8") != text:
            print(f"DIFFERS {excerpt_lock.LOCK}: {excerpt_lock.RERUN}", file=sys.stderr)
            return 1
        return 0
    excerpt_lock.LOCK.write_text(text, encoding="utf-8")
    print(f"wrote {excerpt_lock.LOCK}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
