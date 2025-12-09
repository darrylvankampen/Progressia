export function loadAllItems() {
  const modules = import.meta.glob("../items/**/*.json", { eager: true });

  const items = {};

  for (const path in modules) {
    const data = modules[path];

    if (!data.id) {
      console.warn("[Progressia] Item JSON mist 'id' veld:", path);
      continue;
    }

    items[data.id] = data;
  }

  return items;
}
