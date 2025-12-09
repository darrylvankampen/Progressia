<template>
    <div v-if="visible" class="loot-modal-overlay" @click="close">
        <div class="loot-modal card-style" @click.stop>

            <!-- HEADER -->
            <h2 class="loot-title">Loot Obtained!</h2>

            <!-- DROPS GRID -->
            <div class="loot-grid">
                <div v-for="drop in loot" :key="drop.item" class="loot-card">
                    <div class="loot-icon-wrapper">
                        <img :src="getItem(drop.item).icon" class="loot-icon" />
                    </div>

                    <div class="loot-name">
                        {{ getItem(drop.item).name }}
                    </div>

                    <div class="loot-amount">
                        ×{{ drop.amount }}
                    </div>
                </div>
            </div>

            <!-- CLOSE BUTTON -->
            <button class="btn close" @click="close">
                Close
            </button>

        </div>
    </div>
</template>

<script setup>
import { getItem } from "../../game/utils/itemDB";

const props = defineProps({
    visible: Boolean,
    loot: Array
});

const emit = defineEmits(["close"]);

function close() {
    emit("close");
}
</script>

<style scoped>
/* BACKDROP ---------------------------------------- */
.loot-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.25s ease;
    z-index: 2000;
}

/* MODAL -------------------------------------------- */
.loot-modal {
    width: 520px;
    max-width: 90%;
    padding: 26px 32px;
    text-align: center;

    background: rgba(25, 25, 40, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 18px;

    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.35),
        inset 0 0 16px rgba(255, 255, 255, 0.04);

    animation: scaleIn 0.25s ease;
    color: white;
}

/* TITLE -------------------------------------------- */
.loot-title {
    font-size: 1.9rem;
    font-weight: 800;
    margin-bottom: 20px;
    letter-spacing: 0.5px;
}

/* GRID --------------------------------------------- */
.loot-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 22px;
    margin-bottom: 24px;
}

/* ITEM CARD ---------------------------------------- */
.loot-card {
    padding: 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    transition: 0.2s;
    animation: fadeUp 0.35s ease;
}

.loot-card:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
}

.loot-icon-wrapper {
    width: 64px;
    height: 64px;
    margin: 0 auto 10px;
}

.loot-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.loot-name {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 6px;
}

.loot-amount {
    font-size: 0.9rem;
    opacity: 0.85;
}

/* CLOSE BUTTON ------------------------------------- */
/* Buttons */
.btn {
    padding: 8px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    width: 100%;
}

.close {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ANIMATIONS --------------------------------------- */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0.85);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
