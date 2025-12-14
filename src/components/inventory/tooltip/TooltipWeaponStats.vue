<template>
    <TooltipSection title="Combat Stats">
        <div v-if="attackPower" class="row">
            <span>Attack Power</span>
            <strong>{{ attackPower }}</strong>
        </div>

        <div v-if="rangedPower" class="row">
            <span>Ranged Power</span>
            <strong>{{ rangedPower }}</strong>
        </div>

        <div v-if="accuracy" class="row">
            <span>Accuracy</span>
            <strong>{{ accuracy }}</strong>
        </div>

        <div v-if="speed" class="row">
            <span>Speed</span>
            <strong>{{ speed }}×</strong>
        </div>

        <div v-if="requiredLevel" class="row">
            <span>Required Level</span>
            <strong>{{ requiredLevel }}</strong>
        </div>

        <div v-if="element" class="row">
            <span>Element</span>
            <strong class="element">{{ element }}</strong>
        </div>
    </TooltipSection>
</template>

<script setup>
import { computed } from "vue";
import TooltipSection from "./TooltipSection.vue";

const props = defineProps({
    item: { type: Object, required: true }
});

const stats = computed(() => props.item.stats || {});

const attackPower = computed(() => stats.value.attackPower);
const rangedPower = computed(() => stats.value.rangedPower);
const accuracy = computed(() => stats.value.accuracy);
const speed = computed(() => stats.value.speedMultiplier);
const requiredLevel = computed(() => stats.value.requiresLevel);
const element = computed(() => stats.value.element);
</script>

<style scoped>
.row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
}

.element {
    text-transform: capitalize;
    opacity: 0.9;
}
</style>
