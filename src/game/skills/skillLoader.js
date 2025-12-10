export async function loadAllSkills() {
  const modules = import.meta.glob("./*.json", { eager: true });
  const skills = {};

  for (const path in modules) {
    const mod = modules[path];

    // Vite JSON modules: mod.default = parsed JSON
    const data = mod.default;

    if (!data.id) {
      console.warn("Skill JSON mist 'id':", path);
      continue;
    }

    skills[data.id] = {
      ...data,
    }; // Save pure JSON only
  }

  return skills;
}
