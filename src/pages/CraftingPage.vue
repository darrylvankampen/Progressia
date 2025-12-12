<template>
  <div class="osrs-panel">
    <div class="card-body">
      <h3 class="mb-3">{{ title }}</h3>

      <div v-if="loading" class="text-muted mb-3">
        Loading recipes…
      </div>

      <CraftingGrid v-else :recipes="recipes" :options="craftOptions" :canCraft="canCraft" />

      <CraftingQueue />
    </div>
  </div>
</template>

<script setup>
import { canCraft, craftMax, addToQueue }
  from "../game/crafting/craftingEngine";
import CraftingGrid from "../components/crafting/CraftingGrid.vue";
import { loadRecipesBySkill } from "../game/crafting/recipeLoader";
import { ref, watch, computed } from "vue";
import CraftingQueue from "../components/crafting/CraftingQueue.vue";

const props = defineProps({
  skill: {
    type: String,
    default: "crafting"   // Fallback
  }
});
const title = computed(() =>
  props.skill.charAt(0).toUpperCase() + props.skill.slice(1)
);


const recipes = ref([]);
const loading = ref(false);

watch(
  () => props.skill,
  async (skill) => {
    loading.value = true;
    recipes.value = await loadRecipesBySkill(skill);
    loading.value = false;
  },
  { immediate: true }
);

const craftOptions = [
  {
    label: "1x",
    class: "btn-primary",
    qty: 1,
    action: (recipe) => addToQueue(recipe, 1)
  },
  {
    label: "5x",
    class: "btn-secondary",
    qty: 5,
    action: (recipe) => addToQueue(recipe, 5)
  },
  {
    label: "10x",
    class: "btn-secondary",
    qty: 10,
    action: (recipe) => addToQueue(recipe, 10)
  },
  {
    label: "Max",
    class: "btn-success",
    qty: "max",
    action: (recipe) => craftMax(recipe)
  }
];
</script>

<style scoped>
/* ===================================================== */
/* CRAFTING PAGE — OSRS HD PANEL                         */
/* ===================================================== */

.osrs-panel,
.card {
  padding: 26px 28px;
  border-radius: 14px;

  background: linear-gradient(145deg, #2f2f2f, #1a1a1a);
  border: 1px solid #6c6c6c44;
  color: white;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 12px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);
}

.card-body>h3 {
  margin-bottom: 18px;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: #d8e7ff;
  text-shadow: 0 0 10px rgba(110, 160, 255, 0.4);
}
</style>
