<template>
  <div class="card shadow text-light">
    <div class="card-body">
      <h3 class="mb-3">⚙️ Settings</h3>

      <button class="btn btn-danger" @click="resetGame()">
        Reset Game
      </button>
    </div>
  </div>
</template>

<script setup>
import { resetGame } from "../game/state/gameState";
</script>
