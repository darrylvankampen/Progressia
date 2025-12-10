<template>
  <div class="sidebar" :class="{ collapsed }">
    <button class="toggle" @click="toggle()">☰</button>
    <!-- PLAYER INFO -->
    <div class="player-info">
      <div class="player-name">{{ game.player.name }}</div>
      <div class="player-title" v-if="!collapsed">{{ game.player.activeTitle }}</div>
      <div class="player-stats" v-if="!collapsed">
        <div><strong>Total Level:</strong> {{ totalLevel }}</div>
        <div><strong>Total XP:</strong> {{ totalXp.toLocaleString() }}</div>
      </div>
    </div>

    <!-- TOGGLE BUTTON -->

    <!-- NAV MENU -->
    <ul class="menu">
      <template v-for="(group, groupName) in grouped" :key="groupName">
        <!-- Category label -->
        <li class="category" v-if="!collapsed && groupName !== '_uncategorized'">
          {{ groupName }}
        </li>

        <!-- Menu items in group -->
        <router-link v-for="item in group" :key="item.id" :to="item.to" class="menu-item" active-class="active">
          <img :src="item.icon" class="icon" />
          <span class="label" v-if="!collapsed">{{ item.label }}</span>
        </router-link>
      </template>
    </ul>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { getGame } from "../game/state/gameState";
import { formatNumber } from "../game/utils/formatNumber";

const props = defineProps({
  items: Array,
});

const game = getGame();
const collapsed = ref(false);

const grouped = computed(() => {
  const groups = {};
  for (const item of props.items) {
    const cat = item.category || "_uncategorized";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  console.log(groups)
  return groups;
});

const totalLevel = computed(() =>
  Object.values(game.skills).reduce((acc, s) => acc + s.level, 0)
);

const totalXp = computed(() => formatNumber(game.player.totalXP));

function toggle() {
  collapsed.value = !collapsed.value;

  if (collapsed.value) {
    document.body.classList.add("sidebar-collapsed");
  } else {
    document.body.classList.remove("sidebar-collapsed");
  }
}
</script>

<style scoped>
/* ====================================================== */
/* OSRS-HD SIDEBAR PANEL                                  */
/* ====================================================== */

.sidebar {
  width: 260px;
  height: calc(100vh - 52px);

  background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
  border-right: 1px solid #6c6c6c44;

  backdrop-filter: blur(10px);
  color: #fff;

  display: flex;
  flex-direction: column;

  box-shadow:
    inset 0 0 12px rgba(255, 255, 255, 0.04),
    5px 0 12px rgba(0, 0, 0, 0.5);

  transition: width 0.25s ease;
  position: fixed;
  top: 52px;
  left: 0;
}

.sidebar.collapsed {
  width: 84px;
}

/* ====================================================== */
/* TOGGLE BUTTON                                          */
/* ====================================================== */
.toggle {
  background: linear-gradient(145deg, #3a3a3a, #222);
  border: 1px solid #555;

  padding: 6px 10px;
  margin: 6px;
  border-radius: 8px;

  font-size: 1.3rem;
  cursor: pointer;
  color: #fff;

  transition: 0.2s ease;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    inset 0 0 4px rgba(255, 255, 255, 0.05);
}

.toggle:hover {
  background: #4fa3ff33;
  box-shadow: 0 0 10px #4fa3ff55;
}

/* ====================================================== */
/* PLAYER INFO PANEL                                      */
/* ====================================================== */

.player-info {
  padding: 18px;
  border-bottom: 1px solid #6c6c6c33;

  background: linear-gradient(145deg, #303030, #1f1f1f);
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.4);
}

.player-name {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.3px;

  color: #d7e7ff;
  text-shadow: 0 0 6px rgba(100, 150, 255, 0.5);
}

.player-title {
  margin-top: 2px;
  font-size: 0.85rem;
  opacity: 0.8;
  font-style: italic;
}

.player-stats {
  margin-top: 12px;
  font-size: 0.9rem;
  opacity: 0.85;

  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ====================================================== */
/* MENU STRUCTURE                                          */
/* ====================================================== */

.menu {
  list-style: none;
  padding: 0;
  margin-top: 16px;
  flex-grow: 1;

  overflow-y: auto;
}

/* Category title */
.category {
  padding: 6px 18px;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 1px;

  margin-top: 14px;

  color: #9eb1c9;
  opacity: 0.6;
}

/* ====================================================== */
/* MENU ITEMS                                              */
/* ====================================================== */

.menu-item {
  display: flex;
  align-items: center;
  gap: 14px;

  padding: 12px 20px;
  text-decoration: none;
  color: #fff;

  border-left: 3px solid transparent;

  opacity: 0.8;
  transition: 0.18s ease;

  background: linear-gradient(145deg, #2c2c2c, #1b1b1b);
  box-shadow:
    inset 0 0 5px rgba(255, 255, 255, 0.03);
}

/* Hover look */
.menu-item:hover {
  opacity: 1;
  background: #4fa3ff22;
  border-left-color: #4fa3ff;
  box-shadow: 0 0 12px #4fa3ff44;
}

/* Active route */
.menu-item.active {
  opacity: 1;
  background: #4fa3ff33;

  border-left-color: #4fa3ff;
  box-shadow:
    0 0 14px #4fa3ff55,
    inset 0 0 10px rgba(255, 255, 255, 0.08);
}

/* ====================================================== */
/* ICONS                                                   */
/* ====================================================== */

.icon {
  width: 28px;
  height: 28px;

  filter:
    drop-shadow(0 0 4px rgba(0, 0, 0, 0.5)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
}

/* ====================================================== */
/* COLLAPSED SIDEBAR                                       */
/* ====================================================== */

.sidebar.collapsed .menu-item {
  justify-content: center;
  border-left: none;
  padding: 14px 0;
}

.sidebar.collapsed .label {
  display: none;
}

.sidebar.collapsed .category {
  display: none;
}

.sidebar.collapsed .player-title,
.sidebar.collapsed .player-stats {
  display: none;
}

.sidebar.collapsed .player-name {
  text-align: center;
  font-size: 1rem;
}

.sidebar.collapsed .player-info {
  padding: 12px;
}

/* Scrollbar styling */
.menu::-webkit-scrollbar {
  width: 6px;
}

.menu::-webkit-scrollbar-thumb {
  background: #4fa3ff55;
  border-radius: 20px;
}

.menu::-webkit-scrollbar-track {
  background: transparent;
}
</style>
