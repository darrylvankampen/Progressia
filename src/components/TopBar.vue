<template>
  <div class="topbar shadow">
    <!-- LEFT: Player Info -->
    <div class="left">

      <div class="stat">
        <span class="icon">⭐</span>
        <span>{{ totalLevel }}</span>
      </div>

      <div class="stat">
        <span class="icon">❤️</span>
        <span>{{ game.player.hp }}/{{ game.player.maxHp }}</span>
      </div>

      <div class="stat">
        <span class="icon">🪙</span>
        <span>{{ game.player.gold }}</span>
      </div>

    </div>

    <!-- CENTER: Active XP (Melvor style) -->
    <div class="center" v-if="activeSkill">
      <div class="xp-label">
        {{ activeSkill.name }} (Lvl {{ activeSkill.level }})
      </div>
      <div class="xp-bar">
        <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
      </div>
    </div>

    <!-- RIGHT: Clock -->
    <div class="right">
      <span>{{ time }}</span>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { getGame } from "../game/state/gameState";

const game = getGame();

/* ---------------------------
   CLOCK SYSTEM
--------------------------- */
const time = ref("");

function updateClock() {
  const now = new Date();
  time.value = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

onMounted(() => {
  updateClock();
  setInterval(updateClock, 1000);
});

/* ---------------------------
   TOTAL LEVEL
--------------------------- */
const totalLevel = computed(() =>
  Object.values(game.skills).reduce((acc, s) => acc + s.level, 0)
);

/* ---------------------------
   ACTIVE SKILL XP DISPLAY
--------------------------- */
const activeSkill = computed(() =>
  Object.values(game.skills).find((s) => s.isActive)
);

const xpPercent = computed(() => {
  if (!activeSkill.value) return 0;
  const s = activeSkill.value;
  return Math.min(100, Math.floor((s.xp / s.xpToNext) * 100));
});
</script>

<style scoped>
.topbar {
  height: 52px;
  background: rgba(20, 20, 20, 0.6);
  border-bottom: 2px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
}

.left,
.right {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
}

.icon {
  font-size: 1.2rem;
}

.center {
  width: 30%;
  text-align: center;
}

.xp-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.xp-bar {
  margin-top: 4px;
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.2);
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #6cf, #9ef);
  transition: width 0.3s ease;
}
</style>
