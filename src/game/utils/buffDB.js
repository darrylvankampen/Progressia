import buffs from "../data/buffs.json";
import { getGame } from "../state/gameState";
const dynamicBuffDefs = {};

export function registerDynamicBuff(id, def) {
  dynamicBuffDefs[id] = def;
}

export function rebuildDynamicBuffDefs() {
  const game = getGame();
  const buffs = game.activeBuffs || [];

  for (const b of buffs) {
    // sla tijdelijke buffs over
    if (b.expiresAt) continue;

    // reconstruct buffId
    const buffId = b.id;

    // als definities al bestaan, niet opnieuw maken
    if (dynamicBuffDefs[buffId]) continue;

    // reconstruct modifiers via parsed stat/value
    const parts = buffId.replace("perm_", "").split("_");
    const value = Number(parts.pop());
    const stat = parts.join("_");

    registerDynamicBuff(buffId, {
      id: buffId,
      name: "Permanent Bonus",
      icon: "/icons/achievements/achievement.png",
      description: `Permanent +${value}% ${stat}.`,
      duration: null,
      modifiers: {
        [stat]: value
      },
    });
  }
}

export function getBuffDef(id) {
  return buffs.find(b => b.id === id) || dynamicBuffDefs[id] || null;
}

export function getAllBuffDefs() {
  return buffs;
}
