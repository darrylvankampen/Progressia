<template>
    <div v-if="tooltip.visible" class="tooltip-box" :style="{
        top: tooltip.y + 'px',
        left: tooltip.x + 'px',
        '--rarity': rarityColor
    }">
        <TooltipHeader :item="item" />

        <p v-if="item.description" class="tooltip-desc">
            {{ item.description }}
        </p>

        <TooltipSection title="General">
            <div class="row">
                <span>Value</span>
                <strong>{{ item.value }} gold</strong>
            </div>
        </TooltipSection>

        <TooltipConsumableStats v-if="isConsumable" :item="item" />
        <TooltipWeaponStats v-if="isWeapon" :item="item" />
        <TooltipToolStats v-if="isTool" :item="item" />
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useTooltip } from "../../composables/useTooltip";
import { getRarityColor } from "../../game/utils/rarity";

import TooltipHeader from "./tooltip/TooltipHeader.vue";
import TooltipSection from "./tooltip/TooltipSection.vue";
import TooltipConsumableStats from "./tooltip/TooltipConsumableStats.vue";
import TooltipWeaponStats from "./tooltip/TooltipWeaponStats.vue";
import TooltipToolStats from "./tooltip/TooltipToolStats.vue";

const { tooltip } = useTooltip();
const item = computed(() => tooltip.value.item || {});

const rarityColor = computed(() => getRarityColor(item.value.rarity));

const isTool = computed(() => item.value.category === "tools");
const isConsumable = computed(() => !!item.value.use);
const isWeapon = computed(() =>
    item.value.slot === "weapon" || item.value.slot === "ammo"
);
</script>

<style scoped>
.tooltip-box {
    position: fixed;
    z-index: 99999;
    width: 320px;

    background: rgba(20, 20, 20, 0.9);
    border: 2px solid var(--rarity);
    border-radius: 12px;

    padding: 14px 16px;
    color: #fff;

    backdrop-filter: blur(6px);
    box-shadow:
        0 0 16px color-mix(in srgb, var(--rarity) 40%, transparent),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);

    animation: fadeIn 0.15s ease-out;
    pointer-events: none;
}

.tooltip-desc {
    margin: 8px 0 12px;
    font-size: 0.85rem;
    opacity: 0.9;
    line-height: 1.4;
}

.row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }

    to {
        opacity: 1;
    }
}
</style>
