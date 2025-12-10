<template>
  <div class="craft-card">
    <div class="craft-header">
      <h4 class="craft-title">{{ recipe.name }}</h4>
      <div class="xp-badge">{{ recipe.xp }} XP</div>
    </div>

    <!-- INPUTS -->
    <div class="section">
      <div class="section-title">Required Items</div>
      <div class="item-list">
        <div v-for="i in inputItems" :key="i.id" class="item-chip" :style="{ '--rarity': getRarityColor(i.rarity) }">
          <img :src="i.icon" class="chip-icon" />
          <span>{{ i.amount }}× {{ i.name }}</span>
        </div>
      </div>
    </div>

    <!-- OUTPUTS -->
    <div class="section">
      <div class="section-title">Creates</div>
      <div class="item-list">
        <div v-for="o in outputItems" :key="o.id" class="item-chip output"
          :style="{ '--rarity': getRarityColor(o.rarity) }">
          <img :src="o.icon" class="chip-icon" />
          <span>{{ o.amount }}× {{ o.name }}</span>
        </div>
      </div>
    </div>

    <!-- BUTTONS -->
    <div class="button-row">
      <button v-for="opt in options" :key="opt.label" class="craft-btn" :disabled="!canCraft(recipe)"
        @click="opt.action(recipe)">
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>


<script setup>
import { computed } from "vue";
import { getItem } from "../../game/utils/itemDB";
import { getRarityColor } from "../../game/utils/rarity";

const props = defineProps({
  recipe: Object,
  options: Array,
  canCraft: Function,
});

const inputItems = computed(() =>
  props.recipe.inputs.map((i) => ({
    ...getItem(i.item),
    amount: i.amount,
  }))
);

const outputItems = computed(() =>
  props.recipe.outputs.map((o) => ({
    ...getItem(o.item),
    amount: o.amount,
  }))
);
</script>

<style scoped>
/* ===================================================== */
/* CRAFT CARD — OSRS HD STYLE                            */
/* ===================================================== */

.craft-card {
  padding: 20px;
  border-radius: 14px;

  background: linear-gradient(145deg, #323232, #1a1a1a);
  border: 1px solid #6c6c6c44;
  color: white;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 10px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(6px);
  transition: 0.2s;
}

.craft-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.5),
    0 0 12px rgba(110, 160, 255, 0.25);
}

/* Header */
.craft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.craft-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #d7e7ff;
  text-shadow: 0 0 10px rgba(100, 150, 255, 0.4);
}

/* XP badge */
.xp-badge {
  padding: 6px 12px;
  border-radius: 8px;

  background: linear-gradient(145deg, #4fc3a1, #3b9c7f);
  border: 1px solid rgba(110, 255, 200, 0.4);
  color: white;
  font-weight: 700;

  box-shadow: 0 0 10px rgba(100, 255, 180, 0.35);
}

/* Sections */
.section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 0.85rem;
  opacity: 0.75;
  text-transform: uppercase;

  border-left: 4px solid #4fa8ff77;
  padding-left: 8px;

  margin-bottom: 6px;
  letter-spacing: 0.4px;
}

/* Item Chips */
.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-chip {
  padding: 8px 12px;
  border-radius: 10px;

  display: flex;
  align-items: center;
  gap: 8px;

  border: 2px solid var(--rarity);
  background: rgba(255, 255, 255, 0.07);

  color: white;
  font-weight: 600;
  font-size: 0.85rem;

  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 0 8px var(--rarity);

  transition: 0.15s;
}

.item-chip:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 10px rgba(0, 0, 0, 0.5),
    0 0 10px var(--rarity);
}

.item-chip.output {
  background: rgba(255, 255, 255, 0.12);
}

.chip-icon {
  width: 28px;
  height: 28px;
  filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.4));
}

/* Buttons */
.button-row {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.craft-btn {
  flex: 1;
  padding: 10px 0;

  border-radius: 10px;
  border: 1px solid #4fa8ff66;

  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  color: white;
  font-weight: 700;

  cursor: pointer;
  transition: 0.2s;

  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.35),
    inset 0 0 6px rgba(255, 255, 255, 0.06);
}

.craft-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #4a4a4a, #343434);
  transform: translateY(-2px);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.45),
    0 0 10px #4fa8ff66;
}

.craft-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}
</style>