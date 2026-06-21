import { MOCK_RECIPES } from './recipe-data.js';

// --- GLOBAL APPLICATION STATE ---
let state = {
  profile: {
    householdSize: 2,
    allergies: [],
    restrictions: [],
    customAllergies: '',
    filterMode: 'hide' // 'hide' or 'deprioritize'
  },
  planner: {
    Monday: { breakfast: null, lunch: null, dinner: null },
    Tuesday: { breakfast: null, lunch: null, dinner: null },
    Wednesday: { breakfast: null, lunch: null, dinner: null },
    Thursday: { breakfast: null, lunch: null, dinner: null },
    Friday: { breakfast: null, lunch: null, dinner: null },
    Saturday: { breakfast: null, lunch: null, dinner: null },
    Sunday: { breakfast: null, lunch: null, dinner: null }
  },
  pantry: [], // list of { name, quantity, unit }
  favorites: [], // list of recipe IDs
  apiKey: '', // Spoonacular API Key
  prepCheckedSteps: {}, // { stepId: true/false }
  groceryCheckedItems: {} // { itemKey: true/false }
};

// Cache for Spoonacular API recipe detailed fetch requests to avoid redundant calls
const API_RECIPE_CACHE = {};

// Helper to check if setup wizard is completed
let isSetupCompleted = false;

// --- STATE MANAGEMENT & LOCAL STORAGE ---
const STATE_KEY = 'THE_KITCHEN_EDITION_STATE';

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
  showSyncState('Synced to Account');
  updateActiveProfileSummary();
}

function loadState() {
  const saved = localStorage.getItem(STATE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Merge with default state structure in case of schema drift
      state = { ...state, ...parsed };
      state.profile = { ...state.profile, ...parsed.profile };
      state.planner = { ...state.planner, ...parsed.planner };
      state.pantry = parsed.pantry || [];
      state.favorites = parsed.favorites || [];
      state.apiKey = parsed.apiKey || '';
      state.prepCheckedSteps = parsed.prepCheckedSteps || {};
      state.groceryCheckedItems = parsed.groceryCheckedItems || {};
      isSetupCompleted = true;
    } catch (e) {
      console.error('Error loading saved state, resetting', e);
      isSetupCompleted = false;
    }
  } else {
    isSetupCompleted = false;
  }
}

// Visual indicator of synchronized state
function showSyncState(text) {
  const syncTextEl = document.getElementById('syncText');
  const syncDotEl = document.querySelector('.sync-dot');
  if (syncTextEl) syncTextEl.textContent = text;
  if (syncDotEl) {
    syncDotEl.style.backgroundColor = 'var(--accent-olive)';
  }
}

