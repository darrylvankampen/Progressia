import { saveGame } from "./gameState";

export function startAutosave(interval = 5000) {
  setInterval(() => {
    saveGame();
  }, interval);
}
