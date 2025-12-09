import { getGame } from "../state/gameState";
import { addItem, removeItem, addXp } from "../state/gameState";
import { useNotifications } from "../../composables/useNotification";

const { pushNotification } = useNotifications();

export function canCraft(recipe, quantity = 1) {
  const game = getGame();

  for (const input of recipe.inputs) {
    const required = input.amount * quantity;
    const have = game.inventory[input.item] || 0;

    if (have < required) {
      return false;
    }
  }

  return true;
}

export function maxCraftAmount(recipe) {
  const game = getGame();

  let max = Infinity;

  for (const input of recipe.inputs) {
    const have = game.inventory[input.item] || 0;
    const possible = Math.floor(have / input.amount);

    max = Math.min(max, possible);
  }

  return max === Infinity ? 0 : max;
}

export async function craft(recipe, quantity = 1) {
  const game = getGame();

  if (!canCraft(recipe, quantity)) return false;

  const totalTime = recipe.time * quantity; // ms
  const start = performance.now();

  game.craftingProgress = 0;
  game.craftingTimeRemaining = totalTime;

  return new Promise((resolve) => {

    function tick() {
      const now = performance.now();
      const elapsed = now - start;

      const remaining = Math.max(totalTime - elapsed, 0);

      game.craftingProgress = Math.min((elapsed / totalTime) * 100, 100);
      game.craftingTimeRemaining = remaining;

      if (elapsed >= totalTime) {
        finishCraft(recipe, quantity);
        resolve(true);
      } else {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  });
}

function finishCraft(recipe, quantity) {
  const game = getGame();

  // Remove inputs
  for (const input of recipe.inputs) {
    removeItem(input.item, input.amount * quantity, 'use');
  }

  // Add outputs
  for (const output of recipe.outputs) {
    addItem(output.item, output.amount * quantity);
  }

  // XP
  if (recipe.skill && recipe.xp) {
    addXp(recipe.skill, recipe.xp * quantity);
  }

  // Notify
  pushNotification(
    "craft-" + recipe.id,
    `Crafted ${quantity} × ${recipe.name}`
  );

  // Reset progress
  game.craftingProgress = 0;
}



export function craftOnce(recipe) {
  return craft(recipe, 1);
}

export function craftX(recipe, amount) {
  return craft(recipe, amount);
}

export function craftMax(recipe) {
  const max = maxCraftAmount(recipe);
  if (max > 0) return craft(recipe, max);
  return false;
}
