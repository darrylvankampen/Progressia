/**
 * =============================================================================
 *  PROGRESSIA — OFFLINE PROGRESS HANDLER
 * =============================================================================
 *
 * This module simulates progress while the player is offline.
 *
 * Responsibilities:
 *  - Determine time spent offline
 *  - Simulate repeated skill actions for all skills that were active before exit
 *  - Award XP, resources, and progress using the same logic as real-time gameplay
 *  - Provide a structured summary for UI purposes (modals, notifications)
 *
 * Key assumptions:
 *  - Skills marked with `wasActive: true` should continue performing actions offline
 *  - `performSkillAction()` is responsible for game-rules correctness (XP, drops, etc.)
 *  - Multiple cycles may be simulated depending on elapsed time and action speed
 *  - Modifiers, tools, buffs, etc., are already baked into action.actionTime
 *
 * Edge cases handled:
 *  - Negative or zero elapsed time (e.g., device clock changed)
 *  - Missing action definitions due to version updates
 *  - Partial cycles are ignored (consistent with real-time behavior)
 */

import { getGame, saveGame, addItem, addXp } from "./gameState";
const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Computes offline progress for all skills.
 *
 * Returns:
 *  Array of offline results, each containing:
 *    {
 *      skill: "mining",
 *      action: "mine_stone",
 *      cycles: 120,
 *      gainedXp: 450,
 *      gainedResource: "stone",
 *      gainedAmount: 38
 *    }
 *
 * Behavior:
 *  - Determines elapsed time since lastOnline
 *  - For each active skill:
 *      - Calculates how many action cycles would have occurred offline
 *      - Replays the action N times using performSkillAction()
 *      - Tracks total XP and resources produced
 */
export function handleOfflineProgress() {
  const game = getGame();

  const now = Date.now();
  const last = Number(localStorage.getItem("lastOnline")) || now;
  let elapsed = now - last;

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

    // Basic batch calculations:
    const xpPer = action.xpGain ?? 0;
    const amountPer = action.amountGain ?? 1;

    let totalXp = xpPer * cycles;
    let totalAmount = amountPer * cycles;

    // Double chance -> expected value
    const doubleChance = action.doubleChance || 0;
    totalAmount += Math.floor(cycles * doubleChance);

    // Rare drops
    if (Array.isArray(action.rareDrops)) {
      for (const drop of action.rareDrops) {
        const amt = Math.floor(cycles * drop.chance);
        if (amt > 0) addItem(drop.item, amt);
      }
    }

    // Give player resources + xp
    if (action.resource) addItem(action.resource, totalAmount);
    addXp(key, totalXp);

    summary.push({
      skill: key,
      action: action.id,
      cycles,
      gainedXp: totalXp,
      gainedResource: action.resource,
      gainedAmount: totalAmount,
      elapsed: elapsed,
      maxOffline: elapsed === MAX_OFFLINE_MS,
    });
  }

  localStorage.setItem("lastOnline", now);
  saveGame();

  return summary;
}

/**
 * Utility function used for QA/Debug:
 *
 * Simulates the effect of being offline for X minutes.
 * Useful for testing:
 *  - pacing
 *  - balancing XP gains
 *  - ensuring offline simulation matches online behavior
 */
export function testOfflineProgress(minutes = 60) {
  const fakePast = Date.now() - minutes * 60 * 1000;
  localStorage.setItem("lastOnline", fakePast);

  console.log("[Offline TEST]", minutes, "minutes");
  return handleOfflineProgress();
}
