<template>
  <div v-if="visible" class="modal-backdrop" @click.self="close">
    <div class="modal-box" :style="{ '--rarity': rarityColor }">
      <!-- NAME -->
      <h2 class="title" :style="{ color: rarityColor }">{{ item.name }}</h2>
      <p class="subtitle">{{ rarityLabel }} • {{ item.category }}</p>

      <!-- ICON -->
      <div class="icon-wrapper">
        <img :src="item.icon" class="icon" />
      </div>

      <!-- DESCRIPTION -->
      <p v-if="item.description" class="desc">
        {{ item.description }}
      </p>

      <!-- TOOL-STATS BLOCK -->
      <div v-if="isTool && isTool === `t`" class="stats-section">
        <!-- REQUIRED LEVEL -->
        <div class="stat-row">
          <div class="stat-label">Required Level</div>
          <div class="stat-value">{{ legacy.requiresLevel }}</div>
        </div>

        <!-- SPEED -->
        <div class="stat-row">
          <div class="stat-label">Speed</div>
          <div class="stat-values">
            <div>Base: {{ legacy.speedMultiplier.toFixed(2) }}×</div>
            <div>Modifier: {{ modifierSpeed }}%</div>
            <div>
              <strong>Final: {{ final.speedMultiplier.toFixed(2) }}×</strong>
            </div>
          </div>
        </div>

        <!-- XP -->
        <div class="stat-row">
          <div class="stat-label">XP</div>
          <div class="stat-values">
            <div>Base: {{ legacy.xpMultiplier.toFixed(2) }}×</div>
            <div>Modifier: {{ modifierXP }}%</div>
            <div>
              <strong>Final: {{ final.xpMultiplier.toFixed(2) }}×</strong>
            </div>
          </div>
        </div>

        <!-- DOUBLE CHANCE -->
        <div class="stat-row">
          <div class="stat-label">Double Chance</div>
          <div class="stat-values">
            <div>Base: {{ (legacy.doubleChance * 100).toFixed(0) }}%</div>
            <div>Modifier: {{ modifierDouble }}%</div>
            <div>
              <strong>Final: {{ (final.doubleChance * 100).toFixed(0) }}%</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="actions">
        <button v-if="(isTool || isEquipable) && !isEquipped && !locked" class="btn equip" @click="equip">
          Equip
        </button>

        <button v-if="item.openable" class="btn open" @click="openThisItem" :disabled="!hasItemInInventory">
          Open
        </button>

        <button class="btn destroy" @click="destroyItem">Destroy</button>

        <button class="btn sell" @click="sellItem">Sell ({{ item.value }})</button>

        <button class="btn close" @click="close">Close</button>
      </div>
    </div>
  </div>
  <LootModal :visible="lootVisible" :loot="lootResults" @close="lootVisible = false" />
</template>

<script setup>
import { computed, ref } from "vue";
import { getRarityColor, getRarityLabel } from "../../game/utils/rarity";
import { getGame, removeItem, equipTool, openItem, equipItem, } from "../../game/state/gameState";
import LootModal from "./LootModal.vue";
import { isEquiped, isLocked } from "../../game/helpers/gameHelpers";

const lootVisible = ref(false);
const lootResults = ref([]);

const props = defineProps({
  item: Object,
  locked: Boolean,
  visible: Boolean,
});

const emits = defineEmits(["close"]);

const game = getGame();

/* BASIC */
const item = computed(() => props.item);

/* Tool checks */
const isTool = computed(() => item.value?.category === "tools");
const isEquipable = computed(() => item.value?.category === "weapon" || item.value?.category === "armor" || item.value?.category === "ammo");
const skillId = computed(() => item.value?.skill);

const isEquipped = computed(() => isEquiped(item.value));
const locked = computed(() => isLocked(item.value));

// /* Equipped? */
// const isEquipped = computed(() => {
//   const player = game.player;
//   const item = props.item;

//   if (!item) return false;

//   // 1) Tools
//   if (isTool.value) {
//     return player.equippedTools?.[skillId.value] === item.id;
//   }

//   // 2) Equipment (armor / weapon / offhand / misc)
//   if (item.slot) {
//     return player.equipment?.[item.slot] === item.id;
//   }

//   return false;
// });

// const isLocked = computed(() => {
//   const item = props.item;
//   if (!item) return false;

//   const required = item.stats?.requiresLevel ?? 1;

