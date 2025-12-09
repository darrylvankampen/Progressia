// src/game/skillEngine.js

import {
  addItem,
  addXp,
  getGame,
  saveGame,
  gameReady,
  cleanupExpiredBuffs,
  addBuff,
} from "./state/gameState";
import {
  getEffectiveToolStats,
  getPercentModifier,
  getFlatModifier,
} from "./modifierEngine";

const TICK_MS = 100;

/**
 * =============================================================================
 *  PROGRESSIA — SKILL ENGINE
 * =============================================================================
 *
 * This module controls:
 *  - Skill action lifecycle (start/stop)
 *  - The global game tick loop (action timing)
 *  - XP and resource generation per action
 *  - Integration with tools, buffs, and modifiers
 *  - Resume behavior after refresh or reload
 *
 * Design goals:
 *  - Only one skill can be actively performing actions at a time
 *  - All timing is driven by a single global tick (TICK_MS)
 *  - Actions are defined by JSON config (actions per skill)
 *  - Runtime state is rebuilt from config + saved state on resume
 *
 * High-level flow:
 *  - `startAction()` sets up `currentAction` and starts ticking
 *  - `gameTick()` decrements `timeLeft` and calls `performSkillAction()`
 *  - `performSkillAction()` calculates resources, XP, crits, doubles, drops, buffs
 *  - `resumeAllActiveSkills()` reconstructs running actions after reload
 */

/* ============================================================================
 * HELPER: Reset skill state
 * ============================================================================
 */

/**
 * Resets all runtime fields for a given skill.
 *
 * Used when:
 *  - Stopping a skill
 *  - Switching active skills
 *  - Failing to restore an action after reload
 */
function clearSkillState(skill) {
  if (!skill) return;
  skill.isActive = false;
  skill.wasActive = false;
  skill.currentActionId = null;
  skill.currentAction = null;
  skill.timeLeft = 0;
}

/* ============================================================================
 * HELPER: Base values from action config
 * ============================================================================
 */

/**
 * Extracts the base timing, XP, and amount values from an action definition.
 *
 * Supports multiple naming conventions in config:
 *  - Time: baseTime | actionTime | default 3000 ms
 *  - XP:   xpPerHit | xpBase | xpGain | default 10
 *  - Amt:  amountBase | amountGain | default 1
 *
 * This provides a clean abstraction so action configs can evolve over time
 * without tightly coupling to a single field name.
 */
function getBaseValues(action) {
  const baseTime = action.baseTime ?? action.actionTime ?? 3000;
  const baseXp =
    action.xpPerHit ??
    action.xpBase ??
    action.xpGain ??
    10;
  const baseAmount = action.amountBase ?? action.amountGain ?? 1;

  return { baseTime, baseXp, baseAmount };
}

/* ============================================================================
 * HELPER: Compute effective stats (tool + modifiers)
 * ============================================================================
 */

/**
 * Computes effective action stats by combining:
 *  - Base action values
 *  - Tool stats (speedMultiplier, xpMultiplier, doubleChance)
 *  - Global percent modifiers (per skill)
 *
 * Result:
 *  - final actionTime (minimum 200 ms for sanity)
 *  - xpGain per action cycle
 *  - amountGain per action cycle
 *  - doubleChance for doubling resource gain
 */
function computeEffectiveStats(skillKey, baseVals) {
  const tool = getEffectiveToolStats(skillKey);

  const speedPercent = getPercentModifier(`${skillKey}_speed_percent`) || 0;
  const xpPercent = getPercentModifier(`${skillKey}_xp_percent`) || 0;

  const globalSpeedPercent = getPercentModifier("speed_global_percent") || 0;
  const globalXpPercent = getPercentModifier("xp_global_percent") || 0;

  // SPEED: higher speedPercent → lower actionTime
  const finalSpeedMultiplier = tool.speedMultiplier * (1 + speedPercent + globalSpeedPercent / 100);
  const actionTime = Math.max(
    200, // hard floor on action time
    Math.floor(baseVals.baseTime / finalSpeedMultiplier)
  );

  // XP: tool + modifiers affect xpGain
  const finalXpMultiplier = tool.xpMultiplier * (1 + xpPercent + globalXpPercent / 100);
  const xpGain = Math.floor(baseVals.baseXp * finalXpMultiplier);

  return {
    actionTime,
    xpGain,
    amountGain: baseVals.baseAmount,
    doubleChance: tool.doubleChance || 0,
  };
}