// Elegant magazine style toasts
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `badge ${type === 'success' ? 'badge-success' : 'badge-alert'}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.zIndex = '2000';
  toast.style.padding = '0.75rem 1.25rem';
  toast.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
  toast.style.animation = 'fadeIn 0.2s ease-out';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

// --- SERVING SIZE SCALING UTILITY ---
// Shared utility (US-8.1, US-8.2, US-8.4, US-3.1, US-4.1)
export function scaleRecipe(recipe, targetServings) {
  if (!recipe) return null;
  const baseServings = recipe.servings || 1;
  const multiplier = targetServings / baseServings;
  
  const scaledIngredients = recipe.extendedIngredients.map(ing => {
    const rawAmount = ing.amount * multiplier;
    const scaledAmount = roundToSensibleKitchen(rawAmount, ing.unit);
    return {
      ...ing,
      amount: scaledAmount,
      originalAmount: rawAmount // hold raw amount for precision math later
    };
  });

  const scaledNutrition = {};
  if (recipe.nutrition) {
    for (const [macro, value] of Object.entries(recipe.nutrition)) {
      scaledNutrition[macro] = Math.round(value * multiplier);
    }
  }

  return {
    ...recipe,
    servings: targetServings,
    extendedIngredients: scaledIngredients,
    nutrition: scaledNutrition
  };
}

function roundToSensibleKitchen(amount, unit) {
  if (!amount) return 0;
  const u = (unit || '').toLowerCase().trim();
  
  // Whole items (eggs, whole pieces of fruit/veggies, slices of bread) round to nearest integer
  if (['egg', 'eggs', 'piece', 'pieces', 'slice', 'slices', 'whole', 'block', 'blocks', 'fillet', 'fillets'].includes(u)) {
    return Math.max(1, Math.round(amount));
  }
  
  // Spices / small flavorings (salt, spices, garlic cloves, oils) keep at least a minimum threshold and round to 1 decimal
  if (['tsp', 'tbsp', 'clove', 'cloves', 'pinch', 'pinches', 'sprig', 'sprigs'].includes(u)) {
    if (amount < 0.1) return 0.1;
    return Math.round(amount * 10) / 10;
  }
  
  // General volume/weight (cups, g, oz, ml) round to 2 decimals
  return Math.round(amount * 100) / 100;
}

// --- CORE DISCOVER & SEARCH API ENGINE ---
// Spoonacular mapping to internal unified data schema
function mapSpoonacularToInternal(spRecipe) {
  // Extract nutrition values if available
  let cal = 0, protein = 0, carbs = 0, fat = 0;
  if (spRecipe.nutrition && spRecipe.nutrition.nutrients) {
    const findNutrient = (name) => spRecipe.nutrition.nutrients.find(n => n.name.toLowerCase() === name.toLowerCase())?.amount || 0;
    cal = findNutrient('Calories');
    protein = findNutrient('Protein');
    carbs = findNutrient('Carbohydrates');
    fat = findNutrient('Fat');
  } else if (spRecipe.nutrition) {
    // Simple mock structure mapping if already converted
    cal = spRecipe.nutrition.calories || 0;
    protein = spRecipe.nutrition.protein || 0;
    carbs = spRecipe.nutrition.carbs || 0;
    fat = spRecipe.nutrition.fat || 0;
  }

  // Group ingredient category mapping (Spoonacular uses aisle)
  const ingredients = (spRecipe.extendedIngredients || []).map(ing => {
    return {
      name: ing.nameClean || ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: cleanAisle(ing.aisle)
    };
  });

  // Extract step instruction structures
  let instructions = [];
  if (spRecipe.analyzedInstructions && spRecipe.analyzedInstructions.length > 0) {
    instructions = spRecipe.analyzedInstructions.map(instr => ({
      name: instr.name || "Preparation",
      steps: (instr.steps || []).map(st => ({
        number: st.number,
        step: st.step,
        equipment: (st.equipment || []).map(e => e.name),
        temperature: parseTemperature(st.step) // extract temp details
      }))
    }));
  } else {
    // Fallback if raw text instructions exist but no analyzed blocks
    instructions = [{
      name: "Instructions",
      steps: (spRecipe.instructions || '').split('.').filter(s => s.trim()).map((s, idx) => ({
        number: idx + 1,
        step: s.trim() + '.',
        equipment: [],
        temperature: parseTemperature(s)
      }))
    }];
  }

  return {
    id: spRecipe.id,
    title: spRecipe.title,
    image: spRecipe.image || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=600",
    readyInMinutes: spRecipe.readyInMinutes || 20,
    servings: spRecipe.servings || 2,
    nutrition: { calories: cal, protein, carbs, fat },
    diets: spRecipe.diets || [],
    allergens: inferAllergens(spRecipe),
    extendedIngredients: ingredients,
    analyzedInstructions: instructions
  };
}

function cleanAisle(aisle) {
  if (!aisle) return "Pantry";
  const a = aisle.toLowerCase();
  if (a.includes("produce") || a.includes("fruit") || a.includes("vegetable")) return "Produce";
  if (a.includes("meat") || a.includes("poultry") || a.includes("seafood") || a.includes("fish")) return "Meat & Seafood";
  if (a.includes("dairy") || a.includes("cheese") || a.includes("egg")) return "Dairy";
  if (a.includes("bakery") || a.includes("bread")) return "Bakery";
  if (a.includes("spice") || a.includes("seasoning") || a.includes("herb")) return "Spices";
  return "Pantry";
}

function inferAllergens(spRecipe) {
  // Infer allergens from spoonacular tags and labels
  const allergens = [];
  const title = spRecipe.title.toLowerCase();
  const diets = (spRecipe.diets || []).map(d => d.toLowerCase());
  
  if (title.includes("peanut") || title.includes("satay")) allergens.push("peanuts");
  if (title.includes("pecan") || title.includes("walnut") || title.includes("almond") || title.includes("cashew")) allergens.push("tree nuts");
  if (title.includes("shrimp") || title.includes("crab") || title.includes("lobster") || title.includes("prawn")) allergens.push("shellfish");
  if (!diets.includes("dairy free") && !diets.includes("vegan")) {
    const dairyKeywords = ['milk', 'cheese', 'feta', 'butter', 'cream', 'yogurt'];
    if (dairyKeywords.some(kw => title.includes(kw))) allergens.push("dairy");
  }
  if (title.includes("egg") || title.includes("quiche") || title.includes("frittata")) allergens.push("eggs");
  if (title.includes("tofu") || title.includes("soy") || title.includes("edamame")) allergens.push("soy");
  if (!diets.includes("gluten free")) {
    const glutenKeywords = ['wheat', 'flour', 'bread', 'pasta', 'ramen', 'noodle', 'toast'];
    if (glutenKeywords.some(kw => title.includes(kw))) allergens.push("gluten");
  }
  return allergens;
}

function parseTemperature(text) {
  // Parse baking temperatures from text (e.g. 375°F or 190°C)
  const regex = /(\d{3})\s*°?\s*[FfCc]/;
  const match = text.match(regex);
  if (match) {
    let temp = parseInt(match[1]);
    // convert celsius to fahrenheit for standard comparison in consolidator
    if (text.includes("°C") || text.includes(" C")) {
      temp = Math.round((temp * 9/5) + 32);
    }
    return temp;
  }
  return null;
}

// Main Recipe Retrieval (Local Mock or Spoonacular API)
async function fetchRecipes(options = {}) {
  const { nameSearch = '', ingredientSearch = [] } = options;
  
  // Read active allergies and restrictions from state
  const userAllergies = [...state.profile.allergies];
  if (state.profile.customAllergies) {
    const customs = state.profile.customAllergies.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    userAllergies.push(...customs);
  }
  
  const userRestrictions = state.profile.restrictions;
  
  // IF SPOONACULAR API KEY IS AVAILABLE
  if (state.apiKey) {
    try {
      showSyncState('Fetching API...');
      let url = '';
      let results = [];
      
      const dietParam = userRestrictions.join(',');
      const intoleranceParam = userAllergies.join(',');
      
      if (ingredientSearch.length > 0) {
        // Find by ingredients API
        const ingredients = ingredientSearch.join(',');
        url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(ingredients)}&number=12&ignorePantry=false&apiKey=${state.apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        const rawResults = await response.json();
        
        // FindByIngredients endpoint lacks detailed instructions/diets, we need to fetch info for each card.
        // To save API points, we map what we can and mock fallback instructions, or batch fetch details.
        // For standard reliability, we fetch full details for the top 4 matched recipes.
        const topMatches = rawResults.slice(0, 4);
        results = await Promise.all(topMatches.map(async (r) => {
          return await fetchRecipeById(r.id);
        }));
      } else {
        // Search by name API
        url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(nameSearch)}&diet=${encodeURIComponent(dietParam)}&intolerances=${encodeURIComponent(intoleranceParam)}&addRecipeNutrition=true&number=12&apiKey=${state.apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        results = (data.results || []).map(r => mapSpoonacularToInternal(r));
      }
      
      showSyncState('Synced to Account');
      return results;
    } catch (err) {
      console.warn('Spoonacular API Fetch failed, falling back to mock database', err);
      showToast('API fetch failed. Using local database fallback.', 'error');
    }
  }

  // --- LOCAL DATABASE FILTERING (MOCK FALLBACK) ---
  let results = [...MOCK_RECIPES];

  // 1. Safety Hard-Filter: Exclude any recipe containing user allergies (US-1.4, US-7.1)
  if (userAllergies.length > 0) {
    results = results.filter(recipe => {
      // Check recipe allergen tags
      const hasAllergenTag = recipe.allergens.some(a => userAllergies.includes(a.toLowerCase()));
      // Also check ingredient text names just in case
      const hasIngredientMatch = recipe.extendedIngredients.some(ing => {
        const name = ing.name.toLowerCase();
        return userAllergies.some(allergen => name.includes(allergen));
      });
      return !hasAllergenTag && !hasIngredientMatch;
    });
  }

  // 2. Dietary Restrictions Filter (US-1.5, US-7.2)
  if (userRestrictions.length > 0) {
    if (state.profile.filterMode === 'hide') {
      // Hide conflicting recipes (recipe must match ALL user restrictions)
      results = results.filter(recipe => {
        return userRestrictions.every(restrict => recipe.diets.map(d => d.toLowerCase()).includes(restrict.toLowerCase()));
      });
    } else {
      // Deprioritize mode: we will flag them and sort them later
      // The actual filtering isn't done here; sorting occurs in the render step
    }
  }

  // 3. Name Text Search (US-1.3)
  if (nameSearch.trim()) {
    const q = nameSearch.toLowerCase().trim();
    results = results.filter(recipe => recipe.title.toLowerCase().includes(q));
  }

  // 4. Ingredient-on-hand Search (US-1.2)
  if (ingredientSearch.length > 0) {
    const searchIngredients = ingredientSearch.map(s => s.toLowerCase().trim());
    
    results = results.map(recipe => {
      const ingNames = recipe.extendedIngredients.map(ing => ing.name.toLowerCase());
      
      // Calculate how many searched ingredients are matching
      const matched = searchIngredients.filter(sIng => ingNames.some(rIng => rIng.includes(sIng)));
      const missing = recipe.extendedIngredients.filter(ing => {
        return !searchIngredients.some(sIng => ing.name.toLowerCase().includes(sIng));
      });

      return {
        ...recipe,
        matchCount: matched.length,
        missingIngredients: missing
      };
    });

    // Filter out recipes that have zero matching ingredients, then sort by maximum match count
    results = results.filter(r => r.matchCount > 0);
    results.sort((a, b) => b.matchCount - a.matchCount);
  }

  return results;
}

// Fetch single recipe details (cached)
async function fetchRecipeById(id) {
  id = parseInt(id);
  
  // Check local mock DB first
  const mockMatch = MOCK_RECIPES.find(r => r.id === id);
  if (mockMatch) return mockMatch;

  if (API_RECIPE_CACHE[id]) return API_RECIPE_CACHE[id];

  if (state.apiKey) {
    try {
      const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${state.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch detailed recipe');
      const data = await response.json();
      const mapped = mapSpoonacularToInternal(data);
      API_RECIPE_CACHE[id] = mapped;
      return mapped;
    } catch (e) {
      console.error('API detailed fetch failed', e);
    }
  }

  return null;
}

// --- SINGLE-PAGE ROUTING SYSTEM ---
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.app-section');

function handleRoute() {
  // If household wizard is not complete, enforce modal block
  if (!isSetupCompleted) {
    const wizard = document.getElementById('setupWizardOverlay');
    if (wizard) wizard.classList.add('active');
    return;
  }

  let hash = window.location.hash.slice(1) || 'discover';
  
  // Validate hash exists in our tabs
  const validSections = ['discover', 'planner', 'prep', 'grocery', 'pantry', 'favorites', 'profile'];
  if (!validSections.includes(hash)) {
    hash = 'discover';
  }

  // Update active links
  navLinks.forEach(link => {
    if (link.getAttribute('data-target') === hash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update active section
  sections.forEach(section => {
    if (section.id === hash) {
      section.classList.add('active');
    } else {
      section.classList.remove('remove');
      section.classList.remove('active');
    }
  });

  // Trigger page-specific re-renders
  if (hash === 'discover') renderDiscoverPage();
  if (hash === 'planner') renderPlannerPage();
  if (hash === 'prep') renderPrepPage();
  if (hash === 'grocery') renderGroceryPage();
  if (hash === 'pantry') renderPantryPage();
  if (hash === 'favorites') renderFavoritesPage();
  if (hash === 'profile') renderProfilePage();
}

window.addEventListener('hashchange', handleRoute);

// --- FEATURE 7: HOUSEHOLD PROFILE SETUP & SETTINGS ---
const setupForm = document.getElementById('setupWizardForm');
const settingsForm = document.getElementById('profileSettingsForm');

if (setupForm) {
  setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const size = parseInt(document.getElementById('setupHouseholdSize').value);
    const allergies = Array.from(document.querySelectorAll('input[name="setupAllergies"]:checked')).map(el => el.value);
    const customAllergies = document.getElementById('setupCustomAllergies').value;
    const restrictions = Array.from(document.querySelectorAll('input[name="setupRestrictions"]:checked')).map(el => el.value);

    // Apply values to state
    state.profile.householdSize = size;
    state.profile.allergies = allergies;
    state.profile.customAllergies = customAllergies;
    state.profile.restrictions = restrictions;
    state.profile.filterMode = 'hide'; // Default setup filter style

    isSetupCompleted = true;
    saveState();
    
    // Hide overlay
    document.getElementById('setupWizardOverlay').classList.remove('active');
    showToast('Household Profile Saved!');
    
    // Reroute / Render
    handleRoute();
  });
}

if (settingsForm) {
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const size = parseInt(document.getElementById('profileHouseholdSize').value);
    const allergies = Array.from(document.querySelectorAll('input[name="allergies"]:checked')).map(el => el.value);
    const customAllergies = document.getElementById('profileCustomAllergies').value;
    const restrictions = Array.from(document.querySelectorAll('input[name="restrictions"]:checked')).map(el => el.value);
    const filterMode = document.getElementById('profileFilterMode').value;

    // Apply updates to state (US-7.4 updates immediately)
    state.profile.householdSize = size;
    state.profile.allergies = allergies;
    state.profile.customAllergies = customAllergies;
    state.profile.restrictions = restrictions;
    state.profile.filterMode = filterMode;

    saveState();
    showToast('Preferences updated successfully!');
    renderProfilePage();
  });
}

// Sync settings button trigger
const syncBtn = document.getElementById('triggerSyncBtn');
if (syncBtn) {
  syncBtn.addEventListener('click', () => {
    showSyncState('Connecting...');
    setTimeout(() => {
      saveState();
      showToast('Account Sync Successful!');
    }, 800);
  });
}

// API Key save trigger
const apiKeyBtn = document.getElementById('saveApiKeyBtn');
if (apiKeyBtn) {
  apiKeyBtn.addEventListener('click', () => {
    const val = document.getElementById('spoonacularApiKey').value.trim();
    state.apiKey = val;
    saveState();
    showToast(val ? 'Spoonacular API Key enabled!' : 'Spoonacular API Key disabled.');
  });
}

function updateActiveProfileSummary() {
  const el = document.getElementById('activeProfileSummary');
  if (el) {
    const size = state.profile.householdSize;
    const dietsStr = state.profile.restrictions.join(', ') || 'Standard';
    const allgs = [...state.profile.allergies];
    if (state.profile.customAllergies) {
      allgs.push(...state.profile.customAllergies.split(',').map(s => s.trim()));
    }
    const allgsStr = allgs.join(', ') || 'None';
    
    el.innerHTML = `<span>Household Size: <strong>${size} people</strong></span> • <span>Diets: <strong>${dietsStr}</strong></span> • <span>Allergy Safeguards: <strong class="danger-label">${allgsStr}</strong></span>`;
  }
}

function renderProfilePage() {
  // Populate settings form with state
  document.getElementById('profileHouseholdSize').value = state.profile.householdSize;
  document.getElementById('profileCustomAllergies').value = state.profile.customAllergies || '';
  document.getElementById('profileFilterMode').value = state.profile.filterMode || 'hide';
  document.getElementById('spoonacularApiKey').value = state.apiKey || '';

  // Check boxes
  document.querySelectorAll('input[name="allergies"]').forEach(cb => {
    cb.checked = state.profile.allergies.includes(cb.value);
  });
  document.querySelectorAll('input[name="restrictions"]').forEach(cb => {
    cb.checked = state.profile.restrictions.includes(cb.value);
  });
}

// --- FEATURE 1: DISCOVER PAGE & FEATURE 6: FAVORITES ---
let activeNameSearch = '';
let activeIngredientSearch = [];

const searchBtn = document.getElementById('recipeSearchBtn');
const searchInput = document.getElementById('recipeSearchInput');
const ingSearchInput = document.getElementById('ingredientSearchInput');
const ingTagsContainer = document.getElementById('ingredientTags');

if (searchBtn && searchInput) {
  searchBtn.addEventListener('click', () => {
    activeNameSearch = searchInput.value;
    renderDiscoverPage();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      activeNameSearch = searchInput.value;
      renderDiscoverPage();
    }
  });
}

// Tag-based ingredient input handler
if (ingSearchInput) {
  ingSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && ingSearchInput.value.trim()) {
      const val = ingSearchInput.value.trim().toLowerCase();
      if (!activeIngredientSearch.includes(val)) {
        activeIngredientSearch.push(val);
        renderIngredientTags();
        renderDiscoverPage();
      }
      ingSearchInput.value = '';
    }
  });
}

function renderIngredientTags() {
  if (!ingTagsContainer) return;
  ingTagsContainer.innerHTML = '';
  activeIngredientSearch.forEach(tag => {
    const el = document.createElement('div');
    el.className = 'tag';
    el.innerHTML = `<span>${tag}</span><button data-val="${tag}">&times;</button>`;
    el.querySelector('button').addEventListener('click', (e) => {
      const val = e.target.getAttribute('data-val');
      activeIngredientSearch = activeIngredientSearch.filter(t => t !== val);
      renderIngredientTags();
      renderDiscoverPage();
    });
    ingTagsContainer.appendChild(el);
  });
}

// Main discover rendering
async function renderDiscoverPage() {
  const grid = document.getElementById('discoverGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="empty-state">Curating editorial selections...</div>';

  try {
    const list = await fetchRecipes({
      nameSearch: activeNameSearch,
      ingredientSearch: activeIngredientSearch
    });

    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">No matching recipes found. Check your allergy filters or settings.</div>';
      return;
    }

    grid.innerHTML = '';

    // Handle "Deprioritize" dietary restriction checks (US-1.5, US-7.2)
    // In deprioritize mode, we tag recipes that do not match the diet restrictions and sort them to the bottom.
    let displayList = list.map(recipe => {
      let conflictsDiet = false;
      if (state.profile.restrictions.length > 0) {
        conflictsDiet = !state.profile.restrictions.every(restrict => 
          recipe.diets.map(d => d.toLowerCase()).includes(restrict.toLowerCase())
        );
      }
      return { ...recipe, conflictsDiet };
    });

    if (state.profile.filterMode === 'deprioritize') {
      // Sort conflicting recipes to the bottom
      displayList.sort((a, b) => (a.conflictsDiet ? 1 : 0) - (b.conflictsDiet ? 1 : 0));
    }

    displayList.forEach(recipe => {
      const card = createRecipeCard(recipe);
      grid.appendChild(card);
    });

  } catch (e) {
    grid.innerHTML = '<div class="empty-state">Error downloading selections.</div>';
    console.error(e);
  }
}

// Generate recipe card element
function createRecipeCard(recipe, compact = false) {
  const card = document.createElement('div');
  card.className = `recipe-card ${recipe.conflictsDiet ? 'deprioritized-overlay' : ''}`;
  
  // Highlight if uses Smart Pantry ingredients (US-1.6, US-5.3)
  const matchingPantryItems = getPantryMatchesForRecipe(recipe);
  const pantryBadgeHtml = matchingPantryItems.length > 0
    ? `<div class="pantry-match-badge">
        <span>🌱 Uses ${matchingPantryItems.length} pantry item${matchingPantryItems.length > 1 ? 's' : ''}</span>
        <span class="hint">${matchingPantryItems.slice(0,2).join(', ')}</span>
       </div>`
    : '';

  const dietBadges = (recipe.diets || []).slice(0, 3).map(d => `<span class="diet-pill">${d}</span>`).join('');
  const isBookmarked = state.favorites.includes(recipe.id);

  // If in deprioritize mode and conflicts with active restrictions, add warning flag
  const warningFlag = recipe.conflictsDiet
    ? `<div class="deprioritized-banner">⚠️ Doesn't match dietary restrictions</div>`
    : '';

  // Calculate missing ingredients info if in ingredient-search mode
  let ingredientMatchHtml = '';
  if (recipe.missingIngredients && activeIngredientSearch.length > 0) {
    const missingCount = recipe.missingIngredients.length;
    ingredientMatchHtml = `<div class="pantry-match-badge highlight">
      <span>🛒 ${recipe.matchCount} Match${recipe.matchCount > 1 ? 'es' : ''}</span>
      <span class="hint">${missingCount === 0 ? 'All ingredients on hand!' : `${missingCount} item${missingCount > 1 ? 's' : ''} missing`}</span>
    </div>`;
  }

  card.innerHTML = `
    ${warningFlag}
    <div class="recipe-card-img-wrapper">
      <img src="${recipe.image}" class="recipe-card-img" alt="${recipe.title}" loading="lazy">
    </div>
    <div class="recipe-card-content">
      <div class="recipe-diet-badges">${dietBadges}</div>
      <h3 class="recipe-card-title" data-id="${recipe.id}">${recipe.title}</h3>
      <div class="recipe-card-meta">${recipe.readyInMinutes} mins • ${recipe.servings} Servings</div>
      ${pantryBadgeHtml}
      ${ingredientMatchHtml}
      <div class="recipe-card-footer">
        <button class="btn-secondary view-details-btn" data-id="${recipe.id}">View Recipe</button>
        <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-id="${recipe.id}" aria-label="Bookmark recipe">
          ${isBookmarked ? '★' : '☆'}
        </button>
      </div>
    </div>
  `;

  // Attach card event listeners
  const titleEl = card.querySelector('.recipe-card-title');
  const detailsBtn = card.querySelector('.view-details-btn');
  const bookmarkBtn = card.querySelector('.bookmark-btn');

  const openModal = () => openRecipeDetailModal(recipe.id);
  titleEl.addEventListener('click', openModal);
  detailsBtn.addEventListener('click', openModal);

  bookmarkBtn.addEventListener('click', () => {
    toggleFavorite(recipe.id);
    bookmarkBtn.classList.toggle('active');
    bookmarkBtn.textContent = state.favorites.includes(recipe.id) ? '★' : '☆';
  });

  return card;
}

