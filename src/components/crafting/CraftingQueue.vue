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
        <!-- LEFT SIDE -->
        <div class="left">
          <span class="job-name">{{ job.recipe.name }}</span>
          <span class="job-qty">× {{ job.quantity }}</span>
        </div>

        <!-- RIGHT SIDE -->
        <div class="right">
          <!-- Active craft -->
          <template v-if="i === 0 && isCrafting">
            <div class="progress-wrapper">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>

            <div class="time-text">⏳ {{ timeLeft }}</div>
          </template>

          <!-- Waiting -->
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
import { cancelCraft, getCraftingStatus } from "../../game/crafting/craftingEngine";

const game = getGame();

console.log("ACTIVE", game.crafting.active);
console.log("QUEUE", game.crafting.queue);
console.log("IS", game.isCrafting);

const queue = computed(() => game.crafting?.queue ?? []);

const status = computed(() => getCraftingStatus());

const isCrafting = computed(() => status.value.isCrafting);
const progress = computed(() => status.value.progress);
const timeLeft = computed(() =>
  formatTime(status.value.remaining)
);

/**
 * Stop = engine laten beslissen
 */
function stopCrafting() {
  cancelCraft();
}
</script>

<style scoped>
/* ===================================================== */
/* CRAFTING QUEUE — OSRS HD STYLE                        */
/* ===================================================== */

.queue-box {
  margin-top: 18px;
  padding: 20px;

  border-radius: 12px;
  background: linear-gradient(145deg, #2c2c2c, #1b1b1b);
  border: 1px solid #6c6c6c44;

  color: white;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.45),
    inset 0 0 10px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);
}

h5 {
  margin: 0 0 12px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.3px;
}

/* Stop button */
.stop-btn {
  padding: 4px 10px;
  border-radius: 8px;

  border: 1px solid rgba(255, 90, 90, 0.5);
  background: linear-gradient(145deg, #ff4e4e, #c93737);
  color: white;

  font-weight: 700;
  cursor: pointer;

  box-shadow: 0 0 10px rgba(255, 70, 70, 0.4);
  transition: 0.15s;
}

.stop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 14px rgba(255, 70, 70, 0.6);
}

/* Queue items */
.queue-item {
  padding: 12px 4px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.queue-item:last-child {
  border-bottom: none;
}

.job-name {
  font-size: 1rem;
  font-weight: 600;
}

.job-qty {
  opacity: 0.7;
  font-size: 0.85rem;
}

.right {
  min-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Progress bar */
.progress-wrapper {
  width: 150px;
  height: 10px;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  overflow: hidden;
  backdrop-filter: blur(5px);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fa8ff, #87c8ff);
  box-shadow: 0 0 8px #4fa8ff;
  transition: width 0.12s linear;
}

.time-text {
  margin-top: 6px;
  opacity: 0.85;
  font-size: 0.9rem;
}

.waiting-text {
  opacity: 0.7;
  font-style: italic;
  font-size: 0.85rem;
}
</style>
