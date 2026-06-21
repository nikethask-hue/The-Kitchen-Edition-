# AGENTS.md

Guidance for AI coding agents (Claude Code or similar) working in this repository. This file is the source of truth for how to interpret the product docs, what order to build in, and the conventions to follow.

---

## Project context

**The Kitchen Edition** is an AI-powered meal planning suite with an editorial magazine aesthetic. It connects recipe discovery, weekly planning, batch prep, grocery shopping, and pantry tracking into one synced loop, personalized to each user's household size, dietary restrictions, and allergies.

This repository is currently in the **pre-implementation / spec phase**. Two documents define the product and must be treated as authoritative:

- `the-kitchen-edition-product-writeup.md` — what each feature is, why it exists, and how features connect to each other
- `the-kitchen-edition-user-stories.md` — the specific, testable requirements for each feature, in user-story format with acceptance criteria and priority tags (P0/P1/P2)

If a requirement is unclear or missing from both documents, do not guess — flag it rather than inventing behavior, and prefer asking over assuming.

---

## Source of truth hierarchy

When documents conflict, resolve in this order:

1. User stories acceptance criteria (most specific, testable)
2. Product write-up (explains intent and feature connections)
3. Code comments / inline TODOs (only if more recent than both docs above)

If you change product behavior while implementing, update the relevant doc in the same change — these documents should never drift from what the code actually does.

---

## Build priority

Implement in story-priority order, not document order:

1. **P0 stories first**, across all features — this is the minimum for the app to function end-to-end
2. **P1 stories** once P0 is stable for a given feature
3. **P2 stories** last, treat as polish

Within P0, build in this dependency order, since later features assume earlier ones exist:

```
Household Profile → Discover → Meal Planner → Serving Size Scaling
                                    │
                                    ▼
                          Grocery List ← Smart Pantry
                                    │
                                    ▼
                               Meal Prep
                                    │
                                    ▼
                              Favorites
```

Household Profile is foundational — allergy filtering (US-7.1) should exist before Discover ships any recipe results, since showing unfiltered results even temporarily is a safety issue, not a cosmetic one.

---

## Conventions

**Stack:** Not yet finalized in the product docs. Until decided, do not assume a specific framework — check for an existing `package.json`, `requirements.txt`, or equivalent before scaffolding new tooling. If none exists and a choice is required to proceed, state the assumption explicitly rather than silently picking one.

**External APIs:**
- Spoonacular API is the confirmed data source for recipe content (Discover, recipe details, nutrition data). Use its native `diet` and `intolerances` query parameters for Household Profile filtering rather than building custom filtering logic — this is called out explicitly in the product write-up.

**Naming:** Match feature names exactly as they appear in the user stories doc (e.g., "Smart Pantry," not "Pantry Manager") across UI copy, component names, and route names, so the docs and codebase stay easy to cross-reference.

**Allergies vs. restrictions:** These are not interchangeable in code. Allergy-conflicting recipes must be excluded from results entirely (hard filter). Restriction-conflicting recipes may be hidden or deprioritized depending on a user-facing toggle (US-1.5). Do not implement both with the same filtering logic.

**Scaling logic:** Serving Size Scaling (Feature 8) is a dependency for Meal Planner macros, Grocery List quantities, and Meal Prep batch math. Implement it as a shared utility, not feature-specific code, since three other features call into it (US-2.3, US-4.1, US-8.4).

---

## Testing expectations

Every P0 and P1 user story has acceptance criteria written to be directly testable. When implementing a story, write tests against its acceptance criteria as listed in `the-kitchen-edition-user-stories.md` — treat each bullet under a story as a separate test case where practical.

---

## What not to do

- Do not skip allergy filtering to move faster on Discover — this is P0 for a reason
- Do not hardcode household size to a default (e.g., 4) anywhere scaling logic is used — it must always read from the user's Household Profile
- Do not add new features beyond the eight defined in the product write-up without flagging it as a scope change first