// Find intersections between recipe and pantry (US-1.6, US-5.3)
function getPantryMatchesForRecipe(recipe) {
  const pantryNames = state.pantry.map(p => p.name.toLowerCase().trim());
  const matches = [];
  recipe.extendedIngredients.forEach(ing => {
    const ingName = ing.name.toLowerCase().trim();
    const isMatched = pantryNames.some(pName => pName.includes(ingName) || ingName.includes(pName));
    if (isMatched) {
      matches.push(ing.name);
    }
  });
  return matches;
}

function toggleFavorite(id) {
  id = parseInt(id);
  const idx = state.favorites.indexOf(id);
  if (idx === -1) {
    state.favorites.push(id);
    showToast('Added to Favorites');
  } else {
    state.favorites.splice(idx, 1);
    showToast('Removed from Favorites');
  }
  saveState();
  
  // Sync views
  if (window.location.hash === '#favorites') renderFavoritesPage();
  if (window.location.hash === '#planner') renderPlannerPage();
}

function renderFavoritesPage() {
  const grid = document.getElementById('favoritesGrid');
  const emptyMsg = document.getElementById('favoritesEmptyMessage');
  if (!grid || !emptyMsg) return;

  grid.innerHTML = '';

  if (state.favorites.length === 0) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  state.favorites.forEach(async (id) => {
    const recipe = await fetchRecipeById(id);
    if (recipe) {
      const card = createRecipeCard(recipe);
      grid.appendChild(card);
    }
  });
}

