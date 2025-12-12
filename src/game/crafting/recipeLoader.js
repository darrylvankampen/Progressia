// Laad alle .json bestanden in recipes én subfolders
const modules = import.meta.glob("./recipes/**/*.json", { eager: true });

let _cachedRecipes = null;

export function loadAllRecipes() {
  if (_cachedRecipes) return _cachedRecipes;

  const recipes = [];

  for (const path in modules) {
    const data = modules[path].default;

    if (!data || !data.id) {
      console.warn("Recipe zonder ID:", path);
      continue;
    }

    recipes.push(data);
  }

  _cachedRecipes = recipes;
  return recipes;
}

export function loadRecipesBySkill(skillId) {
  return loadAllRecipes().filter(r => r.skill === skillId);
}

export function loadRecipe(recipeId) {
  return loadAllRecipes().find(r => r.id === recipeId) || null;
}
