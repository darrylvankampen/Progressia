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

import { getGame, saveGame } from "./gameState";
import { performSkillAction } from "../skillEngine";

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

  // Total offline duration in milliseconds
  const elapsed = now - last;

  // If nothing meaningful elapsed (or system clock changed negatively), stop.
  if (elapsed <= 0) {
    localStorage.setItem("lastOnline", now);
    saveGame();
    return [];
  }

  const summary = [];

  for (const key in game.skills) {
    const skill = game.skills[key];

    // Skill never marked as active before logout → skip
    if (!skill.wasActive) continue;

    // Skill action missing (skill update? corrupted save?) → skip
    if (!skill.currentAction) continue;

    const action = skill.currentAction;

    /**
     * actionTime is already modified by:
     *   - tools
     *   - skill modifiers
     *   - buffs
     *
     * If actionTime is missing, fall back to stored baseTime or a safe default.
     */
    const actionTime = action.actionTime || action.baseTime || 3000;

    // Total number of full cycles completed offline
    const cycles = Math.floor(elapsed / actionTime);
    if (cycles <= 0) continue;

    let totalAmount = 0;
    let totalXp = 0;
    let resourceId = action.resource;

    /**
     * Replay the action logic N times using the real skill engine.
     * This guarantees:
     *   - XP behaves identically to online play
     *   - Drops/amountGain follow real drop tables or modifiers
     *   - Achievements, stats, and notifications are updated consistently
     */
    for (let i = 0; i < cycles; i++) {
      const result = performSkillAction(key, action);
      if (!result) continue;

      totalAmount += result.gain;
      totalXp += result.xp;
      resourceId = result.resource || resourceId;
    }

    // Store final summary for UI
    summary.push({
      skill: key,
      action: action.id,
      cycles,
      gainedXp: totalXp,
      gainedResource: resourceId,
      gainedAmount: totalAmount,
    });
  }

  // Persist new timestamp and game state
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
