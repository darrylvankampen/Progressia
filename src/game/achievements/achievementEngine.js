import data from "../data/achievements.json";
import { addTitle } from "../helpers/gameHelpers";
import { getGame, saveGame, addItem, applyPermanentBonus } from "../state/gameState";
import { getRarityColor, getRarityLabel } from "../utils/rarity";

export function checkAchievements() {
  const game = getGame();

  data.achievements.forEach((achievement) => {
    if (game.achievementsUnlocked.includes(achievement.id)) return;

    if (isAchievementMet(achievement, game)) {
      unlockAchievement(achievement, game);
    }
  });

  saveGame();
}

function isAchievementMet(a, game) {
  const c = a.conditions;
  switch (c.type) {
    case "skill_level": {
      const selectedSkill = game.skills[c.skill];
      if (selectedSkill && selectedSkill.level) {
        return game.skills[c.skill].level >= c.level;
      }
      return false;
    }
    case "resource_amount": {
      const stat = game.resourceStats[c.item];
      return stat && stat.collected >= c.amount;
    }

    case "resource_used": {
      const stat = game.resourceStats[c.item];
      return stat && stat.used >= c.amount;
    }

    case "total_level": {
      const total = Object.values(game.skills).reduce(
        (sum, s) => sum + s.level,
        0
      );
      return total >= c.value;
    }

    case "stat": {
      const stat = game.player.stats[c.stat];
      return stat >= c.value;
    }

    default:
      return false;
  }
}

function unlockAchievement(a, game) {
  game.achievementsUnlocked.push(a.id);
  addAchievementPoints(a.points);
  console.log(a)
  if (a.reward) {
    a.reward.forEach((r) => {
      const reward = parseReward(r);
      if (reward) applyReward(reward, game);
    });
  }
}

function parseReward(rewardString) {
  const [type, ...rest] = rewardString.split(":");

  const value = rest.join(":").trim(); // ← Alles samenvoegen en trimmen

  switch (type) {
    case "title":
      return { type: "title", id: value };

    case "item": {
      const [itemId, amount] = value.split(":");
      return { type: "item", item: itemId, amount: Number(amount || 1) };
    }

    case "bonus": {
      const [stat, val] = value.split(":");
      return { type: "bonus", stat, value: Number(val) };
    }

    default:
      console.warn("Unknown reward type:", rewardString);
      return null;
  }
}

function applyReward(reward) {
  switch (reward.type) {
    case "title":
      addTitle(reward.id)
      break;

    case "item":
      addItem(reward.item, reward.amount);
      break;

    case "bonus":
      applyPermanentBonus(reward.stat, reward.value)
      break;
  }

  saveGame();
}

export function getAllAchievements() {
  return data.achievements;
}

export function getPlayerAchievements() {
  return getGame().achievementsUnlocked ?? [];
}

export function getAchievementsWithStatus() {
  const unlocked = getPlayerAchievements();

  return data.achievements
    .map((a) => ({
      ...a,
      unlocked: unlocked.includes(a.id),
      rarityColor: getRarityColor(a.rarity),
      rarityLabel: getRarityLabel(a.rarity),
    }))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
}

export function addAchievementPoints(amount = 0) {
  getGame().player.achievementPoints += amount;
}

export function getAchievementPoints() {
  return getGame().player.achievementPoints;
}
