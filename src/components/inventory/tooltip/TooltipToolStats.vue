<template>
    <TooltipSection title="Tool Stats">
        <div class="req">
            Required Level:
            <strong>{{ legacy.requiredLevel }}</strong>
        </div>

        <TooltipStatLine label="Speed" :base="legacy.speedMultiplier.toFixed(2) + '×'"
            :final="final.speedMultiplier.toFixed(2) + '×'" />

        <TooltipStatLine label="XP" :base="legacy.xpMultiplier.toFixed(2) + '×'"
            :final="final.xpMultiplier.toFixed(2) + '×'" />

        <TooltipStatLine label="Double" :base="(legacy.doubleChance * 100).toFixed(0) + '%'"
            :final="(final.doubleChance * 100).toFixed(0) + '%'" />
    </TooltipSection>
</template>

<script setup>
import { computed } from "vue";
import TooltipSection from "./TooltipSection.vue";
import TooltipStatLine from "./TooltipStatLine.vue";

const props = defineProps({
    item: Object
});

const stats = computed(() => props.item.stats || {});
const modifiers = computed(() => props.item.modifiers || {});
const skill = computed(() => props.item.skill);

const legacy = computed(() => ({
    speedMultiplier: stats.value.speedMultiplier ?? 1,
    xpMultiplier: stats.value.xpMultiplier ?? 1,
    doubleChance: stats.value.doubleChance ?? 0,
    requiredLevel: stats.value.requiredLevel ?? 1
}));

const final = computed(() => ({
    speedMultiplier:
        legacy.value.speedMultiplier *
        (1 + (modifiers.value[`${skill.value}_speed_percent`] ?? 0) / 100),

    xpMultiplier:
        legacy.value.xpMultiplier *
        (1 + (modifiers.value[`${skill.value}_xp_percent`] ?? 0) / 100),

    doubleChance:
        legacy.value.doubleChance +
        (modifiers.value[`${skill.value}_doubleChance`] ?? 0) / 100
}));
</script>

<style scoped>
.req {
    font-size: 0.8rem;
    margin-bottom: 6px;
}
</style>
