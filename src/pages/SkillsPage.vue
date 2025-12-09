<template>
  <div v-if="skill && skillDef" class="skill-page" :style="{ '--accent': accent }">
    <!-- HEADER --------------------------------------------------- -->
    <div class="skill-header card-style">
      <div class="icon-ring">
        <img :src="skillDef.icon" class="skill-icon" />
      </div>

      <div class="skill-info">
        <h2 class="skill-title">{{ skillDef.name }}</h2>

        <div class="skill-level">
          Level <strong>{{ skill.level }}</strong>
          <span class="divider">/</span>
          {{ skillDef.maxLevel }}
        </div>

        <!-- XP BAR -->
        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: xpPercent + '%' }"></div>
        </div>
        <div class="xp-text">{{ skill.xp }} / {{ skill.xpToNext }} XP</div>
      </div>
    </div>

    <!-- ACTION LIST --------------------------------------------------- -->
    <SkillActionList :skillKey="skillKey" :skillData="skillDef" class="actions-section" />

    <!-- STOP BUTTON --------------------------------------------------- -->
    <button v-if="skill.isActive" class="stop-btn fancy-btn" @click="stopSkill(skillKey)">
      ✖ Stop {{ skillDef.name }}
    </button>
  </div>

  <div v-else class="loading-container">
    <div class="loading-card card-style">Loading skill data...</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

import SkillActionList from "../components/skills/SkillActionList.vue";
import { getGame, getSkillDefs } from "../game/state/gameState";
import { stopSkill } from "../game/skillEngine";

import { getSkillColor } from "../game/utils/skillColors";

const accent = computed(() => getSkillColor(skillKey.value));

// Props OR route param
const route = useRoute();

const props = defineProps({
  skillKey: { type: String, required: false },
});

const skillKey = computed(() => props.skillKey || route.params.skillKey);

const game = getGame();

const skillDef = computed(() => getSkillDefs()[skillKey.value]);
const skill = computed(() => game.skills?.[skillKey.value]);

const xpPercent = computed(() => {
  const xp = skill.value.xp;
  const need = skill.value.xpToNext;

  return ((xp / need) * 100).toFixed(2);
});
</script>

<style scoped>
/* --- GLOBAL LAYOUT -------------------------------------------------- */
.skill-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;
  color: white;
  animation: fadeIn 0.25s ease-out;
}

.actions-section {
  margin-top: 28px;
}

/* --- HEADER --------------------------------------------------------- */
.skill-header {
  display: flex;
  align-items: center;
  padding: 22px;
  gap: 22px;

  background: rgba(255, 255, 255, 0.05);
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.35),
    inset 0 0 14px rgba(255, 255, 255, 0.03);
}

.icon-wrapper {
  min-width: 72px;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-ring {
  width: 90px;
  height: 90px;
  border-radius: 999px;

  background: radial-gradient(circle at 30% 30%, #ffffff25, #00000020);
  border: 2px solid var(--accent);
  box-shadow:
    0 0 12px var(--accent),
    inset 0 0 8px rgba(255, 255, 255, 0.06);

  display: flex;
  justify-content: center;
  align-items: center;
}

.skill-icon {
  width: 60px;
  height: 60px;
}

.skill-info {
  flex: 1;
}

.skill-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.5px;
  color: var(--accent);
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
}

.skill-level {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 8px;
}

.divider {
  opacity: 0.35;
  padding: 0 4px;
}

.xp-bar {
  width: 100%;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg,
      var(--accent),
      #ffffff);
  transition: width 0.3s ease;
  border-radius: 999px;
}

.xp-text {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-top: 4px;
}

/* --- STOP BUTTON ---------------------------------------------------- */
/* STOP BUTTON --------------------------------------------------------- */
.fancy-btn {
  margin-top: 24px;
  width: 100%;
  padding: 14px;

  background: linear-gradient(145deg, #ff6b6b, #d63031);
  border-radius: 14px;
  border: none;
  color: white;
  font-weight: 800;
  font-size: 1.15rem;

  cursor: pointer;
  transition: 0.2s ease;
  box-shadow: 0 4px 14px rgba(255, 0, 0, 0.25);
}

.fancy-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(255, 0, 0, 0.35);
}

/* LOADING ------------------------------------------------------------- */
.loading-container {
  padding: 40px;
  display: flex;
  justify-content: center;
}

.loading-card {
  padding: 20px 28px;
  font-size: 1.2rem;
  opacity: 0.9;
}

/* ANIMATIONS ---------------------------------------------------------- */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
  }
}

/* --- CARD STYLE SHARED ------------------------------------------------ */
.card-style {
  background: rgba(25, 25, 40, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

/* MULTI HIT ------------------------------------------------- */
.hit-progress-box {
  margin-top: 12px;
}

.hit-label {
  font-size: 0.9rem;
  opacity: 0.85;
  margin-bottom: 6px;
}

.hit-bar {
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hit-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ffffffaa);
  transition: width 0.2s ease-out;
  border-radius: 999px;
}
</style>
