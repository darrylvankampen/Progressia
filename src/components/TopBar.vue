<template>
  <div class="topbar">

    <!-- LEFT: PLAYER STATS -->
    <div class="left">
      <div class="stat-badge">
        ⭐ {{ totalLevel }}
      </div>

      <div class="stat-badge hp">
        ❤️ {{ game.player.hp }}/{{ game.player.maxHp }}
      </div>

      <div class="stat-badge gold">
        🪙 {{ game.player.gold }}
      </div>
    </div>

    <!-- CENTER: ACTIVE XP -->
    <div class="center" v-if="activeSkill">
      <div class="xp-label">
        {{ activeSkill.name }} (Lv {{ activeSkill.level }})
      </div>

      <div class="xp-bar">
        <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
      </div>
    </div>

    <!-- RIGHT: CLOCK -->
    <div class="right">
      <div class="clock">{{ time }}</div>
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
  height: 56px;

  /* OSRS HD translucent dark slate */
  background: linear-gradient(145deg, #272727ee, #1a1a1add);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 0 22px;
  color: #f5f5f5;

  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.45),
    inset 0 -2px 6px rgba(255, 255, 255, 0.04);
}

/* LEFT & RIGHT GROUPS ------------------------------------------------ */
.left,
.right {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* STAT BADGES -------------------------------------------------------- */
.stat-badge {
  padding: 6px 12px;
  border-radius: 10px;

  background: linear-gradient(145deg, #363636, #1f1f1f);
  border: 1px solid rgba(255, 255, 255, 0.12);

  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.35),
    inset 0 0 6px rgba(255, 255, 255, 0.05);

  font-size: 0.95rem;
  font-weight: 600;

  display: flex;
  align-items: center;
  gap: 6px;

  color: #eee;
}

.stat-badge.hp {
  border-color: #ff6b6b99;
  box-shadow: 0 0 10px #ff6b6b55;
}

.stat-badge.gold {
  border-color: #e0c36d99;
  box-shadow: 0 0 10px #e0c36d55;
}

/* CENTER XP SECTION -------------------------------------------------- */
.center {
  text-align: center;
  width: 32%;
}

.xp-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 4px;
  letter-spacing: 0.4px;
}

/* XP BAR (OSRS HD Style) */
.xp-bar {
  width: 100%;
  height: 9px;

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);

  border-radius: 999px;
  overflow: hidden;

  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.4);
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4fc3ff, #9be7ff);
  box-shadow: 0 0 10px #6fcaff;

  transition: width 0.25s ease-out;
}

/* CLOCK --------------------------------------------------------------- */
.clock {
  font-weight: 600;
  opacity: 0.9;
  letter-spacing: 0.4px;

  padding: 6px 12px;
  border-radius: 10px;

  background: linear-gradient(145deg, #303030, #202020);
  border: 1px solid rgba(255, 255, 255, 0.12);

  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.35),
    inset 0 0 6px rgba(255, 255, 255, 0.05);
}
</style>
