// src/game/ItemUseEngine.js
import { getGame, saveGame, removeItem, addItem } from "./state/gameState";
import { getItem } from "./utils/itemDB";
import { useNotifications } from "../composables/useNotification";

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function notify(payload) {
    const { pushNotification } = useNotifications();
    pushNotification("items", payload);
}

// ---------------------------------------------------------------------------
// State normalization
// ---------------------------------------------------------------------------
function ensureItemUseState(game) {
    // Cooldowns container
    if (!game.cooldowns) game.cooldowns = {};
    if (typeof game.cooldowns !== "object") game.cooldowns = {};

    // Player HP container (minimal, CombatEngine kan dit later uitgebreid beheren)
    if (!game.player) game.player = {};
    if (typeof game.player.hp !== "number") game.player.hp = 40;
    if (typeof game.player.maxHp !== "number") game.player.maxHp = 40;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function now() {
    return Date.now();
}

function getCooldownRemainingMs(game, key) {
    const until = game.cooldowns?.[key] ?? 0;
    return Math.max(until - now(), 0);
}

function setCooldown(game, key, durationMs) {
    game.cooldowns[key] = now() + Math.max(durationMs, 0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns whether the item can currently be used (inventory, consumable, cooldown).
 */
export function canUseItem(itemId) {
    const game = getGame();
    ensureItemUseState(game);

    const item = getItem(itemId);
    if (!item) return { ok: false, reason: "Unknown item." };

    const have = game.inventory?.[itemId] ?? 0;
    if (have <= 0) return { ok: false, reason: "Not in inventory." };

    const stats = item.stats || {};
    if (!stats.consumable) return { ok: false, reason: "Item is not usable." };

    // Cooldown (defaults)
    const cdKey = stats.cooldownKey || itemId; // per-item cooldown by default
    const cdMs = typeof stats.cooldownMs === "number" ? stats.cooldownMs : 1500; // default 1.5s

    const remaining = getCooldownRemainingMs(game, cdKey);
    if (remaining > 0) return { ok: false, reason: `On cooldown (${Math.ceil(remaining / 1000)}s).` };

    // If it heals, ensure not full HP (optional QoL)
    if (typeof stats.healAmount === "number" && stats.healAmount > 0) {
        if (game.player.hp >= game.player.maxHp) {
            return { ok: false, reason: "HP is already full." };
        }
    }

    return { ok: true, reason: null, item, cdKey, cdMs };
}

/**
 * Uses an item once. Handles healing + cooldown + inventory consumption.
 * Returns true if used.
 */
export function useItem(itemId, amount = 1) {
    const game = getGame();
    ensureItemUseState(game);

    const useCheck = canUseItem(itemId);
    if (!useCheck.ok) {
        notify({ type: "warning", message: useCheck.reason });
        return false;
    }

    const { item, cdKey, cdMs } = useCheck;
    const stats = item.stats || {};

    const useAmount = Math.max(1, Math.floor(amount));
    const have = game.inventory?.[itemId] ?? 0;
    const actualAmount = Math.min(useAmount, have);

    let used = 0;

    // Use multiple items in one call, but respect cooldown as a single lock.
    // (If you want per-item cooldown, call useItem repeatedly from UI.)
    for (let i = 0; i < actualAmount; i++) {
        // Healing
        if (typeof stats.healAmount === "number" && stats.healAmount > 0) {
            const missing = game.player.maxHp - game.player.hp;
            if (missing <= 0) break; // stop using if full

            const heal = Math.min(stats.healAmount, missing);
            game.player.hp += heal;
        }

        // Consume
        removeItem(itemId, 1);
        used++;
    }

    if (used <= 0) {
        notify({ type: "info", message: "Nothing to use right now." });
        return false;
    }

    // Apply cooldown once per use call
    setCooldown(game, cdKey, cdMs);

    saveGame();

    // Notification
    if (stats.healAmount) {
        notify({ type: "success", message: `Used ${used}× ${item.name}.` });
    } else {
        notify({ type: "success", message: `Used ${used}× ${item.name}.` });
    }

    return true;
}
