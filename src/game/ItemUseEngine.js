// src/game/ItemUseEngine.js
import { getGame, saveGame, removeItem } from "./state/gameState";
import { getItem } from "./utils/itemDB";
import { useNotifications } from "../composables/useNotification";

// USE HANDLERS
const USE_HANDLERS = {
    heal({ game, use }) {
        const missing = game.player.maxHp - game.player.hp;
        if (missing <= 0) {
            return { ok: false, reason: "HP is already full." };
        }

        const heal = Math.min(use.amount ?? 0, missing);
        game.player.hp += heal;

        return {
            ok: true,
            message: `Healed ${heal} HP.`
        };
    }
}

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

    if (!item.use || !item.use.type) {
        return { ok: false, reason: "Item cannot be used." };
    }

    if (!USE_HANDLERS[item.use.type]) {
        return { ok: false, reason: "Item use is not implemented." };
    }
    const stats = item.stats || {};

    // Cooldown (defaults)
    const cdKey = stats.cooldownKey || itemId; // per-item cooldown by default
    const cdMs = typeof stats.cooldownMs === "number" ? stats.cooldownMs : 1500; // default 1.5s

    const remaining = getCooldownRemainingMs(game, cdKey);
    if (remaining > 0) return { ok: false, reason: `On cooldown (${Math.ceil(remaining / 1000)}s).` };

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

    const handler = USE_HANDLERS[item.use.type];
    if (!handler) {
        notify({ type: "warning", message: "This item does nothing." });
        return false;
    }

    let used = 0;

    for (let i = 0; i < actualAmount; i++) {
        const result = handler({
            game,
            item,
            use: item.use
        });

        if (!result?.ok) {
            notify({ type: "warning", message: result?.reason });
            break;
        }

        removeItem(itemId, 1);
        used++;

        if (result.message) {
            notify({ type: "info", message: result.message });
        }
    }

    if (used <= 0) {
        notify({ type: "info", message: "Nothing to use right now." });
        return false;
    }

    // Apply cooldown once per use call
    setCooldown(game, cdKey, cdMs);

    saveGame();

    notify({
        type: "success",
        message: `Used ${used}× ${item.name}.`
    });

    return true;
}
