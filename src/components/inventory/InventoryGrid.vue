<template>
  <div class="inventory-panel">
    <div class="inventory-inner">
      <div class="filter-bar">
        <Dropdown
          v-model="selectedType"
          :options="[
            { label: 'All Types', value: 'all' },
            { label: 'Resources', value: 'resources' },
            { label: 'Tools', value: 'tools' }
          ]"
        />

        <Dropdown
          v-model="sortBy"
          :options="[
            { label: 'Name (A–Z)', value: 'name' },
            { label: 'Rarity', value: 'rarity' },
            { label: 'Amount', value: 'amount' }
          ]"
        />
      </div>

      <div class="inventory-grid">
        <InventoryItem
          v-for="item in sortedAndFiltered"
          :key="item.itemKey"
          :item="item"
        />
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
.inventory-panel {
  width: 100%;
  padding: 28px 32px;

  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;

  backdrop-filter: blur(12px);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.06);

  margin-top: 20px;
}

.inventory-panel,
.inventory-inner,
.filter-bar {
  overflow: visible;
}

/* HEADER */
.inventory-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.inv-icon {
  width: 28px;
  height: 28px;
  opacity: 0.9;
}

.inv-title {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 0;
}

/* FILTER BAR */
.filter-bar {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.filter-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 8px;
  color: #fff;

  backdrop-filter: blur(6px);
  font-size: 0.9rem;

  cursor: pointer;
  transition: 0.2s;
}

.filter-select:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

/* GRID */
.inventory-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}
</style>
