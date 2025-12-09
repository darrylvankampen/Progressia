import { saveGame } from "./gameState";

export function initBackgroundSaves() {
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      saveGame();
    } else {
      saveGame();
    }
  });
}
