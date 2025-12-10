<template>
  <div class="skills-grid">
    <div v-for="(skill, key) in skillsList" :key="key" class="skill-card" @click="$emit('openSkill', skill.key)"
      :style="{ '--accent': skill.accent }">
      <!-- ICON RING -->
      <div class="icon-ring small">
        <img :src="skill.icon" class="skill-icon" />
      </div>

      <!-- NAME -->
      <h3 class="skill-name">{{ skill.name }}</h3>

      <!-- LEVEL -->
      <div class="skill-level">
        Lv {{ skill.level }}
        <span class="divider">/</span>
        {{ skill.maxLevel }}
      </div>

      <!-- XP BAR -->
      <div class="xp-bar">
        <div class="xp-fill" :style="{ width: skill.xpPercent + '%' }"></div>
      </div>

      <div class="xp-text">
        {{ skill.xp }} / {{ skill.xpToNext }} XP
        <span class="total">(Total: {{ skill.totalXP }})</span>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed } from "vue";
import { getGame, getSkillDefs } from "../../game/state/gameState";
import { getSkillColor } from "../../game/utils/skillColors";

const game = getGame();

// Create a flat list for iteration
const skillsList = computed(() => {
  return Object.entries(game.skills).map(([key, s]) => {
    const def = getSkillDefs()[key];
    const xpPercent = Math.min(100, Math.round((s.xp / s.xpToNext) * 100));

    return {
      key,
      name: def.name,
      icon: def.icon,
      level: s.level,
      maxLevel: def.maxLevel,
      xp: s.xp,
      xpToNextLevel: s.xpToNextLevel,
      xpPercent,
      accent: getSkillColor(def.name.toLowerCase()),
      totalXP: s.totalXP,
    };
  });
});
</script>

<style scoped>
/* GRID ----------------------------------------------------------- */
.skills-grid {
  display: grid;
  gap: 26px;
  padding: 20px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

/* SKILL CARD ----------------------------------------------------- */
.skill-card {
  background: linear-gradient(145deg, #2c2c2c, #1b1b1b);
  border: 1px solid #5a5a5a55;
  border-radius: 16px;

  padding: 24px 18px;
  text-align: center;

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 8px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(10px);

  cursor: pointer;
  transition: 0.18s ease-in-out;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Hover glow */
.skill-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.6),
    0 0 14px var(--accent);
}

/* ICON RING ------------------------------------------------------ */
.icon-ring.small {
  width: 76px;
  height: 76px;

  border-radius: 999px;
  border: 2px solid var(--accent);

  background: linear-gradient(145deg, #303030, #1f1f1f);

  display: flex;
  justify-content: center;
  align-items: center;

  box-shadow:
    0 0 10px var(--accent),
    inset 0 0 8px rgba(255, 255, 255, 0.06);

  margin-bottom: 14px;
}

.skill-icon {
  width: 44px;
  height: 44px;
  object-fit: contain;
  object-position: center;
  display: block;
}

/* NAME ----------------------------------------------------------- */
.skill-name {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 6px 0 4px 0;

  color: #eaeaea;
  letter-spacing: 0.4px;
}

/* LEVEL ---------------------------------------------------------- */
.skill-level {
  font-size: 0.95rem;
  opacity: 0.9;
}

.divider {
  opacity: 0.35;
}

/* XP BAR --------------------------------------------------------- */
.xp-bar {
  width: 100%;
  height: 12px;
  margin: 12px 0 6px;

  border-radius: 999px;
  overflow: hidden;

  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.xp-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease-out;

  background: linear-gradient(90deg, var(--accent), #ffffff);
  box-shadow: 0 0 10px var(--accent);
}

/* XP TEXT -------------------------------------------------------- */
.xp-text {
  opacity: 0.85;
  font-size: 0.85rem;
}

.total {
  opacity: 0.55;
  font-size: 0.75rem;
}
</style>
