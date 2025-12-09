<template>
  <div class="card shadow text-light">
    <div class="card-body">
      <h3 class="mb-3">🛠️ Crafting</h3>

      <CraftingGrid
        :recipes="recipes"
        :options="craftOptions"
        :canCraft="canCraft"
      />
      <CraftingQueue/>
    </div>
  </div>
</template>

<script setup>
import {canCraft }
  from "../game/crafting/craftingEngine";

import CraftingGrid from "../components/crafting/CraftingGrid.vue";
import { loadAllRecipes } from "../game/crafting/recipeLoader";
import { ref, onMounted } from "vue";
import { addToQueue } from "../composables/craftingQueue";
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
  { label: "Max", class: "btn-success", action: (recipe) => addToQueue(recipe, maxCraftAmount(recipe)) },
];
</script>