/* ============================================================================
 * HELPER: Rebuild currentAction from config + saved state
 * ============================================================================
 */

/**
 * Reconstructs the `currentAction` object for a skill using:
 *  - The saved `currentActionId`
 *  - The static action config in `skill.actions`
 *  - The saved `timeLeft`
 *  - Freshly computed effective stats
 *
 * This is used when:
 *  - Resuming after a page refresh
 *  - Reloading a save where an action was in progress
 *
 * On failure (missing config, invalid id), the skill state is cleared to
 * prevent stuck or invalid actions.
 */
function rebuildCurrentAction(skillKey, skill) {
  if (!skill.currentActionId) return null;
  if (!Array.isArray(skill.actions)) return null;

  const base = skill.actions.find((a) => a.id === skill.currentActionId);
  if (!base) {
    console.warn("[Progressia] Action not found:", skill.currentActionId);
    clearSkillState(skill);
    return null;
  }

  const baseVals = getBaseValues(base);
  const effective = computeEffectiveStats(skillKey, baseVals);

  // Restore saved timeLeft, clamped to [0, actionTime]
  let timeLeft =
    typeof skill.timeLeft === "number" && skill.timeLeft > 0
      ? skill.timeLeft
      : effective.actionTime;

  if (timeLeft > effective.actionTime) {
    timeLeft = effective.actionTime;
  }

  const currentAction = {
    ...base,
    baseTime: baseVals.baseTime,
    baseXp: baseVals.baseXp,
    baseAmount: baseVals.baseAmount,
    amountGain: effective.amountGain,
    xpGain: effective.xpGain,
    doubleChance: effective.doubleChance,
    actionTime: effective.actionTime,
    timeLeft,
  };

  skill.currentAction = currentAction;
  skill.timeLeft = timeLeft;

  return currentAction;
}

/* ============================================================================
 * GLOBAL TICK LOOP
 * ============================================================================
 */

/**
 * Main game tick executed every TICK_MS milliseconds.
 *
 * Responsibilities:
 *  - Cleanup expired buffs
 *  - Enforce single-active-skill rule
 *  - Decrement `timeLeft` for active actions
 *  - Trigger `performSkillAction()` when an action completes
 */
function gameTick() {
  const game = getGame();

  // Buff system maintenance
  cleanupExpiredBuffs();

  for (const key in game.skills) {
    const skill = game.skills[key];

    // Only one skill can be active at runtime
    if (game.activeSkill && game.activeSkill !== key) {
      clearSkillState(skill);
      continue;
    }

    if (!skill || !skill.isActive || !skill.currentActionId) continue;

    // Ensure currentAction exists after reload or config change
    let action = skill.currentAction;
    if (!action) {
      action = rebuildCurrentAction(key, skill);
      if (!action) {
        clearSkillState(skill);
        continue;
      }
    }

    // Ensure timeLeft is valid
    if (typeof skill.timeLeft !== "number" || skill.timeLeft <= 0) {
      skill.timeLeft = action.actionTime ?? TICK_MS;
    }

    // Decrement timer
    skill.timeLeft -= TICK_MS;

    // Action completed?
    if (skill.timeLeft <= 0) {
      performSkillAction(key, action);

      // Reset for next cycle
      skill.timeLeft = action.actionTime ?? TICK_MS;

      saveGame();
    }
  }
}

// Start ticking globally
setInterval(gameTick, TICK_MS);

