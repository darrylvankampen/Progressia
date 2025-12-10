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
        <div class="xp-text">{{ skill.xp }} / {{ skill.xpToNext }} XP (total: {{ skill.totalXP }} XP)</div>
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
/* ========================================= */
/* SKILL PAGE — OSRS-HD Modern Theme */
/* ========================================= */

.skill-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px;

  color: white;
  animation: fadeIn 0.25s ease-out;
}

/* ========================================= */
/* HEADER PANEL */
/* ========================================= */

.skill-header {
  display: flex;
  align-items: center;
  gap: 28px;

  padding: 26px 30px;
  border-radius: 14px;

  background: linear-gradient(145deg, #2f2f2f, #1c1c1c);
  border: 1px solid #6c6c6c44;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.45),
    inset 0 0 12px rgba(255, 255, 255, 0.05);
}

/* ICON RING */
.icon-ring {
  width: 95px;
  height: 95px;
  border-radius: 999px;

  background: linear-gradient(145deg, #2d2d2d, #1b1b1b);
  border: 2px solid var(--accent);
  box-shadow:
    0 0 12px var(--accent),
    inset 0 0 10px rgba(255, 255, 255, 0.05);

  display: flex;
  align-items: center;
  justify-content: center;
}

.skill-icon {
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* TITLE + LEVEL */
.skill-title {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: var(--accent);

  text-shadow: 0 0 12px rgba(0, 0, 0, 0.45);
}

.skill-level {
  font-size: 1.2rem;
  opacity: 0.85;
  margin-bottom: 10px;
}

/* XP BAR */
.xp-bar {
  height: 16px;
  width: 100%;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.12);

  overflow: hidden;
  backdrop-filter: blur(4px);
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ffffffaa);
  box-shadow: 0 0 10px var(--accent);
  border-radius: 999px;
  transition: width 0.3s ease-out;
}

.xp-text {
  margin-top: 6px;
  font-size: 0.9rem;
  opacity: 0.85;
}

/* STOP BUTTON */
.fancy-btn {
  width: 100%;
  padding: 14px;
  margin-top: 26px;

  background: linear-gradient(145deg, #ff5a5a, #c63b3b);
  border-radius: 12px;

  border: 1px solid #ff7b7b55;
  color: white;
  font-size: 1.15rem;
  font-weight: 700;

  cursor: pointer;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 10px #ff6b6b55;

  transition: 0.15s ease;
}

.fancy-btn:hover {
  transform: translateY(-3px);
  box-shadow:
    0 0 14px #ff6b6b88,
    inset 0 0 12px rgba(255, 255, 255, 0.1);
}

/* SHARED PANEL STYLE */
.card-style {
  background: linear-gradient(145deg, #2b2b2b, #1c1c1c);
  border: 1px solid #6c6c6c44;
  border-radius: 12px;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.35),
    inset 0 0 8px rgba(255, 255, 255, 0.05);

  backdrop-filter: blur(8px);
  margin-bottom: 20px;
}

/* FADE IN */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
  }
}
</style>
