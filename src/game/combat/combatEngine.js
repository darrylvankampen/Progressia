// src/game/CombatEngine.js

import { getGame, saveGame, addItem, addXp } from "../state/gameState";
import { getItem } from "../utils/itemDB";
import { getEnemy } from "../utils/enemyDB";
import { useNotifications } from "../../composables/useNotification";
import { COMBAT_TRIANGLE, ELEMENT_MATRIX, FAMILY_MATRIX } from "./typeMatrix";

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------

// fallback als geen equipment
const BASE_PLAYER_ATTACK_INTERVAL = 2000; // ms
const BASE_ENEMY_ATTACK_INTERVAL = 2200;

// minimale/ruwe damage basis
const BASE_MELEE_MIN = 1;
const BASE_MELEE_MAX = 3;

// ---------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------

function notifyCombat(payload) {
    const { pushNotification } = useNotifications();
    pushNotification("combat", payload);
}

// ---------------------------------------------------------------------
// HELPER: SKILLS
// ---------------------------------------------------------------------

function getSkillLevel(game, key, fallback = 1) {
    return game.skills?.[key]?.level ?? fallback;
}

// We gaan uit van skills:
// attack, strength, defence, ranged, magic
function getCombatSkills(game) {
    return {
        attack: getSkillLevel(game, "attack"),
        strength: getSkillLevel(game, "strength"),
        defence: getSkillLevel(game, "defence"),
        ranged: getSkillLevel(game, "ranged"),
        magic: getSkillLevel(game, "magic")
    };
}

// ---------------------------------------------------------------------
// HELPER: EQUIPMENT
// ---------------------------------------------------------------------

function getEquippedWeapon(game) {
    const weaponId = game.player?.equipment?.weapon ?? null;
    return weaponId ? getItem(weaponId) : null;
}

function getEquippedArmor(game) {
    const e = game.player?.equipment;
    if (!e) return [];

    const armorSlots = ["head", "plate", "legs", "boots", "hands", "cape", "amulet", "offhand"];

    return armorSlots
        .map(slot => e[slot])
        .filter(Boolean)
        .map(id => getItem(id))
        .filter(Boolean);
}

// ---------------------------------------------------------------------
// HP & DEFENCE
// ---------------------------------------------------------------------

// Gebruik de opgeslagen maxHP uit het player object
function calculatePlayerMaxHp(game) {
    return game.player?.maxHp ?? 10;
}

function calculateTotalDefence(game) {
    const { defence } = getCombatSkills(game);
    const armorPieces = getEquippedArmor(game);

    const armorDef = armorPieces.reduce((sum, piece) => {
        const def = piece.stats?.defenceBonus ?? piece.stats?.defenseBonus ?? 0;
        return sum + def;
    }, 0);

    return defence + armorDef;
}

// ---------------------------------------------------------------------
// COMBAT STYLE
// ---------------------------------------------------------------------
// Styles:
// - melee_accurate
// - melee_aggressive
// - melee_defensive
// - ranged
// - magic

function defaultCombatStyle(game) {
    const weapon = getEquippedWeapon(game);
    const type = weapon?.combatType || weapon?.stats?.combatType;

    switch (type) {
        case "ranged":
            return "ranged";
        case "magic":
            return "magic";
        default:
            return "melee_aggressive";
    }
}

// ---------------------------------------------------------------------
// ACCURACY & DAMAGE
// ---------------------------------------------------------------------

function getPlayerAccuracy(game, style, weapon, enemy) {
    const { attack, strength, ranged, magic } = getCombatSkills(game);
    const weaponAccuracy = weapon?.stats?.accuracy ?? 0;
    const enemyDefence = enemy.defence ?? enemy.level ?? 1;

    let offensive;

    switch (style) {
        case "melee_accurate":
            offensive = attack * 2 + weaponAccuracy;
            break;
        case "melee_aggressive":
        case "melee_defensive":
            offensive = attack * 1.4 + strength * 0.6 + weaponAccuracy;
            break;
        case "ranged":
            offensive = ranged * 1.8 + weaponAccuracy;
            break;
        case "magic":
            offensive = magic * 1.6 + weaponAccuracy;
            break;
        default:
            offensive = attack + strength + weaponAccuracy;
    }

    const defensive = enemyDefence * 1.2;

    const hitChance = offensive / (offensive + defensive);
    return Math.min(Math.max(hitChance, 0.05), 0.95); // nooit 0% of 100%
}

