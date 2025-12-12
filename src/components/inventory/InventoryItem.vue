<template>
  <div class="inv-card" :class="{
    locked: locked,
    equipped: isEquipped
  }" :style="{ '--rarity': rarityColor }" @mouseenter="showTooltip(item, $event)" @mouseleave="hideTooltip()"
    @mousemove="showTooltip(item, $event)">
    <!-- AMOUNT BADGE -->
    <span class="amount-badge">{{ item.amount }}</span>

    <!-- TOP BADGES -->
    <div class="top-badges">
      <span v-if="isEquipped" class="badge equipped">Equipped</span>
      <span v-if="locked" class="badge locked">
        Lvl {{ item.stats.requiresLevel }}
      </span>
    </div>

    <!-- ICON -->
    <div class="icon-box">
      <img :src="item.icon" class="item-icon" />
    </div>

    <!-- NAME + CATEGORY -->
    <div class="info">
      <span class="name">{{ item.name }}</span><br>
      <span class="rarity">{{ rarityLabel }}</span><br>
      <span class="category">{{ item.category }}</span>
    </div>

    <!-- ACTION BUTTON (appears on hover)-->
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
import { isLocked, isEquiped } from "../../game/helpers/gameHelpers";

const props = defineProps({
  item: Object
});

const { showTooltip, hideTooltip } = useTooltip();
const { openInspect } = useItemActions();

const isEquipped = computed(() => {
  return isEquiped(props.item);
});


const locked = computed(() => {
  return isLocked(props.item);
});

const rarityColor = computed(() => getRarityColor(props.item.rarity));
const rarityLabel = computed(() => getRarityLabel(props.item.rarity));
</script>

<style scoped>
/* ========================================= */
/* INVENTORY ITEM — OSRS-HD SLOT CARD */
/* ========================================= */

.inv-card {
  --rarity: #ffffff;

  position: relative;
  padding: 14px;
  border-radius: 12px;

  background: linear-gradient(145deg, #303030, #1a1a1a);
  border: 1px solid #6c6c6c44;

  display: flex;
  flex-direction: column;
  align-items: center;

  backdrop-filter: blur(6px);

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    border-color .15s ease,
    filter .15s ease;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    inset 0 0 10px rgba(255, 255, 255, 0.03);
}

/* Hover glow (RuneLite HD style) */
.inv-card:hover {
  transform: translateY(-6px) scale(1.03);
  border-color: var(--rarity);
  box-shadow:
    0 0 14px var(--rarity),
    inset 0 0 10px rgba(255, 255, 255, 0.05);
}

/* EQUIPPED STATUS */
.inv-card.equipped {
  border-color: #8affb2;
  box-shadow: 0 0 16px rgba(120, 255, 180, 0.7);
}

.inv-card.locked {
  opacity: 0.5;
  filter: grayscale(80%);
}

/* ICON BOX */
.icon-box {
  width: 80px;
  height: 80px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 10px;
  background: linear-gradient(145deg, #2d2d2d, #1b1b1b);
  border: 1px solid #6c6c6c44;

  box-shadow:
    inset 0 0 6px rgba(255, 255, 255, 0.04),
    inset 0 0 4px rgba(0, 0, 0, 0.5);

  margin-bottom: 10px;
}

.item-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;

  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6));
}

/* TEXT */
.name {
  font-size: 1rem;
  font-weight: 700;
  opacity: 0.95;
}

.rarity {
  margin-top: 4px;
  font-size: 0.75rem;
  font-weight: 700;

  padding: 2px 8px;
  border-radius: 6px;
  background: var(--rarity);
  color: #111;

  box-shadow:
    0 0 6px var(--rarity);
}

.category {
  font-size: 0.75rem;
  opacity: 0.6;
}

/* AMOUNT BADGE */
.amount-badge {
  position: absolute;
  bottom: 6px;
  right: 8px;

  background: rgba(0, 0, 0, 0.65);
  padding: 2px 10px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.75rem;

  box-shadow: 0 0 6px rgba(0, 0, 0, 0.5);
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
  background: rgba(100, 255, 180, 0.2);
  border: 1px solid rgba(100, 255, 180, 0.5);
  color: #6affb2;
}

.badge.locked {
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 120, 120, 0.4);
  color: #ff7979;
}

/* ACTION BUTTON (⋮ menu) */
.action-btn {
  position: absolute;
  top: 8px;
  left: 8px;

  width: 26px;
  height: 26px;
  border-radius: 50%;

  border: 1px solid #6c6c6c55;
  background: rgba(255, 255, 255, 0.08);
  color: white;

  opacity: 0;
  transition: 0.15s ease;
}

.inv-card:hover .action-btn {
  opacity: 1;
}
</style>
