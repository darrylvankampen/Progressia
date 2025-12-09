<template>
  <div class="skills-grid">
    <div
      v-for="(skill, key) in skillsList"
      :key="key"
      class="skill-card"
      @click="$emit('openSkill', skill.name.toLowerCase())"
      :style="{ '--accent': skill.accent }"
    >
      <!-- Icon badge -->
      <div class="icon-ring">
        <img :src="skill.icon" class="skill-icon" />
      </div>

      <h3 class="skill-name">{{ skill.name }}</h3>

      <div class="skill-level">
        Lv {{ skill.level }} <span class="divider">/</span> {{ skill.maxLevel }}
      </div>

      <!-- XP bar -->
      <div class="xp-bar">
        <div class="xp-fill" :style="{ width: skill.xpPercent + '%' }"></div>
      </div>

      <div class="xp-text">{{ skill.xp }} / {{ skill.xpToNext }} XP</div>
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
    };
  });
});
</script>

<style scoped>
.skills-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  padding: 20px;
}

.skill-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  padding: 22px 18px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(6px);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.skill-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4), 0 0 12px var(--accent);
}

/* ICON RING ---------------------------------------------------- */
.icon-ring {
  width: 70px;
  height: 70px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #ffffff25, #00000020);
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 14px;

  border: 2px solid var(--accent);
  box-shadow: 0 0 8px calc(var(--accent) + '33');
}

.skill-icon {
  width: 48px;
  height: 48px;
}

/* NAME -------------------------------------------------------- */
.skill-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 0.4px;
  color: #e6e6e6;
}

/* LEVEL ------------------------------------------------------- */
.skill-level {
  margin-top: 4px;
  font-size: 0.95rem;
  opacity: 0.9;
}

.divider {
  opacity: 0.35;
  padding: 0 4px;
}

/* XP BAR ------------------------------------------------------ */
.xp-bar {
  background: #1a1a1a;
  height: 9px;
  border-radius: 999px;
  margin: 12px 0 6px;
  overflow: hidden;
  border: 1px solid #00000060;
}

.xp-fill {
  background: linear-gradient(
    90deg,
    var(--accent),
    white
  );
  height: 100%;
  transition: width 0.35s ease;
}

/* XP TEXT ----------------------------------------------------- */
.xp-text {
  font-size: 0.85rem;
  opacity: 0.85;
  letter-spacing: 0.3px;
}
</style>