function getPlayerDamage(game, style, weapon, enemy) {
    const { strength, ranged, magic } = getCombatSkills(game);

    // -----------------------------
    // 1. BASE DAMAGE (jouw bestaande systeem)
    // -----------------------------
    let base = 0;

    if (style.startsWith("melee")) {
        const power = weapon?.stats?.attackPower ?? 0;
        const min = BASE_MELEE_MIN + Math.floor(strength * 0.3);
        const max = BASE_MELEE_MAX + Math.floor(strength * 0.6 + power * 1.5);
        base = randomInt(min, max);
    }
    else if (style === "ranged") {
        const power = weapon?.stats?.rangedPower ?? weapon?.stats?.attackPower ?? 0;
        const min = 1 + Math.floor(ranged * 0.4);
        const max = 3 + Math.floor(ranged * 0.7 + power * 1.5);
        base = randomInt(min, max);
    }
    else if (style === "magic") {
        const power = weapon?.stats?.magicPower ?? 0;
        const min = 2 + Math.floor(magic * 0.5);
        const max = 4 + Math.floor(magic * 0.8 + power * 1.8);
        base = randomInt(min, max);
    }
    else {
        base = randomInt(1, 3);
    }

    // -----------------------------
    // 2. DAMAGE MODIFIERS
    // -----------------------------
    const triangleMod = getTriangleModifier(style, enemy);
    const elementMod = getElementModifier(weapon, enemy);
    const familyMod = getFamilyModifier(weapon, enemy);

    const finalDamage = Math.floor(base * triangleMod * elementMod * familyMod);

    // -----------------------------
    // 3. EFFECTIVENESS FEEDBACK
    // -----------------------------
    let messageNote = "";

    if (triangleMod > 1) messageNote = "(Combat advantage!)";
    if (elementMod > 1) messageNote = "(Elemental weakness!)";
    if (familyMod > 1) messageNote = "(Effective vs type!)";

    if (triangleMod < 1 || elementMod < 1 || familyMod < 1) {
        messageNote = "(Not very effective...)";
    }

    if (messageNote) {
        notifyCombat({
            type: "combat",
            message: messageNote,
        });
    }

    return Math.max(1, finalDamage);
}


// Enemy damage → mitigated door Defence + armor
function calculateEnemyDamage(enemy, game) {
    const base = enemy.attack ?? 1;
    const totalDefence = calculateTotalDefence(game);

    const reduced = base - totalDefence * 0.25;
    const effective = Math.max(1, reduced);

    const variation = Math.floor(effective * 0.3);
    const min = Math.max(1, effective - variation);
    const max = effective + variation;

    return randomInt(min, max);
}

// ---------------------------------------------------------------------
// TIMERS / SPEED
// ---------------------------------------------------------------------

function calculatePlayerAttackInterval(game) {
    const weapon = getEquippedWeapon(game);
    const speedMult = weapon?.stats?.speedMultiplier ?? 1;
    const interval = BASE_PLAYER_ATTACK_INTERVAL / speedMult;
    return Math.max(600, interval);
}

function calculateEnemyAttackInterval(enemy) {
    return enemy.speed || BASE_ENEMY_ATTACK_INTERVAL;
}

// ---------------------------------------------------------------------
// LOOT & XP
// ---------------------------------------------------------------------

function grantCombatXpForKill(style, enemy) {
    const xpTotal = enemy.xp ?? 0;
    if (xpTotal <= 0) return;

    // HP krijgt altijd 20% van combat XP
    addXp("hp", xpTotal * 0.2);

    // Verdeling per style (kan je later tunen)
    switch (style) {
        case "melee_accurate":
            addXp("attack", xpTotal * 0.7);
            addXp("strength", xpTotal * 0.2);
            addXp("defence", xpTotal * 0.1);
            break;

        case "melee_aggressive":
            addXp("strength", xpTotal * 0.7);
            addXp("attack", xpTotal * 0.2);
            addXp("defence", xpTotal * 0.1);
            break;

        case "melee_defensive":
            addXp("defence", xpTotal * 0.7);
            addXp("attack", xpTotal * 0.2);
            addXp("strength", xpTotal * 0.1);
            break;

        case "ranged":
            addXp("ranged", xpTotal);
            break;

        case "magic":
            addXp("magic", xpTotal);
            break;

        default:
            // fallback, als stijl onbekend is
            addXp("attack", xpTotal * 0.4);
            addXp("strength", xpTotal * 0.4);
            addXp("defence", xpTotal * 0.2);
    }

    notifyCombat({
        type: "xp",
        message: `You gained ${Math.floor(xpTotal)} combat XP.`
    });
}