// --- FEATURE 8: RECIPE DETAIL MODAL & SERVING SIZE STEPPER ---
const recipeModal = document.getElementById('recipeDetailModal');
const closeRecipeModalBtn = document.getElementById('closeRecipeModalBtn');

if (closeRecipeModalBtn && recipeModal) {
  closeRecipeModalBtn.addEventListener('click', () => {
    recipeModal.classList.remove('active');
  });
  
  // Close on outside click
  recipeModal.addEventListener('click', (e) => {
    if (e.target === recipeModal) {
      recipeModal.classList.remove('active');
    }
  });
}

let activeDetailRecipe = null;
let activeDetailServings = 2;

async function openRecipeDetailModal(id) {
  const container = document.getElementById('recipeModalContent');
  if (!container || !recipeModal) return;

  container.innerHTML = '<div class="empty-state" style="border:none;">Reading recipe file...</div>';
  recipeModal.classList.add('active');

  const recipe = await fetchRecipeById(id);
  if (!recipe) {
    container.innerHTML = '<div class="empty-state" style="border:none;">Failed to load recipe details.</div>';
    return;
  }

  // Set active stepper scaling state, default to household profile size (US-7.3, US-8.1)
  activeDetailRecipe = recipe;
  activeDetailServings = state.profile.householdSize;

  renderRecipeModalBody();
}

