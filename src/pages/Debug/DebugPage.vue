<template>
    <div class="debug-page">
        <h1 class="debug-title">🔧 Progressia Debug Panel</h1>

        <!-- TABS -->
        <div class="debug-tabs">
            <button v-for="tab in tabs" :key="tab" :class="{ active: currentTab === tab }" @click="currentTab = tab">
                {{ tab }}
            </button>
        </div>

        <div class="debug-content">
            <!-- GENERAL TAB -->
            <div v-if="currentTab === 'General'">
                <h2>General Debug Tools</h2>
                <button @click="resetGame">Reset Game</button>
                <button @click="giveGold(10000)">+10000 Gold</button>
                <button @click="giveXp(100)">+100 XP</button>

                <h3>Game State</h3>
                <pre>{{ game }}</pre>
            </div>

            <!-- PLAYER TAB -->
            <div v-if="currentTab === 'Player'">
                <h2>Player Data</h2>
                <pre>{{ game.player }}</pre>
            </div>

            <!-- ITEMS TAB -->
            <div v-if="currentTab === 'Items'">
                <h2>All Items (itemDB)</h2>

                <!-- SEARCH BAR -->
                <input v-model="searchQuery" type="text" placeholder="🔍 Search items..." class="debug-search" />

                <div class="item-grid">
                    <div class="item-card" v-for="item in filteredItems" :key="item.id">
                        <img :src="item.icon" class="item-icon" />
                        <div class="name">{{ item.name }}</div>
                        <div class="id">ID: {{ item.id }}</div>
                        <div class="desc">{{ item.description }}</div>
                        <button @click="giveItem(item.id)">Give Item</button>
                    </div>
                </div>
            </div>

            <!-- SKILLS TAB -->
            <div v-if="currentTab === 'Skills'">
                <h2>Skills</h2>

                <div class="item-grid">
                    <div class="item-card" v-for="(skill, key) in game.skills" :key="key">
                        <div class="name">{{ key }}</div>
                        <div>Level: {{ skill.level }}</div>
                        <div>XP: {{ skill.xp }}</div>
                        <button @click="addSkillXp(key)">+100 XP</button>
                    </div>
                </div>
            </div>

            <!-- FACTIONS TAB -->
            <div v-if="currentTab === 'Factions'">
                <h2>Factions</h2>
                <pre>{{ game.factions }}</pre>
            </div>

            <!-- SYSTEMS TAB -->
            <div v-if="currentTab === 'Systems'">
                <h2>Loaded Databases</h2>



                <h3>Skill DB</h3>
                <pre>{{ skillDB }}</pre>

                <h3>Faction DB</h3>
                <pre>{{ factionDB }}</pre>
            </div>

            <!-- PRESTIGE TAB -->
            <div v-if="currentTab === 'Prestiges' && allPrestiges">
                <h2>Prestige Upgrades</h2>

                <div class="item-grid">
                    <div class="item-card" v-for="upgrade in allPrestiges" :key="upgrade.id">

                        <div class="name">{{ upgrade.name }}</div>
                        <div class="id">ID: {{ upgrade.id }}</div>
                        <div class="desc">{{ upgrade.description }}</div>

                        <div class="level">
                            Level: {{ getPrestigeLevel(upgrade.id) }} / {{ upgrade.maxLevel }}
                        </div>

                        <div class="cost">
                            Cost: {{ getPrestigeCost(upgrade.id) }} gold
                        </div>

                        <button @click="buyPrestige(upgrade.id)">Buy Upgrade</button>
                        <button @click="prestigeMax(upgrade.id)">Max Upgrade</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { addItem, getGame } from "../../game/state/gameState";
import { getAllItems } from "../../game/utils/itemDB";
import { getPrestigeDefs } from "../../game/prestiges/prestigeDB";
import { getPrestigeLevel, purchasePrestigeUpgrade, getPrestigeCost } from "../../game/prestiges/prestigesEngine";

const game = getGame();

// TABS
const tabs = ["General", "Player", "Items", "Skills", "Factions", "Systems", "Prestiges"];
const currentTab = ref("General");

const allItems = computed(() => getAllItems());
const allPrestiges = computed(() => getPrestigeDefs());

const buyPrestige = id => {
    const success = purchasePrestigeUpgrade(id);
    if (!success) {
        console.warn("Purchase failed or insufficient resources.");
    }
};

function prestigeMax(prestigeId) {
    const def = getPrestigeDefs().find(p => p.id === prestigeId);

    game.player.prestige[prestigeId] = def.maxLevel;
}

const searchQuery = ref("");

const filteredItems = computed(() => {
    const q = searchQuery.value.toLowerCase();
    const items = Array.isArray(allItems.value)
        ? allItems.value
        : Object.values(allItems.value);

    return items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
});

// ACTIONS
const resetGame = () => {
    console.warn("RESET NOT IMPLEMENTED YET");
};

const giveGold = amt => {
    game.player.gold += amt;
};

const giveXp = amt => {
    game.player.totalXp += amt;
};

const giveItem = id => {
    addItem(id);
};

const addSkillXp = key => {
    game.skills[key].xp += 100;
};
</script>

<style scoped>
.debug-page {
    padding: 32px;
    color: white;
}

/* TITLES ------------------------------ */
.debug-title {
    font-size: 2.4rem;
    font-weight: 800;
    margin-bottom: 24px;
    letter-spacing: 0.5px;
    text-shadow: 0 0 12px rgba(255, 255, 255, 0.15);
}

/* TABS -------------------------------- */
.debug-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.debug-tabs button {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    color: white;
    font-weight: 600;
    letter-spacing: 0.3px;
    transition: 0.2s;
}

.debug-tabs button:hover {
    background: rgba(255, 255, 255, 0.12);
}

.debug-tabs button.active {
    background: rgba(255, 255, 255, 0.25);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.1);
}

/* CONTENT PANEL ------------------------ */
.debug-content {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
    border-radius: 16px;
    backdrop-filter: blur(8px);
}

/* CODE BLOCKS -------------------------- */
.debug-content pre {
    background: rgba(0, 0, 0, 0.2);
    padding: 16px;
    border-radius: 10px;
    white-space: pre-wrap;
    font-size: 0.9rem;
    line-height: 1.3;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* GRID ---------------------------------- */
.item-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
}

/* ITEM CARDS --------------------------- */
.item-card {
    background: rgba(255, 255, 255, 0.08);
    padding: 16px;
    border-radius: 14px;
    text-align: center;
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    transition: 0.2s;
}

.item-card:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-3px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

/* ITEM ICON ---------------------------- */
.item-icon {
    width: 52px;
    height: 52px;
    margin-bottom: 12px;
}

/* BUTTONS ------------------------------ */
.debug-content button {
    width: 100%;
    padding: 8px 0;
    margin-top: 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    color: white;
    font-weight: 600;
    transition: 0.2s;
}

.debug-content button:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* SEARCH BAR --------------------------- */
.debug-search {
    width: 100%;
    padding: 12px 16px;
    margin-bottom: 20px;

    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(6px);
    color: white;

    font-size: 1rem;
    outline: none;
    transition: 0.2s;
}

.debug-search::placeholder {
    color: rgba(255, 255, 255, 0.55);
}

.debug-search:focus {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.25);
}
</style>
