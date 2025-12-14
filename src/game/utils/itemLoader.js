export function loadAllItems() {
  const modules = import.meta.glob("../items/**/*.json", { eager: true });

  const items = {};

  for (const path in modules) {
    // Vite JSON -> altijd via .default
    const data = modules[path]?.default;

    // -------------------------------
    // Case 1: array van items
    // -------------------------------
    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item?.id) {
          console.warn(
            "[Progressia] Item in array mist 'id' veld:",
            path,
            item
          );
          continue;
        }

        if (items[item.id]) {
          console.warn(
            `[Progressia] Duplicate item id '${item.id}' in`,
            path
          );
          continue;
        }

        items[item.id] = item;
      }
      continue;
    }

    // -------------------------------
    // Case 2: single item object
    // -------------------------------
    if (data && typeof data === "object") {
      if (!data.id) {
        console.warn(
          "[Progressia] Item JSON mist 'id' veld:",
          path,
          data
        );
        continue;
      }

      items[data.id] = data;
      continue;
    }

    // -------------------------------
    // Fallback
    // -------------------------------
    console.warn(
      "[Progressia] Ongeldige item JSON structuur:",
      path,
      data
    );
  }

  return items;
}
