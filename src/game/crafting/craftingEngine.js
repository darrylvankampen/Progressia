import { getGame, saveGame, addItem, removeItem, addXp } from "../state/gameState";
import { useNotifications } from "../../composables/useNotification";
import { getFinalStats } from "../modifierEngine";

// Runtime-only guard (voorkomt dubbele finish in dezelfde tick)
let finishing = false;

function notify(payload) {
  const { pushNotification } = useNotifications();
  pushNotification("crafting", payload);
}

// ============================================================================
// STATE HELPERS
// ============================================================================

function ensureCraftingState(game) {
  if (!game.crafting) game.crafting = { active: null, queue: [] };
  if (!Array.isArray(game.crafting.queue)) game.crafting.queue = [];
  if (typeof game.crafting.active === "undefined") game.crafting.active = null;

  game.isCrafting = !!game.crafting.active;

  if (typeof game.craftingProgress !== "number") game.craftingProgress = 0;
  if (typeof game.craftingTimeRemaining !== "number") game.craftingTimeRemaining = 0;
}

function getNow() {
  return Date.now();
}

function getActiveRecipe(game) {
  return game.crafting.active?.recipe ?? null;
}

function computeTotalTimeMs(recipe, quantity) {
  const { speed } = getFinalStats(recipe.skill);
  const spd = Math.max(speed || 1, 0.0001);
  return (recipe.time * quantity) / spd;
}

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

  if (!recipe || !quantity || quantity <= 0) return false;

  game.crafting.queue.push({ recipe, quantity: Math.floor(quantity) });

  if (!game.crafting.active) {
    startNextInQueue(); // deze doet nu ook “skip invalid jobs”
  }
  saveGame();
  return true;
}

export function startNextInQueue() {
  const game = getGame();
  ensureCraftingState(game);

  // Als er al iets actief is, niets doen
  if (game.crafting.active) {
    game.isCrafting = true;
    return true;
  }

  // Zolang er jobs staan en er niets actief is: probeer te starten
  while (game.crafting.queue.length > 0 && !game.crafting.active) {
    const job = game.crafting.queue[0];

    const ok = startCraft(job.recipe, job.quantity);

    // Als startCraft faalt (meestal canCraft=false): verwijder job en ga door
    if (!ok) {
      notify({
        type: "warning",
        message: `Removed from queue: cannot craft ${job?.recipe?.name ?? "item"} (missing materials / invalid recipe).`,
      });
      game.crafting.queue.shift();
      saveGame();
      continue;
    }

    // Gelukt → active is gezet
    saveGame();
    return true;
  }

  // Geen queue meer
  game.crafting.active = null;
  game.isCrafting = false;
  resetCraftUI(game);
  saveGame();
  return false;
}

// ============================================================================
// CORE START
// ============================================================================

export function startCraft(recipe, quantity = 1) {
  const game = getGame();
  ensureCraftingState(game);

  // Als er al iets actief is: niet opnieuw starten
  if (game.crafting.active) return false;

  const qty = Math.floor(quantity);
  if (!canCraft(recipe, qty)) return false;

  const totalTime = computeTotalTimeMs(recipe, qty);
  const startAt = getNow();

  game.crafting.active = {
    recipeId: recipe.id ?? null,
    recipe,
    quantity: qty,
    startAt,
    totalTime,
  };

  game.isCrafting = true;

  // UI init
  game.craftingProgress = 0;
  game.craftingTimeRemaining = totalTime;

  saveGame();
  return true;
}

// ============================================================================
// TICK / PROGRESS (call from loop/UI interval)
// ============================================================================

/**
 * Tick function: houdt UI progress bij en rondt craft(s) af wanneer tijd verstreken is.
 * Aanroepen bijv. elke 100–250ms vanuit je main loop of een UI timer.
 */
export function tickCrafting() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) {
    game.isCrafting = false;
    resetCraftUI(game);
    return false;
  }

  const now = getNow();
  const elapsed = Math.max(now - active.startAt, 0);
  const remaining = Math.max(active.totalTime - elapsed, 0);

  // UI velden
  game.craftingTimeRemaining = remaining;
  game.craftingProgress =
    active.totalTime > 0 ? Math.min((elapsed / active.totalTime) * 100, 100) : 100;

  // Klaar?
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

/**
 * Helper voor UI: geeft progress state terug zonder side effects.
 * (Handig als je UI liever geen tick aanroept.)
 */
export function getCraftingStatus() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) {
    return { isCrafting: false, progress: 0, remaining: 0, recipe: null, quantity: 0 };
  }

  const now = getNow();
  const elapsed = Math.max(now - active.startAt, 0);
  const remaining = Math.max(active.totalTime - elapsed, 0);
  const progress = active.totalTime > 0 ? Math.min((elapsed / active.totalTime) * 100, 100) : 100;

  return {
    isCrafting: true,
    progress,
    remaining,
    recipe: active.recipe,
    quantity: active.quantity,
  };
}

// ============================================================================
// FINISH
// ============================================================================

export function finishActiveCraft() {
  const game = getGame();
  ensureCraftingState(game);

  const active = game.crafting.active;
  if (!active) return false;

  const recipe = getActiveRecipe(game);
  const quantity = active.quantity;

  if (!recipe || !quantity) {
    game.crafting.active = null;
    game.isCrafting = false;
    resetCraftUI(game);
    saveGame();
    return false;
  }

  if (!canCraft(recipe, quantity)) {
    notify({ type: "warning", message: `Craft cancelled: missing materials for ${recipe.name}.` });

    game.crafting.queue.shift();
    game.crafting.active = null;
    game.isCrafting = false;
    resetCraftUI(game);

    saveGame();
    startNextInQueue();
    return false;
  }

  for (const input of recipe.inputs) {
    removeItem(input.item, input.amount * quantity);
  }

  for (const output of recipe.outputs) {
    addItem(output.item, output.amount * quantity);
  }

  if (recipe.skill && recipe.xp) {
    const { xp } = getFinalStats(recipe.skill);
    addXp(recipe.skill, recipe.xp * quantity * (xp ?? 1));
  }

  notify({ type: "success", message: `Crafted ${quantity}× ${recipe.name}` });

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
// HELPERS
// ============================================================================

export function canCraft(recipe, qty = 1) {
  const game = getGame();
  ensureCraftingState(game);

  const q = Math.max(Math.floor(qty || 0), 0);
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
    const possible = Math.floor(have / input.amount);
    if (possible < max) max = possible;
  }

  return Math.max(max, 0);
}

export function craftOnce(recipe) {
  if (!canCraft(recipe, 1)) return false;
  return addToQueue(recipe, 1);
}

export function craftX(recipe, x) {
  const qty = Math.floor(x);
  if (!canCraft(recipe, qty)) return false;
  return addToQueue(recipe, qty);
}

export function craftMax(recipe) {
  const max = maxCraftAmount(recipe);
  if (max > 0) return addToQueue(recipe, max);
  return false;
}
