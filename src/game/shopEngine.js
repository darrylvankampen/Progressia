import { useNotifications } from "../composables/useNotification";
import generalStore from "./data/shops/general_store.json";
import { addItem, getGame, saveGame } from "./state/gameState";
import { getItem } from "./utils/itemDB";

const shops = {
    "general_store": generalStore
};

export function getShop(shopId) {
    const shop = shops[shopId];
    if (!shop) return null;

    return {
        ...shop,
        categories: shop.categories.map(cat => ({
            ...cat,
            items: cat.items.map(entry => ({
                ...entry,
                item: getItem(entry.itemId) // merge item info
            }))
        }))
    };
}

export function canBuy(entry, item) {
    const game = getGame();
    if (entry.requiresLevel && entry.skill && game.skills[entry.skill]?.level < entry.requiresLevel) {
        return {
            canBuy: false,
            reason: "level"
        };
    }

    const cost = entry.salePercent
        ? Math.floor(entry.price * (1 - entry.salePercent / 100))
        : entry.price;

    if (game.player[entry.currency] < cost) {
        return { canBuy: false, reason: "Not enough currency" };
    }

    if (entry.stock !== undefined && entry.stock !== -1) {
        if (entry.stock <= 0) {
            return { canBuy: false, reason: "Out of stock" };
        }
    }

    // 5. Faction lock
    // if (entry.requiresFaction) {
    //     if (!game.factions?.[entry.requiresFaction]?.unlocked) {
    //         return { ok: false, reason: "Faction required" };
    //     }
    // }

    return { canBuy: true };
}

export function buyFromShop(shopId, categoryId, itemId) {
    const game = getGame();
    const shop = getShop(shopId);

    if (!shop) return { bought: false, reason: "Shop not found" };

    const category = shop.categories.find(cat => cat.id === categoryId);
    if (!category) return { bought: false, reason: "Category not found" };

    const entry = category.items.find(item => item.itemId === itemId);
    if (!entry) return { bought: false, reason: "Item not found" };

    const item = entry.item;

    const check = canBuy(entry, item);
    if (!check.canBuy) return { bought: false, reason: check.reason };

    const cost = entry.salePercent
        ? Math.floor(entry.price * (1 - entry.salePercent / 100))
        : entry.price;

    game.player[entry.currency] -= cost;

    if (entry.stock && entry.stock > 0) {
        entry.stock--;
    }

    addItem(itemId, 1);
    saveGame();
    return { bought: true, itemId };
}