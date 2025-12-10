<template>
    <div class="slot" @click.stop="unequip">

        <!-- Label boven het slot -->
        <div class="slot-label">{{ label }}</div>

        <!-- Icon -->
        <div class="slot-box">
            <img :src="itemIcon" class="slot-icon" />
        </div>

    </div>
</template>

<script setup>
import { computed } from "vue";
import { getItem } from "../game/utils/itemDB";

const props = defineProps({
    label: String,
    slotKey: String,
    item: String
});

const emit = defineEmits(["unequip"]);

const itemIcon = computed(() => {
    if (!props.item) return "/icons/ui/worn_equipment.png"; // OSRS empty slot look
    return getItem(props.item)?.icon ?? "/icons/items/placeholder.png";
});

function unequip() {
    emit("unequip");
}
</script>

<style scoped>
.slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    user-select: none;
}

/* Minimalistisch label */
.slot-label {
    font-size: 0.72rem;
    opacity: 0.55;
    margin-bottom: 6px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
}

/* Modern fantasy slot box */
.slot-box {
    width: 72px;
    height: 72px;
    border-radius: 10px;

    background: linear-gradient(145deg, #343434, #1e1e1e);
    border: 1px solid #6c6c6c55;

    display: flex;
    align-items: center;
    justify-content: center;

    box-shadow:
        0 4px 10px rgba(0, 0, 0, 0.4),
        inset 0 0 8px rgba(255, 255, 255, 0.05),
        inset 0 0 4px rgba(0, 0, 0, 0.3);

    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        border-color 0.15s ease;
}

/* Modern OSRS hover effect */
.slot-box:hover {
    border-color: #8ab5ff66;
    box-shadow:
        0 0 12px #8ab5ff55,
        inset 0 0 10px rgba(255, 255, 255, 0.1);

    transform: translateY(-2px);
}

.slot-icon {
    width: 48px;
    height: 48px;
    object-fit: contain;
    image-rendering: auto;

    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
}
</style>
