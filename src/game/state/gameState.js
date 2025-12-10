/**
 * =============================================================================
 *  PROGRESSIA — CORE GAME STATE MANAGER
 * =============================================================================
 *
 * This module acts as the central authority for:
 *  • Game state storage (reactive state)
 *  • Saving & loading (localStorage)
 *  • Merging saves across game version updates
 *  • Item management (inventory, resourceStats)
 *  • Skill system (XP, actions, level progression)
 *  • Buffs, modifiers, and dynamic modifier rebuilds
 *  • Skill definitions + initialisation workflow
 *
 * High-level architecture notes:
 *  - The game state lives in a single reactive() root object.
 *  - Default values originate from `defaultGame`, ensuring
 *    compatibility across versions.
 *  - Save migration is handled by mergeSave(), designed to
 *    tolerate missing, added, or corrupted fields.
 *  - Skill definitions are loaded asynchronously (SVGs, JSON).
 *  - Item DB is static and initialised once.
 *
 * This system behaves similar to a minimal ECS/state container
 * found in lightweight RPG/idle games.
 */

import { reactive } from "vue";
import { defaultGame } from "../defaultGame";
import { playSound } from "../soundManager";
import { initItems, getItem } from "../utils/itemDB";
import { loadAllSkills } from "../skills/skillLoader";
import { useNotifications } from "../../composables/useNotification";
import { recalculateModifiers } from "../modifierEngine";
import { getBuffDef, rebuildDynamicBuffDefs, registerDynamicBuff } from "../utils/buffDB";
import { checkAchievements } from "../achievements/achievementEngine";
import { rollFromLootTable } from "../utils/lootTables";
import { validateAmount } from "../helpers/gameHelpers";
import { resetPrestige } from "../prestiges/prestigesEngine";

const { pushNotification } = useNotifications();

/* ============================================================================
 * INTERNAL STATE
 * ============================================================================
 */

/**
 * The main game state container.
 * 
 * - Created by cloning defaultGame to avoid shared references.
 * - Made reactive so UI updates automatically.
 */
let game = reactive(structuredClone(defaultGame));

/**
 * Dynamic skill definitions loaded at runtime.
 * May include inline SVG, images, or external config bundles.
 */
let skillDefs = null;

/**
 * Promises that allow external systems (UI, game loops)
 * to wait for skills/game to be fully initialized.
 */
let skillDefsReadyResolve;
let gameReadyResolve;

export const gameReady = new Promise((resolve) => {
  gameReadyResolve = resolve;
});

export const skillDefsReady = new Promise((resolve) => {
  skillDefsReadyResolve = resolve;
});

/**
 * Initialize item database once:
 * loads static item metadata, icons, categories, etc.
 */
initItems();

/**
 * Boot sequence:
 *  1) Load skills (async)
 *  2) Load save game (async)
 *  3) Rebuild modifiers
 *  4) Resolve initialization promises
 */
(async () => {
  await ensureSkillsLoaded();
  await initGame();
})();

/* ============================================================================
 * INITIALIZATION PIPELINE
 * ============================================================================
 */

/**
 * Initializes the game state by:
 *  - Loading from localStorage or falling back to defaults
 *  - Restoring skill state and merging definitions
 *  - Rebuilding any dynamically registered buffs
 *  - Recalculating all modifiers
 */
async function initGame() {
  try {
    const loaded = await loadGameFromStorage();
    Object.assign(game, loaded);

    // Explicitly assign player object to preserve reactivity
    game.player = loaded.player;

    // Re-register dynamic buffs created during runtime
    rebuildDynamicBuffDefs();
  } catch (err) {
    console.error("[Progressia] Failed to load game, using defaults:", err);
  } finally {
    // Modifiers must always be recalculated after load/reset
    recalculateModifiers();

    // Signal readiness
    if (gameReadyResolve) gameReadyResolve();
  }
}

/**
 * Loads skill definitions once.
 * Used by multiple systems, including state merging.
 */
async function ensureSkillsLoaded() {
  if (!skillDefs) {
    skillDefs = await loadAllSkills();
    skillDefsReadyResolve();
  }
}

/**
 * Extracts skill progress from a save entry and fills in default values.
 *
 * Rationale:
 *  - After game updates, older saves may miss new fields.
 *  - Skills are a hybrid structure (config + runtime progress).
 *  - We reset runtime-only fields like `isActive` to prevent stuck actions.
 */
