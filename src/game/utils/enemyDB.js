// src/utils/enemyDB.js

// -------------------------------------------------------------
// ENEMY DATABASE (met OSRS-based elements, families, attack types)
// -------------------------------------------------------------
//
// Properties gebruikt door CombatEngine:
//
// id
// name
// hp
// attack
// defence
// speed
// xp
// icon
// drops[]
//
// NIEUW:
// difficulty   → easy / normal / elite / boss
// element      → fire / water / earth / air / ice / lightning / shadow / holy / nature
// family       → undead / demon / beast / elemental / dragon / golem / spirit
// attackType   → melee / ranged / magic (voor OSRS combat triangle)
//
// -------------------------------------------------------------


const enemies = {
    goblin: {
        id: "goblin",
        name: "Goblin",
        difficulty: "easy",

        hp: 10,
        attack: 1,
        defence: 0,
        speed: 1800,
        xp: 20,
        icon: "/icons/monsters/goblin.png",

        // NEW
        element: "nature",          // Goblins → primitieve/grond-type
        family: "beast",
        attackType: "melee",

        drops: [
            { item: "bones", chance: 1.0, min: 1, max: 1 },
            { item: "coins", chance: 0.5, min: 1, max: 8 },
            { item: "bronze_dagger", chance: 0.02, min: 1, max: 1 }
        ]
    },

    wolf: {
        id: "wolf",
        name: "Wolf",
        difficulty: "normal",

        hp: 28,
        attack: 5,
        defence: 3,
        speed: 1650,
        xp: 30,
        icon: "/icons/monsters/wolf.png",

        // NEW
        element: "air",            // snelle, agile enemy
        family: "beast",
        attackType: "melee",

        drops: [
            { item: "wolf_pelt", chance: 0.8, min: 1, max: 1 },
            { item: "raw_meat", chance: 0.5, min: 1, max: 2 }
        ]
    },

    skeleton: {
        id: "skeleton",
        name: "Skeleton",
        difficulty: "normal",

        hp: 35,
        attack: 6,
        defence: 4,
        speed: 1900,
        xp: 45,
        icon: "/icons/monsters/skeleton.png",

        // NEW
        element: "shadow",         // undead affinity
        family: "undead",
        attackType: "melee",

        drops: [
            { item: "bones", chance: 1.0, min: 1, max: 2 },
            { item: "iron_sword_fragment", chance: 0.15, min: 1, max: 1 },
            { item: "coins", chance: 0.6, min: 5, max: 20 }
        ]
    },

    ogre: {
        id: "ogre",
        name: "Ogre",
        difficulty: "elite",

        hp: 85,
        attack: 12,
        defence: 6,
        speed: 2300,
        xp: 90,
        icon: "/icons/monsters/ogre.png",

        // NEW
        element: "earth",          // trage, zware melee enemy
        family: "beast",
        attackType: "melee",

        drops: [
            { item: "ogre_club", chance: 0.03, min: 1, max: 1 },
            { item: "coins", chance: 1.0, min: 20, max: 50 },
            { item: "large_bones", chance: 1.0, min: 1, max: 1 }
        ]
    },

    fire_elemental: {
        id: "fire_elemental",
        name: "Fire Elemental",
        difficulty: "boss",

        hp: 120,
        attack: 15,
        defence: 10,
        speed: 1500,
        xp: 140,
        icon: "/icons/monsters/fire_elemental.png",

        // NEW
        element: "fire",
        family: "elemental",
        attackType: "magic",

        drops: [
            { item: "fire_essence", chance: 1.0, min: 2, max: 4 },
            { item: "ember_core", chance: 0.05, min: 1, max: 1 },
            { item: "coins", chance: 0.7, min: 30, max: 80 }
        ]
    }
};


// -------------------------------------------------------------
// PUBLIC GETTER
// -------------------------------------------------------------

export function getEnemy(id) {
    return enemies[id] || null;
}

// Optional: alle enemies teruggeven
export function getAllEnemies() {
    return Object.values(enemies);
}
