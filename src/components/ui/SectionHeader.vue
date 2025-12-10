<template>
  <div class="section-header" :style="{ '--accent': accent }">
    <div v-if="icon" class="section-icon">
      <img v-if="isImage" :src="icon" alt="" />
      <span v-else class="emoji">{{ icon }}</span>
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
  gap: 16px;

  margin-top: 40px;
  margin-bottom: 20px;

  padding: 14px 22px;

  /* OSRS-HD beveled dark panel */
  background: linear-gradient(145deg, #2e2e2e, #1b1b1b);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  backdrop-filter: blur(10px);

  transition: 0.18s ease-out;
  cursor: default;
}

.section-header:hover {
  transform: translateY(-3px);
  box-shadow:
    0 6px 20px rgba(0, 0, 0, 0.55),
    0 0 12px var(--accent);
}

/* ICON ------------------------------------------------------ */
.section-icon {
  width: 46px;
  height: 46px;

  border-radius: 50%;
  border: 2px solid var(--accent);

  background: linear-gradient(145deg, #323232, #1e1e1e);

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;
}

.section-icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.section-icon .emoji {
  font-size: 1.6rem;
}

/* TITLE ------------------------------------------------------ */
.section-title {
  margin: 0;

  font-size: 1.55rem;
  font-weight: 700;

  color: var(--accent);
  letter-spacing: 0.6px;
}
</style>
