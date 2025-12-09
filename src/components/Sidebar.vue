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
        <li
          class="category"
          v-if="!collapsed && groupName !== '_uncategorized'"
        >
          {{ groupName }}
        </li>

        <!-- Menu items in group -->
        <router-link
          v-for="item in group"
          :key="item.id"
          :to="item.to"
          class="menu-item"
          active-class="active"
        >
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
.sidebar {
  width: 240px;
  background: rgba(0, 0, 0, 0.3);
  border-right: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  height: calc(100vh - 52px);
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  position: fixed;
  top: 52px;
  left: 0;
}

.sidebar.collapsed {
  width: 80px;
}

/* PLAYER BLOCK */
.player-info {
  padding: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.player-name {
  font-size: 1.3rem;
  font-weight: bold;
}

.player-title {
  font-size: 0.9rem;
  font-style: italic;
}

.player-stats {
  margin-top: 10px;
  font-size: 0.9rem;
  opacity: 0.85;
}

/* MENU */
.menu {
  list-style: none;
  padding: 0;
  margin-top: 10px;
  flex-grow: 1;
}

/* Category header */
.category {
  padding: 6px 16px;
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.55;
  letter-spacing: 1px;
  margin-top: 12px;
}

/* Menu items */
.menu-item {
  padding: 12px 16px;
  display: flex;
  text-decoration: none;
  color: white;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  opacity: 0.75;
  transition: 0.2s;
  border-left: 4px solid transparent;
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.18);
  opacity: 1;
  border-left-color: #4fa3ff;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.12);
  opacity: 1;
}

.icon {
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3));
}

/* Toggle button */
.toggle {
  background: none;
  color: white;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  text-align: right;
}
</style>
