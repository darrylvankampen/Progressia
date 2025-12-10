<template>
  <div class="faction-page" v-if="faction" :style="{ '--accent': faction.colors.primary }">
    <!-- HEADER ---------------------------------------------------------------->
    <div class="faction-header">
      <div class="icon-ring big">
        <img :src="faction.icon" class="faction-icon" />
      </div>

      <div class="faction-info">
        <h2 class="faction-name">{{ faction.name }}</h2>
        <p class="faction-slogan">{{ faction.slogan }}</p>

        <div class="rep-bar">
          <div class="rep-fill" :style="{ width: repPercent + '%' }"></div>
        </div>

        <div class="rep-text">
          Reputation:
          <strong>{{ rep }}</strong> / {{ faction.maxReputation }}
        </div>

        <div class="current-tier" v-if="currentTier">
          Current Rank:
          <span class="rank-pill">{{ currentTier.name }}</span>
        </div>
      </div>
    </div>

    <!-- MAIN GRID ------------------------------------------------------------->
    <div class="faction-main-grid">
      <!-- DESCRIPTION --------------------------------------------------------->
      <div class="faction-panel">
        <h3 class="section-title">About this faction</h3>
        <p class="faction-description">
          {{ faction.description }}
        </p>
      </div>

      <!-- FAVORED SKILLS ------------------------------------------------------>
      <div class="faction-panel">
        <h3 class="section-title">Favored Skills</h3>

        <div class="favored-list">
          <span v-for="skillKey in faction.favoredSkills" :key="skillKey" class="favored-badge">
            {{ formatSkillName(skillKey) }}
          </span>
        </div>
      </div>
    </div>

    <!-- PASSIVES -------------------------------------------------------------->
    <div class="faction-panel">
      <h3 class="section-title">Faction Passives</h3>

      <div class="passive-list">
        <div class="passive-item" v-for="(val, key) in faction.passives" :key="key">
          <div class="passive-name">
            {{ formatPassiveName(key) }}
          </div>
          <div class="passive-value">+{{ val }}%</div>
        </div>
      </div>
    </div>

    <!-- TIERS ----------------------------------------------------------------->
    <div class="faction-panel">
      <h3 class="section-title">Reputation Ranks</h3>

      <div class="tier-card" v-for="tier in faction.reputationTiers" :key="tier.id"
        :class="{ unlocked: rep >= tier.minReputation }">
        <div class="tier-header">
          <div class="tier-left">
            <div class="tier-name">{{ tier.name }}</div>
            <div class="tier-req">Req: {{ tier.minReputation }} rep</div>
          </div>

          <div class="tier-status" v-if="rep >= tier.minReputation">
            UNLOCKED
          </div>
          <div class="tier-status locked" v-else>
            LOCKED
          </div>
        </div>

        <ul class="perk-list">
          <li v-for="perk in tier.perks" :key="perk">
            {{ formatPerk(perk) }}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- If no faction found -->
  <div v-else class="faction-not-found">
    <p>Faction not found.</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import factions from "../../game/data/factions/factions.json";
import { getGame } from "../../game/state/gameState";

const props = defineProps({
  id: String,
});

const game = getGame();

// Find faction data
const faction = computed(() =>
  factions.find((f) => f.id === props.id) || null
);

// Player reputation
const rep = computed(() => game.player.factions[props.id] || 0);

// Reputation as %
const repPercent = computed(() => {
  if (!faction.value) return 0;
  return Math.min(100, (rep.value / faction.value.maxReputation) * 100);
});

// Current tier
const currentTier = computed(() => {
  if (!faction.value) return null;
  return (
    [...faction.value.reputationTiers]
      .reverse()
      .find((t) => rep.value >= t.minReputation) || null
  );
});

