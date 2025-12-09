<template>
  <div
    class="inv-card"
    :class="{
      locked: isLocked,
      equipped: isEquipped
    }"
    :style="{ '--rarity': rarityColor }"
    @mouseenter="showTooltip(item, $event)"
    @mouseleave="hideTooltip()"
    @mousemove="showTooltip(item, $event)"
  >
    <!-- AMOUNT BADGE -->
    <span class="amount-badge">{{ item.amount }}</span>

    <!-- TOP BADGES -->
    <div class="top-badges">
      <span v-if="isEquipped" class="badge equipped">Equipped</span>
      <span v-if="isLocked" class="badge locked">
        Lvl {{ item.stats.requiredLevel }}
      </span>
    </div>

    <!-- ICON -->
    <div class="icon-box">
      <img :src="item.icon" class="item-icon" />
    </div>

    <!-- NAME + CATEGORY -->
    <div class="info">
      <span class="name">{{ item.name }}</span>
      <span class="rarity">{{ rarityLabel }}</span>
      <span class="category">{{ item.category }}</span>
    </div>

    <!-- ACTION BUTTON (appears on hover) -->
    <button class="action-btn" @click.stop="openInspect(item)">
      ⋮
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getRarityColor, getRarityLabel } from "../../game/utils/rarity";
import { useTooltip } from "../../composables/useTooltip";
import { useItemActions } from "../../composables/useItemActions";
import { getGame } from "../../game/state/gameState";

const props = defineProps({
  item: Object
});

const { showTooltip, hideTooltip } = useTooltip();
const { showActions, hideActions, openInspect } = useItemActions();
const game = getGame();

const isTool = computed(() => props.item.category === "tools");
const skillId = computed(() => props.item.skill || null);

const playerSkill = computed(() => {
  if (!skillId.value) return null;
  return game.skills[skillId.value];
});

const isEquipped = computed(() => {
  if (!isTool.value) return false;
  return game.player.equippedTools?.[skillId.value] === props.item.id;
});

const isLocked = computed(() => {
  if (!isTool.value) return false;
  const req = props.item.stats?.requiredLevel ?? 1;
  return playerSkill.value?.level < req;
});

const rarityColor = computed(() => getRarityColor(props.item.rarity));
const rarityLabel = computed(() => getRarityLabel(props.item.rarity));
</script>

<style scoped>
/* CARD BASE */
.inv-card {
  --rarity: #fff;

  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--rarity);
  border-radius: 14px;
  padding: 14px;

  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  transition: transform 0.25s ease, box-shadow 0.25s ease;

  box-shadow: 0 0 12px var(--rarity);
  backdrop-filter: blur(6px);
}

/* HOVER EFFECT */
.inv-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 0 18px var(--rarity);
}

/* ICON */
.icon-box {
  width: 72px;
  height: 72px;

  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 8px;
}

.item-icon {
  width: 56px;
  height: 56px;
}

/* TEXT */
.name {
  font-weight: 700;
  font-size: 1rem;
  color: var(--rarity);
}

.rarity {
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--rarity);
  color: #000;
  padding: 2px 8px;
  border-radius: 6px;
  margin-top: 4px;
  display: inline-block;
  box-shadow: 0 0 6px var(--rarity);
}

.category {
  opacity: 0.7;
  font-size: 0.75rem;
  margin-top: 2px;
}

/* AMOUNT BADGE */
.amount-badge {
  position: absolute;
  bottom: 6px;
  right: 8px;

  background: rgba(0, 0, 0, 0.7);
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 0.75rem;
  font-weight: 600;

  backdrop-filter: blur(6px);
}

/* TOP BADGES */
.top-badges {
  position: absolute;
  top: 6px;
  right: 6px;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge {
  font-size: 0.65rem;
  padding: 2px 6px;

  border-radius: 6px;
  font-weight: 700;
}

.badge.equipped {
  background: rgba(80, 255, 120, 0.2);
  border: 1px solid rgba(80, 255, 120, 0.5);
  color: #3cff89;
}

.badge.locked {
  background: rgba(255, 80, 80, 0.2);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff6d6d;
}

/* LOCKED LOOK */
.inv-card.locked {
  opacity: 0.55;
  filter: grayscale(80%);
}

/* EQUIPPED LOOK */
.inv-card.equipped {
  box-shadow: 0 0 20px rgba(80, 255, 120, 0.6);
  border-color: #3cff89;
}

/* ACTION BTN */
.action-btn {
  position: absolute;
  top: 8px;
  left: 8px;

  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;

  width: 26px;
  height: 26px;
  border-radius: 50%;

  opacity: 0;
  transition: 0.2s;
}

.inv-card:hover .action-btn {
  opacity: 1;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
}
</style>
