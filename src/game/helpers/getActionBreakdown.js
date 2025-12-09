import { getEffectiveToolStats } from "../modifierEngine";
import { getPercentModifier, getFlatModifier } from "../modifierEngine";

export function getActionBreakdown(skillKey, action) {
  const tool = getEffectiveToolStats(skillKey);

  // Skill-specific modifiers
  const speedPercent = getPercentModifier(`${skillKey}_speed_percent`) || 0;
  const xpPercent = getPercentModifier(`${skillKey}_xp_percent`) || 0;
  const rarePercent = getPercentModifier(`${skillKey}_rareChance_percent`) || 0;
  const flatAmount = getFlatModifier(`${skillKey}_amount_flat`) || 0;

  // GLOBAL modifiers from Prestige (and future systems)
  const globalSpeedPercent = getPercentModifier("speed_global_percent") || 0;
  const globalXpPercent = getPercentModifier("xp_global_percent") || 0;
  const globalAmountPercent = getPercentModifier("amount_global_percent") || 0;
  const globalRarePercent = getPercentModifier("rare_drop_percent") || 0;

  // 1. FINAL TIME
  const totalSpeedMultiplier =
    tool.speedMultiplier *
    (1 + speedPercent / 100) *
    (1 + globalSpeedPercent / 100);

  const finalTime = Math.floor(action.baseTime / totalSpeedMultiplier);

  // 2. FINAL XP
  const totalXpMultiplier =
    tool.xpMultiplier *
    (1 + xpPercent / 100) *
    (1 + globalXpPercent / 100);

  const finalXp = Math.floor(action.xpGain * totalXpMultiplier);

  // 3. FINAL AMOUNT
  let finalAmount = action.amountBase + flatAmount;
  finalAmount = Math.floor(finalAmount * (1 + globalAmountPercent / 100));

  // 4. RARE DROP CHANCES
  const rareDrops = (action.rareDrops || []).map(drop => {
    const totalRareMultiplier =
      (1 + rarePercent / 100) *
      (1 + globalRarePercent / 100);

    return {
      item: drop.item,
      baseChance: drop.chance,
      finalChance: drop.chance * totalRareMultiplier,
    };
  });

  return {
    baseTime: action.baseTime,
    finalTime,

    baseXp: action.xpGain,
    finalXp,

    baseAmount: action.amountBase,
    finalAmount,

    rareDrops
  };
}
