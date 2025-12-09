/**
 * =============================================================================
 *  PROGRESSIA — OFFLINE PROGRESS HANDLER
 * =============================================================================
 *
 * Simulates progress while the player is offline.
 * Now integrated with the prestige.json upgrade system.
 */

import { getGame, saveGame, addItem, addXp } from "./gameState";
import { getOfflineEfficiencyBonus } from "../prestiges/prestigesEngine";

const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;  // 24 hours
const BASE_OFFLINE_EFFICIENCY = 0.8;        // 80% base efficiency
const MAX_EFFICIENCY = 1.5;                  // 150% offline max efficiency cap

export function handleOfflineProgress() {
  const game = getGame();

  // Calculate prestige-based efficiency bonus from JSON definitions
  const prestigeBonus = getOfflineEfficiencyBonus();
  let OFFLINE_EFFICIENCY = BASE_OFFLINE_EFFICIENCY + prestigeBonus;

  // Clamp efficiency to prevent extreme gains
  OFFLINE_EFFICIENCY = Math.min(OFFLINE_EFFICIENCY, MAX_EFFICIENCY);

  const now = Date.now();
  const last = Number(localStorage.getItem("lastOnline")) || now;
  let elapsed = now - last;

  // Limit offline progress to max 24 hours
  if (elapsed > MAX_OFFLINE_MS) {
    elapsed = MAX_OFFLINE_MS;
  }

  if (elapsed <= 0) {
    localStorage.setItem("lastOnline", now);
    saveGame();
    return [];
  }

  const summary = [];

  for (const key in game.skills) {
    const skill = game.skills[key];

    if (!skill.wasActive) continue;
    if (!skill.currentAction) continue;

    const action = skill.currentAction;
    const actionTime = action.actionTime || action.baseTime || 3000;
    const cycles = Math.floor(elapsed / actionTime);

    if (cycles <= 0) continue;

    const xpPer = action.xpGain ?? 0;
    const amountPer = action.amountGain ?? 1;

    // Apply offline efficiency to XP and resource gains
    let totalXp = Math.floor(xpPer * cycles * OFFLINE_EFFICIENCY);
    let totalAmount = Math.floor(amountPer * cycles * OFFLINE_EFFICIENCY);

    // Double chance → expected value
    const doubleChance = action.doubleChance || 0;
    totalAmount += Math.floor(cycles * doubleChance * OFFLINE_EFFICIENCY);

    // Rare drops (expected value)
    if (Array.isArray(action.rareDrops)) {
      for (const drop of action.rareDrops) {
        const amt = Math.floor(cycles * drop.chance * OFFLINE_EFFICIENCY);
        if (amt > 0) addItem(drop.item, amt);
      }
    }

    // Apply XP and resource rewards
    if (action.resource) addItem(action.resource, totalAmount);
    addXp(key, totalXp);

    summary.push({
      skill: key,
      action: action.id,
      cycles,
      gainedXp: totalXp,
      gainedResource: action.resource,
      gainedAmount: totalAmount,
      elapsed,
      maxOffline: elapsed === MAX_OFFLINE_MS,

      efficiency: OFFLINE_EFFICIENCY,

      // Prestige bonus in %
      prestigeBonus: Math.round(prestigeBonus * 100)
    });
  }

  // Save new timestamp
  localStorage.setItem("lastOnline", now);
  saveGame();

  return summary;
}

/**
 * Debug helper for testing offline gains.
 */
export function testOfflineProgress(minutes = 60) {
  const fakePast = Date.now() - minutes * 60 * 1000;
  localStorage.setItem("lastOnline", fakePast);

  console.log("[Offline TEST]", minutes, "minutes");
  return handleOfflineProgress();
}
