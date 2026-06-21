# The Kitchen Edition
### User Stories

---

## How to read this document

Stories follow the standard format: **As a [user], I want [goal], so that [reason].**
Each story includes acceptance criteria — the specific, testable conditions that define "done."
Stories are grouped by feature and tagged by priority:

- **P0** — Core to the feature working at all
- **P1** — Important, but the feature is usable without it
- **P2** — Enhancement, can ship later

---

## 1. Discover

**US-1.1** (P0) — As a user, I want to browse a curated daily selection of recipes, so that I can answer "what should I cook tonight?" without searching.
- Acceptance criteria:
  - Homepage shows a rotating set of recipes on load
  - Selection updates daily
  - Each recipe card shows image, title, cook time, and serving count

**US-1.2** (P0) — As a user, I want to search recipes by ingredients I already have, so that I can cook without a grocery run.
- Acceptance criteria:
  - User can enter multiple ingredients
  - Results rank recipes by how many entered ingredients they use
  - Results show which ingredients are missing, if any

**US-1.3** (P1) — As a user, I want to search recipes by name, so that I can quickly find something specific.
- Acceptance criteria:
  - Search returns results as the user types (or on submit)
  - Partial matches are supported

**US-1.4** (P0) — As a user, I want recipes that conflict with my allergies excluded from results, so that I never see something unsafe to eat.
- Acceptance criteria:
  - Recipes containing a declared allergen are filtered out, not just flagged
  - Filter applies to all Discover entry points (browse, ingredient search, name search)

**US-1.5** (P1) — As a user, I want recipes that don't match my dietary restrictions deprioritized or hidden, so that I only see relevant options.
- Acceptance criteria:
  - User can toggle whether restrictions hide or just deprioritize results
  - Filter respects multiple simultaneous restrictions (e.g., vegetarian + gluten-free)

**US-1.6** (P1) — As a user, I want recipes that use up items in my Smart Pantry surfaced, so that nothing I own goes to waste.
- Acceptance criteria:
  - A distinct "use it up" section or badge appears on Discover
  - Pantry items nearing relevance (e.g., manually flagged or expiring) are prioritized

---

## 2. Meal Planner

**US-2.1** (P0) — As a user, I want a seven-day calendar with breakfast, lunch, and dinner slots, so that I can plan my whole week at once.
- Acceptance criteria:
  - Calendar displays all 7 days with 3 meal slots each
  - Empty slots are visually distinct from filled ones

**US-2.2** (P0) — As a user, I want to drag and drop recipes into calendar slots, so that scheduling is fast and visual.
- Acceptance criteria:
  - Recipes can be dragged from Discover/Favorites/Search directly into a slot
  - Dropping a recipe into a filled slot prompts confirmation before replacing it
  - Works via tap-to-place as a fallback on touch devices

**US-2.3** (P0) — As a user, I want to see daily macro totals (calories, protein, carbs), so that I can track nutrition across my plan.
- Acceptance criteria:
  - Totals recalculate automatically when meals are added, removed, or changed
  - Totals reflect the user's household serving size, not the recipe default

**US-2.4** (P1) — As a user, I want to remove or swap a planned meal easily, so that I can adjust my week without starting over.
- Acceptance criteria:
  - Each filled slot has a clear remove/swap action
  - Swapping preserves the original time slot

---

## 3. Meal Prep

**US-3.1** (P0) — As a user, I want my week's planned recipes consolidated into a single batch-cooking session, so that I can prep efficiently instead of cooking each recipe separately.
- Acceptance criteria:
  - Consolidated view lists all ingredients and steps across the week's planned recipes
  - Steps are grouped by action type (e.g., all chopping, all roasting) rather than by recipe

**US-3.2** (P1) — As a user, I want overlapping cook times merged, so that I'm not preheating the oven five separate times.
- Acceptance criteria:
  - Steps with matching equipment/temperature requirements are flagged as combinable
  - User sees a single consolidated instruction instead of repeated ones

**US-3.3** (P2) — As a user, I want to mark Meal Prep steps as complete, so that I can track progress through a long prep session.
- Acceptance criteria:
  - Each step has a checkbox or completion state
  - Progress persists if the user leaves and returns to the session

---

## 4. Grocery List

**US-4.1** (P0) — As a user, I want a grocery list generated automatically from my Meal Planner, so that I don't have to build it manually.
- Acceptance criteria:
  - List regenerates whenever the Meal Planner changes
  - List reflects the user's household serving size for every ingredient quantity

**US-4.2** (P0) — As a user, I want the list organized by supermarket aisle, so that shopping is faster and I don't backtrack through the store.
- Acceptance criteria:
  - Ingredients are grouped under categories (produce, dairy, meat, bakery, pantry, etc.)
  - Category assignment is correct for at least the most common ingredient types

**US-4.3** (P1) — As a user, I want items I already have in my Smart Pantry removed from the list, so that I don't buy duplicates.
- Acceptance criteria:
  - Pantry-matched items are excluded or shown as already-owned, not just listed normally
  - User can override and re-add an excluded item if needed

