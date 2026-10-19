# Delegation plan

Units: 8
Gate: open — 8 independent units; four 15-skill cohorts plus menu, security, publication readiness, and serialized integration/publication.

| # | Unit | Files (mine) | Worker | Acceptance | Status |
|---|------|--------------|--------|------------|--------|
| 1 | Validate skills cohort A (1–15) | Read-only: first 15 tracked `skills/*/SKILL.md` and their owned files; report only | done (fast-worker) | Report records every validator command, finding, and file:line for exactly 15 skills — REPORTED: 15/15 wrappers complete; validators exit 0 except CPV default invocation exits non-zero pre-scan; 3 MAJOR (1 in-cohort: chapter.md:586 abs path; 2 out-of-cohort in mods-doc-hooks-reference:2954,2957) + 11-vs-8 NIT count discrepancy (heading says 11, table has 8 rows/17 sites — uncorrected) | done with discrepancies — docs_dev/20261019_165337+0200-skills-validation-cohort-A.md (reader-verified 2026-10-19) |
| 2 | Validate skills cohort B (16–30) | Read-only: next 15 tracked `skills/*/SKILL.md` and their owned files; report only | done (fast-worker) | Report records every validator command, finding, and file:line for exactly 15 skills — see docs_dev/20261019_165726+0200-skills-validation-cohort-B.md | done with discrepancies — docs_dev/20261019_165726+0200-skills-validation-cohort-B.md (reader-verified 2026-10-19) |
| 3 | Validate skills cohort C (31–45) | Read-only: next 15 tracked `skills/*/SKILL.md` and their owned files; report only | done (fast-worker) | REPORTED: CLEAN, all 15 validated, no findings | done, clean — docs_dev/20261019_165517+0200-skills-validation-cohort-C.md (reader-verified 2026-10-19) |
| 4 | Validate skills cohort D (46–60) | Read-only: final 15 tracked `skills/*/SKILL.md` and their owned files; report only | done (fast-worker) | REPORTED: cohort D validated with findings — see cohort-D report | done with findings — cohort-D report (reader-verified 2026-10-19) |
| 5 | Audit skills-menu completeness | Read-only: all `skills/`, plugin manifests, existing menu artifacts; report only | done (fast-worker) | REPORTED: 60/60 in README + frontmatter exactly once; NO canonical generator; runtime verification + generator decision OPEN → unit 8 | done, decision open — docs_dev/20261019_164052+0200-skills-menu-audit.md (reader-verified 2026-10-19) |
| 6 | Audit security and no-suppression invariants | Read-only: plugin configs, validator configs, workflows, consent/exclusion surfaces; report only | done (fast-worker) | Report lists every suppression/exclusion/consent/severity-demotion or proves none with file:line evidence — VERIFIED: proves none; consent file removed (474c16b) + regression-guarded; ignore lists owner-pinned, 128 tests passed; 4 documented infra exemptions + 1 redundant checkov skip | done — docs_dev/20261019_164201+0200-security-invariants-audit.md |
| 7 | Audit publication readiness | Read-only: GitHub and `Emasoft/emasoft-plugins` remote state, release/version/CI prerequisites; report only | done (fast-worker) | Report gives exact repository, marketplace, release, secret, branch-protection, and CPV-integrity blockers — VERIFIED: 6 blockers (CPV #243 open/unfixed in any release; plugin repo 404; no local remote/tags; absent from marketplace index; complete-plugins-validation 404; G3 cannot pass) | done — docs_dev/20261019_163851+0200-publication-readiness-audit.md |
| 8 | Integrate fixes, generate menu, strict-validate, publish | Sole writer: entire isolated CPV worktree; serialized git and remote writes | existing CPV agent | `uv run --project /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer pytest -q /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer/tests` and strict CPV/release/marketplace/CI evidence in final report | pending |

## Evidence

- Review of 4840d96: findings 1/5/6 refuted by inspection — `git show 4840d96 --stat` shows create-mode commit of previously untracked DELEGATION.md, 26 insertions = 24 original + 2 rewritten rows, exactly 1 file changed; row count `grep -c '^| [0-9] |' DELEGATION.md` = 8. Finding 4 fixed in 5d2598b (criterion restored). Finding 3 LOW: refutation now recorded here.
- Review of 5d2598b: finding 4 refuted — `awk -F'|' '/^\| [0-9] \|/ {print NF}'` = 8 fields on all 8 unit rows, table intact. Finding 1: full-body reads of reports 6/7/A/C/B dispatched to reader agents. Finding 2 adopted: ledger rows now updated by self-anchored replace (target row's own text), never neighbor+line-range.
## Coordination constraints

- Units 1–7 are read-only and may run concurrently.
- Unit 8 is the only project-file writer and the only actor allowed to perform serialized git or remote publication writes.
- No validation may be bypassed, suppressed, excluded, consented away, skipped, or severity-demoted.
- A false positive must be fixed in detector precision by the owning project; this plugin does not patch another repository.
- Publication stops on CPV self-integrity issue #243 unless a released strict path verifies successfully.

## Evidence

