import { getGame, addItem, removeItem, addXp } from "../state/gameState";
import { useNotifications } from "../../composables/useNotification";
import { getEffectiveToolStats, getFinalStats } from "../modifierEngine";

const { pushNotification } = useNotifications();

export let currentCraft = null;

// ============================================================================
// QUEUE MANAGEMENT
// ============================================================================

export function addToQueue(recipe, quantity = 1) {
  const game = getGame();

  game.craftingQueue.push({ recipe, quantity });

  // Als er niets bezig is → start direct
  if (!game.isCrafting) {
    startNextInQueue();
  }
}

function startNextInQueue() {
  const game = getGame();

  if (game.craftingQueue.length === 0) {
    currentCraft = null;
    game.isCrafting = false;
    return;
  }

  // Pak het eerstvolgende item
  const job = game.craftingQueue[0];

  craft(job.recipe, job.quantity);
}

// ============================================================================
// CORE CRAFT EXECUTION
// ============================================================================

export async function craft(recipe, quantity = 1) {
  const game = getGame();

  if (currentCraft) return; // dubbele crafts voorkomen

  if (!canCraft(recipe, quantity)) return false;

  const { speed } = getFinalStats(recipe.skill);
  const totalTime = (recipe.time * quantity) / speed;
  const start = performance.now();

  const session = {
    recipe,
    quantity,
    totalTime,
    start,
    interval: null,
  };

  currentCraft = session;
  game.isCrafting = true;

  return new Promise((resolve) => {
    session.interval = setInterval(() => {
      // Als de session vervangen/gestopt is → exit stilletjes
      if (currentCraft !== session) {
        clearInterval(session.interval);
        return resolve(false);
      }

      const now = performance.now();
      const elapsed = now - session.start;
      const remaining = Math.max(session.totalTime - elapsed, 0);

      game.craftingProgress = Math.min((elapsed / session.totalTime) * 100, 100);
      game.craftingTimeRemaining = remaining;

      if (remaining <= 0) {
        clearInterval(session.interval);

        finishCraft(session);
        resolve(true);
      }
    }, 100);
  });
}

// ============================================================================
// FINISH CRAFT
// ============================================================================

function finishCraft(session) {
  const { recipe, quantity } = session;
  const game = getGame();

  // Verwijder inputs
  for (const input of recipe.inputs) {
    removeItem(input.item, input.amount * quantity);
  }

  // Voeg outputs toe
  for (const output of recipe.outputs) {
    addItem(output.item, output.amount * quantity);
  }
  const { xp } = getFinalStats(recipe.skill);
  // XP
  if (recipe.skill && recipe.xp) {
    addXp(recipe.skill, recipe.xp * quantity * xp);
  }

  pushNotification("craft-" + recipe.id, { type: "success", message: `Crafted ${quantity}× ${recipe.name}` })

  // Verwijder deze job uit queue
  game.craftingQueue.shift();

  // Reset craft state
  resetCraftState();

  // Start volgende job
  startNextInQueue();
}

// ============================================================================
// CANCEL
// ============================================================================

export function cancelCraft() {
  const game = getGame();

  if (!currentCraft) return;

  clearInterval(currentCraft.interval);

  // verwijder de actieve job
  game.craftingQueue.shift();

  resetCraftState();
}

function resetCraftState() {
  const game = getGame();
  currentCraft = null;
  game.isCrafting = false;
  game.craftingProgress = 0;
  game.craftingTimeRemaining = 0;
}

// ============================================================================
// HELPERS
// ============================================================================

export function canCraft(recipe, qty = 1) {
  const game = getGame();
  return recipe.inputs.every((input) => {
    const have = game.inventory[input.item] || 0;
    return have >= input.amount * qty;
  });
}

export function craftOnce(r) {
  return addToQueue(r, 1);
}

export function craftX(r, x) {
  return addToQueue(r, x);
}

export function craftMax(r) {
  const max = maxCraftAmount(r);
  if (max > 0) return addToQueue(r, max);
}
