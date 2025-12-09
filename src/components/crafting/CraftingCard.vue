<template>
  <div class="craft-card">
    <div class="craft-header">
      <!-- <img :src="recipe.icon" alt="" class="craft-icon" /> -->
      <h5 class="craft-title">{{ recipe.name }}</h5>
    </div>

    <!-- INPUTS -->
    <div class="section">
      <h6 class="label">Inputs</h6>
      <div class="item-list">
        <div
          v-for="i in inputItems"
          :key="i.id"
          class="item-chip"
          :style="{ borderColor: getRarityColor(i.rarity) }"
        >
          <img :src="i.icon" class="chip-icon" />
          <span class="chip-text"> {{ i.amount }}× {{ i.name }} </span>
        </div>
      </div>
    </div>

    <!-- OUTPUTS -->
    <div class="section">
      <h6 class="label">Output</h6>
      <div class="item-list">
        <div
          v-for="o in outputItems"
          :key="o.id"
          class="item-chip output"
          :style="{ borderColor: getRarityColor(o.rarity) }"
        >
          <img :src="o.icon" class="chip-icon" />
          <span class="chip-text"> {{ o.amount }}× {{ o.name }} </span>
        </div>
      </div>
    </div>

    <!-- XP -->
    <div class="xp-row">
      <span class="xp-label">XP</span>
      <span class="xp-value">{{ recipe.xp }}</span>
    </div>

    <!-- BUTTONS -->
    <div class="button-group">
      <button
        v-for="opt in options"
        :key="opt.label"
        class="craft-btn"
        :disabled="!canCraft(recipe)"
        @click="opt.action(recipe)"
      >
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
.craft-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 0 12px #00000040;
  transition: 0.2s;
}

.craft-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 16px #00000080;
}

.craft-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.craft-icon {
  width: 40px;
  height: 40px;
}

.craft-title {
  font-size: 1.2rem;
  font-weight: 700;
}

.section {
  margin-bottom: 12px;
}

.label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-bottom: 4px;
}

.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 2px solid;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
}

.item-chip.output {
  background: rgba(255, 255, 255, 0.12);
}

.chip-icon {
  width: 28px;
  height: 28px;
}

.chip-text {
  font-size: 0.9rem;
  font-weight: 500;
}

.xp-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 12px;
}

.xp-label {
  opacity: 0.7;
}

.xp-value {
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 6px;
}

.craft-btn {
  flex: 1;
  padding: 8px 0;
  border-radius: 6px;
  border: none;
  background: linear-gradient(135deg, #3e3e3e, #2a2a2a);
  color: white;
  font-weight: 600;
  transition: 0.15s;
}

.craft-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #565656, #333);
}

.craft-btn:disabled {
  opacity: 0.4;
}
</style>