**US-4.4** (P1) — As a user, I want to copy or email my grocery list, so that I can use it while shopping without the app open.
- Acceptance criteria:
  - Copy action puts a plain-text version of the list on the clipboard
  - Email action opens a pre-filled message with the list content

**US-4.5** (P2) — As a user, I want to check items off as I shop, so that I can track what's left in-store.
- Acceptance criteria:
  - Each item has a checkbox
  - Checked state persists during the shopping session

---

## 5. Smart Pantry

**US-5.1** (P0) — As a user, I want to maintain a list of ingredients I currently own, so that the app knows what's already in my kitchen.
- Acceptance criteria:
  - User can manually add, edit, and remove pantry items
  - Items support a quantity and unit

**US-5.2** (P1) — As a user, I want pantry items automatically deducted from my grocery list, so that I'm not buying things I already have.
- Acceptance criteria:
  - Matching is based on ingredient name and, where available, quantity
  - User can see which list items were auto-removed and why

**US-5.3** (P1) — As a user, I want pantry items to influence Discover recommendations, so that I'm nudged to use what I have before it goes bad.
- Acceptance criteria:
  - Pantry-matching recipes are visually flagged on Discover
  - Matching considers partial pantry overlap, not just full matches

---

## 6. Favorites

**US-6.1** (P0) — As a user, I want to bookmark a recipe, so that I can find it again quickly later.
- Acceptance criteria:
  - A save/bookmark action is available on every recipe view
  - Saved state is visually indicated (e.g., filled vs. outline icon)

**US-6.2** (P0) — As a user, I want to view all my saved recipes in one place, so that I don't have to re-search for them.
- Acceptance criteria:
  - Favorites page lists all bookmarked recipes
  - User can remove a recipe from Favorites directly from this view

---

## 7. Household Profile

**US-7.1** (P0) — As a user, I want to declare my allergies during setup, so that the app never recommends something unsafe.
- Acceptance criteria:
  - Common allergens are available as quick-select options
  - A free-text field supports uncommon allergens
  - Allergy data is required to be confirmed (even if empty) before first use of Discover

**US-7.2** (P1) — As a user, I want to declare dietary restrictions, so that recipe results match how I actually eat.
- Acceptance criteria:
  - Multiple restrictions can be selected simultaneously
  - Restrictions are editable at any time from account settings

**US-7.3** (P0) — As a user, I want to set my household size, so that recipe quantities and nutrition reflect how many people I'm actually cooking for.
- Acceptance criteria:
  - Household size is a required field during setup
  - Changing household size later updates scaling app-wide without requiring re-entry of other profile data

**US-7.4** (P1) — As a user, I want to edit my Household Profile at any time, so that I can update it as my needs change.
- Acceptance criteria:
  - All profile fields (allergies, restrictions, household size) are editable from a single settings screen
  - Changes apply immediately to Discover, Meal Planner, and Grocery List without requiring app restart

---

## 8. Serving Size Scaling

**US-8.1** (P0) — As a user, I want ingredient quantities on a recipe to scale with my household size, so that I don't have to do manual math every time I cook.
- Acceptance criteria:
  - Recipe detail view shows a servings stepper
  - Adjusting the stepper recalculates every listed ingredient quantity in real time

**US-8.2** (P0) — As a user, I want macro totals in my Meal Planner to reflect scaled servings, so that my nutrition tracking is accurate for my actual household.
- Acceptance criteria:
  - Macro totals use the scaled quantity, not the recipe's default serving size
  - Totals update immediately if household size changes

**US-8.3** (P1) — As a user, I want scaled quantities to round to sensible kitchen measurements, so that I'm not asked to measure something impractical like a third of an egg.
- Acceptance criteria:
  - Non-divisible ingredients (eggs, whole items) round to the nearest sensible whole number
  - Small quantities (spices, seasoning) have a defined minimum rather than scaling to near-zero

**US-8.4** (P1) — As a user, I want my Grocery List quantities to reflect scaled servings, so that I buy the right amount of each ingredient.
- Acceptance criteria:
  - Grocery List pulls scaled quantities, not recipe-default quantities, from every planned recipe
  - Quantities update automatically if household size changes after the list is generated

---

## Cross-Cutting: Account Sync

**US-9.1** (P0) — As a user, I want my Meal Planner, Pantry, Favorites, and Household Profile saved to my account, so that my data persists across sessions and devices.
- Acceptance criteria:
  - Data is retrievable after logging out and back in
  - Data is consistent across web and any other supported platform

**US-9.2** (P1) — As a user, I want changes made on one device to reflect on another, so that I can plan on desktop and shop from my phone.
- Acceptance criteria:
  - Sync occurs without requiring manual refresh
  - Conflicting simultaneous edits resolve predictably (e.g., last write wins, with no silent data loss)

---

*Next possible step: convert P0 stories into a sprint-ready backlog, or break any story above into engineering tasks.*
