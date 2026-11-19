#!/usr/bin/env python3
"""Fetch the public commits the no-copy test reads (excerpt_lock.NO_COPY_SOURCES) into excerpt_lock.NO_COPY_ROOT.

Run from the repository root: `uv run scripts/fetch_no_copy_sources.py`. It uses only the standard library and git 2.32
or newer; an older git is refused before anything runs, because it ignores GIT_CONFIG_GLOBAL (below) and would read the
user's configuration without saying so. Each pin gets its own folder (excerpt_lock.no_copy_dir): `git init
--object-format=sha1` with files ref storage, a .git/config the script writes itself (PIN_CONFIG: the repository format
and the origin URL from the table, nothing else), then `git fetch --depth 1 --no-tags --no-recurse-submodules origin
+<commit>:refs/no-copy/pin`. The ref keeps the fetched objects reachable, so git's housekeeping never prunes them.
Nothing is checked out (no working tree is written), no submodule is fetched, and git never prompts for credentials
(GIT_TERMINAL_PROMPT=0, and an empty core.askPass, which also keeps SSH_ASKPASS from running). The object format and
ref storage are fixed so that a repository a newer git writes on CI can be read by an older git elsewhere.

The user's own git configuration is ignored: every git call runs with GIT_CONFIG_GLOBAL=/dev/null and
GIT_CONFIG_NOSYSTEM=1 and without any inherited GIT_* variable but GIT_SSL_CAINFO and GIT_SSL_CAPATH, so no URL
rewrite, hooks folder, template folder, credential helper or default format of this machine applies (a URL rewrite
would make the origin differ from the table and refuse every rerun). Every call also sets GIT_NO_REPLACE_OBJECTS=1, so
no replace ref makes git read one object in place of another. Only https is allowed (protocol.allow=never,
protocol.https.allow=always), so a local file URL is refused. A fetch transfers objects only: a repository's hooks
never travel with it. The fetched repositories are untrusted data that the no-copy test only reads with git. Since the
configuration is ignored, a proxy is given through https_proxy (or HTTPS_PROXY) and a CA bundle through GIT_SSL_CAINFO
or GIT_SSL_CAPATH; a TLS or proxy failure says so.

Every git call names the pin folder's repository explicitly (--git-dir and --work-tree), so git never searches the
folders above for one, and the script checks that git opens that .git (rev-parse --absolute-git-dir): a partial .git,
from a run or a cache cut short, is refused, where git would otherwise open the enclosing repository, the project's
own, and fetch into it. A pin folder that is already there (an earlier run, a restored CI cache) is not trusted. It
and its .git must be real folders, not a link or a gitdir file that git would follow elsewhere, and nothing under its
.git may be a link (a linked object fan-out folder, ref folder or shallow file would make the fetch write outside the
pin folder); its origin, read from .git/config without git, must be the table's URL (a folder with another origin is
refused, never repointed). Then, before git reads anything there, reset_git_dir replaces its .git/config with
PIN_CONFIG through a new file renamed over the old one (so no askpass program, ssh command, include, URL rewrite, extra
header or other key of its own survives, and a run cut short leaves one configuration or the other, never none),
empties its hooks folder and removes its info folder, its refs/replace folder (a replace ref packed into packed-refs
stays, unused under GIT_NO_REPLACE_OBJECTS), alternates and commondir file (which would make git read another
repository's configuration). Every call still empties the credential helper list, the askpass program and the
file-system monitor and points the hooks folder at the null device. Since git reads an object without checking it
against its name, such a folder is then checked with git fsck, and an altered object refuses it. A refused folder's
remedy says where it came from: on GitHub Actions, ci.yml's cache, whose entry must be deleted; elsewhere, a local
folder to move away. A folder that already holds its commit is otherwise left as it is, so a second run fetches
nothing. A fetch that fails, or runs past FETCH_TIMEOUT seconds, is tried once more after RETRY_PAUSE seconds when the
run has the time. The whole run starts no pin after RUN_DEADLINE seconds and gives each fetch at most the time left, so
it ends, and prints the pins it did not fetch, before the 10-minute timeout of the No-copy sources jobs in ci.yml and
release.yml. Each failure is printed when it happens, so a run that is cut short still shows why. Exit 0 when every pin
is present; exit 1 otherwise.
--prune first removes every entry under NO_COPY_ROOT that no pin names (ci.yml runs it before it archives the folder,
so a restored cache never carries a pin the table dropped; a run without it removes nothing). --pin-hash prints the
hash of the pin table, the key of ci.yml's cache, and fetches nothing.
"""

from __future__ import annotations

