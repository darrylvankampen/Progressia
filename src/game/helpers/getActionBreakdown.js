import { getFinalStats } from "../modifierEngine";

export function getActionBreakdown(skillKey, action) {
  const stats = getFinalStats(skillKey);

  // 1. FINAL TIME
  const finalTime = Math.max(
    200, // same floor as skillEngine
    Math.floor(action.baseTime / stats.speed)
  );

  // 2. FINAL XP
  const finalXp = Math.floor(action.xpGain * stats.xp);

  // 3. FINAL AMOUNT
  const finalAmount = Math.floor(action.amountBase * stats.amount);

  // 4. RARE DROPS (each scaled by rareChance multiplier)
  const rareDrops = (action.rareDrops || []).map(drop => {
    let finalChance = drop.chance;
    if (stats.rareChance > 0) {
      finalChance = drop.chance * stats.rareChance;
    }
    return {
      item: drop.item,
      baseChance: drop.chance,
      finalChance,
    };
  });

  return {
    baseTime: action.baseTime,
    finalTime,

    baseXp: action.xpGain,
    finalXp,

    baseAmount: action.amountBase,
    finalAmount,

    rareDrops,
  };
}
