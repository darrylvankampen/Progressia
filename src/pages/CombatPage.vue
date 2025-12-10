<template>
    <!-- ========================================= -->
    <!-- ENEMY SELECTOR (GRID) -->
    <!-- ========================================= -->
    <div v-if="!combat" class="enemy-select">
        <h2>Select an enemy</h2>

        <div class="enemy-grid">
            <div v-for="e in enemies" :key="e.id" class="enemy-card card-style" @click="startFight(e.id)"
                :data-diff="e.difficulty">
                <div class="enemy-card-image">
                    <img :src="e.icon" />
                </div>

                <div class="enemy-card-body">
                    <h3>{{ e.name }}</h3>

                    <div class="stats">
                        <div class="stat">
                            <span>HP</span>
                            <strong>{{ e.hp }}</strong>
                        </div>
                        <div class="stat">
                            <span>ATK</span>
                            <strong>{{ e.attack }}</strong>
                        </div>
                        <div class="stat">
                            <span>DEF</span>
                            <strong>{{ e.defence }}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- ========================================= -->
    <!-- COMBAT VIEW -->
    <!-- ========================================= -->
    <div class="combat-page" v-if="combat">

        <!-- HEADER: Enemy naam en icon -->
        <div class="enemy-header card-style">
            <img :src="enemyIcon" class="enemy-icon" />
            <h2 class="enemy-name">{{ enemy?.name }}</h2>
        </div>

        <!-- HP BARS -->
        <div class="hp-section">

            <div class="hp-block card-style">
                <div class="hp-label">Player</div>
                <div class="hp-bar">
                    <div class="hp-fill player" :style="{ width: playerHpPercent + '%' }"></div>
                </div>
                <div class="hp-text">{{ combat.playerHp }} / {{ combat.maxPlayerHp }}</div>
            </div>

            <div class="hp-block card-style">
                <div class="hp-label">{{ enemy?.name }}</div>
                <div class="hp-bar">
                    <div class="hp-fill enemy" :style="{ width: enemyHpPercent + '%' }"></div>
                </div>
                <div class="hp-text">{{ combat.enemyHp }} / {{ combat.maxEnemyHp }}</div>
            </div>

        </div>

        <!-- STYLE INFO -->
        <div class="style-info card-style">
            Combat Style:
            <strong>{{ combat.style }}</strong>
        </div>

        <!-- COMBAT RESULT -->
        <div v-if="combat.result" class="result-box card-style" :data-result="combat.result">
            <template v-if="combat.result === 'win'">
                <h3>You defeated {{ enemy?.name }}!</h3>
            </template>

            <template v-if="combat.result === 'lose'">
                <h3>You were defeated by {{ enemy?.name }}...</h3>
            </template>

            <template v-if="combat.result === 'fled'">
                <h3>You fled from {{ enemy?.name }}.</h3>
            </template>

            <button class="btn" @click="returnToWorld">Return</button>
        </div>

        <!-- ACTION BUTTONS -->
        <div v-else class="actions card-style">
            <button class="btn flee" @click="flee">Flee</button>
        </div>

    </div>

    <!-- NO COMBAT (fallback) -->
    <div v-else class="no-combat card-style">
        <h2>No active combat</h2>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { startCombat, getCurrentCombat, stopCombat } from "../game/combat/CombatEngine";
import { getEnemy, getAllEnemies } from "../game/utils/enemyDB";

// enemy list
const enemies = getAllEnemies();

// reactive combat state
const combat = computed(() => getCurrentCombat());

// enemy info
const enemy = computed(() => combat.value ? getEnemy(combat.value.enemyId) : null);
const enemyIcon = computed(() => enemy.value?.icon || "/icons/resources/placeholder.png");

console.log(enemies)

// % bars
const playerHpPercent = computed(() => {
    if (!combat.value) return 0;
    return Math.max(0, (combat.value.playerHp / combat.value.maxPlayerHp) * 100);
});

const enemyHpPercent = computed(() => {
    if (!combat.value) return 0;
    return Math.max(0, (combat.value.enemyHp / combat.value.maxEnemyHp) * 100);
});

// start fight
function startFight(enemyId) {
    startCombat(enemyId);
}

// flee handler
function flee() {
    stopCombat();
}

function returnToWorld() {
    location.reload();
}
</script>

<style scoped>
/* ======================================== */
/* OSRS-HD Enemy Selector / Combat Styling  */
/* ======================================== */

.enemy-select {
    padding: 20px;
    text-align: center;
}

.enemy-select h2 {
    font-size: 1.6rem;
    margin-bottom: 20px;
    opacity: 0.9;
}

/* Modern HD enemy grid */
.enemy-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 20px;
}

