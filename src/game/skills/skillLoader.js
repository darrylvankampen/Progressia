import {fetchSvg} from "../utils/svgLoader";

export async function loadAllSkills() {
  const modules = import.meta.glob("./*.json", { eager: true });
  const skills = {};

  for (const path in modules) {
    const mod = modules[path];

    // Vite JSON modules: mod.default = parsed JSON
    const data = mod.default;

    const svg = await fetchSvg(data.icon);

    if (!data.id) {
      console.warn("Skill JSON mist 'id':", path);
      continue;
    }

    skills[data.id] = {
        ...data,
        iconSvg: svg
    }; // Save pure JSON only
  }

  return skills;
}
