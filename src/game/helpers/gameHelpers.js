// src/game/helpers/gameHelpers.js

import { getItem, getAllItems } from "../utils/itemDB";
import { getGame, getSkillDefs } from "../state/gameState";
import { getEffectiveToolStats } from "../modifierEngine";

/* --------------------------------------------------------
   ITEMS
-------------------------------------------------------- */
export function getItems() {
  return getAllItems();
}
export function getItemName(id) {
  const item = getItem(id);
  return item?.name ?? "Unknown Item";
}

export function getItemIcon(id) {
  const item = getItem(id);
  return item?.icon ?? null;
}

export function getEquippedTool(skillId) {
  const game = getGame();

  const toolId = game.player?.equippedTools?.[skillId];
  if (!toolId) return null;

  const item = getItem(toolId);
  if (!item) {
    console.warn("[getEquippedTool] Unknown tool from equippedTools:", toolId);
    return null;
  }

  return item;
}

export function getToolStats(skillId) {
  return getEffectiveToolStats(skillId);
}

export function getItemObject(id) {
  const item = getItem(id)
  return item ?? null;
}

/* --------------------------------------------------------
   SKILLS
-------------------------------------------------------- */

export function getSkillName(skillId) {
  const defs = getSkillDefs();
  return defs?.[skillId]?.name ?? "Unknown Skill";
}

export function getSkillIcon(skillId) {
  const defs = getSkillDefs();
  return defs?.[skillId]?.icon ?? null;  // assuming you store icon path
}

export function getSkillConfig(skillId) {
  const defs = getSkillDefs();
  return defs?.[skillId] ?? null;
}

export function getSkillProgress(skillId) {
  const game = getGame();
  return game.skills?.[skillId] ?? null;
}

/* --------------------------------------------------------
   ACTIONS
-------------------------------------------------------- */

export function getActionById(skillId, actionId) {
  const defs = getSkillDefs();
  const skill = defs?.[skillId];
  if (!skill) return null;

  return skill.actions?.find(a => a.id === actionId) ?? null;
}

export function getActionName(skillId, actionId) {
  const action = getActionById(skillId, actionId);
  return action?.name ?? "Unknown Action";
}

export function getActionResourceItem(skillId, actionId) {
  const action = getActionById(skillId, actionId);
  return action?.resource ?? null;
}

/**
 * Titles
 */

export function getPlayerTitles() {
  const game = getGame();
  return game.player.titles;
}

export function hasTitle(title) {
  const game = getGame();
  const playerTitles = game.player.titles;
  return playerTitles.includes(title);
}

export function addTitle(title) {
  const game = getGame();
  if (title) {
    game.player.titles.push(title);
  }
}

export function validateAmount(input) {
  // Probeer input te converteren naar nummer
  const amount = Number(input);

  // Controleer of het een echt nummer is
  if (isNaN(amount)) return { valid: false, error: "Amount is not a number." };

  // Optioneel: Negatieve waarden blokkeren
  if (amount < 0) return { valid: false, error: "Amount cannot be negative." };

  // Geen oneindige getallen
  if (!isFinite(amount)) return { valid: false, error: "Amount must be finite." };

  return { valid: true, amount };
}
