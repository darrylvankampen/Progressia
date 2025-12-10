// src/game/modifierEngine.js

import { reactive } from "vue";
import { getGame } from "./state/gameState";
import { getItem } from "./utils/itemDB";
import { getBuffDef } from "./utils/buffDB";
import { getPrestigeModifiers } from "./prestiges/prestigesEngine";

/**
 * =============================================================================
 *  PROGRESSIA — MODIFIER ENGINE
 * =============================================================================
 *
 * This module is responsible for aggregating all modifiers that influence
 * gameplay behavior. It collects modifiers from:
 *
 *  • Equipped tools
 *  • Temporary buffs
 *  • Permanent buffs
 *  • (Future) pets, quests, faction bonuses, titles, etc.
 *
 * Modifiers are separated into three categories:
 *
 *  - flat:     Direct additive bonuses (e.g., +5 doubleChance)
 *  - percent:  Percentage-based bonuses (e.g., +10% mining_speed)
 *  - special:  Reserved for flags, unlocks, or non-numeric rule changes
 *
 * The modifier engine recalculates the entire modifier table on-demand,
 * ensuring deterministic and predictable behavior whenever the game state
 * changes (equipment swap, buff expiration, achievements, etc.).
 *
 * This acts as a lightweight buff/equipment system similar to those used
 * in idle games, MMOs and RPGs where many sources can modify skill rates.
 */

const modifiers = reactive({
  flat: {},
  percent: {},
  special: {},
});

/**
 * Helper to safely accumulate values inside a modifier table.
 * Ensures missing keys are initialized to zero before arithmetic.
 */
function addValue(obj, key, value) {
  if (!obj[key]) obj[key] = 0;
  obj[key] += value;
}

/**
 * =============================================================================
 *  RECALCULATE MODIFIERS
 * =============================================================================
 *
 * Rebuilds the full modifier table from scratch.
 *
 * Steps:
 *   1. Reset local modifier containers
 *   2. Process equipped tools (primary modifier source)
 *   3. Process active buffs (temporary or permanent)
 *   4. Store newly calculated modifier state
 *
 * Why rebuild instead of incremental updates?
 *   - Guarantees consistency in all cases
 *   - Removes risk of stale or orphaned modifier states
 *   - Supports dynamic buff definitions and tool swaps
 *   - Matches common patterns in professional RPG engines
 *
 * Returns:
 *   The fully rebuilt modifier table for external use.
 */
