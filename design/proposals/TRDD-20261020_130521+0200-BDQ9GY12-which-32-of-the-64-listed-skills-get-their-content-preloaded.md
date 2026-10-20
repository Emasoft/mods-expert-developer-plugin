---
trdd-id: BDQ9GY12
title: Which 32 of the 64 listed skills get their content preloaded
column: proposal
status: proposed
created: 2026-10-20T13:05:21+0200
updated: 2026-10-20T13:05:21+0200
current-owner: user
created-by: user
task-type: feature
min-approval-requirement: user
assignee: user
approved: false
---

# Which 32 of the 64 listed skills get their content preloaded

ONE FRONTMATTER LINE, AND A PRODUCT CALL.

THE DECISION. The plugin lists 64 skill names; 32 of them get their content injected at load. Which 32 is the owner's call.

WHY IT IS A CALL AND NOT A DERIVATION. The current roster is the first 32 in a curated order. The order was set by judgement about which skills an agent needs without asking, and the boundary at 32 is where that judgement ran out - the other 28 doc skills are not preloaded, including mods-doc-hooks-reference and mods-doc-skills-reference. The tests make the boundary explicit and FAIL if a named entry skill falls outside the window, so the roster is guarded against drift; what the tests cannot do is decide which skills belong on it.

WHAT IS ALREADY GUARDED. tests/test_spec_selfcheck_coverage.py and the plugin's own structure checks assert that the preloaded set is exactly the first N in the curated order and that every named entry skill falls inside the window. So whichever roster is chosen, the suite enforces that the choice is applied consistently - a change of roster is a change to the frontmatter and the tests follow it, not a drift to be discovered later.

WHAT THIS IS NOT. It is not the same decision as the bucket-A editorial question (TRDD-FM80HTRT), which is about what the chapters teach. This one is about how much of the plugin's own text is in the context window when an agent starts.

HOW TO DECIDE, IF A FRAME HELPS. The trade is context budget against the cost of an agent having to load a reference on demand: a skill the agent cannot see may never be consulted, and a skill that is always in view costs every session. The 32 skills that reference OTHER skills' content (the hooks reference and the skills reference) are the ones most likely to be useful without being read, because they are indexes - but that is an argument, not a measurement, and the corpus's own usage would be the thing to measure.

## Approval log