/* HD Enemy Card */
.enemy-card {
    cursor: pointer;
    padding: 18px;
    border-radius: 14px;

    background: linear-gradient(145deg, #343434, #1e1e1e);
    border: 1px solid #6c6c6c44;

    box-shadow:
        0 4px 10px rgba(0, 0, 0, 0.35),
        inset 0 0 12px rgba(255, 255, 255, 0.04),
        inset 0 0 5px rgba(0, 0, 0, 0.35);

    display: flex;
    flex-direction: column;
    align-items: center;

    transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
}

/* HD Hover */
.enemy-card:hover {
    transform: translateY(-6px);
    border-color: #9ac7ff66;

    box-shadow:
        0 0 14px #8ab5ff45,
        inset 0 0 12px rgba(255, 255, 255, 0.06);
}

/* Enemy Image */
.enemy-card-image {
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 14px;

    filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.6));
}

.enemy-card-image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

/* Enemy name */
.enemy-card-body h3 {
    margin: 6px 0 10px;
    font-size: 1.2rem;
    opacity: 0.95;
    letter-spacing: 0.4px;
}

/* Stats row */
.stats {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 12px;
    gap: 6px;
}

.stat span {
    font-size: 0.75rem;
    opacity: 0.6;
}

.stat strong {
    font-size: 1.0rem;
    opacity: 0.95;
}

/* Difficulty borders (HD subtle gradients) */
.enemy-card[data-diff="easy"] {
    border-color: #6bd66f88;
}

.enemy-card[data-diff="normal"] {
    border-color: #6fbaff88;
}

.enemy-card[data-diff="elite"] {
    border-color: #c29bff88;
}

.enemy-card[data-diff="boss"] {
    border-color: #ff7a7a88;
}

/* ======================================== */
/* COMBAT VIEW (HD OSRS-style) */
/* ======================================== */

.combat-page {
    padding: 30px;
    gap: 24px;
    display: flex;
    flex-direction: column;
}

/* Header area */
.enemy-header {
    padding: 24px;
    background: linear-gradient(145deg, #292929, #181818);
    border: 1px solid #6c6c6c44;
    border-radius: 10px;

    box-shadow:
        0 4px 10px rgba(0, 0, 0, 0.4),
        inset 0 0 8px rgba(255, 255, 255, 0.04);
}

.enemy-icon {
    width: 110px;
    height: 110px;
    margin-bottom: 10px;

    filter: drop-shadow(0px 3px 4px rgba(0, 0, 0, 0.6));
}

/* HP Section */
.hp-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.hp-block {
    padding: 16px;

    background: linear-gradient(145deg, #343434, #1e1e1e);
    border-radius: 10px;
    border: 1px solid #6c6c6c44;

    box-shadow:
        inset 0 0 6px rgba(255, 255, 255, 0.05),
        0 4px 8px rgba(0, 0, 0, 0.3);
}

.hp-label {
    margin-bottom: 6px;
    opacity: 0.75;
    font-size: 0.95rem;
}

.hp-bar {
    width: 100%;
    height: 20px;
    background: #222;
    border-radius: 6px;
    overflow: hidden;
}

.hp-fill {
    height: 100%;
    transition: width 0.25s ease-out;
}

.hp-fill.player {
    background: linear-gradient(90deg, #00ffc8, #00a896);
    box-shadow: 0 0 8px #00ffc888;
}

.hp-fill.enemy {
    background: linear-gradient(90deg, #ff6b6b, #b83333);
    box-shadow: 0 0 8px #ff6b6b88;
}

.hp-text {
    margin-top: 4px;
    text-align: right;
    opacity: 0.8;
}

/* Combat Style box */
.style-info {
    padding: 14px;
    border-radius: 10px;

    background: linear-gradient(145deg, #343434, #1e1e1e);
    border: 1px solid #6c6c6c44;

    text-align: center;
    opacity: 0.9;
}

/* Fight Result Box */
.result-box {
    padding: 20px;
    border-radius: 10px;

    background: linear-gradient(145deg, #2b2b2b, #191919);
    border: 1px solid #6c6c6c44;

    text-align: center;

    box-shadow:
        0 0 10px rgba(255, 255, 255, 0.04),
        inset 0 0 8px rgba(0, 0, 0, 0.35);
}

.actions .btn,
.result-box .btn {
    padding: 10px 20px;
    background: linear-gradient(145deg, #3a3a3a, #1e1e1e);
    border-radius: 6px;
    border: 1px solid #6c6c6c55;

    transition: box-shadow .15s ease;
}

.btn:hover {
    box-shadow: 0 0 8px #8ab5ff55;
}
</style>
