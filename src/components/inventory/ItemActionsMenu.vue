<template>
  <div
    v-if="actionState.visible"
    class="actions-menu"
    :style="{ top: actionState.y + 'px', left: actionState.x + 'px' }"
    ref="menuRef"
  >
    <!-- USE -->
    <button
      v-if="canUse"
      class="action-button"
      @click="handleUse"
    >Use</button>

    <!-- EQUIP (gear + tools) -->
    <button
      v-if="canEquip"
      class="action-button"
      @click="handleEquip"
    >Equip</button>

    <!-- SELL -->
    <button
      v-if="canSell"
      class="action-button"
      @click="handleSell"
    >Sell ({{ item.value }})</button>

    <!-- DROP -->
    <button
      class="action-button text-danger"
      @click="handleDrop"
    >Drop</button>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { useItemActions } from "../../composables/useItemActions";
import { getGame, removeItem, equipTool } from "../../game/state/gameState";
import { useNotifications } from "../../composables/useNotification";

const { actionState, hideActions } = useItemActions();
const game = getGame();
const { pushNotification } = useNotifications();

const item = computed(() => actionState.value.item);

// TYPES
const canUse = computed(() => item.value?.category === "consumable");
const isGear = computed(() => item.value?.category === "gear");
const isTool = computed(() => item.value?.category === "tools");

const canEquip = computed(() => isGear.value || isTool.value);

const canSell = computed(() => item.value?.value > 0);

const menuRef = ref(null);

function onClickOutside(e) {
  if (!actionState.value.visible) return;

  // Is er een menu, en is de klik BUITEN het menu?
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    hideActions();
  }
}

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onClickOutside);
});


// ACTION LOGIC
function handleUse() {
  pushNotification("use-" + item.value.key, `Used ${item.value.name}`);
  hideActions();
}

function handleEquip() {
  if (isGear.value) {
    pushNotification("equip-" + item.value.key, `Equipped ${item.value.name}`);
  }

  if (isTool.value) {
    const success = equipTool(item.value.skill, item.value.id);

    if (!success) {
      pushNotification("equip-fail", `Cannot equip ${item.value.name}`);
      return hideActions();
    }

    pushNotification("equip-" + item.value.key, `Equipped ${item.value.name}`);
  }

  hideActions();
}

function handleSell() {
  game.player.gold += item.value.value;
  removeItem(item.value.id, 1, 'sell');
  pushNotification("sell-" + item.value.key, `Sold ${item.value.name}`);
  hideActions();
}

function handleDrop() {
  removeItem(item.value.id, 1, 'drop');
  pushNotification("drop-" + item.value.key, `Dropped ${item.value.name}`);
  hideActions();
}
</script>

<style scoped>
.actions-menu {
  position: fixed;
  z-index: 99999;

  background: #1c1c1fdd;
  border: 2px solid #ffffff30;
  padding: 10px;
  border-radius: 8px;

  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;

  backdrop-filter: blur(6px);
  animation: fadeIn 0.15s ease-out;
}

.action-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;

  padding: 6px 10px;
  text-align: left;

  color: white;
  font-size: 0.9rem;
  border-radius: 6px;

  transition: background 0.2s;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.text-danger {
  color: #ff6060;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
}
</style>
