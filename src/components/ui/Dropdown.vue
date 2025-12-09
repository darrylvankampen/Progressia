<template>
  <div class="dropdown" ref="dropdownRef">
    <!-- Klikken op het geselecteerde veld opent/sluit -->
    <div class="dropdown-selected" @click.stop="toggle">
      {{ selectedLabel }}
      <span class="arrow">▾</span>
    </div>

    <!-- Menu -->
    <div
      v-if="open"
      class="inventory-dropdown-menu"
      @click.stop
    >
      <div
        class="dropdown-item"
        v-for="option in options"
        :key="option.value"
        @click.stop="select(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const dropdownRef = ref(null);

// ------------------------------------
// SELECTED LABEL
// ------------------------------------
const selectedLabel = computed(() => {
  const item = props.options.find((o) => o.value === props.modelValue);
  return item ? item.label : "Select";
});

// ------------------------------------
// TOGGLE DROPDOWN
// ------------------------------------
function toggle() {
  open.value = !open.value;
}

// ------------------------------------
// SELECT OPTION
// ------------------------------------
function select(option) {
  emit("update:modelValue", option.value);
  open.value = false;
}

// ------------------------------------
// CLICK OUTSIDE HANDLER
// ------------------------------------
function handleClickOutside(event) {
  if (!dropdownRef.value) return;

  // Als klik NIET binnen dropdown is → sluiten
  if (!dropdownRef.value.contains(event.target)) {
    open.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>


<style scoped>
.dropdown {
  position: relative;
  cursor: pointer;
}

.dropdown-selected {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow {
  opacity: 0.7;
}

.inventory-dropdown-menu {
  position: absolute;
  top: 110%;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 8px;
  padding: 8px 0;
  backdrop-filter: blur(6px);
  z-index: 5000;
  min-width: 150px;
}

.dropdown-item {
  padding: 6px 12px;
  color: white;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
