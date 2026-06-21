// Mock Spoonacular Recipe Database for The Kitchen Edition
// Contains rich data to test filtering, scaling, grocery mapping, and batch meal prep.

export const MOCK_RECIPES = [
  {
    id: 101,
    title: "Editorial Avocado Toast",
    image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 10,
    servings: 2,
    nutrition: {
      calories: 320,
      protein: 8, // g
      carbs: 24,   // g
      fat: 22      // g
    },
    diets: ["vegetarian", "vegan", "dairy free"],
    allergens: ["gluten"],
    extendedIngredients: [
      { name: "Avocado", amount: 2, unit: "pieces", category: "Produce" },
      { name: "Sourdough Bread", amount: 2, unit: "slices", category: "Bakery" },
      { name: "Cherry Tomatoes", amount: 100, unit: "g", category: "Produce" },
      { name: "Olive Oil", amount: 1, unit: "tbsp", category: "Pantry" },
      { name: "Salt", amount: 0.25, unit: "tsp", category: "Spices" },
      { name: "Black Pepper", amount: 0.25, unit: "tsp", category: "Spices" }
    ],
    analyzedInstructions: [
      {
        name: "Prep",
        steps: [
          { number: 1, step: "Mash the avocado flesh in a small bowl with a pinch of salt and pepper.", equipment: ["Bowl", "Fork"] },
          { number: 2, step: "Toast the sourdough bread slices until golden brown.", equipment: ["Toaster"] },
          { number: 3, step: "Spread the mashed avocado evenly over the toasted bread.", equipment: ["Butter Knife"] },
          { number: 4, step: "Top with halved cherry tomatoes and a drizzle of olive oil.", equipment: [] }
        ]
      }
    ]
  },
  {
    id: 102,
    title: "Classic Pecan Maple Granola",
    image: "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 30,
    servings: 4,
    nutrition: {
      calories: 450,
      protein: 10,
      carbs: 48,
      fat: 26
    },
    diets: ["vegetarian", "vegan", "gluten free", "dairy free"],
    allergens: ["tree nuts"],
    extendedIngredients: [
      { name: "Rolled Oats", amount: 2, unit: "cups", category: "Pantry" },
      { name: "Pecans", amount: 1, unit: "cup", category: "Pantry" },
      { name: "Maple Syrup", amount: 0.5, unit: "cup", category: "Pantry" },
      { name: "Coconut Oil", amount: 0.25, unit: "cup", category: "Pantry" },
      { name: "Cinnamon", amount: 1, unit: "tsp", category: "Spices" },
      { name: "Salt", amount: 0.5, unit: "tsp", category: "Spices" }
    ],
    analyzedInstructions: [
      {
        name: "Bake Granola",
        steps: [
          { number: 1, step: "Preheat the oven to 325°F (160°C).", equipment: ["Oven"], temperature: 325 },
          { number: 2, step: "Mix oats, pecans, cinnamon, and salt in a large mixing bowl.", equipment: ["Bowl"] },
          { number: 3, step: "Pour in maple syrup and melted coconut oil, mixing until fully coated.", equipment: ["Spatula"] },
          { number: 4, step: "Spread granola onto a parchment-lined baking sheet.", equipment: ["Baking Sheet"] },
          { number: 5, step: "Bake at 325°F for 20 minutes, stirring halfway through, until golden brown.", equipment: ["Oven"], temperature: 325, duration: 20 }
        ]
      }
    ]
  },
  {
    id: 103,
    title: "Thai Peanut Noodles",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 15,
    servings: 2,
    nutrition: {
      calories: 580,
      protein: 18,
      carbs: 68,
      fat: 28
    },
    diets: ["vegetarian", "vegan", "dairy free"],
    allergens: ["peanuts", "soy", "gluten"],
    extendedIngredients: [
      { name: "Ramen Noodles", amount: 150, unit: "g", category: "Pantry" },
      { name: "Peanut Butter", amount: 4, unit: "tbsp", category: "Pantry" },
      { name: "Soy Sauce", amount: 2, unit: "tbsp", category: "Pantry" },
      { name: "Maple Syrup", amount: 1, unit: "tbsp", category: "Pantry" },
      { name: "Sesame Oil", amount: 1, unit: "tbsp", category: "Pantry" },
      { name: "Garlic", amount: 2, unit: "cloves", category: "Produce" },
      { name: "Green Onions", amount: 2, unit: "pieces", category: "Produce" }
    ],
    analyzedInstructions: [
      {
        name: "Prepare Noodles",
        steps: [
          { number: 1, step: "Cook noodles in boiling water for 5 minutes, then drain.", equipment: ["Pot", "Colander"], duration: 5 },
          { number: 2, step: "Whisk peanut butter, soy sauce, maple syrup, sesame oil, and minced garlic in a bowl with warm water.", equipment: ["Bowl", "Whisk"] },
          { number: 3, step: "Toss the warm noodles in the peanut sauce until fully coated.", equipment: ["Tongs"] },
          { number: 4, step: "Garnish with chopped green onions before serving.", equipment: ["Chef Knife"] }
        ]
      }
    ]
  },
  {
    id: 104,
    title: "Mediterranean Baked Salmon",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 25,
    servings: 2,
    nutrition: {
      calories: 420,
      protein: 38,
      carbs: 6,
      fat: 26
    },
    diets: ["pescatarian", "gluten free", "dairy free", "keto"],
    allergens: ["shellfish"], // included here just to tag fish/seafood/shellfish tests
    extendedIngredients: [
      { name: "Salmon Fillet", amount: 2, unit: "pieces", category: "Meat & Seafood" },
      { name: "Olive Oil", amount: 2, unit: "tbsp", category: "Pantry" },
      { name: "Lemon", amount: 1, unit: "piece", category: "Produce" },
      { name: "Cherry Tomatoes", amount: 150, unit: "g", category: "Produce" },
      { name: "Kalamata Olives", amount: 50, unit: "g", category: "Pantry" },
      { name: "Dried Oregano", amount: 1, unit: "tsp", category: "Spices" },
      { name: "Garlic", amount: 2, unit: "cloves", category: "Produce" }
    ],
    analyzedInstructions: [
      {
        name: "Bake Salmon",
        steps: [
          { number: 1, step: "Preheat the oven to 375°F (190°C).", equipment: ["Oven"], temperature: 375 },
          { number: 2, step: "Place salmon fillets on a baking dish. Rub with olive oil and minced garlic.", equipment: ["Baking Dish"] },
          { number: 3, step: "Arrange cherry tomatoes and kalamata olives around salmon, and slice lemons to place on top.", equipment: ["Knife"] },
          { number: 4, step: "Sprinkle with oregano, salt, and pepper.", equipment: [] },
          { number: 5, step: "Bake salmon in the preheated oven at 375°F for 15 minutes until flaky.", equipment: ["Oven"], temperature: 375, duration: 15 }
        ]
      }
    ]
  },
  {
    id: 105,
    title: "Greek Chickpea Salad",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 10,
    servings: 2,
    nutrition: {
      calories: 290,
      protein: 12,
      carbs: 32,
      fat: 14
    },
    diets: ["vegetarian", "gluten free", "mediterranean"],
    allergens: ["dairy"],
    extendedIngredients: [
      { name: "Canned Chickpeas", amount: 1.5, unit: "cups", category: "Pantry" },
      { name: "Cucumber", amount: 1, unit: "piece", category: "Produce" },
      { name: "Cherry Tomatoes", amount: 150, unit: "g", category: "Produce" },
      { name: "Feta Cheese", amount: 75, unit: "g", category: "Dairy" },
      { name: "Olive Oil", amount: 1.5, unit: "tbsp", category: "Pantry" },
      { name: "Lemon Juice", amount: 1, unit: "tbsp", category: "Produce" },
      { name: "Dried Oregano", amount: 0.5, unit: "tsp", category: "Spices" }
    ],
    analyzedInstructions: [
      {
        name: "Assemble Salad",
        steps: [
          { number: 1, step: "Rinse and drain the canned chickpeas.", equipment: ["Colander"] },
          { number: 2, step: "Dice cucumber and halve cherry tomatoes.", equipment: ["Chef Knife", "Cutting Board"] },
          { number: 3, step: "In a salad bowl, toss chickpeas, cucumber, tomatoes, and crumbled feta cheese.", equipment: ["Bowl", "Salad Tongs"] },
          { number: 4, step: "Drizzle with olive oil, lemon juice, and oregano. Season with salt to taste.", equipment: [] }
        ]
      }
    ]
  },
  {
    id: 106,
    title: "Lemon Herb Roasted Chicken",
    image: "https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 50,
    servings: 4,
    nutrition: {
      calories: 480,
      protein: 42,
      carbs: 8,
      fat: 32
    },
    diets: ["gluten free", "dairy free", "keto"],
    allergens: [],
    extendedIngredients: [
      { name: "Chicken Breasts", amount: 4, unit: "pieces", category: "Meat & Seafood" },
      { name: "Olive Oil", amount: 3, unit: "tbsp", category: "Pantry" },
      { name: "Lemon", amount: 2, unit: "pieces", category: "Produce" },
      { name: "Fresh Rosemary", amount: 3, unit: "sprigs", category: "Produce" },
      { name: "Garlic", amount: 4, unit: "cloves", category: "Produce" },
      { name: "Paprika", amount: 1, unit: "tsp", category: "Spices" }
    ],
    analyzedInstructions: [
      {
        name: "Roast Chicken",
        steps: [
          { number: 1, step: "Preheat the oven to 375°F (190°C).", equipment: ["Oven"], temperature: 375 },
          { number: 2, step: "Lay chicken breasts in a baking dish.", equipment: ["Baking Dish"] },
          { number: 3, step: "Whisk olive oil, garlic paste, paprika, lemon juice, and chopped rosemary together and rub over chicken.", equipment: ["Bowl"] },
          { number: 4, step: "Top chicken breasts with lemon slices.", equipment: [] },
          { number: 5, step: "Roast at 375°F for 35 minutes until internal temperature reaches 165°F.", equipment: ["Oven"], temperature: 375, duration: 35 }
        ]
      }
    ]
  },
  {
    id: 107,
    title: "Crispy Sesame Tofu",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 25,
    servings: 2,
    nutrition: {
      calories: 340,
      protein: 16,
      carbs: 18,
      fat: 22
    },
    diets: ["vegetarian", "vegan", "dairy free", "gluten free"],
    allergens: ["soy"],
    extendedIngredients: [
      { name: "Extra Firm Tofu", amount: 1, unit: "block", category: "Produce" },
      { name: "Cornstarch", amount: 2, unit: "tbsp", category: "Pantry" },
      { name: "Soy Sauce", amount: 2, unit: "tbsp", category: "Pantry" },
      { name: "Sesame Seeds", amount: 1, unit: "tbsp", category: "Pantry" },
      { name: "Sesame Oil", amount: 2, unit: "tbsp", category: "Pantry" },
      { name: "Maple Syrup", amount: 1, unit: "tbsp", category: "Pantry" }
    ],
    analyzedInstructions: [
      {
        name: "Pan Fry Tofu",
        steps: [
          { number: 1, step: "Press tofu to drain excess moisture, then cut into 1-inch cubes.", equipment: ["Cutting Board", "Paper Towels"] },
          { number: 2, step: "Toss tofu cubes in cornstarch until lightly coated.", equipment: ["Bowl"] },
          { number: 3, step: "Heat sesame oil in a frying pan and cook tofu until crispy on all sides.", equipment: ["Frying Pan"] },
          { number: 4, step: "Pour in soy sauce and maple syrup, stirring quickly to glaze tofu. Sprinkle with sesame seeds.", equipment: ["Spatula"] }
        ]
      }
    ]
  },
  {
    id: 108,
    title: "Shakshuka (Eggs in Tomato Sauce)",
    image: "https://images.unsplash.com/photo-1590412200988-a436bb7050a8?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 20,
    servings: 2,
    nutrition: {
      calories: 270,
      protein: 14,
      carbs: 16,
      fat: 18
    },
    diets: ["vegetarian", "gluten free"],
    allergens: ["eggs"],
    extendedIngredients: [
      { name: "Eggs", amount: 4, unit: "pieces", category: "Dairy" },
      { name: "Canned Diced Tomatoes", amount: 400, unit: "g", category: "Pantry" },
      { name: "Bell Pepper", amount: 1, unit: "piece", category: "Produce" },
      { name: "Onion", amount: 1, unit: "piece", category: "Produce" },
      { name: "Olive Oil", amount: 1, unit: "tbsp", category: "Pantry" },
      { name: "Cumin", amount: 1, unit: "tsp", category: "Spices" },
      { name: "Garlic", amount: 2, unit: "cloves", category: "Produce" }
    ],
    analyzedInstructions: [
      {
        name: "Cook Shakshuka",
        steps: [
          { number: 1, step: "Dice the onion and bell pepper, and mince the garlic.", equipment: ["Knife", "Cutting Board"] },
          { number: 2, step: "Sauté onion, bell pepper, and garlic in a skillet with olive oil until soft.", equipment: ["Skillet"] },
          { number: 3, step: "Add cumin and diced tomatoes, then let the sauce simmer for 8 minutes to thicken.", equipment: ["Skillet"], duration: 8 },
          { number: 4, step: "Make small wells in the sauce and crack eggs into them.", equipment: [] },
          { number: 5, step: "Cover the skillet and cook on low heat for 5 minutes until egg whites are set but yolks remain runny.", equipment: ["Skillet", "Lid"], duration: 5 }
        ]
      }
    ]
  },
  {
    id: 109,
    title: "Chocolate Avocado Mousse",
    image: "https://images.unsplash.com/photo-1541795795328-f073b763494e?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: 10,
    servings: 2,
    nutrition: {
      calories: 310,
      protein: 4,
      carbs: 22,
      fat: 26
    },
    diets: ["vegetarian", "vegan", "gluten free", "dairy free"],
    allergens: [],
    extendedIngredients: [
      { name: "Avocado", amount: 2, unit: "pieces", category: "Produce" },
      { name: "Cocoa Powder", amount: 0.25, unit: "cup", category: "Pantry" },
      { name: "Maple Syrup", amount: 0.25, unit: "cup", category: "Pantry" },
      { name: "Almond Milk", amount: 0.25, unit: "cup", category: "Dairy" },
      { name: "Vanilla Extract", amount: 1, unit: "tsp", category: "Pantry" }
    ],
    analyzedInstructions: [
      {
        name: "Blend Mousse",
        steps: [
          { number: 1, step: "Scoop out avocado flesh into a food processor.", equipment: ["Food Processor"] },
          { number: 2, step: "Add cocoa powder, maple syrup, almond milk, and vanilla extract.", equipment: [] },
          { number: 3, step: "Process until smooth and creamy, scraping down the sides as needed.", equipment: ["Food Processor", "Spatula"] },
          { number: 4, step: "Spoon into glasses and chill in the fridge before serving.", equipment: ["Spoons", "Glasses"] }
        ]
      }
    ]
  }
];