function extractSkillProgress(savedSkill) {
  if (!savedSkill) {
    return {
      level: 1,
      xp: 0,
      xpToNext: 50,
      currentActionId: null,
      timeLeft: 0,
      isActive: false,
      wasActive: false,
      totalXP: 0,
    };
  }

  return {
    level: savedSkill.level ?? 1,
    xp: savedSkill.xp ?? 0,
    xpToNext: savedSkill.xpToNext ?? 50,
    currentActionId: savedSkill.currentActionId ?? null,
    timeLeft: savedSkill.timeLeft ?? 0,
    isActive: false, // runtime-only field; never restored
    wasActive: savedSkill.wasActive ?? false,
    totalXP: savedSkill.totalXP ?? 0,
  };
}

/* ============================================================================
 * PUBLIC API — CORE GETTERS & RESET
 * ============================================================================
 */

/** Returns the full reactive game state. */
export function getGame() {
  return game;
}

/**
 * Resets the entire game to factory defaults:
 *  - Rebuilds skills using definitions
 *  - Clears inventory
 *  - Removes active actions
 *  - Recomputes modifiers
 *
 * Used for:
 *  - “Start Over” buttons
 *  - Debug/testing environments
 */
export async function resetGame() {
  await ensureSkillsLoaded();

  const fresh = structuredClone(defaultGame);

  // Rebuild full skill set with fresh progress
  fresh.skills = {};
  for (const id in skillDefs) {
    const def = skillDefs[id];

    fresh.skills[id] = {
      ...structuredClone(def),
      level: 1,
      xp: 0,
      xpToNext: 50,
      currentActionId: null,
      currentAction: null,
      timeLeft: 0,
      isActive: false,
      wasActive: false,
      totalXP: 0,
    };
  }

  // Clear inventory + active skill
  fresh.inventory = {};
  fresh.activeSkill = null;

  // Replace entire game state
  Object.assign(game, fresh);
  resetPrestige();
  recalculateModifiers();
  saveGame();
}

/**
 * Determines whether a field is considered "dynamic".
 *
 * Dynamic fields include:
 *  - Empty objects `{}` (inventory, resourceStats, buffs, quests)
 *  - Empty arrays `[]` (crafting queue, active actions, etc.)
 *
 * These fields are not partially merged; they are replaced outright.
 */
function isDynamicField(defaultVal) {
  return (
    (Array.isArray(defaultVal) && defaultVal.length === 0) ||
    (typeof defaultVal === "object" &&
      defaultVal !== null &&
      !Array.isArray(defaultVal) &&
      Object.keys(defaultVal).length === 0)
  );
}

/** Deep clone helper for structured objects. */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ============================================================================
 * SAVE SYSTEM
 * ============================================================================
 */

/**
 * Serializes the game state into localStorage.
 *
 * Handles multiple categories:
 *  - Dynamic fields → cloned and stored fully
 *  - Player → fixed schema stored explicitly
 *  - Skills → only runtime progress stored
 *  - Simple fields → direct copy
 *
 * Ensures:
 *  - Save files are stable across updates
 *  - No cyclic or reactive references leak into storage
 *  - Invalid states are filtered before writing
 */
export function saveGame() {
  const save = {};

  for (const key of Object.keys(defaultGame)) {
    const defaultVal = defaultGame[key];
    const gameVal = game[key];

    // 1) Dynamic fields stored as-is
    if (isDynamicField(defaultVal)) {
      save[key] = deepClone(gameVal);
      continue;
    }

    // 2) Player: fixed shape explicitly saved
    if (key === "player") {
      save.player = {
        name: game.player.name,
        gold: game.player.gold,
        hp: game.player.hp,
        maxHp: game.player.maxHp,
        totalXP: game.player.totalXP,
        equippedTools: deepClone(game.player.equippedTools),
        titles: deepClone(game.player.titles),
        activeTitle: game.player.activeTitle,
        achievementPoints: game.player.achievementPoints,
        factions: deepClone(game.player.factions),
        prestige: deepClone(game.player.prestige),
        equipment: deepClone(game.player.equipment),
        stats: deepClone(game.player.stats),
      };
      continue;
    }

    // 3) Skills: store only mutable progress fields
    if (key === "skills") {
      const skills = {};
      for (const id in game.skills) {
        const s = game.skills[id];
        skills[id] = {
          level: s.level,
          xp: s.xp,
          xpToNext: s.xpToNext,
          currentActionId: s.currentActionId,
          timeLeft: s.timeLeft,
          isActive: s.isActive,
          wasActive: s.wasActive,
          totalXP: s.totalXP,
        };
      }
      save.skills = skills;
      continue;
    }

    // 4) Primitive/simple fields stored directly
    save[key] = deepClone(gameVal);
  }

  // Persist to storage
  try {
    localStorage.setItem("progressia-save", JSON.stringify(save));
  } catch (err) {
    console.error("[Progressia] Failed to save:", err);
  }
}

