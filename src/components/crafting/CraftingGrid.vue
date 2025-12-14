<template>
  <div class="row g-3 mt-2">
    <div v-for="recipe in sortedRecipes" :key="recipe.id" class="col-12 col-md-4">
      <CraftingCard :recipe="recipe" :options="options" :canCraft="canCraft" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import CraftingCard from "./CraftingCard.vue";

const props = defineProps({
  recipes: Array,
  options: Array,
  canCraft: Function
});

const sortedRecipes = computed(() => {
  if (!Array.isArray(props.recipes)) return [];

  return [...props.recipes].sort((a, b) => {
    const levelA = a.requiredLevel ?? 1;
    const levelB = b.requiredLevel ?? 1;
    return levelA - levelB;
  });
});
</script>
