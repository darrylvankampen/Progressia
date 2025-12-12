<template>
  <div class="inventory-panel">
    <div class="inventory-inner">
      <div class="filter-bar">
        <Dropdown v-model="selectedType" :options="[
          { label: 'All Types', value: 'all' },
          { label: 'Resources', value: 'resources' },
          { label: 'Tools', value: 'tools' },
          { label: 'Weapons', value: 'weapon' },
          { label: 'Armor', value: 'armor' },
          { label: 'Accessories', value: 'accessory' }
        ]" />

        <Dropdown v-model="sortBy" :options="[
          { label: 'Name', value: 'name' },
          { label: 'Rarity', value: 'rarity' },
          { label: 'Amount', value: 'amount' }
        ]" />
      </div>

      <div class="inventory-grid">
        <InventoryItem v-for="item in sortedAndFiltered" :key="item.itemKey" :item="item" />
      </div>
    </div>
  </div>
</template>


<script setup>
import InventoryItem from "./InventoryItem.vue";
import { ref, computed } from "vue";
import { getGame } from "../../game/state/gameState";
import { getItem } from "../../game/utils/itemDB";
import Dropdown from "../ui/Dropdown.vue";

const game = getGame();

const sortBy = ref("name");
const selectedType = ref("all");

/* RAW inventory items */
const rawItems = computed(() => {
  return Object.entries(game.inventory)
    .map(([itemKey, amount]) => {
      const base = getItem(itemKey);

      if (!base) {
        console.warn("Unknown inventory item:", itemKey);
        return null;
      }

      return {
        ...base, // itemDB data (id, name, icon, rarity, etc.)
        itemKey, // inventory key
        amount,
      };
    })
    .filter(Boolean);
});

/* FILTER → SORT → RESULT */
const sortedAndFiltered = computed(() => {
  let list = [...rawItems.value];

  // FILTER
  if (selectedType.value !== "all") {
    list = list.filter((i) => i.category === selectedType.value);
  }

  // SORT
  list.sort((a, b) => {
    switch (sortBy.value) {
      case "rarity":
        return (b.rarity || 0) - (a.rarity || 0);
      case "amount":
        return b.amount - a.amount;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return list;
});
</script>

<style scoped>
/* ========================================= */
/* OUTER PANEL */
/* ========================================= */

.inventory-panel {
  width: 100%;
  padding: 28px 32px;

  background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
  border: 1px solid #4f4f4f55;
  border-radius: 12px;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 12px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);
}

/* ========================================= */
/* FILTER BAR — OSRS HD top bar */
/* ========================================= */

.filter-bar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 22px;

  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.filter-bar :deep(.dropdown) {
  background: linear-gradient(145deg, #2d2d2d, #1b1b1b);
  border: 1px solid #6c6c6c44;
  border-radius: 8px;

  color: white;

  box-shadow:
    inset 0 0 6px rgba(255, 255, 255, 0.04),
    0 2px 4px rgba(0, 0, 0, 0.35);

  transition: box-shadow .15s ease, border-color .15s ease;
}

.filter-bar :deep(.dropdown:hover) {
  border-color: #8ab5ff66;
  box-shadow: 0 0 8px #8ab5ff33;
}

/* ========================================= */
/* GRID */
/* ========================================= */

.inventory-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  margin-top: 10px;
}
</style>
