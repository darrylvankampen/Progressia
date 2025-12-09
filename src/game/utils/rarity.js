import { rarityColors } from "../data/rarityColors";

export function getRarityColor(rarity) {
  return rarityColors[rarity] || "#FFFFFF"; // fallback
}
export function getRarityLabel(r) {
  const labels = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
  };

  return labels[r] || "Unknown";
}