import argparse
import hashlib
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from collections.abc import Sequence
from pathlib import Path

import excerpt_lock

# Seconds allowed for one git command, the fetch included; a shallow fetch of one commit takes seconds on GitHub.
FETCH_TIMEOUT: float = 120
# Seconds to wait before the one retry of a failed fetch.
RETRY_PAUSE: float = 5
# Seconds the whole run may take, leaving the No-copy sources jobs (timeout-minutes: 10) time for the checkout, the
# cache, the archive and the upload, so the run's own report of what it did not fetch is printed before the job is cut.
RUN_DEADLINE: float = 8 * 60
# The oldest git the script runs with: GIT_CONFIG_GLOBAL, which keeps the user's configuration out, came in git 2.32.
MIN_GIT = (2, 32)
# The only GIT_* variables passed through: a CA bundle that the ignored configuration (http.sslCAInfo) can no longer
# give, for a machine behind a proxy that re-signs certificates. They add trust roots; they cannot redirect git or make
# it run anything.
PASS_THROUGH = frozenset({"GIT_SSL_CAINFO", "GIT_SSL_CAPATH"})
# The environment of every git call, built once when the script starts: nothing else inherited whose name starts with
# GIT_ (a GIT_DIR would redirect -C, GIT_CONFIG_COUNT would inject settings, GIT_DEFAULT_HASH would change the format,
# GIT_SSL_NO_VERIFY would turn certificate checks off), no global or system configuration, no prompt, and no replace ref
# (refs/replace/<object> makes git read another object in place of the one named).
ENV = {
    **{key: value for key, value in os.environ.items() if not key.startswith("GIT_") or key in PASS_THROUGH},
    "GIT_CONFIG_GLOBAL": os.devnull,
    "GIT_CONFIG_NOSYSTEM": "1",
    "GIT_TERMINAL_PROMPT": "0",
    "GIT_NO_REPLACE_OBJECTS": "1",
}
# https only: every other transport, the local file one included, is refused.
HTTPS_ONLY = ("-c", "protocol.allow=never", "-c", "protocol.https.allow=always")
# Settings a pin folder's own .git/config could hold, overridden on every call although reset_git_dir has rewritten that
# file: no credential helper, no askpass program (empty, which also keeps git from running SSH_ASKPASS), no file-system
# monitor and no hooks folder (a fetch writes the pin ref, which runs the reference-transaction hook). The monitor is
# emptied, not set to false: a git before 2.36 reads core.fsmonitor as a command and would run one named false.
REPO_SETTINGS_OFF = ("-c", "credential.helper=", "-c", "core.askPass=", "-c", "core.fsmonitor=", "-c", f"core.hooksPath={os.devnull}")
REF = "refs/no-copy/pin"
# Words of the TLS and proxy errors git prints through libcurl (OpenSSL, LibreSSL, GnuTLS, Schannel); looked for with
# the repository URL taken out, so a repository's own name cannot match.
TLS_OR_PROXY = re.compile(r"ssl|tls|certificate|schannel|proxy", re.IGNORECASE)


def git(folder: Path, *args: str, timeout: float | None = None) -> subprocess.CompletedProcess[str]:
    """Run one git command on the repository of `folder` with ENV, https only and the folder's own risky settings off, for at most `timeout` seconds (FETCH_TIMEOUT when None); a timeout or a missing git comes back as a failed result whose stderr says why.

    The repository is named explicitly (--git-dir is `folder`/.git, --work-tree is `folder`), so git never searches the
    folders above `folder` for one: with a partial .git, git would otherwise open the enclosing repository, the
    project's own, and fetch into it (TRDD-R2GILGKU M1).
    """
    limit = FETCH_TIMEOUT if timeout is None else timeout
    where = os.path.abspath(folder)
    command = ["git", *HTTPS_ONLY, *REPO_SETTINGS_OFF, "-C", where, f"--git-dir={os.path.join(where, '.git')}", f"--work-tree={where}", *args]
    try:
        return subprocess.run(command, capture_output=True, text=True, env=ENV, timeout=limit, check=False)
    except subprocess.TimeoutExpired:
        return subprocess.CompletedProcess(command, 124, "", f"git {' '.join(args)} timed out after {limit:g} s")
    except FileNotFoundError:
        return subprocess.CompletedProcess(command, 127, "", "git was not found on PATH")


def has_commit(folder: Path, commit: str) -> bool:
    """Return True when the repository in `folder` holds `commit` as a commit object."""
    return (folder / ".git").is_dir() and git(folder, "cat-file", "-e", f"{commit}^{{commit}}").returncode == 0


