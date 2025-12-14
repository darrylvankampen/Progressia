<template>
    <div class="section">
        <div class="section-title">{{ title }}</div>
        <slot />
    </div>
</template>

<script setup>
defineProps({
    title: String
});
</script>

<style scoped>
.section {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-title {
    font-size: 0.75rem;
    font-weight: 600;
    opacity: 0.7;
    margin-bottom: 6px;
    text-transform: uppercase;
}
</style>
