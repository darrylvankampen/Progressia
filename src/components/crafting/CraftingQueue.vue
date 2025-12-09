<template>
  <div class="mt-3 p-3 rounded queue-box text-light">
    <h5 class="d-flex justify-content-between align-items-center">
      Crafting Queue
      <button v-if="queue.length > 0" class="stop-btn" @click="stopCrafting">
        ✖ Stop
      </button>
    </h5>

    <div v-if="queue.length === 0" class="small">Queue is empty</div>

    <ul class="list-unstyled m-0">
      <li v-for="(job, i) in queue" :key="i" class="queue-item">

        <!-- LEFT SIDE: JOB NAME -->
        <div class="left">
          <span class="job-name">{{ job.recipe.name }}</span>
          <span class="job-qty">× {{ job.quantity }}</span>
        </div>

        <!-- RIGHT SIDE -->
        <div class="right">

          <!-- Active craft (first) -->
          <template v-if="i === 0">
            <div class="progress-wrapper">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>

            <div class="time-text">⏳ {{ timeLeft }}</div>
          </template>

          <!-- Waiting queue items -->
          <template v-else>
            <div class="waiting-text">Waiting…</div>
          </template>
        </div>

      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getGame } from "../../game/state/gameState";
import { formatTime } from "../../game/utils/formatTime";
import { cancelCraft } from "../../game/crafting/craftingEngine";

const game = getGame();

const queue = computed(() => game.craftingQueue);
const timeLeft = computed(() => formatTime(game.craftingTimeRemaining));
const progress = computed(() => game.craftingProgress);

function stopCrafting() {
  cancelCraft();

  // verwijder alleen het actieve craft item
  if (game.craftingQueue.length > 0) {
    game.craftingQueue.shift();
  }

  // reset UI values
  game.craftingProgress = 0;
  game.craftingTimeRemaining = 0;
}
</script>

<style scoped>
/* ---- STOP BUTTON ---- */
.stop-btn {
  background: #ff4f4f;
  border: none;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  box-shadow: 0 2px 6px #00000040;
  transition: 0.2s;
}

.stop-btn:hover {
  background: #ff2f2f;
  transform: translateY(-1px);
}

/* (rest van jouw styling blijft exact hetzelfde) */

.queue-box {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.08);
}

.queue-item {
  padding: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.queue-item:last-child {
  border-bottom: none;
}

.left {
  display: flex;
  flex-direction: column;
}

.job-name {
  font-weight: 600;
  font-size: 1rem;
}

.job-qty {
  opacity: 0.7;
  font-size: 0.9rem;
}

.right {
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.progress-wrapper {
  width: 140px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6cc4ff, #4fa8ff);
  transition: width 0.1s linear;
}

.time-text {
  font-size: 0.85rem;
  opacity: 0.9;
}

.waiting-text {
  font-size: 0.85rem;
  opacity: 0.6;
  font-style: italic;
}
</style>