/* ============================================================================
 * START AN ACTION
 * ============================================================================
 */

/**
 * Starts a new action for a given skill.
 *
 * Behavior:
 *  - Stops all other skills (single-active rule)
 *  - Sets `currentActionId` and builds a runtime `currentAction`
 *  - Flags the skill as active & wasActive
 *  - Updates `game.activeSkill`
 */
export function startAction(skillKey, action) {
  const game = getGame();

  // Only one skill can be actively running at a time
  stopAllSkills(skillKey);

  const skill = game.skills[skillKey];
  if (!skill || !action) return;

  skill.currentActionId = action.id;

  const baseVals = getBaseValues(action);
  const effective = computeEffectiveStats(skillKey, baseVals);

  skill.currentAction = {
    ...action,
    baseTime: baseVals.baseTime,
    baseXp: baseVals.baseXp,
    baseAmount: baseVals.baseAmount,
    amountGain: effective.amountGain,
    xpGain: effective.xpGain,
    doubleChance: effective.doubleChance,
    actionTime: effective.actionTime,
    timeLeft: effective.actionTime,
  };

  skill.timeLeft = effective.actionTime;
  skill.isActive = true;
  skill.wasActive = true;
  game.activeSkill = skillKey;

  saveGame();
}

/* ============================================================================
 * STOP A SKILL
 * ============================================================================
 */

/**
 * Stops a specific skill from performing its action.
 *
 * - Clears its runtime state
 * - Clears global activeSkill reference if this was the active one
 */
export function stopSkill(skillKey) {
  const game = getGame();
  const skill = game.skills[skillKey];
  if (!skill) return;

  clearSkillState(skill);

  if (game.activeSkill === skillKey) {
    game.activeSkill = null;
  }

  saveGame();
}

/* ============================================================================
 * PERFORM ACTION (called when timeLeft <= 0)
 * ============================================================================
 */

/**
 * Executes a skill action once.
 *
 * This is the central logic that:
 *  - Determines the resource being produced (including variants)
 *  - Calculates final amount gained (flat bonuses, crits, doubles)
 *  - Awards items and XP
 *  - Rolls for rare drops and extra resources
 *  - Triggers on-action buffs
 *
 * Returns a result object describing what happened, for use in:
 *  - Offline progress simulation
 *  - Summaries and analytics
 *  - Debugging tools
 *
 * Return shape:
 *   {
 *     resource,
 *     gain,
 *     xp,
 *     crit,
 *     doubled,
 *     rareDropsGained: string[],
 *     extraGained: { item, amount }[],
 *     buffApplied: string | null,
 *   }
 */
