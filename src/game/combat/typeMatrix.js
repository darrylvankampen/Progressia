export const COMBAT_TRIANGLE = {
    melee: {
        strongAgainst: ["ranged"],
        weakAgainst: ["magic"]
    },
    ranged: {
        strongAgainst: ["magic"],
        weakAgainst: ["melee"]
    },
    magic: {
        strongAgainst: ["melee"],
        weakAgainst: ["ranged"]
    }
};

export const ELEMENT_MATRIX = {
    fire: {
        weakTo: ["water", "ice"],
        resistantTo: ["fire", "nature"]
    },
    water: {
        weakTo: ["lightning", "nature"],
        resistantTo: ["fire", "earth"]
    },
    earth: {
        weakTo: ["air"],
        resistantTo: ["lightning"]
    },
    air: {
        weakTo: ["ice"],
        resistantTo: ["earth"]
    },
    ice: {
        weakTo: ["fire"],
        resistantTo: ["air"]
    },
    lightning: {
        weakTo: ["earth"],
        resistantTo: ["water"]
    },
    nature: {
        weakTo: ["fire"],
        resistantTo: ["water"]
    },
    shadow: {
        weakTo: ["holy"],
        resistantTo: ["shadow"]
    },
    holy: {
        weakTo: ["shadow"],
        resistantTo: ["holy"]
    }
};

export const FAMILY_MATRIX = {
    undead: {
        weakTo: ["holy", "magic"],
        resistantTo: ["poison", "shadow"]
    },
    demon: {
        weakTo: ["holy", "silver"],
        resistantTo: ["shadow"]
    },
    dragon: {
        weakTo: ["dragonbane", "ranged", "ice"],
        resistantTo: ["fire"]
    },
    beast: {
        weakTo: ["ranged"],
        resistantTo: ["magic"]
    },
    elemental: {
        weakTo: ["oppositeElement"], // special rule
        resistantTo: ["sameElement"]
    },
    golem: {
        weakTo: ["crush"],
        resistantTo: ["ranged"]
    },
    spirit: {
        weakTo: ["magic"],
        resistantTo: ["melee"]
    }
};
