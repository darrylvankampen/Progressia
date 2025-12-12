export const defaultGame = {
  player: {
    name: "Hero",
    gold: 0,
    hp: 10,
    maxHp: 10,
    totalXP: 0,
    equippedTools: {},
    titles: [],
    activeTitle: null,
    achievementPoints: 0,
    factions: {
      emberforge: 0,
      verdant: 0,
      tidebound: 0,
      iron_dominion: 0
    },
    prestige: {},
    equipment: {
      head: null,
      plate: null,
      legs: null,
      boots: null,
      hands: null,
      amulet: null,
      cape: null,
      weapon: null,
      offhand: null,
      ring: null,
      ammo: null
    },
    stats: {
      goldEarned: 0,
      goldSpent: 0,
      itemsCrafted: 0,
      itemsSold: 0,
      itemsBought: 0,
      itemsDestroyed: 0,
      enemiesKilled: 0,
      resourcesCollected: 0,
      resourcesUsed: 0,
      itemsOpened: 0,
      ammoUsed: 0,
    }
  },
  skills: {},
  inventory: {},
  activeSkill: null,
  activeBuffs: [],
  pets: [],
  completedQuests: [],
  achievementsUnlocked: [],
  resourceStats: {},
  crafting: {
    active: null,
    queue: []
  }
};
