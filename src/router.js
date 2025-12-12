import { createRouter, createWebHashHistory } from "vue-router";

import PlayerPage from "./pages/PlayerPage.vue";
import InventoryPage from "./pages/InventoryPage.vue";
import CraftingPage from "./pages/CraftingPage.vue";
import ShopPage from "./pages/ShopPage.vue";
import SettingsPage from "./pages/SettingsPage.vue";
import SkillsOverviewPage from "./pages/SkillsOverviewPage.vue";
import FactionPage from "./pages/Factions/FactionPage.vue";

const routes = [
  { path: "/", redirect: "/player" },

  { path: "/player", component: PlayerPage },
  { path: "/skills", component: SkillsOverviewPage },
  { path: "/inventory", component: InventoryPage },
  { path: "/skill/crafting", component: CraftingPage, props: { skill: "crafting" } },
  { path: "/skill/fletching", component: CraftingPage, props: { skill: "fletching" } },
  { path: "/shop", component: ShopPage },
  { path: "/settings", component: SettingsPage },
  { path: "/factions/:id", component: FactionPage, props: true },
  {
    path: "/skill/:skillKey",
    name: "SkillPage",
    component: () => import("../src/pages/SkillsPage.vue"),
  },
  {
    path: "/debug/items",
    component: () => import("../src/pages/Debug/DebugItemsPage.vue")
  },
  {
    path: "/debug",
    component: () => import("../src/pages/Debug/DebugPage.vue")
  },
  {
    path: "/combat",
    component: () => import("../src/pages/CombatPage.vue")
  },
  {
    path: "/equipment",
    component: () => import("../src/pages/EquipmentPage.vue")
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
