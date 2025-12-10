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
      <div v-for="(skill, key) in skillList" :key="key" class="skill-card" :style="{ '--accent': skill.accent }">
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
      <div v-for="a in achievements" :key="a.id" class="achievement-card" :style="{
        borderColor: a.unlocked ? a.rarityColor : 'rgba(255,255,255,0.08)',
      }">
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
    <SectionHeader v-if="groupedPermanentBuffs.length" icon="♾️" title="Permanent Bonuses" :accent="accentColor" />

    <div v-if="groupedPermanentBuffs.length" class="permanent-bonus-grid">
      <div v-for="group in groupedPermanentBuffs" :key="group.skill + '_' + group.type" class="permanent-bonus-card">
        <div class="bonus-name">
          {{ formatSkillName(group.skill) }}
          {{ formatTypeName(group.type) }} Bonuses
        </div>

        <div class="bonus-total">Total: +{{ group.total }}%</div>

        <div class="bonus-tag">Permanent Bonus</div>
      </div>
    </div>
    <SectionHeader v-if="playerTitles.length" icon="🎖️" title="Player Titles" :accent="accentColor" />

    <div v-if="playerTitles.length" class="titles-grid">
      <div v-for="title in playerTitles" :key="title" class="title-card" :class="{ active: title === activeTitle }"
        @click="equipTitle(title)">
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
/* ============================================================= */
/* PLAYER STATS PAGE — OSRS HD THEME                             */
/* ============================================================= */

.player-stats-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  color: white;
  animation: fadeIn 0.25s ease-out;
}

/* ============================================================= */
/* HEADER PANEL                                                   */
/* ============================================================= */

.player-header {
  display: flex;
  align-items: center;
  gap: 28px;

  padding: 28px;
  margin-bottom: 32px;

  background: linear-gradient(145deg, #2e2e2e, #1b1b1b);
  border: 1px solid #6c6c6c44;

  border-radius: 14px;

  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.45),
    inset 0 0 10px rgba(255, 255, 255, 0.05);

  backdrop-filter: blur(10px);
}

/* Icon ring (player portrait) */
.icon-ring {
  width: 95px;
  height: 95px;

  border-radius: 50%;
  border: 2px solid var(--accent);
  background: linear-gradient(145deg, #2a2a2a, #161616);

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 0 12px var(--accent),
    inset 0 0 10px rgba(255, 255, 255, 0.06);
}

.player-icon {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
}

/* Player name & stats */
.player-name {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--accent);

  text-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
}

.player-meta {
  margin-top: 6px;
  opacity: 0.85;
  font-size: 1rem;
}

/* ============================================================= */
/* SKILLS GRID                                                    */
/* ============================================================= */

.skills-grid {
  display: grid;
  gap: 26px;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
}

/* Individual skill card */
.skill-card {
  padding: 20px;
  border-radius: 12px;

  text-align: center;

  background: linear-gradient(145deg, #2c2c2c, #1c1c1c);
  border: 1px solid #6c6c6c33;

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.4),
    inset 0 0 8px rgba(255, 255, 255, 0.03);

  backdrop-filter: blur(8px);

  transition: 0.18s ease-in-out;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.skill-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.5),
    0 0 12px var(--accent);
}

/* Skill icon ring */
.icon-ring.small {
  width: 72px;
  height: 72px;
  border-radius: 50%;

  background: linear-gradient(145deg, #303030, #1f1f1f);
  border: 2px solid var(--accent);

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 0 8px var(--accent),
    inset 0 0 6px rgba(255, 255, 255, 0.05);
}

.skill-icon {
  width: 42px;
  height: 42px;
  object-fit: contain;
  display: block;
}

/* Skill title & level */
.skill-name {
  margin-top: 12px;
  font-size: 1.15rem;
  font-weight: 600;
}

.skill-level {
  font-size: 1rem;
  opacity: 0.85;
  margin-top: 4px;
}

/* XP bar */
.xp-bar {
  margin-top: 10px;
  width: 100%;
  height: 12px;

  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ffffffaa);
  box-shadow: 0 0 10px var(--accent);
  transition: width 0.3s ease-out;
}

.xp-text {
  margin-top: 4px;
  font-size: 0.85rem;
  opacity: 0.75;
}

/* ============================================================= */
/* ACHIEVEMENTS GRID                                              */
/* ============================================================= */

.achievements-grid {
  display: grid;
  gap: 24px;
  margin-top: 24px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.achievement-card {
  padding: 20px;
  border-radius: 14px;

  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border: 1px solid rgba(255, 255, 255, 0.1);

  text-align: center;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    inset 0 0 8px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);

  transition: 0.18s ease;
}

.achievement-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--accent);
}

.achievement-icon {
  width: 64px;
  margin-bottom: 10px;
}

.achievement-name {
  font-weight: 700;
  margin-bottom: 4px;
}

.achievement-desc {
  opacity: 0.75;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.rarity-label {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;

  background: rgba(255, 255, 255, 0.12);
}

.badge.locked {
  opacity: 0.45;
}

/* ============================================================= */
/* PERMANENT BONUSES                                             */
/* ============================================================= */

.permanent-bonus-grid {
  margin-top: 24px;
  display: grid;
  gap: 22px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.permanent-bonus-card {
  padding: 20px;
  border-radius: 14px;

  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border: 1px solid rgba(255, 255, 255, 0.1);

  text-align: center;

  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.35),
    inset 0 0 8px rgba(255, 255, 255, 0.04);

  backdrop-filter: blur(8px);

  transition: 0.18s ease;
}

.permanent-bonus-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--accent);
}

.bonus-name {
  color: var(--accent);
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.bonus-total {
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--accent);
}

.bonus-tag {
  padding: 4px 12px;
  border-radius: 999px;

  background: rgba(110, 231, 183, 0.25);
  border: 1px solid rgba(110, 231, 183, 0.45);

  font-size: 0.75rem;
  margin-top: 8px;
}

/* ============================================================= */
/* TITLES GRID                                                    */
/* ============================================================= */

.titles-grid {
  margin-top: 24px;
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.title-card {
  padding: 18px;
  border-radius: 14px;
  text-align: center;

  background: linear-gradient(145deg, #2d2d2d, #1b1b1b);
  border: 1px solid rgba(255, 255, 255, 0.12);

  backdrop-filter: blur(8px);
  cursor: pointer;

  transition: 0.18s ease;
}

.title-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: 0 0 14px var(--accent);
}

.title-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 16px var(--accent);
}

.title-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 6px;
}

.title-badge {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;

  font-size: 0.75rem;
}

.active-badge {
  background: rgba(110, 231, 183, 0.25);
  border: 1px solid rgba(110, 231, 183, 0.45);
  color: white;
  font-weight: 700;
}

/* Fade-in animation */
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
