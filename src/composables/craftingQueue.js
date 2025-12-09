import { getGame } from "../game/state/gameState";
import { craft } from "../game/crafting/craftingEngine";

let isProcessing = false;

export function addToQueue(recipe, quantity = 1) {
  const game = getGame();

  game.craftingQueue.push({
    id: recipe.id,
    recipe,
    quantity,
    done: false,
  });

  processQueue();
}

async function processQueue() {
  if (isProcessing) return;

  const game = getGame();
  const queue = game.craftingQueue;

  isProcessing = true;

  while (queue.length > 0) {
    const job = queue[0];

    // Craft the job
    await craft(job.recipe, job.quantity);

    job.done = true;
    queue.shift(); // remove finished job
  }

  isProcessing = false;
}
