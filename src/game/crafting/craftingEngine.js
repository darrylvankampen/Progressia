// ============================================================================
// CRAFTING ENGINE
// Handles queue-based crafting with offline-safe timing (timestamp driven)
// ============================================================================

import { getGame, saveGame, addItem, removeItem, addXp } from "../state/gameState";
import { useNotifications } from "../../composables/useNotification";
import { getFinalStats } from "../modifierEngine";

// Guard to prevent finishing the same craft multiple times in one tick
let finishing = false;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

function notify(payload) {
  const { pushNotification } = useNotifications();
  pushNotification("crafting", payload);
}

// ============================================================================
// STATE NORMALIZATION
// Ensures crafting-related state always exists and is consistent
// ============================================================================

function ensureCraftingState(game) {
  // Ensure crafting container exists
  if (!game.crafting) game.crafting = { active: null, queue: [] };

  // Ensure queue is always an array
  if (!Array.isArray(game.crafting.queue)) game.crafting.queue = [];

  // Explicitly normalize active state
  if (typeof game.crafting.active === "undefined") game.crafting.active = null;

  // Derived flag used by UI
  game.isCrafting = !!game.crafting.active;

  // UI-facing progress fields
  if (typeof game.craftingProgress !== "number") game.craftingProgress = 0;
  if (typeof game.craftingTimeRemaining !== "number") game.craftingTimeRemaining = 0;
}

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

function getNow() {
  return Date.now();
}

// Returns the active recipe snapshot (or null)
function getActiveRecipe(game) {
  return game.crafting.active?.recipe ?? null;
}

// Computes total crafting duration, including speed modifiers
function computeTotalTimeMs(recipe, quantity) {
  const { speed } = getFinalStats(recipe.skill);
  const effectiveSpeed = Math.max(speed || 1, 0.0001); // prevent division by zero
  return (recipe.time * quantity) / effectiveSpeed;
}

// Resets UI progress state when no craft is active
function resetCraftUI(game) {
  game.craftingProgress = 0;
  game.craftingTimeRemaining = 0;
}

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

export function addToQueue(recipe, quantity = 1) {
  const game = getGame();
  ensureCraftingState(game);

  if (!recipe || quantity <= 0) return false;

  // Push job into queue
  game.crafting.queue.push({
    recipe,
    quantity: Math.floor(quantity),
  });

  // If nothing is currently crafting, immediately try to start
  if (!game.crafting.active) {
    startNextInQueue();
  }

  saveGame();
  return true;
}

/**
 * Attempts to start the next valid craft in the queue.
 * Automatically skips invalid / uncraftable jobs.
 */
export function startNextInQueue() {
  const game = getGame();
  ensureCraftingState(game);

  // If a craft is already running, do nothing
  if (game.crafting.active) {
    game.isCrafting = true;
    return true;
  }

  // Try jobs until one successfully starts or queue is empty
  while (game.crafting.queue.length > 0 && !game.crafting.active) {
    const job = game.crafting.queue[0];
    const started = startCraft(job.recipe, job.quantity);

    // Failed start usually means missing materials or invalid recipe
    if (!started) {
      notify({
        type: "warning",
        message: `Removed from queue: cannot craft ${job?.recipe?.name ?? "item"}.`,
      });
      game.crafting.queue.shift();
      saveGame();
      continue;
    }

    // Successfully started a craft
    saveGame();
    return true;
  }

  // Queue exhausted → idle state
  game.crafting.active = null;
  game.isCrafting = false;
  resetCraftUI(game);
  saveGame();
  return false;
}

// ============================================================================
// CRAFT INITIALIZATION
// ============================================================================

export function startCraft(recipe, quantity = 1) {
  const game = getGame();
  ensureCraftingState(game);

  // Prevent overlapping crafts
  if (game.crafting.active) return false;

  const qty = Math.floor(quantity);
  if (!canCraft(recipe, qty)) return false;

  const totalTime = computeTotalTimeMs(recipe, qty);

  // Snapshot active craft (timestamp-based, offline-safe)
  game.crafting.active = {
    recipeId: recipe.id ?? null,
    recipe,
    quantity: qty,
    startAt: getNow(),
    totalTime,
  };

  game.isCrafting = true;
  game.craftingProgress = 0;
  game.craftingTimeRemaining = totalTime;

  saveGame();
  return true;
}