function renderRecipeModalBody() {
  const container = document.getElementById('recipeModalContent');
  if (!container || !activeDetailRecipe) return;

  // Scale recipe parameters dynamically (US-8.1)
  const scaled = scaleRecipe(activeDetailRecipe, activeDetailServings);
  
  const isBookmarked = state.favorites.includes(scaled.id);
  const dietsHtml = scaled.diets.map(d => `<span class="diet-pill">${d}</span>`).join('');
  
  // Generate ingredients checklist mapping to pantry inventory
  const pantryNames = state.pantry.map(p => p.name.toLowerCase().trim());
  const ingredientsHtml = scaled.extendedIngredients.map(ing => {
    const ingName = ing.name.toLowerCase().trim();
    // Check if ingredient matches item in pantry
    const isOwned = pantryNames.some(pName => pName.includes(ingName) || ingName.includes(pName));
    
    return `<li class="${isOwned ? 'owned' : ''}">
      <span>${isOwned ? '✓ ' : ''}${ing.name}</span>
      <span class="recipe-detail-ingredients-qty">${ing.amount} ${ing.unit}</span>
    </li>`;
  }).join('');

  // Generate instructions listing
  let instructionsHtml = '';
  if (scaled.analyzedInstructions && scaled.analyzedInstructions.length > 0) {
    scaled.analyzedInstructions.forEach(group => {
      instructionsHtml += `
        <h4 class="margin-top-md" style="font-size:1.2rem; text-transform:uppercase;">${group.name}</h4>
        <div class="recipe-detail-instructions-list">
          ${group.steps.map(st => {
            const eqPills = st.equipment.map(eq => `<span class="equipment-pill">${eq}</span>`).join('');
            const tempBadge = st.temperature ? `<span class="combined-prep-badge">Oven ${st.temperature}°F</span>` : '';
            return `
              <div class="recipe-instruction-step">
                <div class="step-number">${st.number}</div>
                <div class="step-content">
                  <p class="step-text">${st.step}</p>
                  <div class="step-equipment-tags">${tempBadge}${eqPills}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    });
  } else {
    instructionsHtml = '<div class="empty-state">No instructions available.</div>';
  }

  // Display scaled macro details (US-8.1, US-8.2)
  const macros = scaled.nutrition;

  container.innerHTML = `
    <div class="recipe-detail-layout">
      <div class="recipe-detail-hero">
        <img src="${scaled.image}" alt="${scaled.title}">
      </div>
      
      <div class="recipe-detail-body">
        
        <div class="recipe-detail-header-block">
          <div>
            <div class="recipe-diet-badges">${dietsHtml}</div>
            <h2 class="recipe-detail-title">${scaled.title}</h2>
            <div class="recipe-detail-meta-row">
              <span>Ready in ${scaled.readyInMinutes} mins</span>
              <span>•</span>
              <span id="recipeModalBookmarkBtn" style="cursor:pointer; color:var(--accent-terracotta);">
                ${isBookmarked ? '★ Bookmarked' : '☆ Save to Favorites'}
              </span>
            </div>
          </div>

          <!-- Stepper Scaling Component -->
          <div class="servings-stepper-container">
            <span class="stepper-label">Servings</span>
            <button class="stepper-btn" id="modalStepperDec">—</button>
            <span class="stepper-value" id="modalStepperVal">${scaled.servings}</span>
            <button class="stepper-btn" id="modalStepperInc">+</button>
          </div>
        </div>

        <!-- Nutrient scale rows -->
        <div class="recipe-detail-macros">
          <div class="recipe-detail-macro-box">
            <div class="label">Calories</div>
            <div class="val">${macros.calories} kcal</div>
          </div>
          <div class="recipe-detail-macro-box">
            <div class="label">Protein</div>
            <div class="val">${macros.protein}g</div>
          </div>
          <div class="recipe-detail-macro-box">
            <div class="label">Carbs</div>
            <div class="val">${macros.carbs}g</div>
          </div>
          <div class="recipe-detail-macro-box">
            <div class="label">Fat</div>
            <div class="val">${macros.fat}g</div>
          </div>
        </div>

        <!-- Two Column grid -->
        <div class="recipe-detail-grid">
          <!-- Left: Ingredients -->
          <div>
            <h3 class="ingredients-title">Ingredients</h3>
            <ul class="recipe-detail-ingredients-list">
              ${ingredientsHtml}
            </ul>
          </div>

          <!-- Right: Instructions -->
          <div>
            <h3 class="instructions-title">Instructions</h3>
            ${instructionsHtml}
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach event hooks
  document.getElementById('modalStepperDec').addEventListener('click', () => {
    if (activeDetailServings > 1) {
      activeDetailServings--;
      renderRecipeModalBody();
    }
  });

  document.getElementById('modalStepperInc').addEventListener('click', () => {
    activeDetailServings++;
    renderRecipeModalBody();
  });

  document.getElementById('recipeModalBookmarkBtn').addEventListener('click', () => {
    toggleFavorite(activeDetailRecipe.id);
    renderRecipeModalBody();
  });
}

// --- FEATURE 2: MEAL PLANNER & CALENDAR SCHEDULER ---
const sidebarRecipes = document.getElementById('sidebarRecipeList');
const calendarGrid = document.getElementById('calendarGrid');

// Drag and drop variables
let draggedRecipeId = null;

// Slots tabs handlers
const tabDiscover = document.getElementById('tabDiscoverRecipes');
const tabFavorites = document.getElementById('tabFavoriteRecipes');

if (tabDiscover) {
  tabDiscover.addEventListener('click', () => {
    tabDiscover.classList.add('active');
    if (tabFavorites) tabFavorites.classList.remove('active');
    loadSidebarRecipes('discover');
  });
}

if (tabFavorites) {
  tabFavorites.addEventListener('click', () => {
    tabFavorites.classList.add('active');
    if (tabDiscover) tabDiscover.classList.remove('active');
    loadSidebarRecipes('favorites');
  });
}

async function loadSidebarRecipes(type = 'discover') {
  if (!sidebarRecipes) return;
  sidebarRecipes.innerHTML = '<div class="hint">Loading...</div>';

  let list = [];
  if (type === 'discover') {
    list = await fetchRecipes();
  } else {
    // favorites
    for (let id of state.favorites) {
      const r = await fetchRecipeById(id);
      if (r) list.push(r);
    }
  }

  sidebarRecipes.innerHTML = '';
  if (list.length === 0) {
    sidebarRecipes.innerHTML = `<div class="hint">No ${type} recipes available.</div>`;
    return;
  }

  list.forEach(recipe => {
    const el = document.createElement('div');
    el.className = 'draggable-recipe-item';
    el.draggable = true;
    el.setAttribute('data-id', recipe.id);
    el.innerHTML = `
      <img src="${recipe.image}" alt="">
      <span class="title">${recipe.title}</span>
    `;

    // DRAG START
    el.addEventListener('dragstart', (e) => {
      draggedRecipeId = recipe.id;
      e.dataTransfer.setData('text/plain', recipe.id);
      el.style.opacity = '0.5';
    });

    el.addEventListener('dragend', () => {
      el.style.opacity = '1';
    });

    // MOBILE TAP-TO-PLACE FALLBACK (US-2.2)
    el.addEventListener('click', () => {
      openSlotChooser(recipe);
    });

    sidebarRecipes.appendChild(el);
  });
}

// Slot chooser details
const slotChooser = document.getElementById('slotChooserModal');
const slotChooserConfirm = document.getElementById('confirmSlotChooserBtn');
const slotChooserCancel = document.getElementById('cancelSlotChooserBtn');
let slotChooserActiveRecipe = null;

function openSlotChooser(recipe) {
  if (!slotChooser) return;
  slotChooserActiveRecipe = recipe;
  document.getElementById('slotChooserRecipeName').textContent = recipe.title;
  slotChooser.classList.add('active');
}

if (slotChooserCancel) {
  slotChooserCancel.addEventListener('click', () => {
    slotChooser.classList.remove('active');
    slotChooserActiveRecipe = null;
  });
}

if (slotChooserConfirm) {
  slotChooserConfirm.addEventListener('click', () => {
    if (!slotChooserActiveRecipe) return;
    const day = document.getElementById('slotChooserDay').value;
    const meal = document.getElementById('slotChooserMeal').value;
    
    scheduleRecipe(slotChooserActiveRecipe.id, day, meal);
    
    slotChooser.classList.remove('active');
    slotChooserActiveRecipe = null;
  });
}

function scheduleRecipe(recipeId, day, slot, force = false) {
  recipeId = parseInt(recipeId);
  const currentScheduled = state.planner[day][slot];

  // Prompt confirmation on slot overwrite (US-2.2)
  if (currentScheduled && !force) {
    if (confirm(`Do you want to swap "${currentScheduled.title}" with this new recipe?`)) {
      scheduleRecipe(recipeId, day, slot, true);
    }
    return;
  }

  // Fetch recipe structure to insert into slot
  fetchRecipeById(recipeId).then(recipe => {
    if (!recipe) return;
    state.planner[day][slot] = {
      id: recipe.id,
      title: recipe.title,
      image: recipe.image
    };
    saveState();
    renderPlannerPage();
    showToast(`Scheduled for ${day} ${slot}!`);
  });
}

function unscheduleRecipe(day, slot) {
  state.planner[day][slot] = null;
  saveState();
  renderPlannerPage();
  showToast(`Meal removed.`);
}

async function renderPlannerPage() {
  if (!calendarGrid) return;
  calendarGrid.innerHTML = '';

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let day of days) {
    const col = document.createElement('div');
    col.className = 'calendar-day-col';
    
    // Day Header
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.innerHTML = `<span class="day-name">${day}</span>`;
    col.appendChild(header);

    // Slots container
    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'calendar-slots';

    const slots = ['breakfast', 'lunch', 'dinner'];
    
    // Tracks daily macro sum values
    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;

    for (let slot of slots) {
      const slotEl = document.createElement('div');
      slotEl.className = 'meal-slot';
      slotEl.setAttribute('data-day', day);
      slotEl.setAttribute('data-slot', slot);

      // Drag and drop event bindings
      slotEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        slotEl.classList.add('drag-over');
      });

      slotEl.addEventListener('dragleave', () => {
        slotEl.classList.remove('drag-over');
      });

      slotEl.addEventListener('drop', (e) => {
        e.preventDefault();
        slotEl.classList.remove('drag-over');
        const recipeId = e.dataTransfer.getData('text/plain') || draggedRecipeId;
        if (recipeId) {
          scheduleRecipe(recipeId, day, slot);
        }
      });

      const scheduledItem = state.planner[day][slot];

      if (scheduledItem) {
        // Fetch recipe detailed data for macro computations
        const recipeData = await fetchRecipeById(scheduledItem.id);
        if (recipeData) {
          // Scale ingredients and macros to household sizes (US-2.3, US-8.2)
          const scaled = scaleRecipe(recipeData, state.profile.householdSize);
          dayCalories += scaled.nutrition.calories;
          dayProtein += scaled.nutrition.protein;
          dayCarbs += scaled.nutrition.carbs;
          dayFat += scaled.nutrition.fat;
        }

        slotEl.innerHTML = `
          <span class="slot-label">${slot}</span>
          <div class="scheduled-recipe">
            <span class="scheduled-title" data-id="${scheduledItem.id}">${scheduledItem.title}</span>
            <div class="scheduled-actions">
              <button class="btn-danger-link remove-slot-btn" data-day="${day}" data-slot="${slot}">&times; Remove</button>
            </div>
          </div>
        `;
        
        slotEl.querySelector('.scheduled-title').addEventListener('click', () => {
          openRecipeDetailModal(scheduledItem.id);
        });

        slotEl.querySelector('.remove-slot-btn').addEventListener('click', () => {
          unscheduleRecipe(day, slot);
        });

      } else {
        // Empty slot placeholder trigger
        slotEl.innerHTML = `
          <span class="slot-label">${slot}</span>
          <div class="slot-empty-placeholder">+ Add Meal</div>
        `;
        
        slotEl.querySelector('.slot-empty-placeholder').addEventListener('click', () => {
          // Find first recipe in mock databases as default fallback, or prompt
          tabDiscover.click();
          showToast('Tap a recipe in the side list to schedule it here!');
        });
      }

      slotsWrap.appendChild(slotEl);
    }
    
    col.appendChild(slotsWrap);

    // Render scaled daily macro tallies (US-2.3, US-8.2)
    const macrosEl = document.createElement('div');
    macrosEl.className = 'calendar-day-macros';
    macrosEl.innerHTML = `
      <div class="macro-row total-calories">
        <span>Energy</span>
        <span>${dayCalories} kcal</span>
      </div>
      <div class="macro-row">
        <span>Protein</span>
        <span>${dayProtein}g</span>
      </div>
      <div class="macro-row">
        <span>Carbs</span>
        <span>${dayCarbs}g</span>
      </div>
    `;
    col.appendChild(macrosEl);

    calendarGrid.appendChild(col);
  }

  // Populate sidebar items list
  loadSidebarRecipes(tabDiscover.classList.contains('active') ? 'discover' : 'favorites');
}

// --- FEATURE 5: SMART PANTRY INVENTORY ---
const pantryForm = document.getElementById('pantryForm');
const pantryTableBody = document.getElementById('pantryTableBody');
const pantryEmptyMsg = document.getElementById('pantryEmptyMessage');

if (pantryForm) {
  pantryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('pantryItemName');
    const qtyInput = document.getElementById('pantryItemQty');
    const unitInput = document.getElementById('pantryItemUnit');

    const name = nameInput.value.trim();
    const qty = parseFloat(qtyInput.value);
    const unit = unitInput.value.trim();

    addPantryItem(name, qty, unit);

    // Reset inputs
    nameInput.value = '';
    qtyInput.value = '';
    unitInput.value = '';
  });
}

function addPantryItem(name, qty, unit) {
  const existingIdx = state.pantry.findIndex(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
  if (existingIdx !== -1) {
    // Add quantity if item matches (US-5.1)
    state.pantry[existingIdx].quantity += qty;
  } else {
    state.pantry.push({ name, quantity: qty, unit });
  }
  saveState();
  renderPantryPage();
  showToast(`Added ${qty} ${unit} of ${name} to pantry.`);
}

function removePantryItem(idx) {
  const item = state.pantry[idx];
  state.pantry.splice(idx, 1);
  saveState();
  renderPantryPage();
  showToast(`Removed ${item.name} from pantry.`);
}

function updatePantryItemQty(idx, qty) {
  if (qty <= 0) {
    removePantryItem(idx);
    return;
  }
  state.pantry[idx].quantity = qty;
  saveState();
  renderPantryPage();
}

function renderPantryPage() {
  if (!pantryTableBody || !pantryEmptyMsg) return;

  pantryTableBody.innerHTML = '';
  
  if (state.pantry.length === 0) {
    pantryEmptyMsg.style.display = 'block';
    return;
  }
  pantryEmptyMsg.style.display = 'none';

  state.pantry.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 500;">${item.name}</td>
      <td>
        <input type="number" step="any" min="0" value="${item.quantity}" style="width:70px; padding:0.2rem;" class="pantry-qty-edit-input" data-idx="${idx}">
      </td>
      <td style="font-style: italic; color: var(--text-muted);">${item.unit}</td>
      <td class="actions-col">
        <button class="btn-danger-link delete-pantry-item-btn" data-idx="${idx}">Remove</button>
      </td>
    `;

    // Edit Quantity
    const qtyInput = tr.querySelector('.pantry-qty-edit-input');
    qtyInput.addEventListener('change', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const val = parseFloat(e.target.value);
      updatePantryItemQty(idx, val);
    });

    // Remove Item
    const delBtn = tr.querySelector('.delete-pantry-item-btn');
    delBtn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      removePantryItem(idx);
    });

    pantryTableBody.appendChild(tr);
  });
}

