# The Kitchen Edition

An AI-powered meal planning suite with an editorial magazine aesthetic — recipe discovery, weekly planning, batch prep, grocery shopping, and pantry tracking, connected into one synced experience and personalized to your household.

> **Status:** Product concept / pre-implementation. See `the-kitchen-edition-product-writeup.md` and `the-kitchen-edition-user-stories.md` for the full spec.

---

## What it does

Most meal planning apps treat recipe browsing, weekly planning, and grocery shopping as separate tools. The Kitchen Edition treats them as one continuous system — what you plan feeds your grocery list, what's in your pantry feeds back into what gets recommended, and everything respects your household's actual size and dietary needs.

## Features

| Feature | What it does |
|---|---|
| **Discover** | Browse, search-by-ingredient, or search-by-name recipe discovery, powered by the Spoonacular API |
| **Meal Planner** | 7-day calendar with drag-and-drop scheduling and live macro tallies |
| **Meal Prep** | Consolidates a week's planned recipes into one optimized batch-cooking session |
| **Grocery List** | Auto-generated, aisle-organized shopping list with copy/email export |
| **Smart Pantry** | Living inventory that reduces your grocery list and informs recommendations |
| **Favorites** | Bookmark recipes for quick access later |
| **Household Profile** | Dietary restrictions, allergies, and household size — personalizes everything above |
| **Serving Size Scaling** | Recalculates ingredient quantities and nutrition based on household size |

Every feature syncs to a personal account, so planning, pantry, and favorites stay consistent across sessions and devices.

## How the features connect

```
Household Profile  ─────┬──────────────────────────────┐
(restrictions,           │                              │
 allergies, size)         ▼                              ▼
                    Discover  ──────►  Meal Planner  ──────►  Meal Prep
                       ▲                    │
                       │                    ▼
                  Smart Pantry  ◄──────  Grocery List
```

Household Profile filters everything upstream. Smart Pantry and Grocery List form a feedback loop. Serving Size Scaling underlies the Meal Planner's macro math, the Grocery List's quantities, and Meal Prep's batch calculations.

## Tech / data sources

- **Spoonacular API** — recipe content, search, and nutrition data. Also supports native `diet` and `intolerances` filtering, used for Household Profile.
- Application stack (frontend framework, backend, database) is not yet finalized.

## Documentation

- [`the-kitchen-edition-product-writeup.md`](./the-kitchen-edition-product-writeup.md) — full feature definitions, rationale, and scope decisions
- [`the-kitchen-edition-user-stories.md`](./the-kitchen-edition-user-stories.md) — user stories with acceptance criteria, prioritized P0–P2
- [`AGENTS.md`](./AGENTS.md) — build order and conventions for engineers/agents implementing this spec

## Getting started

_To be added once the implementation stack is chosen._

## License

_To be determined._