export function performSkillAction(skillKey, actionOverride) {
  const game = getGame();
  const skill = game.skills[skillKey];
  const action = actionOverride || skill?.currentAction;
  if (!skill || !action) return null;

  const tool = getEffectiveToolStats(skillKey);
  const flatAmount = getFlatModifier(`${skillKey}_amount_flat`);
  const doubleFlat = getFlatModifier(`${skillKey}_doubleChance`);
  const rarePercent = getPercentModifier(`${skillKey}_rareChance_percent`);

  const globalRarePercent = getPercentModifier("rare_drop_percent") || 0;
  const globalAmountPercent = getPercentModifier("amount_global_percent") || 0;

  // 1. Resource variants (weighted random selection)
  let resource = action.resource;
  if (action.variants) {
    let roll = Math.random();
    let acc = 0;
    for (const v of action.variants) {
      acc += v.chance;
      if (roll < acc) {
        resource = v.resource;
        break;
      }
    }
  }

  // 2. Base amount + flat bonus
  let gain = (action.amountGain ?? 0) + (flatAmount || 0);
  gain = Math.floor(gain * (1 + globalAmountPercent / 100));

  // 3. Critical hit handling
  let crit = false;
  if (action.critChance && Math.random() < action.critChance) {
    crit = true;
    gain = Math.floor(gain * (action.critMultiplier ?? 2));
    console.log(`[CRIT] ${action.id}`);
  }

  // 4. Double chance (tool + action + flat modifiers)
  let finalDouble =
    (action.doubleChance || 0) +
    tool.doubleChance +
    (doubleFlat || 0) / 100;

  let doubled = false;
  if (Math.random() < finalDouble) {
    gain *= 2;
    doubled = true;
    console.log(`[DOUBLE] ${action.id}`);
  }

  // 5. Award main resource
  if (resource) addItem(resource, gain);

  // 6. Award XP for this action cycle
  addXp(skillKey, action.xpGain);

  // 7. Rare drops (e.g., nests, gems, special items)
  const rareDropsGained = [];
  if (Array.isArray(action.rareDrops)) {
    for (const drop of action.rareDrops) {
      let finalChance = drop.chance * (1 + rarePercent + globalRarePercent / 100);
      if (Math.random() < finalChance) {
        addItem(drop.item, 1);
        rareDropsGained.push(drop.item);
      }
    }
  }

  // 8. Extra resources (e.g., secondary resources like seeds)
  const extraGained = [];
  if (Array.isArray(action.extraResources)) {
    for (const extra of action.extraResources) {
      if (Math.random() < extra.chance) {
        addItem(extra.item, extra.amount);
        extraGained.push({ item: extra.item, amount: extra.amount });
      }
    }
  }

  // 9. Action-triggered buffs
  let buffApplied = null;
  if (action.actionBuff && Math.random() < action.actionBuff.chance) {
    addBuff(action.actionBuff.buffId, action.actionBuff.duration);
    buffApplied = action.actionBuff.buffId;
    console.log("[BUFF] Gained buff:", action.actionBuff.buffId);
  }

  // Return action result (used by offline progress, logging, UI, etc.)
  return {
    resource,
    gain,
    xp: action.xpGain,
    crit,
    doubled,
    rareDropsGained,
    extraGained,
    buffApplied,
  };
}

/* ============================================================================
 * RESUME AFTER REFRESH
 * ============================================================================
 */

/**
 * Resumes a single skill if it was active before a refresh.
 *
 * Behavior:
 *  - If another skill is globally active, this one is cleared
 *  - If `wasActive` and `currentActionId` are set, action is rebuilt
 *  - If rebuild fails, the skill is stopped
 */
export function resumeSkill(skillKey) {
  const game = getGame();
  const skill = game.skills[skillKey];
  if (!skill) return;

  // If another skill is marked as active, this one should not resume
  if (game.activeSkill && game.activeSkill !== skillKey) {
    clearSkillState(skill);
    return;
  }

  if (!skill.wasActive || !skill.currentActionId) return;

  const action = rebuildCurrentAction(skillKey, skill);
  if (!action) {
    stopSkill(skillKey);
    return;
  }

  skill.isActive = true;
}

/**
 * Resumes all skills that were active before reload.
 * Enforces the single-active-skill rule via resumeSkill().
 */
export function resumeAllActiveSkills() {
  const game = getGame();

  for (const key in game.skills) {
    resumeSkill(key);
  }
}

/**
 * Stops all skills except an optional one to keep active.
 *
 * Used primarily when:
 *  - Starting a new action on a different skill
 *  - Ensuring only one skill is ticking at a time
 */
function stopAllSkills(except = null) {
  const game = getGame();

  for (const key in game.skills) {
    if (key === except) continue;
    clearSkillState(game.skills[key]);
  }

  if (except) {
    game.activeSkill = except;
  } else {
    game.activeSkill = null;
  }
}

/* ============================================================================
 * INTEGRATION WITH gameReady
 * ============================================================================
 */

/**
 * Once the game state and skills are fully loaded, we attempt
 * to resume any previously active skills (after refresh/reload).
 *
 * This decouples initialization order from gameplay logic and
 * ensures the skill engine only resumes once everything is ready.
 */
gameReady.then(() => {
  resumeAllActiveSkills();
});
