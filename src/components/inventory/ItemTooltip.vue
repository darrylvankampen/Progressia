<template>
  <div
    v-if="tooltip.visible"
    class="tooltip-box"
    :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px', borderColor: rarityColor }"
  >
    <!-- TITLE -->
    <div class="tooltip-title" :style="{ color: rarityColor }">
      {{ item.name }}
    </div>

    <div class="tooltip-rarity" :style="{ color: rarityColor }">
      {{ rarityLabel }}
    </div>

    <p class="tooltip-desc">{{ item.description }}</p>

    <div class="tooltip-type">Type: {{ item.category }}</div>

    <!-- ⭐ TOOL-STATS -->
    <div v-if="isTool" class="tool-stats mt-3">

      <!-- REQUIRED LEVEL -->
      <div class="stat-row">
        <div class="stat-label">Required Level</div>
        <div class="stat-value">{{ legacy.requiredLevel }}</div>
      </div>

      <!-- SPEED -->
      <div class="stat-row mt-2">
        <div class="stat-label">Speed</div>
        <div class="stat-values">
          <div>Base: {{ legacy.speedMultiplier.toFixed(2) }}×</div>
          <div>Modifier: {{ modifierSpeed }}%</div>
          <div><strong>Final: {{ final.speedMultiplier.toFixed(2) }}×</strong></div>
        </div>
      </div>

      <!-- XP -->
      <div class="stat-row mt-2">
        <div class="stat-label">XP</div>
        <div class="stat-values">
          <div>Base: {{ legacy.xpMultiplier.toFixed(2) }}×</div>
          <div>Modifier: {{ modifierXP }}%</div>
          <div><strong>Final: {{ final.xpMultiplier.toFixed(2) }}×</strong></div>
        </div>
      </div>

      <!-- DOUBLE CHANCE -->
      <div class="stat-row mt-2">
        <div class="stat-label">Double Chance</div>
        <div class="stat-values">
          <div>Base: {{ (legacy.doubleChance * 100).toFixed(0) }}%</div>
          <div>Modifier: {{ modifierDouble }}%</div>
          <div><strong>Final: {{ (final.doubleChance * 100).toFixed(0) }}%</strong></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useTooltip } from "../../composables/useTooltip";
import { getRarityColor, getRarityLabel } from "../../game/utils/rarity";

const { tooltip } = useTooltip();

// --------------------
// BASIC ITEM
// --------------------
const item = computed(() => tooltip.value.item);

// BASIC INFO
const rarityColor = computed(() => getRarityColor(item.value?.rarity));
const rarityLabel = computed(() => getRarityLabel(item.value?.rarity));

// TOOL?
const isTool = computed(() => item.value?.category === "tools");

// --------------------
// LEGACY STATS
// --------------------
const legacy = computed(() => {
  const stats = item.value?.stats || {};
  return {
    speedMultiplier: stats.speedMultiplier ?? 1.0,
    xpMultiplier: stats.xpMultiplier ?? 1.0,
    doubleChance: stats.doubleChance ?? 0.0,
    requiredLevel: stats.requiredLevel ?? 1,
  };
});

// --------------------
// ITEM-BASED MODIFIERS
// --------------------
const itemModifiers = computed(() => item.value?.modifiers || {});
const skillId = computed(() => item.value?.skill || item.value?.tool?.skill);

// Read modifiers from item.modifiers only (NO global modifiers)
const modifierSpeed = computed(() => {
  return itemModifiers.value[`${skillId.value}_speed_percent`] ?? 0;
});

const modifierXP = computed(() => {
  return itemModifiers.value[`${skillId.value}_xp_percent`] ?? 0;
});

const modifierDouble = computed(() => {
  return itemModifiers.value[`${skillId.value}_doubleChance`] ?? 0;
});

// --------------------
// FINAL RESULTS (tooltip-only calculation)
// --------------------
const final = computed(() => {
  const base = legacy.value;

  const speed = base.speedMultiplier * (1 + modifierSpeed.value / 100);
  const xp = base.xpMultiplier * (1 + modifierXP.value / 100);
  const dbl = base.doubleChance + modifierDouble.value / 100;

  return {
    speedMultiplier: speed,
    xpMultiplier: xp,
    doubleChance: dbl,
  };
});
</script>

<style scoped>
.tooltip-box {
  position: fixed;
  z-index: 99999;

  background: #1b1b1bcc;
  padding: 12px 16px;

  border: 2px solid;
  border-radius: 10px;

  max-width: 260px;

  backdrop-filter: blur(6px);
  color: #fff;

  animation: fadeIn 0.15s ease-out;
  pointer-events: none;
}

.tooltip-title {
  font-size: 1.1rem;
  font-weight: bold;
}

.tooltip-rarity {
  font-size: 0.9rem;
  opacity: 0.8;
}

.tooltip-desc {
  margin: 8px 0;
  opacity: 0.9;
  line-height: 1.3;
}

.tooltip-type {
  font-size: 0.85rem;
  opacity: 0.7;
  margin-top: 6px;
  font-style: italic;
}

.stat-row {
  background: rgba(255, 255, 255, 0.05);
  padding: 6px;
  border-radius: 6px;
}

.stat-label {
  font-weight: 600;
  font-size: 0.85rem;
}

.stat-values {
  font-size: 0.8rem;
  margin-top: 4px;
  opacity: 0.9;
}

.stat-values div {
  margin-bottom: 2px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; }
}
</style>