/* ============================================================================
 * XP SYSTEM
 * ============================================================================
 */

/**
 * Adds XP to a skill and handles:
 *  - Multiple possible level-ups in a single grant
 *  - Dynamic scaling XP requirements
 *  - Level-up effects + sound feedback
 *  - Achievement tracking
 *
 * XP formula:
 *   xpToNext = 50 * level^1.8
 *
 * Edge cases handled:
 *  - Negative or non-numeric XP
 *  - Skills at max level
 */
export function addXp(skillKey, amount) {
  amount = Number(amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.warn("Invalid XP amount:", amount, "for", skillKey);
    return;
  }

  const skill = game.skills[skillKey];
  if (!skill) return;

  // Update totals
  skill.xp += amount;
  skill.totalXP += amount;
  game.player.totalXP += amount;

  // Achievement checks triggered by XP changes
  checkAchievements();

  let leveled = false;

  // Level up loop (multiple levels possible)
  while (skill.xp >= skill.xpToNext && skill.level < skill.maxLevel) {
    skill.xp -= skill.xpToNext;
    skill.level++;

    if (skill.id === "hp") {
      game.player.maxHp += 10;
    }

    if (skill.level < skill.maxLevel) {
      skill.xpToNext = Math.floor(50 * Math.pow(skill.level, 1.8));
    } else {
      // Reached max level
      skill.xpToNext = 0;
      skill.xp = 0;
    }

    leveled = true;
  }

  // Level-up event handling
  if (leveled) {
    skill.justLeveled = true;
    playSound("levelup");
    checkAchievements();

    // Reset level-up visual flag after a delay
    setTimeout(() => {
      skill.justLeveled = false;
    }, 1500);
  }
  console.log("XP added to", skillKey, "by", amount);
  saveGame();
}

/* ============================================================================
 * ITEM SYSTEM
 * ============================================================================
 */

/**
 * Adds an item to the player's inventory.
 *
 * Supports:
 *  - Amount validation
 *  - Updating lifetime resourceStats (collected count)
 *  - Triggering notifications
 *  - Achievement tracking
 */
export function addItem(itemKey, amount = 1) {
  const item = getItem(itemKey);

  if (!validateAmount(amount).valid) {
    console.warn("[Progressia] Invalid amount (addItem): ", amount);
    return;
  }

  if (!item) {
    console.warn("[Progressia] Unknown item:", itemKey);
    return;
  }

  // Create inventory entry if missing
  if (!game.inventory[itemKey]) {
    game.inventory[itemKey] = 0;
  }

  // Ensure resourceStats entry exists
  if (!game.resourceStats[itemKey]) {
    game.resourceStats[itemKey] = { collected: 0, used: 0 };
  }

  // Update lifetime collection statistics
  game.resourceStats[itemKey].collected += amount;

  // Add item(s)
  game.inventory[itemKey] += amount;

  incrementPlayerStat("resourcesCollected", amount)

  checkAchievements();

  // Notify UI
  pushNotification(itemKey, {
    type: "resources",
    icon: item.icon,
    amount,
    item: item.name
  });

  saveGame();
}

/**
 * Removes items from the player's inventory.
 *
 * Supported types:
 *  - "use": counts as consumption and updates resourceStats.used
 *  - "sell": converts item value into gold
 */
