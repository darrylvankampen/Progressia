export const SKILL_COLORS = {
  gathering: "#5eead4",    // turquoise / nature
  production: "#fbbf24",   // amber / crafting
  utility: "#a78bfa",      // purple / magic / knowledge
  combat: "#f87171"        // warm red
};

// Koppel skillnamen aan categorie
export const SKILL_CATEGORY = {
  woodcutting: "gathering",
  mining: "gathering",
  fishing: "gathering",

  crafting: "production",
  cooking: "production",
  smithing: "production",

  magic: "utility",
  alchemy: "utility",

  attack: "combat",
  defense: "combat",
  archery: "combat"
};

export function getSkillColor(skillKey) {
  const category = SKILL_CATEGORY[skillKey] || "utility";
  return SKILL_COLORS[category];
}
