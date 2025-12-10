<template>
  <div class="inventory-panel">

    <!-- HEADER -->
    <div class="inventory-header">
      <img src="/icons/ui/backpack.png" class="inv-icon" />
      <h2 class="inv-title">Inventory</h2>
    </div>

    <!-- DIVIDER -->
    <div class="divider"></div>

    <!-- GRID -->
    <InventoryGrid :items="inventoryList" />
  </div>
  <!-- MODAL -->
  <ItemInspectModal :item="inspectState.item" :visible="inspectState.visible" @close="closeInspect" />
</template>

<script setup>
import InventoryGrid from "../components/inventory/InventoryGrid.vue";
import { computed } from "vue";
import { getGame } from "../game/state/gameState";
import { getItem } from "../game/utils/itemDB";
import ItemInspectModal from "../components/inventory/ItemInspectModal.vue";
import { useItemActions } from "../composables/useItemActions";
const { inspectState, closeInspect } = useItemActions();

const game = getGame();

/**
 * Bouw inventory lijst:
 * - key = item ID
 * - amount = hoeveelheid in inventory
 * - ...properties uit dynamic itemLoader
 */
const inventoryList = computed(() =>
  Object.entries(game.inventory)
    .map(([itemKey, amount]) => {
      const base = getItem(itemKey); // dynamische data

      if (!base) {
        console.warn("Unknown item:", itemKey);
        return null;
      }

      return {
        ...base,
        itemKey, // <-- DE INVENTORY KEY
        amount,
      };
    })
    .filter(Boolean)
);
</script>
<style scoped>
/* ========================================= */
/* INVENTORY PANEL — Modern OSRS-HD Theme   */
/* ========================================= */

.inventory-panel {
  width: 100%;
  padding: 28px 32px;

  background: radial-gradient(circle at center, #2c2c2c 0%, #1b1b1b 100%);
  border: 1px solid #4f4f4f55;
  border-radius: 12px;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 12px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);
}

/* HEADER */
.inventory-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.inv-icon {
  width: 36px;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
}

.inv-title {
  margin: 0;
  font-size: 1.6rem;
  opacity: 0.95;
  letter-spacing: 0.4px;
}

/* Divider bar (OSRS-HD) */
.divider {
  height: 2px;
  margin: 16px 0 20px;
  border-radius: 6px;

  background: linear-gradient(90deg,
      #8ab5ff55,
      rgba(255, 255, 255, 0.05),
      #8ab5ff55);

  box-shadow: 0 0 8px #8ab5ff33;
}
</style>
