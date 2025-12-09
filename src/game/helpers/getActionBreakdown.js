import { getEffectiveToolStats } from "../modifierEngine";
import { getPercentModifier, getFlatModifier } from "../modifierEngine";

export function getActionBreakdown(skillKey, action) {
  const tool = getEffectiveToolStats(skillKey);

  const speedPercent = getPercentModifier(`${skillKey}_speed_percent`) || 0;
  const xpPercent = getPercentModifier(`${skillKey}_xp_percent`) || 0;
  const flatAmount = getFlatModifier(`${skillKey}_amount_flat`) || 0;
  const rarePercent = getPercentModifier(`${skillKey}_rareChance_percent`) || 0;

  const finalTime =
    action.baseTime / (tool.speedMultiplier * (1 + speedPercent / 100));

  const finalXp =
    action.xpGain * (tool.xpMultiplier * (1 + xpPercent / 100));

  const finalAmount = action.amountBase + flatAmount;

  const rareDrops = (action.rareDrops || []).map(drop => ({
    item: drop.item,
    baseChance: drop.chance,
    finalChance: drop.chance * (1 + rarePercent / 100),
  }));

  return {
    baseTime: action.baseTime,
    finalTime: Math.floor(finalTime),

    baseXp: action.xpBase,
    finalXp: Math.floor(finalXp),

    baseAmount: action.amountBase,
    finalAmount,

    rareDrops
  };
}