export function recalculateModifiers() {
  const game = getGame();

  const flat = {};
  const percent = {};
  const special = {};

  const addValue = (obj, key, value) => {
    if (!obj[key]) obj[key] = 0;
    obj[key] += value;
  };

  // ---------------------------------------------------------------------------
  // 1) EQUIPPED TOOLS
  // ---------------------------------------------------------------------------
  //
  // Tools contribute most of the core progression modifiers:
  //   - speed bonuses
  //   - XP multipliers
  //   - doubleChance / resource yield bonuses
  //
  // Their modifiers follow the convention:
  //   - *_percent → percentage modifier
  //   - otherwise → flat modifier
  //
  const equippedTools = game.player?.equippedTools || {};

  for (const skillId in equippedTools) {
    const toolId = equippedTools[skillId];
    const tool = getItem(toolId);

    if (!tool?.modifiers) continue;

    for (const key in tool.modifiers) {
      const value = tool.modifiers[key];

      if (key.endsWith("_percent")) {
        addValue(percent, key, value);
      } else {
        addValue(flat, key, value);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2) BUFFS (TEMPORARY + PERMANENT)
  // ---------------------------------------------------------------------------
  //
  // Buffs can modify any numeric stat. They follow the same naming conventions
  // as tool modifiers. Buffs may expire, and cleanup is performed here.
  //
  const now = Date.now();

  // Ensure buffs array exists (older saves may omit it)
  if (!game.activeBuffs) game.activeBuffs = [];

  // Remove expired buffs
  game.activeBuffs = game.activeBuffs.filter((b) => {
    // Permanent buffs have no expiration timestamp
    if (!b.expiresAt) return true;
    return b.expiresAt > now;
  });

  // Apply active buffs
  for (const active of game.activeBuffs) {
    const def = getBuffDef(active.id);
    if (!def?.modifiers) continue;

    for (const key in def.modifiers) {
      const value = def.modifiers[key];

      if (key.endsWith("_percent")) {
        addValue(percent, key, value);
      } else {
        addValue(flat, key, value);
      }
    }
  }

  // Apply Prestige Modifiers
  const prestiges = getPrestigeModifiers();
  addValue(percent, "xp_global_percent", prestiges.xp_global_percent);
  addValue(percent, "amount_global_percent", prestiges.amount_global_percent);
  addValue(percent, "speed_global_percent", prestiges.speed_global_percent);
  addValue(percent, "rare_drop_percent", prestiges.rare_drop_percent);

  // Write rebuilt modifiers to reactive store
  modifiers.flat = flat;
  modifiers.percent = percent;
  modifiers.special = special;

  return modifiers;
}

/**
 * Returns the full reactive modifier set.
 * Useful for UI or debugging tools.
 */
export function getModifiers() {
  return modifiers;
}

/**
 * Returns a single flat modifier value.
 * Guarantees a numeric fallback (0) for missing fields.
 */
export function getFlatModifier(key) {
  return modifiers.flat[key] || 0;
}

/**
 * Returns a single percent modifier value.
 * Guarantees a numeric fallback (0) for missing fields.
 */
export function getPercentModifier(key) {
  return modifiers.percent[key] || 0;
}

/**
 * =============================================================================
 *  EFFECTIVE TOOL STAT CALCULATION
 * =============================================================================
 *
 * Computes the final effective stats for a skill's equipped tool by applying:
 *   - Base tool stats (speedMultiplier, xpMultiplier, doubleChance)
 *   - Relevant percentage modifiers from the global modifier system
 *   - Relevant flat modifiers for doubleChance
 *
 * This ensures tool performance dynamically reflects:
 *   - Buffs
 *   - Special bonuses
 *   - Skill-specific modifiers
 *
 * Naming conventions:
 *   - `${skillId}_speed_percent`
 *   - `${skillId}_xp_percent`
 *   - `${skillId}_doubleChance`
 *
 * Returns:
 *   {
 *     speedMultiplier: number,
 *     xpMultiplier: number,
 *     doubleChance: number
 *   }
 */
export function getEffectiveToolStats(skillId) {
  const game = getGame();
  const equipped = game.player?.equippedTools || {};
  const toolId = equipped[skillId];

  // Default baseline tool stats
  let base = {
    speedMultiplier: 1.0,
    xpMultiplier: 1.0,
    doubleChance: 0.0,
  };

  // Override with actual tool stats if equipped
  if (toolId) {
    const item = getItem(toolId);
    if (item?.stats) {
      base = { ...base, ...item.stats };
    }
  }

  // Construct dynamic modifier keys
  const speedKey = `${skillId}_speed_percent`;
  const xpKey = `${skillId}_xp_percent`;
  const doubleKey = `${skillId}_doubleChance`;

  // Collect modifiers
  const speedPercent = getPercentModifier(speedKey);
  const xpPercent = getPercentModifier(xpKey);
  const doubleFlat = getFlatModifier(doubleKey);

  // Apply modifiers to base stats
  const speedMultiplier = base.speedMultiplier * (1 + speedPercent / 100);
  const xpMultiplier = base.xpMultiplier * (1 + xpPercent / 100);
  const doubleChance = base.doubleChance + doubleFlat;

  return {
    speedMultiplier,
    xpMultiplier,
    doubleChance,
  };
}

/**
 * =============================================================================
 *  UNIVERSAL FINAL STAT CALCULATOR
 * =============================================================================
 *
 * Combines:
 *   - Base tool stats
 *   - Skill-specific percent modifiers
 *   - Prestige modifiers
 *   - Global percent modifiers
 *   - Flat modifiers (doubleChance, amount, etc.)
 *
 * Returns a unified stat object:
 *   {
 *     speed: multiplier,
 *     xp: multiplier,
 *     doubleChance: number,
 *     amount: multiplier,
 *     rareChance: number,
 *   }
 */
export function getFinalStats(skillId) {
  const game = getGame();

  // ---------------------------------------------------------------
  // 1. Base stats from equipped tool
  // ---------------------------------------------------------------
  const equipped = game.player?.equippedTools || {};
  const toolId = equipped[skillId];
  const tool = toolId ? getItem(toolId) : null;

  let stats = {
    speed: tool?.stats?.speedMultiplier ?? 1.0,
    xp: tool?.stats?.xpMultiplier ?? 1.0,
    doubleChance: tool?.stats?.doubleChance ?? 0.0,
    amount: tool?.stats?.amountMultiplier ?? 1.0,
    rareChance: tool?.stats?.rareChance ?? 0.0,
  };

  // ---------------------------------------------------------------
  // 2. SKILL-SPECIFIC MODIFIERS
  // ---------------------------------------------------------------
  const speedPercent = getPercentModifier(`${skillId}_speed_percent`);
  const xpPercent = getPercentModifier(`${skillId}_xp_percent`);
  const amountPercent = getPercentModifier(`${skillId}_amount_percent`);
  const rarePercent = getPercentModifier(`${skillId}_rare_percent`);
  const doubleFlat = getFlatModifier(`${skillId}_doubleChance`);

  // ---------------------------------------------------------------
  // 3. GLOBAL MODIFIERS
  // ---------------------------------------------------------------
  const globalSpeedPercent = getPercentModifier("speed_global_percent") || 0;
  const globalXpPercent = getPercentModifier("xp_global_percent") || 0;
  const globalAmountPercent = getPercentModifier("amount_global_percent") || 0;
  const globalRarePercent = getPercentModifier("rare_drop_percent") || 0;

  // ---------------------------------------------------------------
  // 4. PRESTIGE MODIFIERS (via prestigeEngine)
  // ---------------------------------------------------------------
  const prestige = getPrestigeModifiers();
  const prestigeSpeed = prestige.speed_global_percent || 0;
  const prestigeXp = prestige.xp_global_percent || 0;
  const prestigeRare = prestige.rare_drop_percent || 0;
  const prestigeAmount = prestige.amount_global_percent || 0;

  // ---------------------------------------------------------------
  // 5. APPLY COMBINED MULTIPLIERS
  // ---------------------------------------------------------------
  stats.speed *= 1 + (speedPercent + globalSpeedPercent + prestigeSpeed) / 100;
  stats.xp *= 1 + (xpPercent + globalXpPercent + prestigeXp) / 100;
  stats.amount *= 1 + (amountPercent + globalAmountPercent + prestigeAmount) / 100;

  // Rare is additive rather than multiplicative
  stats.rareChance += (rarePercent + globalRarePercent + prestigeRare) / 100;

  // Double chance is flat + tool base
  stats.doubleChance += doubleFlat;
  return stats;
}
