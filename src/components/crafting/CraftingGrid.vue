<template>
  <div class="row g-3 mt-2">
    <div v-for="recipe in recipes" :key="recipe.id" class="col-12 col-md-4">
      <CraftingCard :recipe="recipe" :options="options" :canCraft="canCraft" />
    </div>
  </div>
</template>

<script setup>
import CraftingCard from "./CraftingCard.vue";

defineProps({
  recipes: Array,
  options: Array,
  canCraft: Function
});
</script>
