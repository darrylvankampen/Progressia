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
.craft-card {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 20px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 18px #0003;
  transition: 0.25s ease;
}

.craft-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 24px #0005;
}

/* HEADER ------------------------------------------------------ */
.craft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.craft-title {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.xp-badge {
  background: linear-gradient(135deg, #4fc3a1, #3c9b7e);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  color: white;
  font-size: 0.85rem;
  box-shadow: 0 2px 6px #0004;
}

/* SECTIONS ---------------------------------------------------- */
.section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 0.9rem;
  opacity: 0.75;
  margin-bottom: 6px;
  border-left: 4px solid #8884;
  padding-left: 8px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* ITEMS ------------------------------------------------------- */
.item-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 2px solid var(--rarity);
  background: rgba(255, 255, 255, 0.07);
  box-shadow: 0 2px 5px #0003;
  transition: 0.2s;
}

.item-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px #0005;
}

.item-chip.output {
  background: rgba(255, 255, 255, 0.12);
}

.chip-icon {
  width: 28px;
  height: 28px;
}

.item-chip span {
  font-size: 0.85rem;
  font-weight: 600;
}

/* BUTTONS ----------------------------------------------------- */
.button-row {
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.craft-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #444, #333);
  color: white;
  font-weight: 700;
  font-size: 0.95rem;
  transition: 0.2s ease;
  box-shadow: 0 2px 8px #0003;
}

.craft-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #555, #3a3a3a);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px #0005;
}

.craft-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>