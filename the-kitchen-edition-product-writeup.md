# The Kitchen Edition
### Product Concept Write-Up

---

## Overview

The Kitchen Edition is an AI-powered meal planning suite with an editorial magazine aesthetic. It connects every stage of the "what am I eating this week" problem — discovery, planning, prepping, shopping, and inventory — into a single synced loop, personalized to the user's household, dietary needs, and what they already own.

The product is built around one core idea: most meal planning apps treat each step (finding a recipe, building a grocery list, tracking what's in the fridge) as separate tools. The Kitchen Edition treats them as one continuous system, where each feature feeds the next.

---

## Core Features

### 1. Discover
Recipe browsing powered by the Spoonacular API.

- Browse a curated daily selection — answers "what should I cook tonight?" without endless searching
- Search by ingredients already on hand
- Search by recipe name when the user knows what they want
- Filters automatically by the user's dietary restrictions and allergies (see Household Profile)
- Surfaces recipes that use up Smart Pantry items, so nothing expires unused

### 2. Meal Planner
A full seven-day calendar with breakfast, lunch, and dinner slots.

- Drag-and-drop scheduling of recipes across the week
- Automatic daily macro tallies (calories, protein, carbs)
- Macro totals and ingredient quantities scale automatically with household size (see Serving Size Scaling)

### 3. Meal Prep
A batch-cooking consolidator connected to the Meal Planner.

- Combines all planned recipes for the week into one optimized cooking session
- Unifies overlapping cook times and steps (e.g., one oven preheat instead of five)
- Built for users who prep meals in bulk rather than cook daily

### 4. Grocery List
Auto-generated from the Meal Planner.

- Organizes every ingredient by supermarket aisle (produce, dairy, meat, bakery, pantry, etc.)
- Subtracts items already in Smart Pantry, preventing duplicate purchases
- Quantities reflect the household's actual serving size, not the recipe's default
- Copy or email the list instantly for in-store shopping

### 5. Smart Pantry
A living inventory of what the user already owns.

- Deducts owned items from the Grocery List automatically
- Surfaces "use it up" recipe suggestions on the Discover page to reduce food waste
- Acts as the connective layer between Discover and Grocery List

### 6. Favorites
A simple bookmarking system for recipes the user wants to return to.

- Quick access to loved recipes without re-searching
- Builds a personal recipe collection over time

### 7. Household Profile *(new)*
A setup step — editable anytime — that personalizes the entire app to the user's actual household.

- **Dietary restrictions**: preference-based filters (vegetarian, vegan, pescatarian, keto, gluten-free, dairy-free, Mediterranean, etc.), multi-select since these often combine
- **Allergies**: safety-critical, treated separately from restrictions since the cost of getting this wrong is higher than a disliked meal. Common allergens (peanuts, tree nuts, shellfish, dairy, eggs, soy, gluten) as quick-select options, plus free text for anything uncommon
- **Household size**: the number of people being cooked for, used as the base multiplier for everything else in the app

This isn't a standalone feature — it's a filter layer that applies across Discover, Meal Planner, and macro calculations. Spoonacular's API natively supports diet and intolerance parameters, so this integrates at the query level rather than requiring custom filtering logic.

### 8. Serving Size Scaling *(new)*
Automatic recalculation of ingredient quantities and nutrition based on household size.

- A servings stepper on any recipe recalculates every ingredient quantity live
- Macro tallies in the Meal Planner scale with the same multiplier instead of staying fixed at the recipe's default
- Grocery List quantities reflect the household's real serving size — this is the feature that makes the Grocery List actually accurate rather than just organized
- Meal Prep's batch math depends on this being correct, since consolidation only works if real per-person quantities are known

This feature is what makes Household Profile useful beyond a stored preference — it's the multiplier that makes every number in the app correct for the specific user instead of generic to the recipe's default.

---

## Cross-Cutting Layer: Account Sync

Planner, Pantry, Favorites, and Household Profile are all saved to a personal account, so the experience stays consistent across devices and sessions. This is what makes the app feel like one continuous food assistant rather than a set of disconnected tools.

---

## How the Features Connect

```
Household Profile  ─────┬──────────────────────────────┐
(restrictions,           │                              │
 allergies, size)         ▼                              ▼
                    Discover  ──────►  Meal Planner  ──────►  Meal Prep
                       ▲                    │
                       │                    ▼
                  Smart Pantry  ◄──────  Grocery List
```

Household Profile sits upstream of everything, filtering what's even shown. Smart Pantry and Grocery List form a feedback loop — pantry reduces the list, and the list (once shopped) should ideally restock the pantry.

---

## Changes from Original Concept

| Original idea | Status | Reason |
|---|---|---|
| Live interactive map with hover-based pins | **Removed** | High technical/licensing cost (Places or Yelp API), and hover doesn't work on mobile, which is the primary use case for a meal app |
| Restaurant discovery + dish-to-recipe (AI Map Explorer / AI Dish Finder) | **Removed** | Dropped along with the map; the underlying restaurant-data and review licensing dependencies made the feature impractical for now |
| Dietary restrictions / allergies / household size | **Added** | Was missing from the original spec; necessary for both relevance (restrictions) and basic safety (allergies) |
| Serving size scaling | **Added** | Was missing; without it, household size is just a stored field with no real effect on the app |

---

## Open Questions for Next Steps

- Should household size be a single number, or per-person (e.g., 2 adults + 1 child eating smaller portions)?
- For non-linear ingredients (a pinch of salt, a single egg), does scaling round to sensible kitchen units, or do straight math for v1 and refine later?
- Should the Grocery List restock the Smart Pantry automatically once items are checked off as purchased?

---

*This document reflects the feature set as defined through product discussion. Recommended next artifacts: a formal PRD with data models and API requirements, a user flow diagram, or a pitch deck for stakeholders.*