export function removeItem(itemKey, amount = 1, type = "use") {
  if (!game.inventory[itemKey]) {
    console.warn("[removeItem] Item not found in inventory:", itemKey);
    return;
  }

  // Ensure stats block exists
  if (!game.resourceStats[itemKey]) {
    game.resourceStats[itemKey] = { collected: 0, used: 0 };
  }

  if (type === "use") {
    game.resourceStats[itemKey].used += amount;
    incrementPlayerStat("itemsCrafted", 1);
  }

  if (type === "sell") {
    const item = getItem(itemKey);
    if (item) {
      game.player.gold += item.value;
    }
    playSound("sell");
    incrementPlayerStat("itemsSold", 1);
    incrementPlayerStat("goldEarned", item.value)
  }

  if (type === "destroy") {
    playSound("destroy");
    incrementPlayerStat("itemsDestroyed", 1);
  }

  // Modify inventory count
  game.inventory[itemKey] -= amount;

  // Remove entry when count hits zero
  if (game.inventory[itemKey] <= 0) {
    delete game.inventory[itemKey];
  }

  checkAchievements();
  saveGame();
}

/* ============================================================================
 * SAVE LOADING & MERGING
 * ============================================================================
 */

/**
 * Loads the save-game from localStorage and merges it with the current game
 * template. This system is robust against:
 *
 *  - Missing fields in older saves
 *  - Added new fields in game updates
 *  - Corrupted or partially damaged save data
 *  - Items that have been removed from the game
 *
 * Skill restoration also reconstructs `currentAction` based on
 * action definitions so that running actions can resume properly.
 */
async function loadGameFromStorage() {
  const raw = localStorage.getItem("progressia-save");
  let base;

  // Load or fallback
  if (!raw) {
    base = structuredClone(defaultGame);
  } else {
    try {
      const parsed = JSON.parse(raw);
      base = mergeSave(parsed, defaultGame);
    } catch (err) {
      console.warn("[Progressia] Corrupted save, using defaults:", err);
      base = structuredClone(defaultGame);
    }
  }

  // Clean up inventory entries referencing non-existing items
  for (const key of Object.keys(base.inventory)) {
    if (!getItem(key)) {
      console.warn("[Progressia] Removing unknown inventory item:", key);
      delete base.inventory[key];
    }
  }

  // Ensure skill definitions loaded
  await ensureSkillsLoaded();

  // Guarantee player structure integrity
  if (!base.player.equippedTools) {
    base.player.equippedTools = {};
  }

  // Ensure skills container exists
  if (!base.skills) base.skills = {};

  // Rebuild skill objects using definitions + saved progress
  for (const id in skillDefs) {
    const def = skillDefs[id];
    const existing = base.skills[id];
    const progress = extractSkillProgress(existing);

    base.skills[id] = {
      ...structuredClone(def),
      ...progress,
    };
  }

  // Rebuild currentAction runtime state
  for (const id in base.skills) {
    const s = base.skills[id];

    if (s.currentActionId) {
      const def = skillDefs[id].actions.find(a => a.id === s.currentActionId);

      if (def) {
        s.currentAction = {
          ...def,
          actionTime: def.baseTime,
          timeLeft: s.timeLeft,
          hitsNeeded: def.strength ?? 1,
          hitsDone: 0,
          xpPerHit: def.xpPerHit ?? def.xpGain ?? 0,
          amountGain: def.amountBase ?? def.amountGain ?? 1
        };
      }
    }
  }

  return base;
}

/* ============================================================================
 * TOOL SYSTEM (EQUIPPING)
 * ============================================================================
 */

/**
 * Equips a tool for a specific skill.
 *
 * Validation includes:
 *  - Tool exists
 *  - Item is actually a tool
 *  - Tool belongs to this skill
 *  - Player meets required level
 *
 * Successful equip triggers:
 *  - Modifier recalculation
 *  - Save game update
 */
export function equipTool(skillId, toolId) {
  const game = getGame();

  const tool = getItem(toolId);
  if (!tool) {
    console.warn(`[equipTool] Tool '${toolId}' not found.`);
    return false;
  }

  if (tool.category !== "tools") {
    console.warn(`[equipTool] Item '${toolId}' is not a tool.`);
    return false;
  }

  if (tool.skill !== skillId) {
    console.warn(
      `[equipTool] Tool '${toolId}' does not belong to skill '${skillId}'.`
    );
    return false;
  }

  // Ensure equippedTools object exists
  if (!game.player.equippedTools) {
    game.player.equippedTools = {};
  }

  // Level requirement check
  const skill = game.skills[skillId];
  if (skill.level < tool.stats.requiredLevel) {
    console.warn(
      `[equipTool] Player level too low for ${toolId}. ` +
      `Required: ${tool.stats.requiredLevel}, Current: ${skill.level}`
    );
    return false;
  }

  // Equip tool
  game.player.equippedTools[skillId] = toolId;
  playSound("equip");
  recalculateModifiers();
  saveGame();
  return true;
}

