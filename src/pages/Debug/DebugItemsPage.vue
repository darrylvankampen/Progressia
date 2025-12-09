<template>
    <div class="inventory-panel">

        <!-- HEADER -->
        <div class="inventory-header">
            <img src="/icons/ui/backpack.png" class="inv-icon" />
            <h2 class="inv-title">All Items (Debug)</h2>
        </div>

        <!-- DIVIDER -->
        <div class="divider"></div>

        <!-- GRID -->
        <div class="inventory-panel">
            <div class="inventory-inner">
                <div class="filter-bar">
                    <Dropdown v-model="selectedType" :options="[
                        { label: 'All Types', value: 'all' },
                        { label: 'Resources', value: 'resources' },
                        { label: 'Tools', value: 'tools' }
                    ]" />

                    <Dropdown v-model="sortBy" :options="[
                        { label: 'Name (A–Z)', value: 'name' },
                        { label: 'Rarity', value: 'rarity' },
                        { label: 'Amount', value: 'amount' }
                    ]" />
                </div>

                <div class="inventory-grid">
                    <InventoryItem v-for="item in allItems" :key="item.itemKey" :item="item" />
                </div>
            </div>
        </div>
    </div>
    <!-- MODAL -->
    <ItemInspectModal :item="inspectState.item" :visible="inspectState.visible" @close="closeInspect" />
</template>

<script setup>
import { computed } from "vue";
import ItemInspectModal from "../../components/inventory/ItemInspectModal.vue";
import { useItemActions } from "../../composables/useItemActions";
import { getAllItems } from "../../game/utils/itemDB";
import InventoryItem from "../../components/inventory/InventoryItem.vue";


const { inspectState, closeInspect } = useItemActions();

/**
 * Bouw lijst van ALLE items in het spel
 */
const allItems = computed(() => {
    const items = Object.values(getAllItems()).map(item => ({
        ...item,
        amount: 1,        // Debug view → altijd 1
        itemKey: item.id  // Nodig voor modal & actions
    }));
    return items;
});
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

.divider {
    height: 2px;
    background: linear-gradient(90deg,
            rgba(255, 255, 255, 0.25),
            rgba(255, 255, 255, 0.05));
    margin: 12px 0 18px 0;
    border-radius: 4px;
}

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