def time_left(deadline: float) -> float:
    """Return the seconds a git call may take now: FETCH_TIMEOUT, or less when `deadline` is nearer; 0 once it is past."""
    return max(0.0, min(FETCH_TIMEOUT, deadline - time.monotonic()))


def remedy(pin: excerpt_lock.NoCopySource, error: str, deadline: float) -> str:
    """Return the line that says what to do about a fetch of `pin` that failed with the git error `error`."""
    if time.monotonic() >= deadline:
        return "  The run deadline cut it short; rerun the script, which keeps what it has fetched."
    if TLS_OR_PROXY.search(error.replace(pin.repo, "")):
        return (
            "  This is a TLS or proxy failure on this machine, not a missing commit. The script ignores your git "
            "configuration, so give a proxy through https_proxy (or HTTPS_PROXY) and a CA bundle through GIT_SSL_CAINFO "
            "or GIT_SSL_CAPATH, which it passes to git."
        )
    return (
        f"  The repository or the commit may have been deleted, made private or rewritten; check "
        f"{pin.repo}/commit/{pin.commit}. Re-pin it in excerpt_lock.NO_COPY_SOURCES, or record a reason in "
        "excerpt_lock.NO_COPY_AVAILABLE, which is an owner decision."
    )


def origin_urls(config: Path) -> list[str]:
    """Return each url value of the [remote "origin"] section of a .git/config file, as written, read without git; none when the file is missing, a link or not a regular file.

    Read without git, because git would act on the rest of an untrusted folder (a commondir file, for one) before
    reset_git_dir has made it safe; a value written in any other way than git writes it (quoted, escaped, with a comment)
    does not equal the table's URL, so the folder is refused instead of guessed at.
    """
    if config.is_symlink() or not config.is_file():
        return []
    urls: list[str] = []
    inside = False
    for line in config.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if stripped.startswith("["):
            inside = stripped.lower() == '[remote "origin"]'
        elif inside and (found := re.fullmatch(r"url\s*=\s*(.*)", stripped, re.IGNORECASE)):
            urls.append(found[1])
    return urls


def remove_entry(path: Path) -> None:
    """Remove a file, a link (never what it points to) or a whole folder; do nothing when there is nothing at `path`."""
    if is_folder(path):
        shutil.rmtree(path)
    elif os.path.lexists(path):
        path.unlink()


# The whole .git/config of a pin folder: the repository format and the origin, and nothing else. Written by the script
# itself, for a new folder and over the file of an old one alike, so no key a restored cache planted survives.
PIN_CONFIG = '[core]\n\trepositoryformatversion = 0\n\tbare = false\n[remote "origin"]\n\turl = {repo}\n'
# What reset_git_dir removes from a .git folder: what git would act on (hooks, info/attributes, info/grafts and the rest
# of info) and what would make it read other objects or another repository's configuration (the refs/replace folder,
# alternates, a commondir file). The configuration is not removed but replaced in one rename. A replace ref packed into
# packed-refs stays, since that file also holds the pin ref; GIT_NO_REPLACE_OBJECTS keeps git from using it.
UNTRUSTED_GIT_ENTRIES = ("hooks", "info", "refs/replace", "commondir", "objects/info/alternates", "objects/info/http-alternates")


def distrusted_folder_remedy(folder: Path) -> str:
    """Return what to do about a pin folder that was there before the run and is refused: on GitHub Actions it came from ci.yml's cache, elsewhere it is a local folder.

    Read at call time from the environment the script runs in (GitHub Actions sets GITHUB_ACTIONS=true), so the remedy
    names the cache only where there is one (TRDD-R2GILGKU L3).
    """
    if os.environ.get("GITHUB_ACTIONS") == "true":
        return (
            "  On GitHub Actions a folder that was there before the run came from ci.yml's cache, and an entry under an "
            "exact key is never overwritten: delete it with "
            f"gh cache delete no-copy-sources-{pin_table_hash()}, then rerun the workflow."
        )
    return f"  It is a local folder, not a cache: move {folder} away and rerun the script, which fetches the pin again."


def links_under(gitdir: Path) -> list[Path]:
    """Return, sorted, every link under `gitdir`, to a file or to a folder; no link is followed, and a folder that cannot be read raises."""

    def fail(error: OSError) -> None:
        raise error

    found: list[Path] = []
    # os.walk lists a link to a folder among the folders and does not enter it (it follows no link unless asked to).
    for top, folders, files in os.walk(gitdir, onerror=fail):
        found.extend(Path(top, name) for name in (*folders, *files) if os.path.islink(os.path.join(top, name)))
    return sorted(found)