function handleEnemyLoot(enemy) {
    if (!Array.isArray(enemy.drops)) return;

    enemy.drops.forEach(drop => {
        const chance = drop.chance ?? 0;
        if (Math.random() <= chance) {
            const amount = randomInt(drop.min ?? 1, drop.max ?? 1);
            addItem(drop.item, amount);

            const item = getItem(drop.item);

            notifyCombat({
                type: "loot",
                message: `Looted ${amount}x ${item?.name || drop.item}`,
                icon: item?.icon
            });
        }
    });
}

// ---------------------------------------------------------------------
// COMBAT STATE HELPERS
// ---------------------------------------------------------------------

function getCombatState(game) {
    return game.combat || null;
}

function setCombatState(game, state) {
    game.combat = state;
}

// ---------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------

// style: "melee_accurate", "melee_aggressive", "melee_defensive", "ranged", "magic"
export function startCombat(enemyId, style = null) {
    const game = getGame();
    const enemy = getEnemy(enemyId);

    if (!enemy) {
        console.error("Enemy not found:", enemyId);
        return { started: false, reason: "Enemy not found" };
    }

    const chosenStyle = style || defaultCombatStyle(game);
    const maxPlayerHp = calculatePlayerMaxHp(game);

    // Zorg dat player.hp altijd een waarde heeft (bv. bij nieuwe save)
    if (game.player.hp == null) {
        game.player.hp = maxPlayerHp;
    }

    const state = {
        active: true,
        enemyId,
        enemyHp: enemy.hp ?? 10,
        maxEnemyHp: enemy.hp ?? 10,
        playerHp: game.player.hp,
        maxPlayerHp,
        style: chosenStyle,
        playerAttackInterval: calculatePlayerAttackInterval(game),
        enemyAttackInterval: calculateEnemyAttackInterval(enemy),
        playerAttackTimer: 0,
        enemyAttackTimer: 0,
        lastUpdate: Date.now(),
        result: null // "win" | "lose" | "fled" | null
    };

    setCombatState(game, state);
    saveGame(game);

    notifyCombat({
        type: "info",
        message: `You engage a ${enemy.name}!`,
        icon: enemy.icon
    });

    return { started: true };
}

export function stopCombat() {
    const game = getGame();
    const combat = getCombatState(game);
    if (!combat?.active) return;

    const enemy = getEnemy(combat.enemyId);

    notifyCombat({
        type: "info",
        message: `You flee from ${enemy?.name || "combat"}.`
    });

    combat.active = false;
    combat.result = "fled";
    saveGame(game);
}

export function isInCombat() {
    const game = getGame();
    return !!game.combat?.active;
}

export function getCurrentCombat() {
    const game = getGame();
    return game.combat || null;
}

// -------------------------------------------------------------
// TICK: aanroepen in je main game loop (bv. setInterval)
// -------------------------------------------------------------

