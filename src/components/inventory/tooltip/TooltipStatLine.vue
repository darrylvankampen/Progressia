<template>
    <div class="stat-line">
        <span class="name">{{ label }}</span>
        <span class="base">{{ base }}</span>
        <span class="arrow">→</span>
        <span class="final">{{ final }}</span>
    </div>
</template>

<script setup>
defineProps({
    label: String,
    base: String,
    final: String
});
</script>

<style scoped>
.stat-line {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 6px;
    font-size: 0.8rem;
    align-items: center;
}

.base {
    opacity: 0.6;
}

.final {
    font-weight: 600;
    color: #7fdcff;
}
</style>
