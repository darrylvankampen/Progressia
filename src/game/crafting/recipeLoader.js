const modules = import.meta.glob("./recipes/*.json", { eager: true });

export function loadAllRecipes() {
  const recipes = [];

  for (const path in modules) {
    const data = modules[path].default;

    if (!data.id) {
      console.warn("Crafting recipe zonder ID:", path);
      continue;
    }

    recipes.push(data);
  }

  return recipes;
}
