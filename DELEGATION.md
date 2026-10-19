# Delegation plan

Units: 8
Gate: open — 8 independent units; four 15-skill cohorts plus menu, security, publication readiness, and serialized integration/publication.

| # | Unit | Files (mine) | Worker | Acceptance | Status |
|---|------|--------------|--------|------------|--------|
| 1 | Validate skills cohort A (1–15) | Read-only: first 15 tracked `skills/*/SKILL.md` and their owned files; report only | pending | Report records every validator command, finding, and file:line for exactly 15 skills | pending |
| 2 | Validate skills cohort B (16–30) | Read-only: next 15 tracked `skills/*/SKILL.md` and their owned files; report only | pending | Report records every validator command, finding, and file:line for exactly 15 skills | pending |
| 3 | Validate skills cohort C (31–45) | Read-only: next 15 tracked `skills/*/SKILL.md` and their owned files; report only | pending | Report records every validator command, finding, and file:line for exactly 15 skills | pending |
| 4 | Validate skills cohort D (46–60) | Read-only: final 15 tracked `skills/*/SKILL.md` and their owned files; report only | pending | Report records every validator command, finding, and file:line for exactly 15 skills | pending |
| 5 | Audit skills-menu completeness | Read-only: all `skills/`, plugin manifests, existing menu artifacts; report only | pending | Report proves whether every current skill is represented exactly once and names the canonical generator | pending |
| 6 | Audit security and no-suppression invariants | Read-only: plugin configs, validator configs, workflows, consent/exclusion surfaces; report only | done (fast-worker) | Report lists every suppression/exclusion/consent/severity-demotion or proves none with file:line evidence — VERIFIED: proves none; consent file removed (474c16b) + regression-guarded; ignore lists owner-pinned, 128 tests passed; 4 documented infra exemptions + 1 redundant checkov skip | done — docs_dev/20261019_164201+0200-security-invariants-audit.md |
| 7 | Audit publication readiness | Read-only: GitHub and `Emasoft/emasoft-plugins` remote state, release/version/CI prerequisites; report only | done (fast-worker) | Report gives exact repository, marketplace, release, secret, branch-protection, and CPV-integrity blockers — VERIFIED: 6 blockers (CPV #243 open/unfixed in any release; plugin repo 404; no local remote/tags; absent from marketplace index; complete-plugins-validation 404; G3 cannot pass) | done — docs_dev/20261019_163851+0200-publication-readiness-audit.md |
| 8 | Integrate fixes, generate menu, strict-validate, publish | Sole writer: entire isolated CPV worktree; serialized git and remote writes | existing CPV agent | `uv run --project /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer pytest -q /Volumes/EmaUITEK4TBSSD/Code/emasoft-mods-expert-developer/tests` and strict CPV/release/marketplace/CI evidence in final report | pending |

## Coordination constraints

- Units 1–7 are read-only and may run concurrently.
- Unit 8 is the only project-file writer and the only actor allowed to perform serialized git or remote publication writes.
- No validation may be bypassed, suppressed, excluded, consented away, skipped, or severity-demoted.
- A false positive must be fixed in detector precision by the owning project; this plugin does not patch another repository.
- Publication stops on CPV self-integrity issue #243 unless a released strict path verifies successfully.

## Evidence