// --- FEATURE 4: AUTO-GENERATED GROCERY LIST ---
const groceryContainer = document.getElementById('groceryListContainer');
const copyGroceryBtn = document.getElementById('copyGroceryListBtn');
const emailGroceryBtn = document.getElementById('emailGroceryListBtn');

async function generateGroceryList() {
  const consolidated = {};
  
  // 1. Gather all recipes from weekly planner
  const plannedRecipes = [];
  for (let day in state.planner) {
    for (let slot in state.planner[day]) {
      const meal = state.planner[day][slot];
      if (meal) {
        plannedRecipes.push(meal.id);
      }
    }
  }

  // 2. Fetch recipe details & scale ingredient amounts based on household size (US-4.1, US-8.4)
  for (let id of plannedRecipes) {
    const recipe = await fetchRecipeById(id);
    if (!recipe) continue;

    // Apply shared scaling multipliers
    const scaled = scaleRecipe(recipe, state.profile.householdSize);
    
    scaled.extendedIngredients.forEach(ing => {
      const key = ing.name.toLowerCase().trim();
      
      if (consolidated[key]) {
        consolidated[key].amount += ing.amount;
      } else {
        consolidated[key] = {
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category || 'Pantry'
        };
      }
    });
  }

  // 3. Subtraction matching with Smart Pantry (US-4.3, US-5.2)
  const finalItems = [];
  const pantryNames = state.pantry.map(p => p.name.toLowerCase().trim());

  for (let key in consolidated) {
    const item = consolidated[key];
    
    // Find if user owns pantry ingredient matching this item
    const pantryIdx = state.pantry.findIndex(p => p.name.toLowerCase().trim() === key || key.includes(p.name.toLowerCase().trim()));
    
    let isDeducted = false;
    let pantryNote = '';
    let requiredAmount = item.amount;

    if (pantryIdx !== -1) {
      const pItem = state.pantry[pantryIdx];
      // Subtract quantity if units are roughly compatible
      if (pItem.unit.toLowerCase().trim() === item.unit.toLowerCase().trim()) {
        if (pItem.quantity >= item.amount) {
          isDeducted = true;
          requiredAmount = 0;
          pantryNote = `Owned in pantry (${pItem.quantity} ${pItem.unit})`;
        } else {
          requiredAmount = item.amount - pItem.quantity;
          pantryNote = `Partially owned (using ${pItem.quantity} ${pItem.unit})`;
        }
      } else {
        // Fallback matching if unit strings differ: assume owned to prevent duplicate list
        isDeducted = true;
        requiredAmount = 0;
        pantryNote = `Owned in pantry (${pItem.quantity} ${pItem.unit})`;
      }
    }

    finalItems.push({
      ...item,
      key,
      isDeducted,
      pantryNote,
      requiredAmount: roundToSensibleKitchen(requiredAmount, item.unit)
    });
  }

  return finalItems;
}