// Format passive names nicely
function formatPassiveName(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// Format perks
function formatPerk(perk) {
  return perk
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatSkillName(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<style scoped>
/* ============================================================= */
/* LAYOUT                                                         */
/* ============================================================= */

.faction-page {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
  color: #fff;
  animation: fadeIn 0.25s ease-out;
}

/* HEADER PANEL -------------------------------------------------- */

.faction-header {
  display: flex;
  align-items: center;
  gap: 24px;

  padding: 24px;
  margin-bottom: 24px;

  background: linear-gradient(145deg, #303030, #181818);
  border-radius: 14px;
  border: 1px solid #6c6c6c44;

  box-shadow:
    0 4px 18px rgba(0, 0, 0, 0.45),
    inset 0 0 10px rgba(255, 255, 255, 0.05);

  backdrop-filter: blur(10px);
}

.faction-info {
  flex: 1;
}

/* ICON RING ----------------------------------------------------- */

.icon-ring.big {
  width: 96px;
  height: 96px;
  border-radius: 50%;

  border: 2px solid var(--accent);
  background: linear-gradient(145deg, #2c2c2c, #141414);

  display: flex;
  align-items: center;
  justify-content: center;

  box-shadow:
    0 0 12px var(--accent),
    inset 0 0 6px rgba(255, 255, 255, 0.05);
}

.faction-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
}

/* HEADER TEXT --------------------------------------------------- */

.faction-name {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--accent);
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
}

.faction-slogan {
  margin: 4px 0 12px;
  opacity: 0.9;
  font-size: 0.98rem;
}

/* REPUTATION BAR ------------------------------------------------ */

.rep-bar {
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  overflow: hidden;
  margin-bottom: 6px;
}

.rep-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ffffffaa);
  box-shadow: 0 0 10px var(--accent);
  transition: width 0.3s ease-out;
}

.rep-text {
  font-size: 0.95rem;
  opacity: 0.9;
}

.current-tier {
  margin-top: 6px;
  font-size: 0.95rem;
  opacity: 0.95;
}

.rank-pill {
  display: inline-block;
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--accent);
  font-size: 0.85rem;
}

/* MAIN GRID (ABOUT + FAVORED) ---------------------------------- */

.faction-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.4fr);
  gap: 20px;
  margin-bottom: 20px;
}

/* GENERIC PANEL ------------------------------------------------- */

.faction-panel {
  padding: 18px 20px;
  border-radius: 14px;

  background: linear-gradient(145deg, #2b2b2b, #191919);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.4),
    inset 0 0 8px rgba(255, 255, 255, 0.03);

  backdrop-filter: blur(8px);
}

.section-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--accent);
  text-shadow: 0 0 8px rgba(0, 0, 0, 0.7);
}

/* DESCRIPTION --------------------------------------------------- */

.faction-description {
  margin: 0;
  font-size: 0.96rem;
  line-height: 1.5;
  opacity: 0.9;
}

/* FAVORED SKILLS ------------------------------------------------ */

.favored-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 4px;
}

.favored-badge {
  padding: 6px 12px;
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);

  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: capitalize;

  box-shadow:
    0 0 6px rgba(0, 0, 0, 0.4),
    0 0 6px rgba(255, 255, 255, 0.08);

  transition: 0.18s ease;
}

.favored-badge:hover {
  border-color: var(--accent);
  box-shadow:
    0 0 10px var(--accent),
    0 0 6px rgba(0, 0, 0, 0.55);
}

/* PASSIVES ------------------------------------------------------ */

.passive-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.passive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 8px 10px;
  border-radius: 10px;

  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.passive-name {
  font-size: 0.95rem;
  opacity: 0.9;
}

.passive-value {
  font-weight: 700;
  color: var(--accent);
}

/* TIERS / RANKS ------------------------------------------------- */

.tier-card {
  margin-top: 10px;
  padding: 14px 16px;
  border-radius: 12px;

  background: linear-gradient(145deg, #252525, #171717);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.35),
    inset 0 0 6px rgba(255, 255, 255, 0.02);

  position: relative;
  overflow: hidden;

  transition: 0.2s ease;
}

.tier-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 4px;
  height: 100%;
  background: rgba(255, 255, 255, 0.08);
}

.tier-card.unlocked::before {
  background: var(--accent);
  box-shadow: 0 0 12px var(--accent);
}

.tier-card.unlocked {
  border-color: rgba(255, 255, 255, 0.16);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.45),
    0 0 12px var(--accent);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.tier-name {
  font-size: 1.05rem;
  font-weight: 700;
}

.tier-req {
  font-size: 0.85rem;
  opacity: 0.8;
}

.tier-status {
  font-size: 0.8rem;
  padding: 3px 10px;
  border-radius: 999px;

  background: rgba(110, 231, 183, 0.15);
  border: 1px solid rgba(110, 231, 183, 0.4);
  color: #e8fff8;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.tier-status.locked {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ddd;
}

/* Perk list ----------------------------------------------------- */

.perk-list {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
  opacity: 0.9;
}

.perk-list li {
  margin-bottom: 2px;
}

/* NOT FOUND ----------------------------------------------------- */

.faction-not-found {
  padding: 24px;
  text-align: center;
  color: #fff;
  opacity: 0.85;
}

/* ANIMATION ----------------------------------------------------- */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
