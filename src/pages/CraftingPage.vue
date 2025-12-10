<template>
  <div class="osrs-panel">
    <div class="card-body">
      <h3 class="mb-3">Crafting</h3>

      <CraftingGrid :recipes="recipes" :options="craftOptions" :canCraft="canCraft" />
      <CraftingQueue />
    </div>
  </div>
</template>

<script setup>
import { canCraft, craftMax, addToQueue }
  from "../game/crafting/craftingEngine";

import CraftingGrid from "../components/crafting/CraftingGrid.vue";
import { loadAllRecipes } from "../game/crafting/recipeLoader";
import { ref, onMounted } from "vue";
import CraftingQueue from "../components/crafting/CraftingQueue.vue";

const recipes = ref([]);

onMounted(async () => {
  recipes.value = await loadAllRecipes();
  console.log("[Crafting] Loaded recipes:", recipes.value);
});

const craftOptions = [
  { label: "1x", class: "btn-primary", action: (recipe) => addToQueue(recipe, 1) },
  { label: "5x", class: "btn-secondary", action: (recipe) => addToQueue(recipe, 5) },
  { label: "10x", class: "btn-secondary", action: (recipe) => addToQueue(recipe, 10) },
  { label: "Max", class: "btn-success", action: (recipe) => addToQueue(recipe, craftMax(recipe)) },
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