// ============================================================================
// TICK HANDLING
// Advances active craft and finalizes when complete
// ============================================================================

export function tickCrafting() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) {
    game.isCrafting = false;
    resetCraftUI(game);
    return false;
  }

  const elapsed = Math.max(getNow() - active.startAt, 0);
  const remaining = Math.max(active.totalTime - elapsed, 0);

  // Update UI-facing values
  game.craftingTimeRemaining = remaining;
  game.craftingProgress =
    active.totalTime > 0
      ? Math.min((elapsed / active.totalTime) * 100, 100)
      : 100;

  // Finalize craft exactly once
  if (remaining <= 0 && !finishing) {
    finishing = true;
    try {
      finishActiveCraft();
    } finally {
      finishing = false;
    }
    return true;
  }

  return false;
}

// ============================================================================
// READ-ONLY STATUS (UI helper)
// ============================================================================

export function getCraftingStatus() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) {
    return { isCrafting: false, progress: 0, remaining: 0, recipe: null, quantity: 0 };
  }

  const elapsed = Math.max(getNow() - active.startAt, 0);
  const remaining = Math.max(active.totalTime - elapsed, 0);

  return {
    isCrafting: true,
    progress: Math.min((elapsed / active.totalTime) * 100, 100),
    remaining,
    recipe: active.recipe,
    quantity: active.quantity,
  };
}

// ============================================================================
// FINALIZATION
// Applies results and advances the queue
// ============================================================================

export function finishActiveCraft() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) return false;

  const recipe = getActiveRecipe(game);
  const quantity = active.quantity;

  // Safety fallback (corrupt state)
  if (!recipe || !quantity) {
    game.crafting.active = null;
    game.isCrafting = false;
    resetCraftUI(game);
    saveGame();
    return false;
  }

  // Validate materials again before consuming
  if (!canCraft(recipe, quantity)) {
    notify({
      type: "warning",
      message: `Craft cancelled: missing materials for ${recipe.name}.`,
    });

    game.crafting.queue.shift();
    game.crafting.active = null;
    game.isCrafting = false;
    resetCraftUI(game);

    saveGame();
    startNextInQueue();
    return false;
  }

  // Consume inputs
  for (const input of recipe.inputs) {
    removeItem(input.item, input.amount * quantity);
  }

  // Produce outputs
  for (const output of recipe.outputs) {
    addItem(output.item, output.amount * quantity);
  }

  // Award XP
  if (recipe.skill && recipe.xp) {
    const { xp } = getFinalStats(recipe.skill);
    addXp(recipe.skill, recipe.xp * quantity * (xp ?? 1));
  }

  notify({ type: "success", message: `Crafted ${quantity}× ${recipe.name}` });

  // Advance queue
  game.crafting.queue.shift();
  game.crafting.active = null;
  game.isCrafting = false;
  resetCraftUI(game);

  saveGame();
  startNextInQueue();
  return true;
}

// ============================================================================
// CANCEL
// ============================================================================

export function cancelCraft() {
  const game = getGame();
  ensureCraftingState(game);

  if (!game.crafting.active) return false;

  game.crafting.queue.shift();
  game.crafting.active = null;
  game.isCrafting = false;
  resetCraftUI(game);

  saveGame();
  notify({ type: "info", message: "Craft cancelled." });

  startNextInQueue();
  return true;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function canCraft(recipe, qty = 1) {
  const game = getGame();
  ensureCraftingState(game);

  const q = Math.max(Math.floor(qty), 0);
  if (!recipe || q <= 0) return false;

  return recipe.inputs.every((input) => {
    const have = game.inventory?.[input.item] || 0;
    return have >= input.amount * q;
  });
}

export function maxCraftAmount(recipe) {
  const game = getGame();
  ensureCraftingState(game);

  if (!recipe?.inputs?.length) return 0;

  let max = Infinity;
  for (const input of recipe.inputs) {
    const have = game.inventory?.[input.item] || 0;
    max = Math.min(max, Math.floor(have / input.amount));
  }

  return Math.max(max, 0);
}

// Convenience wrappers
export const craftOnce = (recipe) => canCraft(recipe, 1) && addToQueue(recipe, 1);
export const craftX = (recipe, x) => canCraft(recipe, x) && addToQueue(recipe, x);
export const craftMax = (recipe) => {
  const max = maxCraftAmount(recipe);
  return max > 0 && addToQueue(recipe, max);
};