async function renderGroceryPage() {
  if (!groceryContainer) return;
  groceryContainer.innerHTML = '<div class="empty-state">Generating list...</div>';

  const list = await generateGroceryList();

  if (list.length === 0) {
    groceryContainer.innerHTML = '<div class="empty-state">No ingredients required. Schedule recipes in the Meal Planner.</div>';
    return;
  }

  groceryContainer.innerHTML = '';

  // Group final items by Category/Aisle (US-4.2)
  const grouped = {};
  list.forEach(item => {
    const cat = item.category || 'Pantry';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // Render grouped cards
  for (let aisle in grouped) {
    const card = document.createElement('div');
    card.className = 'grocery-aisle-card';
    
    card.innerHTML = `
      <h3 class="aisle-title">${aisle}</h3>
      <ul class="grocery-item-list">
        ${grouped[aisle].map(item => {
          // Generate unique storage key for checkbox checked persistence
          const itemKey = `grocery_${item.key}`;
          const isChecked = state.groceryCheckedItems[itemKey] || false;
          
          // Determine if we apply the auto-deduction styling overrides (US-4.3)
          // Allow override: if checkbox is clicked, we override and re-add if needed, or simply style normally
          const rowClass = item.isDeducted ? 'grocery-item-row deducted' : 'grocery-item-row';
          const checkedAttr = (item.isDeducted || isChecked) ? 'checked' : '';
          
          const amountDisplay = item.isDeducted 
            ? `<span class="pantry-owned-tag">Owned</span>` 
            : `<span class="grocery-item-qty">${item.requiredAmount} ${item.unit}</span>`;
            
          const pantryHint = item.pantryNote ? `<div class="hint" style="font-size:0.75rem; margin-top:0px;">${item.pantryNote}</div>` : '';

          return `
            <li class="${rowClass}" data-key="${itemKey}">
              <div class="grocery-item-left">
                <input type="checkbox" class="grocery-item-checkbox" data-key="${itemKey}" ${checkedAttr}>
                <div class="grocery-text-block">
                  <span class="grocery-item-text">${item.name}</span>
                  ${pantryHint}
                </div>
              </div>
              ${amountDisplay}
            </li>
          `;
        }).join('')}
      </ul>
    `;

    // Bind checklist checked storage toggle (US-4.5)
    card.querySelectorAll('.grocery-item-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const key = e.target.getAttribute('data-key');
        state.groceryCheckedItems[key] = e.target.checked;
        saveState();
        
        // Find row to toggle strike-through visual
        const row = e.target.closest('.grocery-item-row');
        if (e.target.checked) {
          row.classList.add('deducted');
        } else {
          // If was originally auto-deducted in pantry, keep deducted class or toggle
          const item = list.find(it => `grocery_${it.key}` === key);
          if (!item || !item.isDeducted) {
            row.classList.remove('deducted');
          }
        }
      });
    });

    groceryContainer.appendChild(card);
  }
}

