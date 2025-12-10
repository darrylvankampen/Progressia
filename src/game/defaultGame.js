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
      ring: null
    }
  },
  skills: {},
  inventory: {},
  craftingQueue: [],
  craftingTimeRemaining: 0,
  activeSkill: null,
  activeBuffs: [],
  pets: [],
  completedQuests: [],
  achievementsUnlocked: [],
  resourceStats: {}
};
