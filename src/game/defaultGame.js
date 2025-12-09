export const defaultGame = {
  player: {
    name: "Hero",
    gold: 0,
    hp: 100,
    maxHp: 100,
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
