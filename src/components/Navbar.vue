<template>
  <nav class="navbar navbar-dark mb-4">
    <div class="container d-flex justify-content-between">
      <span class="navbar-brand">Progressia</span>

      <button @click="$emit('reset')" class="btn btn-danger btn-sm">
        Reset Save
      </button>
    </div>
  </nav>
</template>

<script setup>
// emits automatisch: $emit('reset')
</script>
