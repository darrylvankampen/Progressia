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

// export function addToQueue(recipe, quantity = 1) {
//   const game = getGame();
//   ensureCraftingState(game);

//   const qty = Math.max(quantity);

//   if (!recipe || qty <= 0) return false;

//   const q = game.crafting.queue;
//   const last = q.length > 0 ? q[q.length - 1] : null;

//   if (last && isSameRecipe(last.recipe, recipe)) {
//     last.quantity = Math.max(1, Math.floor(last.quantity) + qty);
//     notify({
//       type: "info",
//       message: `Queue updated: ${recipe.name} is now ${last.quantity}×.`,
//     });
//     // If nothing is currently crafting, immediately try to start
//     if (!game.crafting.active) startNextInQueue();
//     saveGame();
//     return true;
//   }

//   // Push job into queue
//   game.crafting.queue.push({
//     recipe,
//     quantity: qty,
//   });

//   // If nothing is currently crafting, immediately try to start
//   if (!game.crafting.active) {
//     startNextInQueue();
//   }

//   saveGame();
//   return true;
// }

export function addToQueue(recipe, quantity = 1) {
  const game = getGame();
  ensureCraftingState(game);

  const qty = Math.max(1, Math.floor(quantity));
  if (!recipe || qty <= 0) return false;

  // ------------------------------------------------------------
  // A) If currently crafting the SAME recipe → extend active craft
  // ------------------------------------------------------------
  const active = game.crafting.active;
  if (active && isSameRecipe(active.recipe, recipe)) {
    // Need extra inputs now (because we reserve at start)
    const extraReserved = computeReservedInputs(recipe, qty);

    // If we can't afford extra inputs, refuse (no silent partial)
    if (!subtractInventoryOrFail(game, extraReserved)) {
      notify({ type: "warning", message: "Not enough materials to add more to the active craft." });
      saveGame();
      return false;
    }

    // Merge reserved inputs (sum by item id)
    if (!Array.isArray(active.reservedInputs)) active.reservedInputs = [];
    for (const add of extraReserved) {
      const existing = active.reservedInputs.find(x => x.item === add.item);
      if (existing) existing.amount += add.amount;
      else active.reservedInputs.push({ ...add });
    }

    // Extend quantity + totalTime without resetting startAt
    const oldQty = active.quantity;
    active.quantity = Math.max(1, Math.floor(oldQty) + qty);

    const extraTime = computeTotalTimeMs(recipe, qty);
    active.totalTime = Math.max(0, (active.totalTime || 0) + extraTime);

    // Keep remaining/progress consistent immediately
    const elapsed = Math.max(getNow() - active.startAt, 0);
    game.craftingTimeRemaining = Math.max(active.totalTime - elapsed, 0);
    game.craftingProgress = active.totalTime > 0
      ? Math.min((elapsed / active.totalTime) * 100, 100)
      : 100;

    notify({
      type: "info",
      message: `Active craft updated: ${recipe.name} is now ${active.quantity}×.`,
    });

    saveGame();
    return true;
  }

  // ------------------------------------------------------------
  // B) If craft is active but different → merge into NEXT job (queue[0])
  // ------------------------------------------------------------
  const q = game.crafting.queue;

  if (active && q.length > 0 && isSameRecipe(q[0].recipe, recipe)) {
    q[0].quantity = Math.max(1, Math.floor(q[0].quantity) + qty);

    notify({
      type: "info",
      message: `Queue updated: ${recipe.name} is now ${q[0].quantity}× (next).`,
    });

    saveGame();
    return true;
  }

  // ------------------------------------------------------------
  // C) Otherwise: merge with last entry (nice cleanup)
  // ------------------------------------------------------------
  const last = q.length > 0 ? q[q.length - 1] : null;

  if (last && isSameRecipe(last.recipe, recipe)) {
    last.quantity = Math.max(1, Math.floor(last.quantity) + qty);

    notify({
      type: "info",
      message: `Queue updated: ${recipe.name} is now ${last.quantity}×.`,
    });

    // If nothing is currently crafting, immediately try to start
    if (!game.crafting.active) startNextInQueue();

    saveGame();
    return true;
  }

  // ------------------------------------------------------------
  // D) New job
  // ------------------------------------------------------------
  q.push({ recipe, quantity: qty });

  if (!game.crafting.active) startNextInQueue();

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

  // Reserved inputs at start (prevents exploits)
  const reserved = recipe.inputs.map(input => ({
    item: input.item,
    amount: input.amount * qty,
  }));
  // Remove items now; if something goes wrong, rollback
  for (const r of reserved) {
    const have = game.inventory?.[r.item] || 0;
    if (have < r.amount) return false; // safety (shouldn't happen due to canCraft)
  }

  for (const r of reserved) removeItem(r.item, r.amount);

  const totalTime = computeTotalTimeMs(recipe, qty);

  // Snapshot active craft (timestamp-based, offline-safe)
  game.crafting.active = {
    recipeId: recipe.id ?? null,
    recipe,
    quantity: qty,
    startAt: getNow(),
    totalTime,
    reservedInputs: reserved,
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

  // If reserved inputs are missing for some reason, cancel safely
  if (!active.reservedInputs?.length) {
    notify({ type: "warning", message: `Craft cancelled: missing reserved materials for ${recipe.name}.` });
    game.crafting.queue.shift();
    game.crafting.active = null;
    game.isCrafting = false;
    resetCraftUI(game);
    saveGame();
    startNextInQueue();
    return false;
  }

  // ---------------------------------------------------------------------------
  // Burn calculation (PER ITEM)
  // ---------------------------------------------------------------------------
  const hasBurn = !!(recipe.burnLevel && recipe.failOutputs?.length);
  const burnChance = hasBurn ? getBurnChance(recipe) : 0;

  let successCount = quantity;
  let burnCount = 0;

  if (hasBurn && burnChance > 0) {
    successCount = 0;
    burnCount = 0;

    for (let i = 0; i < quantity; i++) {
      if (Math.random() < burnChance) burnCount++;
      else successCount++;
    }
  }

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------
  if (burnCount > 0) {
    for (const output of recipe.failOutputs) {
      addItem(output.item, output.amount * burnCount);
    }
  }

  if (successCount > 0) {
    for (const output of recipe.outputs) {
      addItem(output.item, output.amount * successCount);
    }
  }

  // ---------------------------------------------------------------------------
  // XP calculation
  // ---------------------------------------------------------------------------
  if (recipe.skill && recipe.xp) {
    const { xp } = getFinalStats(recipe.skill);
    const xpMult = xp ?? 1;

    const successXp = recipe.xp * successCount;
    const burnXp = Math.floor(recipe.xp * 0.25) * burnCount;

    addXp(recipe.skill, (successXp + burnXp) * xpMult);
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  if (burnCount > 0 && successCount > 0) {
    notify({
      type: "warning",
      message: `Cooked ${successCount}× successfully, burned ${burnCount}× ${recipe.name}.`,
    });
  } else if (burnCount > 0) {
    notify({
      type: "warning",
      message: `You burn ${burnCount}× ${recipe.name}.`,
    });
  } else {
    notify({
      type: "success",
      message: `Crafted ${successCount}× ${recipe.name}`,
    });
  }

  // ---------------------------------------------------------------------------
  // Advance queue
  // ---------------------------------------------------------------------------
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

  const active = game.crafting.active
  if (!active) return false;

  const recipe = active.recipe;
  const policy = getCancelPolicy(recipe);

  const elapsed = Math.max(getNow() - active.startAt, 0);
  const progress = active.totalTime > 0 ? Math.min(elapsed / active.totalTime, 1) : 1;

  const reserved = active.reservedInputs ?? [];
  const refunds = [];

  if (policy === "full") {
    // REFUND EVERYTHING
    for (const r of reserved) {
      addItem(r.item, r.amount);
      refunds.push({ item: r.item, amount: r.amount });
    }
  } else if (policy === "partial") {
    // proportional refund: remaining fraction
    const remainingFrac = Math.max(1 - progress, 0);
    for (const r of reserved) {
      const amt = Math.floor(r.amount * remainingFrac);
      if (amt > 0) {
        addItem(r.item, amt);
        refunds.push({ item: r.item, amount: amt });
      }
    }
  }

  game.crafting.queue.shift();
  game.crafting.active = null;
  game.isCrafting = false;
  resetCraftUI(game);

  saveGame();
  const refundText = formatRefund(refunds);
  notify({
    type: "info",
    message:
      policy === "none"
        ? "Craft cancelled."
        : refundText
          ? `Craft cancelled. Refunded: ${refundText}.`
          : "Craft cancelled. No materials refunded.",
  });

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
  if (!hasRequiredLevel(recipe)) return false;

  return recipe.inputs.every((input) => {
    const have = game.inventory?.[input.item] || 0;
    return have >= input.amount * q;
  });
}

export function maxCraftAmount(recipe) {
  const game = getGame();
  ensureCraftingState(game);

  if (!recipe?.inputs?.length) return 0;
  if (!hasRequiredLevel(recipe)) return 0;

  let max = Infinity;
  for (const input of recipe.inputs) {
    const have = game.inventory?.[input.item] || 0;
    max = Math.min(max, Math.floor(have / input.amount));
  }

  return Math.max(max, 0);
}

function hasRequiredLevel(recipe) {
  const game = getGame();
  ensureCraftingState(game);

  const level = game.skills?.[recipe.skill]?.level || 0;
  return level >= recipe.requiredLevel;
}

function getBurnChance(recipe) {
  const game = getGame();
  ensureCraftingState(game);

  const playerLevel = game.skills?.[recipe.skill]?.level || 0;
  const burnLevel = recipe.burnLevel || 0;

  if (playerLevel >= burnLevel) return 0;

  const diff = burnLevel - playerLevel;
  return Math.min(0.35, diff * 0.02);
}

// Convenience wrappers
export const craftOnce = (recipe) => canCraft(recipe, 1) && addToQueue(recipe, 1);
export const craftX = (recipe, x) => canCraft(recipe, x) && addToQueue(recipe, x);
export const craftMax = (recipe) => {
  const max = maxCraftAmount(recipe);
  return max > 0 && addToQueue(recipe, max);
};

// Cancel helpers
function getCancelPolicy(recipe) {
  return recipe?.cancelPolicy ?? "none";
}

function formatRefund(refundList = []) {
  return refundList.filter(x => x.amount > 0)
    .map(x => `${x.amount}x ${x.item}`)
    .join(", ");
}

// Same Recipe helper
function isSameRecipe(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id) return a.id === b.id;
  return a.name === b.name && a.skill === b.skill;
}

function computeReservedInputs(recipe, qty) {
  return (recipe.inputs ?? []).map(input => ({
    item: input.item,
    amount: (input.amount ?? 0) * qty,
  }));
}

function subtractInventoryOrFail(game, reserved) {
  for (const r of reserved) {
    const have = game.inventory?.[r.item] || 0;
    if (have < r.amount) return false;
  }
  for (const r of reserved) removeItem(r.item, r.amount);
  return true;
}