<template>
  <div class="actions-container">
    <div v-for="action in skillData.actions" :key="action.id" class="action-card card-style" :class="{
      locked: skill.level < action.requiredLevel,
      active: skill.currentActionId === action.id
    }" :style="{ '--accent': accent }" @click="handleClick(action)">
      <!-- HEADER ------------------------------------------------------- -->
      <div class="action-header">
        <div class="action-title">
          {{ action.name }}
        </div>

        <div class="lvl-chip">
          Lvl {{ action.requiredLevel }}
        </div>
      </div>

      <!-- STATS -------------------------------------------------------- -->
      <div class="stats">

        <!-- TIME -->
        <div class="stat-row">
          <span class="stat-label">⏱ Time</span>
          <span>
            <strong>{{ breakdown(action).finalTime / 1000 }}s</strong>
          </span>
        </div>

        <!-- XP -->
        <div class="stat-row">
          <span class="stat-label">⭐ XP</span>
          <span>
            <strong>{{ breakdown(action).finalXp }}</strong>
          </span>
        </div>

        <!-- AMOUNT -->
        <div class="stat-row">
          <span class="stat-label">{{ resourceLabel }}</span>
          <span>
            <strong>{{ breakdown(action).finalAmount }}</strong>
          </span>
        </div>

        <!-- RARE DROPS -->
        <div v-if="breakdown(action).rareDrops.length" class="rare-section">
          <div class="rare-label">🍀 Rare Drops</div>
          <div class="rare-list">
            <div v-for="drop in breakdown(action).rareDrops" :key="drop.item" class="rare-chip">
              {{ drop.item }}
              <span class="percent">
                {{ (drop.finalChance * 100).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ACTION BUTTON ------------------------------------------------ -->
      <button class="start-btn" :class="{ active: skill.currentActionId === action.id }">
        {{ skill.currentActionId === action.id ? "Active" : "Start" }}
      </button>

      <div v-if="skill.currentActionId === action.id" class="progress-wrapper">
        <div class="progress-fill" :style="{ width: progressPercent(action) + '%' }"></div>
      </div>

      <!-- LOCKED OVERLAY ----------------------------------------------- -->
      <div v-if="skill.level < action.requiredLevel" class="lock-overlay">
        <div class="lock-text">
          🔒 Requires Level {{ action.requiredLevel }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getGame } from "../../game/state/gameState";
import { startAction } from "../../game/skillEngine";
import { getActionBreakdown } from "../../game/helpers/getActionBreakdown";
import { getSkillColor } from "../../game/utils/skillColors";
const props = defineProps({
  skillKey: String,
  skillData: Object
});
const accent = getSkillColor(props.key)
const game = getGame();
const skill = computed(() => game.skills[props.skillKey]);

const breakdown = (action) => {
  return getActionBreakdown(props.skillKey, action);
};

const resourceLabel = computed(() => {
  return props.skillKey === "mining"
    ? "⛏️ Ore"
    : props.skillKey === "woodcutting"
      ? "🌲 Logs"
      : "📦 Items";
});

const progressPercent = (action) => {
  // alleen de actieve actie krijgt progress
  if (skill.value.currentActionId !== action.id) return 0;

  const current = skill.value.timeLeft ?? 0;
  const total = skill.value.currentAction?.actionTime ?? 1;

  return Math.max(0, Math.min(100, 100 - (current / total) * 100));
};

function handleClick(action) {
  if (skill.value.level < action.requiredLevel) return;
  startAction(props.skillKey, action);
}
</script>

<style scoped>
/* GRID -------------------------------------------------------------- */
.actions-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 22px;
}

/* CARD -------------------------------------------------------------- */
.action-card {
  position: relative;
  padding: 18px;
  border-radius: 20px;

  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);

  backdrop-filter: blur(10px) brightness(0.85);
  -webkit-backdrop-filter: blur(10px) brightness(0.85);

  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.35),
    inset 0 0 14px rgba(255, 255, 255, 0.03);

  cursor: pointer;
  transition: 0.18s ease;
  color: #fff;
}


.action-card:hover {
  transform: translateY(-6px);
  border-color: var(--accent);
  box-shadow:
    0 6px 25px rgba(0, 0, 0, 0.4),
    0 0 12px var(--accent);
}

.action-card.active {
  border-color: var(--accent);
  box-shadow:
    0 0 18px var(--accent),
    0 0 8px rgba(255, 255, 255, 0.15) inset;
}

/* LOCKED ------------------------------------------------------------ */
.action-card.locked {
  opacity: 0.45;
  cursor: not-allowed;
  filter: grayscale(0.6);
}

.lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-text {
  background: rgba(0, 0, 0, 0.4);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #eee;
}

/* HEADER ------------------------------------------------------------ */
.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.action-title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.lvl-chip {
  background: rgba(255, 255, 255, 0.12);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ddd;
}

/* STATS ------------------------------------------------------------- */
.stats {
  margin-bottom: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  margin-bottom: 6px;
  opacity: 0.92;
}

.stat-label {
  opacity: 0.75;
}

/* RARE DROPS -------------------------------------------------------- */
.rare-section {
  margin-top: 12px;
}

.rare-label {
  font-weight: 600;
  opacity: 0.85;
  margin-bottom: 6px;
}

.rare-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rare-chip {
  background: rgba(255, 255, 255, 0.10);
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #eee;
  display: flex;
  gap: 5px;
}

.percent {
  opacity: 0.65;
}

/* BUTTON ------------------------------------------------------------ */
.start-btn {
  width: 100%;
  padding: 10px;
  background: var(--accent);
  border-radius: 12px;
  border: none;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: 0.15s ease;
  margin-top: 6px;
  font-size: 1rem;

  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--accent);
}

.start-btn.active {
  background: linear-gradient(145deg, var(--accent), #ffffff55);
  box-shadow: 0 0 14px var(--accent);
  font-weight: 800;
  letter-spacing: 0.5px;
}

.start-btn.active:hover {
  transform: translateY(-2px);
}

/* PROGRESS BAR ----------------------------------------------------- */
.progress-wrapper {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 10px;

  backdrop-filter: blur(4px);
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  transition: width 0.1s linear;
}
</style>
