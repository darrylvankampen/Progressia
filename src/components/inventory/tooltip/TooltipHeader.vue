<template>
    <div class="header">
        <div class="title" :style="{ color: rarityColor }">
            {{ item.name }}
        </div>
        <div class="rarity">
            {{ rarityLabel }}
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { getRarityColor, getRarityLabel } from "../../../game/utils/rarity";

const props = defineProps({
    item: { type: Object, required: true }
});

const rarityColor = computed(() => getRarityColor(props.item.rarity));
const rarityLabel = computed(() => getRarityLabel(props.item.rarity));
</script>

<style scoped>
.header {
    margin-bottom: 6px;
}

.title {
    font-size: 1.1rem;
    font-weight: 700;
}

.rarity {
    font-size: 0.8rem;
    opacity: 0.75;
}
</style>
