<template>
  <div class="player-stats-page" :style="{ '--accent': accentColor }">
    <!-- HEADER ------------------------------------------------ -->
    <div class="player-header card-style">
      <div class="icon-ring">
        <img src="/icons/player.png" class="player-icon" />
      </div>

      <div class="player-info">
        <h2 class="player-name">{{ game.player.name }}</h2>

        <div class="player-meta">
          <span>Total XP: </span>
          <strong>{{ totalXp }}</strong>
        </div>

        <div class="player-meta" v-if="highestSkill">
          <span>Highest Skill: </span>
          <strong>{{ highestSkill.name }} (Lv {{ highestSkill.level }})</strong>
        </div>

        <div class="player-meta" v-if="highestSkill">
          <span>Achievement Points: </span>
          <strong>{{ game.player.achievementPoints }}</strong>
        </div>
      </div>
    </div>

    <!-- SKILL GRID --------------------------------------------- -->
    <div class="skills-grid">
      <div
        v-for="(skill, key) in skillList"
        :key="key"
        class="skill-card"
        :style="{ '--accent': skill.accent }"
      >
        <div class="icon-ring small">
          <img :src="skill.icon" class="skill-icon" />
        </div>

        <div class="skill-name">{{ skill.name }}</div>

        <div class="skill-level">
          Lvl {{ skill.level }}
          <span class="divider">/</span>
          {{ skill.maxLevel }}
        </div>

        <div class="xp-bar">
          <div class="xp-fill" :style="{ width: skill.xpPercent + '%' }"></div>
        </div>

        <div class="xp-text">{{ skill.xp }} / {{ skill.xpToNext }} XP</div>
      </div>
    </div>

    <SectionHeader icon="🏆" title="Your Achievements" :accent="accentColor" />

    <div class="achievements-grid">
      <div
        v-for="a in achievements"
        :key="a.id"
        class="achievement-card"
        :style="{
          borderColor: a.unlocked ? a.rarityColor : 'rgba(255,255,255,0.08)',
        }"
      >
        <img :src="a.icon" class="achievement-icon" />

        <div class="achievement-name">{{ a.name }}</div>
        <div class="achievement-desc">{{ a.description }}</div>
        <div class="rarity-label" :style="{ color: a.rarityColor }">
          {{ a.rarityLabel }}
        </div>
        <div v-if="a.unlocked" class="badge locked">Unlocked</div>
        <div v-else class="badge locked">Locked</div>
      </div>
    </div>

    <!-- GROUPED PERMANENT BONUSES ---------------------------------------- -->
    <SectionHeader
      v-if="groupedPermanentBuffs.length"
      icon="♾️"
      title="Permanent Bonuses"
      :accent="accentColor"
    />

    <div v-if="groupedPermanentBuffs.length" class="permanent-bonus-grid">
      <div
        v-for="group in groupedPermanentBuffs"
        :key="group.skill + '_' + group.type"
        class="permanent-bonus-card"
      >
        <div class="bonus-name">
          {{ formatSkillName(group.skill) }}
          {{ formatTypeName(group.type) }} Bonuses
        </div>

        <div class="bonus-total">Total: +{{ group.total }}%</div>

        <div class="bonus-tag">Permanent Bonus</div>
      </div>
    </div>
    <SectionHeader
      v-if="playerTitles.length"
      icon="🎖️"
      title="Player Titles"
      :accent="accentColor"
    />

    <div v-if="playerTitles.length" class="titles-grid">
      <div
        v-for="title in playerTitles"
        :key="title"
        class="title-card"
        :class="{ active: title === activeTitle }"
        @click="equipTitle(title)"
      >
        <div class="title-name">{{ title }}</div>

        <div v-if="title === activeTitle" class="title-badge active-badge">
          Active Title
        </div>
        <div v-else class="title-badge">Unlocked</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { getGame, getSkillDefs, getActiveBuffs, saveGame } from "../game/state/gameState";
import { getSkillColor } from "../game/utils/skillColors";
import { getAchievementsWithStatus } from "../game/achievements/achievementEngine";
import SectionHeader from "../components/ui/SectionHeader.vue";
import { getBuffDef } from "../game/utils/buffDB";

const game = getGame();

const achievements = computed(() =>
  getAchievementsWithStatus().filter((a) => a.unlocked)
);

function equipTitle(title) {
  // Als je al deze titel hebt, gewoon equippen
  game.player.activeTitle = title;
  saveGame();
}

// --- PERMANENT BUFFS RAW -----------------------------------------
const permanentBuffs = computed(() => {
  return (getActiveBuffs() || [])
    .filter((b) => !b.expiresAt)
    .map((b) => {
      const def = getBuffDef(b.id);
      return {
        id: b.id,
        modifiers: def?.modifiers || {},
      };
    });
});

// --- GROUPING ------------------------------------------------------
function parseStatKey(stat) {
  const parts = stat.split("_");
  return {
    skill: parts[0],
    type: parts[1],
  };
}

const groupedPermanentBuffs = computed(() => {
  const groups = {};

  for (const buff of permanentBuffs.value) {
    for (const stat in buff.modifiers) {
      const value = buff.modifiers[stat];

      const { skill, type } = parseStatKey(stat);
      const key = `${skill}_${type}`;

      if (!groups[key]) {
        groups[key] = {
          skill,
          type,
          total: 0,
          buffs: [],
        };
      }

      groups[key].total += value;
      groups[key].buffs.push({
        id: buff.id,
        value,
      });
    }
  }

  return Object.values(groups);
});

