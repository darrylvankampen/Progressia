<template>
  <div class="app-layout">
    <TopBar />
    <Notification />
    <ItemTooltip />
    <ItemActionsMenu />

    <Sidebar :items="tabs" v-model="activeTab" />

    <div class="content">
      <OfflinePopup ref="offlinePopup" />
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";

import Sidebar from "./components/Sidebar.vue";

import OfflinePopup from "./components/OfflinePopup.vue";
import { startAutosave } from "./game/state/autosave";
import { initBackgroundSaves } from "./game/state/backgroundsaves";
import {
  testOfflineProgress,
  handleOfflineProgress,
} from "./game/state/offlineProgress";

const activeTab = ref("player");

import { gameReady } from "./game/state/gameState";
import { resumeAllActiveSkills } from "./game/skillEngine";
import TopBar from "./components/TopBar.vue";
import Notification from "./components/Notification.vue";
import ItemTooltip from "./components/inventory/ItemTooltip.vue";
import ItemActionsMenu from "./components/inventory/ItemActionsMenu.vue";
import { combatTick } from "./game/combat/combatEngine";
const offlinePopup = ref(null);

const tabs = [
  { id: "player", label: "Overview", icon: "/icons/ui/player_overview.png", to: "/player", category: "player" },
  { id: "equipment", label: "Equipment", icon: "/icons/ui/equipment.png", to: "/equipment", category: "player" },
  { id: "inventory", label: "Inventory", icon: "/icons/ui/backpack.png", to: "/inventory", category: "player" },

  { id: "skills", label: "Overview", icon: "/icons/ui/skills_overview.png", to: "/skills", category: "skills" },
  { id: "woodcutting", label: "Woodcutting", icon: "/icons/skills/woodcutting.png", to: "/skill/woodcutting", category: "skills" },
  { id: "combat", label: "Combat", icon: "/icons/items/placeholder.png", to: "/combat", category: "skills" },

  { id: "shop", label: "General Shop", icon: "/icons/ui/shop.png", to: "/shop", category: "shops" },

  { id: "faction_emberforge", label: "Emberforge", icon: "/icons/factions/emberforge.png", to: "/factions/emberforge", category: "factions" },
  { id: "faction_iron_dominion", label: "Iron Dominion", icon: "/icons/factions/iron_dominion.png", to: "/factions/iron_dominion", category: "factions" },
  { id: "faction_tidebound", label: "Tidebound", icon: "/icons/factions/tidebound.png", to: "/factions/tidebound", category: "factions" },
  { id: "faction_verdant", label: "Verdant", icon: "/icons/factions/verdant.png", to: "/factions/verdant", category: "factions" },

  { id: "debug", label: "Debug", icon: "/icons/ui/settings.png", to: "/debug/", category: "debug" },
  { id: "settings", label: "Settings", icon: "/icons/ui/settings.png", to: "/settings", category: "settings" },
];

onMounted(async () => {
  await gameReady;
  const summary = testOfflineProgress();
  if (summary && summary.length > 0 && offlinePopup.value) {
    offlinePopup.value.show(summary);
  }

  resumeAllActiveSkills();
  startAutosave(5000);
  initBackgroundSaves();
});
</script>

<style>
.app-layout {
  display: flex;
}

.content {
  position: relative;
  margin-top: 52px;
  margin-left: var(--sidebar-width);
  padding: 20px;
  width: calc(100% - var(--sidebar-width));
  transition: margin-left 0.3s ease, width 0.3s ease;
}

:root {
  --sidebar-width: 260px;
}

.sidebar-collapsed+.content {
  --sidebar-width: 84px !important;
}
</style>
