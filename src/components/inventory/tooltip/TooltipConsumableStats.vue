<template>
    <TooltipSection title="Consumable">
        <div class="row">
            <span>Effect</span>
            <strong>Heals {{ healAmount }} HP</strong>
        </div>

        <div v-if="cooldown" class="row">
            <span>Cooldown</span>
            <strong>{{ cooldown }}s</strong>
        </div>
    </TooltipSection>
</template>

<script setup>
import { computed } from "vue";
import TooltipSection from "./TooltipSection.vue";

const props = defineProps({
    item: { type: Object, required: true }
});

const healAmount = computed(() => props.item.use?.amount ?? 0);

const cooldown = computed(() => {
    const ms = props.item.stats?.cooldownMs;
    return ms ? Math.round(ms / 1000) : null;
});
</script>

<style scoped>
.row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
}
</style>
