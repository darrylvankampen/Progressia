<template>
  <div v-if="visible" class="offline-overlay" @click.self="close">
    <div class="offline-popup card-style">

      <!-- HEADER -->
      <div class="popup-header">
        <h2 class="title">Offline Progress</h2>
      </div>

      <!-- BODY -->
      <div class="summary-list">
        <div v-for="entry in summary" :key="entry.skill + entry.action" class="summary-row">
          <div class="left">
            <img :src="getSkillIcon(entry.skill)" class="skill-icon" />
            <div class="skill-info">
              <strong class="skill-name">{{ formatSkill(entry.skill) }}</strong>
              <span class="action-name">{{ formatAction(entry.action) }}</span>
            </div>
          </div>

          <div class="right">
            <div class="reward">
              <span class="amount">+{{ entry.gainedAmount }}</span>
              <span class="resource">{{ getItemName(entry.gainedResource) }}</span>
            </div>

            <div class="xp">+{{ entry.gainedXp }} XP</div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <button class="btn-confirm" @click="close">Continue</button>
    </div>
  </div>
</template>


<script setup>
import { ref } from "vue";
import { getItem } from "../game/utils/itemDB";

const visible = ref(false);
const summary = ref([]);

function show(data) {
  summary.value = data;
  visible.value = true;
}

function close() {
  visible.value = false;
}

// Skill icons map
const skillIcons = {
  woodcutting: "/icons/skills/woodcutting.svg",
  mining: "/icons/skills/mining.svg",
  smithing: "/icons/skills/smithing.svg",
  combat: "/icons/skills/combat.svg",
};

function getSkillIcon(skill) {
  return skillIcons[skill] || "/icons/ui/default.png";
}

function formatSkill(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatAction(id) {
  return id.replace(/_/g, " ");
}

function getItemName(id) {
  return getItem(id).name;
}

// Expose for parent
defineExpose({ show });
</script>

<style scoped>
/* Overlay */
.offline-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.3s ease forwards;
  z-index: 9999;
}

/* Popup box */
.offline-popup {
  width: 420px;
  max-width: 92%;
  padding: 22px;
  background: #1a1410;
  border: 2px solid #a8794e;
  border-radius: 14px;
  color: #f5e7c8;
  animation: popIn 0.35s ease;
}

/* Header */
.popup-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.header-icon {
  width: 36px;
  height: 36px;
}

.title {
  font-size: 1.6rem;
  margin: 0;
  text-shadow: 0 0 8px rgba(255, 230, 180, 0.7);
}

/* Summary list */
.summary-list {
  max-height: 260px;
  overflow-y: auto;
  padding-right: 4px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid rgba(255, 235, 200, 0.15);
}

.left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skill-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 2px #b58a5a);
}

.skill-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.skill-name {
  font-size: 1.05rem;
}

.action-name {
  font-size: 0.85rem;
  opacity: 0.75;
}

.right {
  text-align: right;
}

.reward .amount {
  color: #ffd66c;
  font-weight: bold;
  margin-right: 4px;
}

.reward .resource {
  opacity: 0.8;
}

.xp {
  color: #7af3ff;
  font-size: 0.9rem;
}

/* Confirm button */
.btn-confirm {
  width: 100%;
  margin-top: 18px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(180deg, #e3c08c, #b58a5a);
  color: #1a1410;
  font-weight: bold;
  cursor: pointer;
  transition: 0.15s;
}

.btn-confirm:hover {
  filter: brightness(1.15);
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes popIn {
  0% {
    transform: scale(0.75);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