/**
 * Removes a tool from the specified skill slot.
 */
export function unequipTool(skillId) {
  const game = getGame();

  if (!game.player?.equippedTools) {
    console.warn("[unequipTool] No equipped tools object.");
    return false;
  }

  const current = game.player.equippedTools[skillId];
  if (!current) {
    console.warn(`[unequipTool] No tool equipped for skill '${skillId}'.`);
    return false;
  }

  delete game.player.equippedTools[skillId];

  recalculateModifiers();
  saveGame();
  return true;
}

export function equipItem(itemId) {
  const game = getGame();
  const item = getItem(itemId);

  if (!item) return { success: false, reason: "Item not found" };

  const slot = item.slot;
  const equip = game.player.equipment;

  if (!slot) {
    return { success: false, reason: "Item is not equipable" };
  }

  // ------------------------
  // Weapon validation
  // ------------------------
  if (slot === "weapon") {
    const hands = item.hands ?? 1;

    if (hands === 2) {
      // 2H weapon blocks offhand
      equip.weapon = itemId;
      equip.offhand = null;
    } else {
      // 1H weapon
      equip.weapon = itemId;
    }
  }

  // ------------------------
  // Offhand validation
  // ------------------------
  else if (slot === "offhand") {
    const weapon = getItem(equip.weapon);

    if (weapon?.hands === 2) {
      return { success: false, reason: "Cannot equip shield with a 2H weapon" };
    }

    equip.offhand = itemId;
  }

  // ------------------------
  // Armor & misc slots
  // ------------------------
  else {
    equip[slot] = itemId;
  }

  playSound("equip");

  saveGame(game);

  return { success: true };
}

export function unequipItem(slot) {
  const game = getGame();
  const equip = game.player.equipment;

  if (!equip[slot]) return;

  equip[slot] = null;
  saveGame(game);
}

/* ============================================================================
 * LOOT / OPENABLES
 * ============================================================================
 */

/**
 * Opens an "openable" item (loot boxes, crates, chests).
 * - Removes one instance of the item
 * - Rolls rewards from its loot table
 * - Inserts resulting items into inventory
 * - Returns rewards for UI display
 */
export function openItem(itemId) {
  const item = getItem(itemId);
  if (!item || !item.openable) return null;

  playSound("itemOpen");

  // Consume 1 openable
  removeItem(itemId, 1);

  // Roll loot results
  const results = rollFromLootTable(item.openable);

  // Add rewards
  results.forEach(r => addItem(r.item, r.amount));

  // Add to stats
  incrementPlayerStat("itemsOpened", 1);

  return results;
}

/* ============================================================================
 * SAVE MERGING LOGIC
 * ============================================================================
 */

/**
 * Deep-merges a loaded save into the default template.
 * This system is designed to handle differences between game versions.
 *
 * Merge rules summary:
 *  - Missing fields → filled with template defaults
 *  - Extra fields → preserved (future-proofing)
 *  - Dynamic fields (empty obj/array in template) → full save overwrite
 *  - Player object → explicit shallow merge
 *  - Nested objects → recursive merge
 *  - Primitive values → save overrides default
 *
 * This ensures:
 *  - Backward compatibility
 *  - Forward compatibility (added fields)
 *  - Minimal risk from corrupted or incomplete saves
 */
function mergeSave(save, template) {
  const result = structuredClone(template);

  if (!save || typeof save !== "object") {
    return result;
  }

  const isPlainObject = (val) =>
    val && typeof val === "object" && !Array.isArray(val);

  for (const key of Object.keys(template)) {
    if (!(key in save)) continue;

    const tplVal = template[key];
    const saveVal = save[key];

    // Special-case: Player structure always shallow-merged
    if (key === "player" && isPlainObject(tplVal) && isPlainObject(saveVal)) {
      result.player = {
        ...tplVal,
        ...saveVal,
      };
      continue;
    }

    // Dynamic structures replaced wholesale
    const isEmptyObject =
      isPlainObject(tplVal) && Object.keys(tplVal).length === 0;
    const isEmptyArray =
      Array.isArray(tplVal) && tplVal.length === 0;

    if (isEmptyObject || isEmptyArray) {
      result[key] = saveVal ?? tplVal;
      continue;
    }

    // Recursive merge for structured objects
    if (isPlainObject(tplVal) && isPlainObject(saveVal)) {
      result[key] = mergeSave(saveVal, tplVal);
      continue;
    }

    // Primitive or array → save overwrites template
    result[key] = saveVal;
  }

  return result;
}

