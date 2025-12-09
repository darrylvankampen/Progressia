<template>
  <div class="section-header" :style="{ '--accent': accent }">
    <div v-if="icon" class="section-icon">
      <img v-if="isImage" :src="icon" alt="" />
      <span v-else>{{ icon }}</span>
    </div>

    <h3 class="section-title">{{ title }}</h3>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: null }, // emoji or image
  accent: { type: String, default: null }, // optional override color
});

// Detect if icon is an image path
const isImage = computed(() => props.icon && props.icon.includes("/"));
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 36px;
  margin-bottom: 18px;

  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);

  backdrop-filter: blur(8px) brightness(1.05);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.25),
    inset 0 0 12px rgba(255, 255, 255, 0.03);

  transition: 0.2s ease;
}

.section-header:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 18px rgba(0, 0, 0, 0.35),
    0 0 8px var(--accent);
}

.section-icon {
  font-size: 1.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-icon img {
  width: 28px;
  height: 28px;
}

.section-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.4px;
}
</style>
