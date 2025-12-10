import { getAllItems, getItem } from "./utils/itemDB";
import { getGame, saveGame, getSkillDefs, addItem, applyPermanentBonus, unequipTool } from "./state/gameState";
import { startAction, stopSkill } from "./skillEngine";
import { addTitle, getActionById, getItems, getPlayerTitles } from "./helpers/gameHelpers";

export const debug = {
  help() {
    console.log("%cAvailable Debug Commands:", "color: #4af; font-weight: bold");
    console.table([
      "debug.getItemObject(key)",
      "debug.listItems()",
      "debug.listTools()",
      "debug.getSkillConfig(skillId)",
      "debug.getSkillProgress(skillId)",
      "debug.listSkills()",
      "debug.getActionObject(skillId, actionId)",
      "debug.start(skillId, actionId)",
      "debug.stop(skillId)",
      "debug.setLevel(skillId, level)",
      "debug.addXp(skillId, amount)",
      "debug.equipTool(skillId, toolId)",
      "debug.reset()"
    ]);
  },

  /* ---------------------------------------------
   * ITEMS
   * --------------------------------------------- */

  getItemObject(key) {
    const item = getItem(key);
    if (!item) {
      console.warn(`[DEBUG] Item '${key}' not found.`);
      return null;
    }
    console.log(item);
    return structuredClone(item);
  },

  listItems() {
    const items = getAllItems()
    const all = Object.values(items || {});
    console.log("All items:", all);
    return all;
  },

  listTools() {
    const game = getGame();
    const tools = Object.values(game.itemDB || {})
      .filter(i => i.category === "tools");

    console.log("All tools:", tools);
    return tools;
  },

  addItem(id, amount) {
    addItem(id, amount)
  },

  /* ---------------------------------------------
   * SKILLS
   * --------------------------------------------- */
  getSkillConfig(skillId) {
    const defs = getSkillDefs();
    const skill = defs?.[skillId];
    if (!skill) {
      console.warn(`[DEBUG] Unknown skill config '${skillId}'.`);
      return null;
    }
    console.log(skill);
    return structuredClone(skill);
  },

  getSkillProgress(skillId) {
    const game = getGame();
    const skill = game.skills?.[skillId];
    if (!skill) {
      console.warn(`[DEBUG] Unknown skill '${skillId}'.`);
      return null;
    }
    console.log(skill);
    return structuredClone(skill);
  },

  listSkills() {
    const defs = getSkillDefs();
    const ids = Object.keys(defs ?? {});
    console.log("Skills:", ids);
    return ids;
  },

  /* ---------------------------------------------
   * ACTIONS
   * --------------------------------------------- */
  getActionObject(skillId, actionId) {
    const action = getActionById(skillId, actionId);
    if (!action) {
      console.warn(`[DEBUG] Unknown action '${actionId}' in skill '${skillId}'.`);
      return null;
    }
    console.log(action);
    return structuredClone(action);
  },

  start(skillId, actionId) {
    const action = getActionById(skillId, actionId);
    if (!action) {
      console.warn(`[DEBUG] Cannot start. Unknown action '${actionId}'`);
      return;
    }
    startAction(skillId, action);
    console.log(`[DEBUG] Started action '${actionId}' in skill '${skillId}'`);
  },

  stop(skillId) {
    stopSkill(skillId);
    console.log(`[DEBUG] Stopped skill '${skillId}'`);
  },

  /* ---------------------------------------------
   * LEVEL + XP
   * --------------------------------------------- */
  setLevel(skillId, lvl) {
    const game = getGame();
    if (!game.skills?.[skillId]) {
      console.warn(`[DEBUG] Unknown skill '${skillId}'.`);
      return;
    }

    const skill = game.skills[skillId];
    skill.level = lvl;
    skill.xp = 0;
    skill.xpToNext = Math.floor(50 * Math.pow(lvl, 1.8));

    saveGame();
    console.log(`[DEBUG] Set level of '${skillId}' to ${lvl}`);
    return structuredClone(skill);
  },

  addXp(skillId, amount) {
    const game = getGame();
    const skill = game.skills?.[skillId];

    if (!skill) {
      console.warn(`[DEBUG] Unknown skill '${skillId}'.`);
      return;
    }

    skill.xp += amount;
    saveGame();
    console.log(`[DEBUG] Added ${amount} XP to '${skillId}'`);
    return structuredClone(skill);
  },

  /* ---------------------------------------------
   * TOOLS
   * --------------------------------------------- */
  equipTool(skillId, toolId) {
    const tool = getItem(toolId);
    if (!tool) {
      console.warn(`[DEBUG] Unknown tool '${toolId}'.`);
      return;
    }

    const game = getGame();
    if (!game.player.equippedTools) game.player.equippedTools = {};
    game.player.equippedTools[skillId] = toolId;

    saveGame();
    console.log(`[DEBUG] Equipped '${toolId}' for '${skillId}'`);
  },

  /* ---------------------------------------------
   * SYSTEM
   * --------------------------------------------- */
  reset() {
    console.warn("[DEBUG] Resetting game...");
    localStorage.removeItem("progressia-save");
    location.reload();
  },

  /**
   * Titles
   */

  getTitles() {
    console.log(getPlayerTitles().toString())
  },
  addTitle(title) {
    addTitle(title);
    console.log('[DEBUG] Added title: ' + title)
  },

  /**
   * Buffs
   */

  addPermanentBuff(stat, value) {
    applyPermanentBonus(stat, value)
    console.log('added perm bonus: ' + stat)
  },

  /**
   * Unequip
   */

  unequip(skillId) {
    unequipTool(skillId);
    console.log('[DEBUG] unequiped item for ' + skillId)
  },

  setHealth(health) {
    const game = getGame();
    game.player.hp = health;
    console.log('[DEBUG] Set health to ' + health)
  }
};
