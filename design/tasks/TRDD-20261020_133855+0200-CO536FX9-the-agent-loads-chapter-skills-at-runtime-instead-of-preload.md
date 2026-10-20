---
trdd-id: CO536FX9
title: The agent loads chapter skills at runtime instead of preloading 28 of them
column: todo
status: tasked
created: 2026-10-20T13:38:55+0200
updated: 2026-10-20T13:55:42+0200
current-owner: user
created-by: user
task-type: feature
min-approval-requirement: none
assignee: user
mandate: true
mandated-by: user
approved: true
approval-judge: user
approval-datetime: 2026-10-20T13:38:55+0200
---

# The agent loads chapter skills at runtime instead of preloading 28 of them

THE OWNER'S DECISION (2026-10-20): the agent should load the skill it wants, on demand. The skills-menu exists for exactly that, so the preload roster is no longer a product call - it is a consequence of the routing design.

THE CHANGE. The agent's `skills:` frontmatter keeps only the four tool skills (tldr-code, fastedit, jgrep, quicksilver), which the agent needs on nearly every run. The 60 documentation chapters move OUT of the preload window and stay in the `skills:` list as a tail, so they remain declared and reachable but their content is no longer injected at startup. The agent's own 'Chapter skill index' table is the routing aid it uses to pick one.

THE MEASUREMENT. The 32 preloaded entries carry 63143 bytes of local SKILL.md content - about 15.8k tokens injected into EVERY invocation of the agent. The four tool skills are user-scope plugins, not local files, so the 63143 bytes is entirely the 28 documentation wrappers. A router agent that loads ONE chapter per task is paying for 28 it did not choose.

WHY RUNTIME IS THE CORRECT PATTERN AND NOT A TRADEOFF. The sub-agents documentation says the `skills:` field controls what is PRELOADED, not what is ACCESSIBLE: a skill past the window is still discoverable and invocable through the Skill tool during execution. A runtime load lands in the MESSAGE TAIL and cannot invalidate the cached prefix; a preload injects full content into EVERY invocation, so the 'fix' of moving runtime loads into the frontmatter is strictly worse for a sometimes-needed skill and worse always for a router agent.

THE INVOCABILITY FACT THIS DEPENDS ON, VERIFIED AGAINST THE DOCUMENTATION AND NOT ASSUMED. All 60 documentation skills declare `user-invocable: false`, which per the skills documentation prevents the HUMAN from typing /name and does NOT prevent Claude from invoking the skill ('Only Claude can invoke the skill'). None of them declares `disable-model-invocation: true`, which is the key that WOULD make a preload inert and would also block runtime invocation. The agent declares no `tools:` or `disallowedTools:` field, so it inherits the Skill tool. Therefore: a chapter outside the preload window is still invocable by the agent at runtime.

WHAT MUST CHANGE TOGETHER, because four artifacts describe the same 60 skills and the tests pin their agreement: (1) the agent's `skills:` frontmatter - the 56 chapter entries after the four tool skills move out of the first 32 positions; (2) `PINNED_PRELOAD_SKILLS` in tests/test_skills_menu.py - the mirror of the window, which becomes the four tool skills; (3) the agent body's 'Chapter skill index' table - its prose must say the chapters are loaded on demand rather than preloaded; (4) README.md - its Components/preload description says the same. DELEGATION.md's skills-menu bullet also states the preload design and must be corrected.

THE TEST THAT MUST CHANGE WITH THE DESIGN, NOT AFTER IT. test_preload_window_is_exactly_the_pinned_roster pins the window to a set. The window is now exactly the four tool skills, and the property that matters is not 'which 32' but 'no documentation chapter is preloaded, and every chapter is still declared'. A new test should assert that the preload window contains no documentation chapter, and that all 60 remain in the `skills:` list - so a future edit that re-injects a chapter into the window fails a test rather than silently costing 15.8k tokens per invocation.

WHY THE INDEX TABLE BECOMES LOAD-BEARING RATHER THAN DECORATIVE. The table currently documents the routing order for a reader. After this change it is the agent's actual route to a chapter, so a stale row stops being a documentation defect and becomes a routing defect. The test that already pins the table to the frontmatter and to each skill's H1 heading therefore becomes more important, not less.

WHAT THIS DOES NOT CHANGE. The chapters still ship, still are reachable, and still carry the same content. The README catalogue still lists all 60. The guard-coverage work and the consent registry are untouched by this decision.

## Approval log

- 2026-10-20T13:38:55+0200 — MANDATE issued by user (min-approval-requirement: none). Pre-approved: issuer authority >= required approver. No approval request was sent.

## A CORRECTION TO THE CLOSED DECISION CARD, recorded here because that card is archived

TRDD-BDQ9GY12, the closed decision card, says 'tests/test_spec_selfcheck_coverage.py and the plugin's own structure checks assert that the preloaded set is exactly the first N in the curated order'. THAT ATTRIBUTION IS WRONG: tests/test_spec_selfcheck_coverage.py contains no preload logic at all - its contents are spelled_or_numeral, covered_figure_re, guard_conditions, is_guard and guard_count, and its two tests are the guard-count test and the covered-count property test. THE PRELOAD-WINDOW CHECK LIVES IN tests/test_skills_menu.py, in test_preload_window_is_exactly_the_pinned_roster, test_preloaded_skills_are_the_first_entries_in_frontmatter_order, test_tool_skills_precede_the_documentation_wrappers, and test_frontmatter_and_body_index_list_the_same_skills_in_the_same_order. BDQ9GY12 is archived and therefore immutable, so the correction is recorded here, on the card that implements the decision it fed. A card that names the wrong file for a check is the same class of defect as the mis-citation this series already has one card about (TRDD-8BXXNOPQ), so it is worth naming rather than leaving in place.