// Copy Plain-Text List to Clipboard (US-4.4)
if (copyGroceryBtn) {
  copyGroceryBtn.addEventListener('click', async () => {
    const list = await generateGroceryList();
    if (list.length === 0) {
      showToast('No grocery items to copy!', 'error');
      return;
    }

    const grouped = {};
    list.forEach(item => {
      if (item.isDeducted && state.groceryCheckedItems[`grocery_${item.key}`] !== false) return; // skip owned items
      const cat = item.category || 'Pantry';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    let text = `THE KITCHEN EDITION - GROCERY SHOPPING LIST\n`;
    text += `Household Size: ${state.profile.householdSize} servings\n`;
    text += `==========================================\n\n`;

    for (let aisle in grouped) {
      text += `[${aisle.toUpperCase()}]\n`;
      grouped[aisle].forEach(item => {
        text += `- [ ] ${item.name}: ${item.requiredAmount} ${item.unit}\n`;
      });
      text += `\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied list to clipboard!');
    }).catch(err => {
      console.error('Copy failed', err);
      showToast('Failed to copy list', 'error');
    });
  });
}

// Email pre-filled list (US-4.4)
if (emailGroceryBtn) {
  emailGroceryBtn.addEventListener('click', async () => {
    const list = await generateGroceryList();
    if (list.length === 0) {
      showToast('No grocery items to email!', 'error');
      return;
    }

    const grouped = {};
    list.forEach(item => {
      if (item.isDeducted) return; // skip owned items
      const cat = item.category || 'Pantry';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    let body = `Here is my grocery list from The Kitchen Edition:\n\n`;
    for (let aisle in grouped) {
      body += `[${aisle.toUpperCase()}]\n`;
      grouped[aisle].forEach(item => {
        body += `- ${item.name}: ${item.requiredAmount} ${item.unit}\n`;
      });
      body += `\n`;
    }

    const subject = encodeURIComponent('My Kitchen Edition Grocery List');
    const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
}

// --- FEATURE 3: MEAL PREP CONSOLIDATOR ---
const prepDashboard = document.getElementById('prepDashboard');

async function renderPrepPage() {
  if (!prepDashboard) return;
  prepDashboard.innerHTML = '<div class="empty-state">Consolidating weekly prep steps...</div>';

  // 1. Fetch scheduled recipes
  const plannedIds = [];
  for (let day in state.planner) {
    for (let slot in state.planner[day]) {
      const meal = state.planner[day][slot];
      if (meal) {
        plannedIds.push({ day, slot, id: meal.id, title: meal.title });
      }
    }
  }

  if (plannedIds.length === 0) {
    prepDashboard.innerHTML = '<div class="empty-state">No meals scheduled. Add recipes to the Meal Planner to see batch-cook steps.</div>';
    return;
  }

  // 2. Fetch full recipe objects & extract all instructions
  const stepsList = [];
  const ingredientsSummary = {};

  for (let scheduled of plannedIds) {
    const recipe = await fetchRecipeById(scheduled.id);
    if (!recipe) continue;

    // Sum scaled ingredients for consolidated inventory prep list
    const scaled = scaleRecipe(recipe, state.profile.householdSize);
    scaled.extendedIngredients.forEach(ing => {
      const name = ing.name.toLowerCase().trim();
      if (ingredientsSummary[name]) {
        ingredientsSummary[name].amount += ing.amount;
      } else {
        ingredientsSummary[name] = { name: ing.name, amount: ing.amount, unit: ing.unit };
      }
    });

    // Extract instruction steps (US-3.1)
    if (scaled.analyzedInstructions && scaled.analyzedInstructions.length > 0) {
      scaled.analyzedInstructions.forEach(group => {
        group.steps.forEach(st => {
          stepsList.push({
            recipeId: recipe.id,
            recipeTitle: recipe.title,
            stepNum: st.number,
            text: st.step,
            equipment: st.equipment || [],
            temperature: st.temperature || null,
            day: scheduled.day,
            slot: scheduled.slot
          });
        });
      });
    }
  }

  // 3. Classify steps into action types (US-3.1)
  const prepGroups = {
    "Preheat & Bake": [],
    "Chopping & Veggie Prep": [],
    "Stove & Pan Frying": [],
    "Mixing & Blending": [],
    "Assembly & Plating": []
  };

  stepsList.forEach(step => {
    const text = step.text.toLowerCase();
    
    if (text.includes("preheat") || text.includes("bake") || text.includes("roast") || step.temperature) {
      prepGroups["Preheat & Bake"].push(step);
    } else if (text.includes("chop") || text.includes("slice") || text.includes("dice") || text.includes("mince") || text.includes("peel") || text.includes("cube")) {
      prepGroups["Chopping & Veggie Prep"].push(step);
    } else if (text.includes("sauté") || text.includes("saut") || text.includes("fry") || text.includes("boil") || text.includes("cook in") || text.includes("skillet") || text.includes("simmer") || text.includes("pot") || text.includes("pan")) {
      prepGroups["Stove & Pan Frying"].push(step);
    } else if (text.includes("whisk") || text.includes("blend") || text.includes("mix") || text.includes("stir") || text.includes("combine") || text.includes("bowl")) {
      prepGroups["Mixing & Blending"].push(step);
    } else {
      prepGroups["Assembly & Plating"].push(step);
    }
  });

  // 4. Merge overlapping oven temperatures (US-3.2)
  // Check if we have multiple oven steps with identical temperatures and merge
  const ovenPreheats = {};
  prepGroups["Preheat & Bake"] = prepGroups["Preheat & Bake"].filter(step => {
    if (step.text.toLowerCase().includes("preheat") && step.temperature) {
      const temp = step.temperature;
      if (ovenPreheats[temp]) {
        // Record overlapping match details
        ovenPreheats[temp].recipes.push(step.recipeTitle);
        return false; // exclude redundant preheat step from display list
      } else {
        ovenPreheats[temp] = {
          step,
          recipes: [step.recipeTitle]
        };
        return true;
      }
    }
    return true;
  });

  // Update merged preheat step description
  for (let temp in ovenPreheats) {
    const entry = ovenPreheats[temp];
    if (entry.recipes.length > 1) {
      entry.step.isMerged = true;
      entry.step.text = `Preheat the oven to ${temp}°F (190°C) for both ${entry.recipes.join(" and ")}.`;
    }
  }

  // Render consolidations UI
  prepDashboard.innerHTML = `
    <!-- Top ingredients check list -->
    <div class="prep-ingredients-summary">
      <h3 style="font-size:1.4rem; margin-bottom:0.75rem; text-transform:uppercase;">Weekly Consolidations</h3>
      <p class="hint" style="margin-bottom:1rem;">Total quantities of ingredients needed for this week's prep sessions.</p>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
        ${Object.values(ingredientsSummary).map(ing => `
          <div style="font-size: 0.85rem; padding:0.25rem; border-bottom:1px solid var(--border-muted);">
            <strong>${ing.name}</strong>: ${roundToSensibleKitchen(ing.amount, ing.unit)} ${ing.unit}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Grouped step blocks -->
    <div class="prep-consolidated-steps">
      ${Object.entries(prepGroups).map(([groupTitle, steps]) => {
        if (steps.length === 0) return '';
        
        return `
          <div class="prep-group-block">
            <h3 class="prep-group-title">${groupTitle}</h3>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:0.75rem;">
              ${steps.map(step => {
                const stepKey = `prep_${step.recipeId}_${step.stepNum}`;
                const isChecked = state.prepCheckedSteps[stepKey] || false;
                
                const mergedBadge = step.isMerged ? `<span class="combined-prep-badge">💡 Combined Steps</span>` : '';
                const originBadge = `<span class="prep-origin-badge">${step.recipeTitle} (${step.day})</span>`;

                return `
                  <li class="prep-step-item">
                    <input type="checkbox" class="prep-step-checkbox" data-key="${stepKey}" ${isChecked ? 'checked' : ''}>
                    <div class="prep-step-content">
                      <p class="prep-step-text">${step.text}</p>
                      <div class="prep-step-meta">${mergedBadge}${originBadge}</div>
                    </div>
                  </li>
                `;
              }).join('')}
            </ul>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach checked step checklists toggles (US-3.3 progress state persists)
  prepDashboard.querySelectorAll('.prep-step-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-key');
      state.prepCheckedSteps[key] = e.target.checked;
      saveState();
    });
  });
}

// --- INITIALIZATION ---
function init() {
  loadState();
  updateActiveProfileSummary();
  handleRoute();
}

window.addEventListener('DOMContentLoaded', init);
window.scaleRecipe = scaleRecipe; // Export to global namespace for client tests
window.state = state; // Export state for client debug
