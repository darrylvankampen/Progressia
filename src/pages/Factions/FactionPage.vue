<template>
  <div
    class="faction-page"
    :style="{ '--accent': faction.colors.primary }"
    v-if="faction"
  >
    <!-- HEADER ---------------------------------------------------------------->
    <div class="faction-header card-style">
      <div
        class="icon-ring big"
        :style="{ borderColor: faction.colors.primary }"
      >
        <img :src="faction.icon" class="faction-icon" />
      </div>

      <div class="faction-info">
        <h2 class="faction-name">{{ faction.name }}</h2>
        <p class="faction-slogan">{{ faction.slogan }}</p>

        <div class="rep-bar">
          <div class="rep-fill" :style="{ width: repPercent + '%' }"></div>
        </div>

        <div class="rep-text">
          Reputation: <strong>{{ rep }}</strong> / {{ faction.maxReputation }}
        </div>

        <div class="current-tier" v-if="currentTier">
          Current Rank: <strong>{{ currentTier.name }}</strong>
        </div>
      </div>
    </div>

    <!-- DESCRIPTION ----------------------------------------------------------->
    <div class="faction-description card-style">
      <h3 class="section-title">About this faction</h3>
      <p>{{ faction.description }}</p>
    </div>

    <!-- FAVORED SKILLS ------------------------------------------------------------>
    <div class="faction-favored card-style">
      <h3 class="section-title">Favored Skills</h3>

      <div class="favored-list">
        <span
          v-for="skillKey in faction.favoredSkills"
          :key="skillKey"
          class="favored-badge"
        >
          {{ skillKey }}
        </span>
      </div>
    </div>

    <!-- PASSIVES -------------------------------------------------------------->
    <div class="faction-passives card-style">
      <h3 class="section-title">Faction Passives</h3>

      <div class="passive-list">
        <div
          class="passive-item"
          v-for="(val, key) in faction.passives"
          :key="key"
        >
          <strong>{{ formatPassiveName(key) }}</strong> +{{ val }}%
        </div>
      </div>
    </div>

    <!-- TIERS ----------------------------------------------------------------->
    <div class="faction-tiers card-style">
      <h3 class="section-title">Reputation Ranks</h3>

      <div
        class="tier"
        v-for="tier in faction.reputationTiers"
        :key="tier.id"
        :class="{ unlocked: rep >= tier.minReputation }"
      >
        <div class="tier-header">
          <div class="tier-name">{{ tier.name }}</div>
          <div class="tier-req">Req: {{ tier.minReputation }} rep</div>
        </div>

        <ul class="perk-list">
          <li v-for="perk in tier.perks" :key="perk">{{ formatPerk(perk) }}</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- If no faction found -->
  <div v-else>
    <p>Faction not found.</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import factions from "../../game/data/factions/factions.json";
import { getGame } from "../../game/state/gameState"; // adjust your import

const props = defineProps({
  id: String,
});

const game = getGame(); // your store system
console.log(factions);
console.log(props.id);
// Find faction data
const faction = factions.find((f) => f.id === props.id) || null;

// Player reputation
const rep = computed(() => game.player.factions[props.id] || 0);

// Reputation as %
const repPercent = computed(() => {
  if (!faction) return 0;
  return Math.min(100, (rep.value / faction.maxReputation) * 100);
});

// Current tier
const currentTier = computed(() => {
  if (!faction) return null;
  return (
    [...faction.reputationTiers]
      .reverse()
      .find((t) => rep.value >= t.minReputation) || null
  );
});

// Format passive names nicely
function formatPassiveName(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// Format perks
function formatPerk(perk) {
  return perk.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
</script>

<style scoped>
.faction-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

/* HEADER --------------------------------------------------------------- */
.faction-header {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 20px;
}

.faction-info {
  flex: 1;
}

.faction-name {
  margin: 0;
}

.faction-slogan {
  opacity: 0.8;
  margin-bottom: 10px;
}

.rep-bar {
  width: 100%;
  height: 10px;
  background: #222;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 8px;
}

.rep-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s ease;
}

.rep-text {
  margin-bottom: 6px;
}

.current-tier {
  font-size: 14px;
  opacity: 0.9;
}

/* DESCRIPTION ----------------------------------------------------------- */
.faction-description {
  margin-top: 20px;
  padding: 20px;
}

/* PASSIVES -------------------------------------------------------------- */
.faction-passives {
  margin-top: 20px;
  padding: 20px;
}

.passive-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.passive-item {
  background: rgba(255, 255, 255, 0.04);
  padding: 8px 12px;
  border-radius: 6px;
}

/* TIERS ---------------------------------------------------------------- */
.faction-tiers {
  margin-top: 20px;
  padding: 20px;
}

.tier {
  background: rgba(255, 255, 255, 0.03);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 12px;
  border-left: 4px solid #444;
  transition: 0.2s;
}

.tier.unlocked {
  border-left-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}

.tier-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.perk-list {
  margin: 0;
  padding-left: 18px;
  opacity: 0.9;
}

.icon-ring {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: 6px;
  border: 3px solid var(--accent, #fff);
  background: rgba(0, 0, 0, 0.2);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
}

.icon-ring.big {
  width: 96px;
  height: 96px;
  border-width: 4px;
}

.icon-ring.big .faction-icon {
  width: 72px;
  height: 72px;
  object-fit: contain;
  image-rendering: crisp-edges;
}

.faction-favored {
  margin-top: 20px;
  padding: 20px;
}

.favored-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.favored-badge {
  background: rgba(255,255,255,0.08);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: capitalize;
  border: 1px solid rgba(255,255,255,0.15);
  transition: 0.2s;
}

.favored-badge:hover {
  background: rgba(255,255,255,0.12);
  border-color: var(--accent);
}
</style>