//   const skillKey = isTool.value
//     ? skillId.value
//     : item.skill;

//   if (!skillKey) {
//     return false;
//   }

//   const playerLevel = game.skills?.[skillKey]?.level ?? 1;

//   return playerLevel < required;
// });


/* Rarity */
const rarityColor = computed(() => getRarityColor(item.value?.rarity));
const rarityLabel = computed(() => getRarityLabel(item.value?.rarity));

/* LEGACY STATS */
const legacy = computed(() => {
  const stats = item.value?.stats || {};
  return {
    speedMultiplier: stats.speedMultiplier ?? 1.0,
    xpMultiplier: stats.xpMultiplier ?? 1.0,
    doubleChance: stats.doubleChance ?? 0.0,
    requiredLevel: stats.requiredLevel ?? 1,
  };
});

/* MODIFIERS */
const itemModifiers = computed(() => item.value?.modifiers || {});

const modifierSpeed = computed(
  () => itemModifiers.value[`${skillId.value}_speed_percent`] ?? 0
);

const modifierXP = computed(
  () => itemModifiers.value[`${skillId.value}_xp_percent`] ?? 0
);

const modifierDouble = computed(
  () => itemModifiers.value[`${skillId.value}_doubleChance`] ?? 0
);

const hasItemInInventory = computed(() => {
  return game.inventory[item.value.id] > 0;
});

/* FINAL VALUES */
const final = computed(() => {
  const base = legacy.value;

  const speed = base.speedMultiplier * (1 + modifierSpeed.value / 100);
  const xp = base.xpMultiplier * (1 + modifierXP.value / 100);
  const dbl = base.doubleChance + modifierDouble.value / 100;

  return {
    speedMultiplier: speed,
    xpMultiplier: xp,
    doubleChance: dbl,
  };
});

/* ACTIONS */
function close() {
  emits("close");
}

function equip() {
  if (item.value.category === "tools") {
    equipTool(skillId.value, item.value.id);
  } else {
    equipItem(item.value.id);
  }
  close();
}

function unequip() {
  unequipTool(skillId.value);
  close();
}

function destroyItem() {
  if (confirm(`Destroy ${item.value.name}?`)) {
    removeItem(item.value.id, 1, "destroy");
    close();
  }
}

function sellItem() {
  removeItem(item.value.id, 1, "sell");
  close();
}

function openThisItem() {
  const results = openItem(item.value.id);

  if (!results) return; // item no longer exists

  lootResults.value = results;
  lootVisible.value = true;

  // close inspect modal so spam is impossible
  close();
}
</script>

<style scoped>
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

/* Modal */
.modal-box {
  --rarity: #fff;
  width: 420px;

  background: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--rarity);
  box-shadow: 0 0 20px var(--rarity);
  padding: 24px;

  border-radius: 16px;
  text-align: center;
}

/* Name */
.title {
  font-size: 1.6rem;
  font-weight: 700;
}

/* Icon */
.icon-wrapper {
  width: 110px;
  height: 110px;

  margin: 16px auto;

  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  display: flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 80px;
  height: 80px;
}

/* Description */
.desc {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 18px;
  line-height: 1.3;
}

/* Stats */
.stats-section {
  text-align: left;
  margin: 0 auto 20px auto;
  width: 90%;
}

.stat-row {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.stat-label {
  font-weight: 600;
}

.stat-values {
  margin-top: 4px;
  font-size: 0.85rem;
  opacity: 0.9;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Buttons */
.btn {
  padding: 8px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.equip {
  background: rgba(80, 255, 120, 0.25);
  border: 1px solid rgba(80, 255, 120, 0.5);
  color: #3cff89;
}

.unequip {
  background: rgba(255, 230, 90, 0.25);
  border: 1px solid rgba(255, 230, 90, 0.5);
  color: #ffe55b;
}

.destroy {
  background: rgba(255, 80, 80, 0.2);
  border: 1px solid rgba(255, 80, 80, 0.4);
  color: #ff6d6d;
}

.sell {
  background: rgba(0, 255, 13, 0.2);
  border: 1px solid rgba(17, 145, 0, 0.4);
  color: #00ff40;
}

.close {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.open {
  background: rgba(100, 200, 255, 0.25);
  border: 1px solid rgba(120, 220, 255, 0.5);
  color: #7fd6ff;
}

.open:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>