def reset_git_dir(folder: Path, pin: excerpt_lock.NoCopySource) -> str | None:
    """Make the .git folder of `folder` the script's own before git reads anything there; return why it cannot be, or None.

    A link anywhere under .git is refused first, before anything is removed: a linked object fan-out folder, ref folder
    or shallow file would make the fetch write outside the pin folder, and a linked folder the reset removes through
    would make it remove something elsewhere (TRDD-R2GILGKU M2). Then every UNTRUSTED_GIT_ENTRIES entry goes, the hooks
    folder is empty, and .git/config becomes PIN_CONFIG with the table's URL through a new file renamed over the old
    one, so a run cut short leaves the old configuration or the new one, never none (L2).
    """
    gitdir = folder / ".git"
    try:
        links = links_under(gitdir)
    except OSError as error:
        return f"{gitdir}: cannot be read in full ({error})\n{distrusted_folder_remedy(folder)}"
    if links:
        return (
            f"{links[0]}: a link inside .git ({len(links)} in all), refused, since git would read or write where it points\n"
            f"{distrusted_folder_remedy(folder)}"
        )
    for entry in UNTRUSTED_GIT_ENTRIES:
        remove_entry(gitdir / entry)
    (gitdir / "hooks").mkdir()
    # mkstemp makes a new file that no link can stand in for; os.replace swaps it in at once.
    descriptor, temporary = tempfile.mkstemp(prefix="config-", dir=gitdir)
    with os.fdopen(descriptor, "w", encoding="utf-8") as out:
        out.write(PIN_CONFIG.format(repo=pin.repo))
    os.replace(temporary, gitdir / "config")
    return None


def own_repository_problem(folder: Path) -> str | None:
    """Return why git does not open the .git of `folder` as the repository it is asked for, or None when it does.

    git() names the repository explicitly, so git cannot open another one; a .git that is not a whole repository (no
    HEAD, objects or refs: a run or a cache cut short) fails here instead of letting git search the folders above and
    open the enclosing repository, the project's own (TRDD-R2GILGKU M1). The check stays so that a later change to git()
    cannot bring that search back unnoticed.
    """
    gitdir = folder / ".git"
    found = git(folder, "rev-parse", "--absolute-git-dir")
    opened = found.stdout.strip()
    if found.returncode == 0 and opened and Path(opened).resolve() == gitdir.resolve():
        return None
    detail = found.stderr.strip() or f"git opened {opened or 'nothing'}"
    return f"{gitdir}: git does not open it as this pin's own repository ({detail}); a partial or truncated .git folder\n{distrusted_folder_remedy(folder)}"


def fetch(pin: excerpt_lock.NoCopySource, deadline: float = math.inf) -> str | None:
    """Fetch one pin into its folder before `deadline`, a time.monotonic() value; return None when the commit is present afterwards, else the reason it is not."""
    folder = excerpt_lock.no_copy_dir(pin)
    if time.monotonic() >= deadline:
        return f"{folder}: not tried, the run deadline had passed; rerun the script, which keeps what it has fetched"
    # A link or a gitdir file would make git, and the reset below, act on a repository elsewhere.
    for part in (folder.parent, folder, folder / ".git"):
        if os.path.lexists(part) and not is_folder(part):
            return f"{part}: not a folder (a link or a gitdir file here could point git elsewhere); move it away and rerun"
    existed = is_folder(folder / ".git")
    if existed:
        urls = origin_urls(folder / ".git" / "config")
        if urls != [pin.repo]:
            return f"{folder}: origin is {', '.join(urls) or 'missing'}, the table says {pin.repo}; move the folder away and rerun"
    else:
        folder.mkdir(parents=True, exist_ok=True)
        # The config key, not --ref-format: an older git ignores an unknown key but refuses an unknown option.
        init = git(folder, "-c", "init.defaultRefFormat=files", "init", "--quiet", "--object-format=sha1")
        if init.returncode != 0:
            return f"{folder}: git init failed: {init.stderr.strip()}"
    # reset_git_dir has made the configuration the script's own; now make sure git opens this .git and no other
    # repository (TRDD-R2GILGKU M1), for a new folder as for an old one.
    problem = reset_git_dir(folder, pin) or own_repository_problem(folder)
    if problem:
        return problem
    # git reads an object without checking it against its name, so the objects of a folder that was there before this run
    # (a restored cache) are checked in full before any is used; the ones a fetch brings are checked as they arrive.
    if existed:
        checked = git(folder, "fsck", "--no-dangling", "--no-progress")
        if checked.returncode != 0:
            return f"{folder}: git fsck failed, so its objects cannot be trusted: {(checked.stderr or checked.stdout).strip()}\n{distrusted_folder_remedy(folder)}"
        if has_commit(folder, pin.commit):
            return None
    fetch_args = ("fetch", "--depth", "1", "--no-tags", "--no-recurse-submodules", "origin", f"+{pin.commit}:{REF}")
    # Only the fetch can run long, so only the fetch is held to the deadline; the local calls take milliseconds.
    done = git(folder, *fetch_args, timeout=time_left(deadline))
    retried = False
    if done.returncode != 0 and deadline - time.monotonic() > RETRY_PAUSE:
        print(f"retrying {pin.repo} {pin.commit} in {RETRY_PAUSE} s: {done.stderr.strip()}", file=sys.stderr, flush=True)
        time.sleep(RETRY_PAUSE)
        done = git(folder, *fetch_args, timeout=time_left(deadline))
        retried = True
    if done.returncode != 0:
        tries = "twice" if retried else "once, not retried with the run deadline this near"
        return f"{folder}: git fetch of {pin.repo} {pin.commit} failed {tries}: {done.stderr.strip()}\n{remedy(pin, done.stderr, deadline)}"
    if not has_commit(folder, pin.commit):
        return f"{folder}: the fetch ended but {pin.commit} is not there"
    return None