/* ============================================================================
 * BUFF SYSTEM
 * ============================================================================
 */

/** Exposes loaded skill definitions to external systems. */
export function getSkillDefs() {
  return skillDefs;
}

/**
 * Applies a temporary buff to the player.
 * 
 * Behavior:
 *  - If buff already active, refreshes its duration
 *  - Otherwise inserts a new active buff entry
 *  - Triggers full modifier recalculation
 */
export function addBuff(buffId, durationOverride) {
  const game = getGame();
  const def = getBuffDef(buffId);

  if (!def) {
    console.warn("[addBuff] Unknown buff:", buffId);
    return;
  }

  const duration = durationOverride ?? def.duration ?? 30000;
  const now = Date.now();

  const existing = game.activeBuffs.find(b => b.id === buffId);
  if (existing) {
    existing.expiresAt = now + duration;
  } else {
    game.activeBuffs.push({
      id: buffId,
      expiresAt: now + duration,
    });
  }

  recalculateModifiers();
}

/**
 * Grants a *permanent* buff to the player.
 * Permanent buffs:
 *  - Do not expire
 *  - Are stored in activeBuffs without expiresAt
 *  - Register a synthetic buff definition via registerDynamicBuff()
 *
 * Example use cases:
 *  - Unlock bonuses from achievements
 *  - Prestige/ascension bonuses
 */
export function applyPermanentBonus(stat, value) {
  const game = getGame();

  if (!game.activeBuffs) game.activeBuffs = [];

  const buffId = `perm_${stat}_${value}`;

  // Prevent duplicates
  const exists = game.activeBuffs.find(b => b.id === buffId);
  if (exists) return;

  // Add permanent buff entry
  game.activeBuffs.push({
    id: buffId,
    permanent: true
  });

  // Define permanent buff behavior
  registerDynamicBuff(buffId, {
    id: buffId,
    name: "Permanent Bonus",
    icon: "/icons/buffs/permanent_bonus.png",
    description: `Permanent +${value}% ${stat}.`,
    duration: null,
    modifiers: {
      [stat]: value
    }
  });

  recalculateModifiers();
}

/**
 * Removes expired temporary buffs.
 * Permanent buffs remain forever unless explicitly removed.
 */
export function cleanupExpiredBuffs() {
  const game = getGame();
  const now = Date.now();

  const before = game.activeBuffs.length;

  game.activeBuffs = game.activeBuffs.filter((b) => {
    // Keep permanent buffs always
    if (!b.expiresAt) return true;

    // Keep only active durations
    return b.expiresAt > now;
  });

  // Only recalc modifiers if buff count changed
  if (game.activeBuffs.length !== before) {
    recalculateModifiers();
  }
}

/**
 * Returns all currently active buffs.
 */
export function getActiveBuffs() {
  return game.activeBuffs;
}

/**
 * Sets the player's name.
 */
export function setPlayerName(name) {
  const game = getGame();
  game.player.name = name;
}

export function getPlayerName() {
  const game = getGame();
  return game.player.name;
}

export function getPlayerStats() {
  const game = getGame();

  if (!game.player.stats || typeof game.player.stats !== "object") {
    game.player.stats = {};
    saveGame();
  }

  return game.player.stats;
}

export function getPlayerStatById(statId) {
  const stats = getPlayerStats();

  if (!Object.prototype.hasOwnProperty.call(stats, statId)) {
    return 0;
  }

  const value = Number(stats[statId]);
  return isNaN(value) ? 0 : value;
}

export function incrementPlayerStat(statId, amount = 1) {
  const game = getGame();
  const stats = getPlayerStats();

  if (typeof amount !== "number") {
    amount = Number(amount) || 0;
  }

  if (!Object.prototype.hasOwnProperty.call(stats, statId)) {
    stats[statId] = 0;
  }

  const current = Number(stats[statId]) || 0;

  stats[statId] = current + amount;

  saveGame();
  return stats[statId];
}