export function combatTick() {
    const game = getGame();
    const combat = getCombatState(game);

    if (!combat || !combat.active) return;

    const enemy = getEnemy(combat.enemyId);
    if (!enemy) {
        combat.active = false;
        saveGame(game);
        return;
    }

    const now = Date.now();
    const delta = now - (combat.lastUpdate || now);
    combat.lastUpdate = now;

    combat.playerAttackTimer -= delta;
    combat.enemyAttackTimer -= delta;

    const weapon = getEquippedWeapon(game);
    const style = combat.style || defaultCombatStyle(game);

    // ---------------- PLAYER TURN ------------------------
    if (combat.playerAttackTimer <= 0) {
        const hitChance = getPlayerAccuracy(game, style, weapon, enemy);
        const hitRoll = Math.random();

        if (hitRoll <= hitChance) {
            const dmg = getPlayerDamage(game, style, weapon, enemy);
            combat.enemyHp -= dmg;

            notifyCombat({
                type: "combat",
                message: `You hit ${enemy.name} for ${dmg} damage.`,
                icon: enemy.icon
            });
        } else {
            notifyCombat({
                type: "combat",
                message: `You miss ${enemy.name}.`,
                icon: enemy.icon
            });
        }

        // reset timer
        combat.playerAttackTimer += combat.playerAttackInterval;

        // Enemy dead?
        if (combat.enemyHp <= 0) {
            combat.enemyHp = 0;
            combat.active = false;
            combat.result = "win";

            // HP terug syncen naar player
            game.player.hp = Math.max(0, combat.playerHp);

            notifyCombat({
                type: "success",
                message: `You defeated ${enemy.name}!`,
                icon: enemy.icon
            });

            grantCombatXpForKill(style, enemy);
            handleEnemyLoot(enemy);

            saveGame(game);
            return;
        }
    }

    // ---------------- ENEMY TURN -------------------------
    if (combat.enemyAttackTimer <= 0) {
        const rawDmg = calculateEnemyDamage(enemy, game);
        const dmg = Math.max(1, Math.floor(rawDmg));

        combat.playerHp -= dmg;
        if (combat.playerHp < 0) combat.playerHp = 0;
        game.player.hp = combat.playerHp;

        notifyCombat({
            type: "combat",
            message: `${enemy.name} hits you for ${dmg} damage.`
        });

        combat.enemyAttackTimer += combat.enemyAttackInterval;

        if (combat.playerHp <= 0) {
            combat.playerHp = 0;
            game.player.hp = 0;
            combat.active = false;
            combat.result = "lose";

            notifyCombat({
                type: "warning",
                message: `You were defeated by ${enemy.name}...`
            });

            // Hier kun je death penalty / respawn afhandelen
            saveGame(game);
            return;
        }
    }

    setCombatState(game, combat);
    saveGame(game);
}

// ---------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------

function randomInt(min, max) {
    const mn = Math.floor(min);
    const mx = Math.floor(max);
    return Math.floor(Math.random() * (mx - mn + 1)) + mn;
}

function getTriangleModifier(style, enemy) {
    const userType = style.startsWith("melee") ? "melee" : style;
    const enemyAttackType = enemy.attackType || "melee";

    const data = COMBAT_TRIANGLE[userType];
    if (!data) return 1;

    if (data.strongAgainst.includes(enemyAttackType)) return 1.25;
    if (data.weakAgainst.includes(enemyAttackType)) return 0.75;
    return 1;
}


function getElementModifier(weapon, enemy) {
    const att = weapon?.stats?.element;
    const def = enemy.element;

    if (!att || !def) return 1;

    const data = ELEMENT_MATRIX[def];
    if (!data) return 1;

    if (data.weakTo.includes(att)) return 1.20;
    if (data.resistantTo.includes(att)) return 0.85;

    return 1;
}

function getFamilyModifier(weapon, enemy) {
    const fam = enemy.family;
    if (!fam) return 1;

    const data = FAMILY_MATRIX[fam];
    if (!data) return 1;

    const wtype = weapon?.stats?.element || weapon?.stats?.weaponFamily || null;

    if (data.weakTo.includes(wtype)) return 1.15;
    if (data.resistantTo.includes(wtype)) return 0.90;

    return 1;
}

export function getTotalStats() {
    const game = getGame();
    const armor = getEquippedArmor(game);
    const weapon = getEquippedWeapon(game);

    const base = {
        defenceBonus: 0,
        attackPower: 0,
        accuracy: 0,
        hpBonus: 0,
        element: null
    };

    const items = [...armor, weapon].filter(Boolean);

    for (const item of items) {
        for (const key in item.stats) {
            if (typeof item.stats[key] === "number") {
                base[key] = (base[key] ?? 0) + item.stats[key];
            }
        }

        // for elements we prefer weapon element
        if (item.stats.element && !base.element) {
            base.element = item.stats.element;
        }
    }

    return base;
}