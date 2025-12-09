// src/game/prestige/prestigeEngine.js

import { getGame, saveGame } from "../state/gameState";
import { getPrestigeDefs, getPrestigeUpgrade } from "./prestigeDB";

/**
 * =============================================================================
 *  PROGRESSIA — PRESTIGE ENGINE
 * =============================================================================
 *
 * Handles:
 *  - Reading prestige upgrade definitions from JSON
 *  - Tracking player-owned prestige levels
 *  - Cost scaling (baseCost * costMultiplier^level)
 *  - Applying effects (offline efficiency, XP%, speed%, loot%, etc.)
 *  - Buying upgrades and updating game state
 *  - Providing modifiers to other modules
 *
 * Prestige data structure:
 *  prestiges.json → { prestigeUpgrades: [ { id, category, bonusPerLevel, ... } ] }
 *
 * Stored player data:
 *  game.player.prestige[id] = numberOfLevelsPurchased
 *
 * =============================================================================
 */


/* ---------------------------------------------------------
   1. UTILITY — Get player prestige level
--------------------------------------------------------- */
export function getPrestigeLevel(id) {
    const game = getGame();
    return game.player?.prestige?.[id] ?? 0;
}


/* ---------------------------------------------------------
   2. UTILITY — Compute cost for next level
--------------------------------------------------------- */
export function getPrestigeCost(id) {
    const upgrade = getPrestigeUpgrade(id);
    if (!upgrade) return null;

    const level = getPrestigeLevel(id);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}


/* ---------------------------------------------------------
   3. BUY PRESTIGE UPGRADE
--------------------------------------------------------- */
export function purchasePrestigeUpgrade(id) {
    const game = getGame();
    const upgrade = getPrestigeUpgrade(id);
    if (!upgrade) {
        console.warn(`[Prestige] Unknown upgrade ID: ${id}`);
        return false;
    }

    const level = getPrestigeLevel(id);

    // Max level?
    if (level >= upgrade.maxLevel) {
        console.warn(`[Prestige] Upgrade '${id}' is already maxed`);
        return false;
    }

    const cost = getPrestigeCost(id);

    // Not enough currency?
    if (game.player.gold < cost) {
        console.warn(`[Prestige] Not enough gold to buy '${id}'`);
        return false;
    }

    // Deduct cost
    game.player.gold -= cost;

    // Increase level
    game.player.prestige[id] = level + 1;

    saveGame();
    return true;
}


/* ---------------------------------------------------------
   4. GET TOTAL BONUS FOR A PRESTIGE UPGRADE
--------------------------------------------------------- */
export function getPrestigeBonus(id) {
    const upgrade = getPrestigeUpgrade(id);
    if (!upgrade) return 0;

    const level = getPrestigeLevel(id);
    return level * (upgrade.bonusPerLevel ?? 0);
}


/* ---------------------------------------------------------
   5. SPECIAL EFFECT: Offline Efficiency Bonus
--------------------------------------------------------- */
export function getOfflineEfficiencyBonus() {
    return getPrestigeBonus("offline_efficiency"); // reads from prestiges.json
}


/* ---------------------------------------------------------
   6. GLOBAL MODIFIER AGGREGATION
--------------------------------------------------------- */
/**
 * Returns all prestige modifiers as a single object.
 * This allows the modifier engine to easily integrate prestige bonuses.
 *
 * Example output:
 *   {
 *     xp_global_percent: 0.12,
 *     action_speed_percent: 0.25,
 *     rare_drop_percent: 0.05
 *   }
 */
export function getPrestigeModifiers() {
    const defs = getPrestigeDefs();
    const output = {};

    for (const upgrade of defs) {
        const level = getPrestigeLevel(upgrade.id);
        if (level <= 0) continue;

        const bonus = level * upgrade.bonusPerLevel;

        switch (upgrade.effectType) {
            case "offline_efficiency":
                // handled separately in offline handler
                break;

            case "xp_percent_global":
                output.xp_global_percent = (output.xp_global_percent ?? 0) + bonus;
                break;

            case "amount_percent_global":
                output.amount_global_percent = (output.amount_global_percent ?? 0) + bonus;
                break;

            case "rare_drop_percent":
                output.rare_drop_percent = (output.rare_drop_percent ?? 0) + bonus;
                break;

            case "speed_percent_global":
                output.speed_global_percent = (output.speed_global_percent ?? 0) + bonus;
                break;

            default:
                console.warn(`[Prestige] Unknown effectType: ${upgrade.effectType}`);
                break;
        }
    }

    return output;
}


/* ---------------------------------------------------------
   7. RESET PRESTIGE (optional, for a future prestige reset system)
--------------------------------------------------------- */
export function resetPrestige() {
    const game = getGame();
    game.player.prestige = {};
    saveGame();
}