def git_problem() -> str | None:
    """Return why the git on PATH cannot run this script, or None when it is MIN_GIT or newer."""
    done = git(Path(os.curdir), "--version")
    found = re.match(r"git version (\d+)\.(\d+)", done.stdout)
    wanted = f"git {MIN_GIT[0]}.{MIN_GIT[1]} or newer"
    if done.returncode != 0 or found is None:
        return f"cannot read the git version ({(done.stderr or done.stdout).strip()}); this script needs {wanted}"
    if (int(found[1]), int(found[2])) < MIN_GIT:
        return f"git {found[1]}.{found[2]} is too old: this script needs {wanted}, whose GIT_CONFIG_GLOBAL keeps your git configuration out"
    return None


def pin_table_hash() -> str:
    """Return the sha256 of every pin's repository and commit, sorted: the key of ci.yml's cache, which only a pin changes."""
    lines = sorted(f"{pin.repo} {pin.commit}" for pins in excerpt_lock.NO_COPY_SOURCES.values() for pin in pins)
    return hashlib.sha256("\n".join(lines).encode("utf-8")).hexdigest()


def is_folder(path: Path) -> bool:
    """Return True for a real folder; False for a file and for a link, whatever it points to."""
    return path.is_dir() and not path.is_symlink()


def prune() -> list[Path]:
    """Remove every entry under NO_COPY_ROOT that no pin names, and return them; a link is removed, never followed."""
    keep = {excerpt_lock.no_copy_dir(pin) for pins in excerpt_lock.NO_COPY_SOURCES.values() for pin in pins}
    owners = {folder.parent for folder in keep}
    root = excerpt_lock.NO_COPY_ROOT
    removed: list[Path] = []
    for entry in sorted(root.iterdir()) if is_folder(root) else []:
        for item in sorted(entry.iterdir()) if entry in owners and is_folder(entry) else [entry]:
            if item in keep and is_folder(item):
                continue
            if is_folder(item):
                shutil.rmtree(item)
            else:
                item.unlink()
            removed.append(item)
    return removed


def main(argv: Sequence[str] = ()) -> int:
    parser = argparse.ArgumentParser(description="Fetch the public commits the no-copy test reads.")
    parser.add_argument("--prune", action="store_true", help="first remove every entry under the sources folder that no pin names")
    parser.add_argument("--pin-hash", action="store_true", help="print the hash of the pin table, the key of ci.yml's cache, and fetch nothing")
    options = parser.parse_args(argv)
    if options.pin_hash:
        print(pin_table_hash())
        return 0
    problem = git_problem()
    if problem:
        print(problem, file=sys.stderr)
        return 1
    if options.prune:
        for entry in prune():
            print(f"pruned {entry}", flush=True)
    deadline = time.monotonic() + RUN_DEADLINE
    failed = 0
    for mod, pins in sorted(excerpt_lock.NO_COPY_SOURCES.items()):
        for pin in pins:
            reason = fetch(pin, deadline)
            print(f"{'FAILED' if reason else 'ok'} {mod} {pin.version} {pin.commit}", flush=True)
            if reason:
                failed += 1
                print(reason, file=sys.stderr, flush=True)
    if failed:
        print(f"{failed} no-copy source(s) missing; each reason is printed under its FAILED line", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