// Formatting helpers
function formatSkillName(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTypeName(t) {
  if (t === "xp") return "XP";
  if (t === "speed") return "Speed";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Skills
const skillList = computed(() => {
  const defs = getSkillDefs();

  return Object.entries(game.skills).map(([key, s]) => {
    const def = defs[key];
    const xpPercent = Math.min(100, Math.round((s.xp / s.xpToNext) * 100));

    return {
      key,
      name: def.name,
      icon: def.icon,
      level: s.level,
      maxLevel: def.maxLevel,
      xp: s.xp,
      xpToNext: s.xpToNext,
      xpPercent,
      accent: getSkillColor(key),
    };
  });
});

const totalXp = computed(() => game.player.totalXP);

const highestSkill = computed(() => {
  let top = null;
  for (const [key, s] of Object.entries(game.skills)) {
    if (!top || s.level > top.level) {
      top = { key, ...s, name: getSkillDefs()[key].name };
    }
  }
  return top;
});

const playerTitles = computed(() => game.player.titles);
const activeTitle = computed(() => game.player.activeTitle || null);

const accentColor = "#6ee7b7";
</script>

<style scoped>
/* PAGE layout -------------------------------------------------------- */
.player-stats-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  color: white;
}

/* HEADER -------------------------------------------------------------- */
.player-header {
  display: flex;
  align-items: center;
  gap: 24px;

  padding: 24px;
  margin-bottom: 28px;

  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  backdrop-filter: blur(10px);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
}

/* PLAYER ICON --------------------------------------------------------- */
.icon-ring {
  width: 90px;
  height: 90px;
  border-radius: 999px;

  background: radial-gradient(circle at 30% 30%, #ffffff25, #00000020);
  border: 2px solid var(--accent);
  box-shadow: 0 0 12px var(--accent), inset 0 0 8px rgba(255, 255, 255, 0.06);

  display: flex;
  justify-content: center;
  align-items: center;
}

.skill-icon {
  width: 60px;
  height: 60px;
}

.player-icon {
  width: 55px;
  height: 55px;
}

/* PLAYER INFO --------------------------------------------------------- */
.player-name {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  margin: 0;
}

.player-meta {
  font-size: 1rem;
  opacity: 0.85;
  margin-top: 4px;
}

/* SKILL GRID ---------------------------------------------------------- */
.skills-grid {
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

/* SKILL CARD ---------------------------------------------------------- */
.skill-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 20px;
  padding: 18px;
  text-align: center;

  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);

  display: flex;
  flex-direction: column;
  align-items: center; /* ← icon-ring nu perfect gecentreerd */
}
/* SKILL INFO ---------------------------------------------------------- */
.skill-name {
  margin-top: 10px;
  font-weight: 600;
  font-size: 1.1rem;
}

.skill-level {
  margin-top: 4px;
  opacity: 0.9;
}

.divider {
  opacity: 0.3;
  padding: 0 4px;
}

/* XP BAR -------------------------------------------------------------- */
.xp-bar {
  background: rgba(255, 255, 255, 0.1);
  height: 10px;
  width: 100%;
  border-radius: 999px;
  margin: 10px 0 4px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), white);
  transition: 0.3s ease;
}

.xp-text {
  opacity: 0.75;
  font-size: 0.85rem;
}

/* Achievements*/
.achievements-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.achievement-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(6px);
  transition: 0.2s ease;
}

.achievement-card.unlocked {
  border-color: gold;
  box-shadow: 0 0 14px gold;
}

.achievement-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 10px;
}

.badge {
  margin-top: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
}

.badge.locked {
  background: rgba(255, 255, 255, 0.08);
}

.badge.unlocked {
  background: gold;
  color: black;
  font-weight: bold;
}

.rarity-label {
  font-size: 0.8rem;
  margin-top: 6px;
  opacity: 0.9;
  font-weight: bold;
  letter-spacing: 0.5px;
}

/* PERMANENT BONUSES ------------------------------------------------ */
.permanent-bonus-grid {
  margin-top: 20px;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.permanent-bonus-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  transition: 0.2s ease;
}

.permanent-bonus-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.bonus-icon {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
  opacity: 0.9;
}

.bonus-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 6px;
}

.bonus-desc {
  font-size: 0.85rem;
  opacity: 0.8;
  line-height: 1.3;
  margin-bottom: 10px;
}

.bonus-modifiers {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  font-size: 0.9rem;
}

.bonus-modifiers li {
  opacity: 0.9;
  padding: 2px 0;
}

.bonus-tag {
  margin-top: 8px;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(110, 231, 183, 0.25);
  border: 1px solid rgba(110, 231, 183, 0.45);
  font-size: 0.75rem;
  color: white;
  letter-spacing: 0.5px;
}

/* GROUPED PERMANENT BONUSES ------------------------------------------- */
.permanent-bonus-grid {
  margin-top: 20px;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.permanent-bonus-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  backdrop-filter: blur(8px);
}

.bonus-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 8px;
}

.bonus-modifiers {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
}

.bonus-total {
  font-weight: bold;
  margin-bottom: 12px;
  color: var(--accent);
}

.bonus-tag {
  margin-top: 8px;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(110, 231, 183, 0.25);
  border: 1px solid rgba(110, 231, 183, 0.45);
  font-size: 0.75rem;
  letter-spacing: 0.5px;
}

.titles-grid {
  margin-top: 20px;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

.title-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px;
  border-radius: 16px;
  text-align: center;
  backdrop-filter: blur(8px);
  transition: 0.2s ease;
}

.title-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

.title-card {
  cursor: pointer;
  user-select: none;
}

.title-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
  border-color: var(--accent);
}

.title-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

.title-name {
  font-size: 1.2rem;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 8px;
}

.title-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  font-size: 0.75rem;
  color: #eee;
}

.active-badge {
  background: rgba(110, 231, 183, 0.25);
  border: 1px solid rgba(110, 231, 183, 0.45);
  color: white;
  font-weight: bold;
}
</style>
