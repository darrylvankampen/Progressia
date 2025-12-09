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
    <ItemInspectModal
      :item="inspectState.item"
      :visible="inspectState.visible"
      @close="closeInspect"
    />
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
.inventory-panel {
  width: 100%;
  max-width: none;
  margin: 0;

  padding: 24px 32px;

  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;

  backdrop-filter: blur(10px);
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.08);
}

/* HEADER */
.inventory-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.inv-icon {
  width: 32px;
  opacity: 0.9;
}

.inv-title {
  font-size: 1.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 0;
}

/* DIVIDER */
.divider {
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.25),
    rgba(255, 255, 255, 0.05)
  );
  margin: 12px 0 18px 0;
  border-radius: 4px;
}

</style>
