import prestigeData from "../data/prestiges.json";
import { getGame } from "../state/gameState";

let prestigeDefs = prestigeData.prestigeUpgrades || [];

export function getPrestigeDefs() {
    return prestigeDefs;
}

export function getPrestigeUpgrade(id) {
    return prestigeDefs.find(u => u.id === id);
}

export function getPrestiges() {
    return getGame().player.prestige;
}