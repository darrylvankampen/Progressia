<template>
    <div class="equipment-page">

        <h2 class="title">Worn Equipment</h2>

        <div class="osrs-grid card-style">

            <!-- Row 1: Head -->
            <div class="slot-head">
                <EquipmentSlot label="Head" slotKey="head" :item="equipment.head" @unequip="unequip('head')" />
            </div>

            <!-- Row 2: Cape - Chest - Amulet -->
            <div class="slot-cape">
                <EquipmentSlot label="Cape" slotKey="cape" :item="equipment.cape" @unequip="unequip('cape')" />
            </div>

            <div class="slot-chest">
                <EquipmentSlot label="Chest" slotKey="plate" :item="equipment.plate" @unequip="unequip('plate')" />
            </div>

            <div class="slot-amulet">
                <EquipmentSlot label="Amulet" slotKey="amulet" :item="equipment.amulet" @unequip="unequip('amulet')" />
            </div>

            <!-- Row 3: Weapon - Legs - Shield -->
            <div class="slot-weapon">
                <EquipmentSlot label="Weapon" slotKey="weapon" :item="equipment.weapon" @unequip="unequip('weapon')" />
            </div>

            <div class="slot-legs">
                <EquipmentSlot label="Legs" slotKey="legs" :item="equipment.legs" @unequip="unequip('legs')" />
            </div>

            <div class="slot-offhand">
                <EquipmentSlot label="Off-hand" slotKey="offhand" :item="equipment.offhand"
                    @unequip="unequip('offhand')" />
            </div>

            <!-- Row 4: Hands -->
            <div class="slot-hands">
                <EquipmentSlot label="Hands" slotKey="hands" :item="equipment.hands" @unequip="unequip('hands')" />
            </div>

            <!-- Row 5: Boots -->
            <div class="slot-boots">
                <EquipmentSlot label="Boots" slotKey="boots" :item="equipment.boots" @unequip="unequip('boots')" />
            </div>

            <!-- OPTIONAL OSRS SLOTS -->
            <!-- Ring -->
            <div class="slot-ring">
                <EquipmentSlot label="Ring" slotKey="ring" :item="equipment.ring" @unequip="unequip('ring')" />
            </div>

            <!-- Ammo -->
            <div class="slot-ammo">
                <EquipmentSlot label="Ammo" slotKey="ammo" :item="equipment.ammo" @unequip="unequip('ammo')" />
            </div>

        </div>

        <!-- Stats Panel -->
        <div class="stats card-style">
            <h3>Stats</h3>
            <div><strong>Attack Power:</strong> {{ totalStats.attackPower || 0 }}</div>
            <div><strong>Accuracy:</strong> {{ totalStats.accuracy || 0 }}</div>
            <div><strong>Defence:</strong> {{ totalStats.defenceBonus || 0 }}</div>
            <div><strong>HP Bonus:</strong> {{ totalStats.hpBonus || 0 }}</div>
            <div><strong>Element:</strong> {{ totalStats.element || "None" }}</div>
        </div>

    </div>
</template>

<script setup>
import { computed } from "vue";
import { getGame, equipItem, unequipItem } from "../game/state/gameState";
import EquipmentSlot from "../components/EquipmentSlot.vue"; // small reusable slot component
import { getTotalStats } from "../game/combat/CombatEngine";

// COMPUTED EQUIPMENT STATE
const equipment = computed(() => getGame().player.equipment);

// Total stats from all equipped gear
const totalStats = computed(() => getTotalStats());

// UNEQUIP ACTION
function unequip(slot) {
    unequipItem(slot);
}
</script>

<style scoped>
.equipment-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
}

.title {
    margin-bottom: 20px;
}

/* ============================================= */
/* OSRS 7x5 GRID */
/* ============================================= */
.osrs-grid {
    width: 360px;
    display: grid;

    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(6, 90px);

    padding: 24px 30px;
    gap: 10px;

    background: radial-gradient(circle at center, #2b2b2b 0%, #1b1b1b 100%);
    border: 1px solid #4f4f4faa;
    border-radius: 12px;

    box-shadow:
        0 0 12px rgba(0, 0, 0, 0.4),
        inset 0 0 12px rgba(255, 255, 255, 0.03);
}

/* Exact slot placements (OSRS style) */
.slot-head {
    grid-column: 2;
    grid-row: 1;
}

.slot-cape {
    grid-column: 1;
    grid-row: 2;
}

.slot-chest {
    grid-column: 2;
    grid-row: 2;
}

.slot-amulet {
    grid-column: 3;
    grid-row: 2;
}

.slot-weapon {
    grid-column: 1;
    grid-row: 3;
}

.slot-legs {
    grid-column: 2;
    grid-row: 3;
}

.slot-offhand {
    grid-column: 3;
    grid-row: 3;
}

.slot-hands {
    grid-column: 2;
    grid-row: 4;
}

.slot-boots {
    grid-column: 2;
    grid-row: 5;
}

.slot-ammo {
    grid-column: 1;
    grid-row: 6;
}

.slot-ring {
    grid-column: 3;
    grid-row: 6;
}


/* Stats panel */
.stats {
    margin-top: 20px;
    width: 280px;
    padding: 12px;
    text-align: left;
}
</style>
