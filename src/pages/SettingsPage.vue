<template>
  <div class="settings-page osrs-panel">

    <h2 class="settings-title">Settings</h2>

    <!-- PLAYER NAME -------------------------------------------------->
    <div class="setting-row name-row">
      <label>Player Name</label>

      <div class="name-editor">
        <input class="name-input" v-model="playerName" maxlength="20" placeholder="Enter your name" />
        <button class="osrs-btn small" @click="applyName(playerName.value)">
          Save
        </button>
      </div>
    </div>

    <!-- UI SETTINGS -------------------------------------------------->
    <div class="section">
      <h3 class="section-title">Interface</h3>

      <div class="setting-row">
        <label>Sidebar Auto-Collapse</label>
        <input type="checkbox" v-model="settings.autoCollapse" />
      </div>

      <div class="setting-row">
        <label>Show XP Popups</label>
        <input type="checkbox" v-model="settings.showXpPopups" />
      </div>

      <div class="setting-row">
        <label>Show Rare Drop Notifs</label>
        <input type="checkbox" v-model="settings.showRareNotifs" />
      </div>

      <div class="setting-row">
        <label>UI Accent Color</label>
        <input type="color" v-model="settings.accentColor" />
      </div>
    </div>

    <!-- AUDIO SETTINGS -------------------------------------------------->
    <div class="section">
      <h3 class="section-title">Audio</h3>

      <div class="setting-row">
        <label>Music Volume</label>
        <input type="range" min="0" max="100" v-model="settings.musicVolume" />
      </div>

      <div class="setting-row">
        <label>Sound Effects</label>
        <input type="range" min="0" max="100" v-model="settings.sfxVolume" />
      </div>

      <div class="setting-row">
        <label>Mute All</label>
        <input type="checkbox" v-model="settings.muted" />
      </div>
    </div>

    <!-- PERFORMANCE -------------------------------------------------->
    <div class="section">
      <h3 class="section-title">Graphics & Performance</h3>

      <div class="setting-row">
        <label>HD Effects (glow, shadows)</label>
        <input type="checkbox" v-model="settings.hdMode" />
      </div>

      <div class="setting-row">
        <label>Disable Animations</label>
        <input type="checkbox" v-model="settings.noAnimations" />
      </div>
    </div>

    <!-- SAVE SYSTEM -------------------------------------------------->
    <div class="section">
      <h3 class="section-title">Save Data</h3>

      <button class="osrs-btn" @click="exportData">Export Save</button>
      <button class="osrs-btn" @click="importData">Import Save</button>
      <button class="osrs-btn" @click="backupNow">Download Backup</button>
    </div>

    <!-- DANGER ZONE -------------------------------------------------->
    <div class="section danger">
      <h3 class="section-title danger">Danger Zone</h3>
      <button class="danger-btn" @click="resetGame">Reset Entire Game</button>
    </div>

  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { resetGame, getPlayerName, setPlayerName as applyName } from "../game/state/gameState";

const settings = reactive({
  autoCollapse: false,
  showXpPopups: true,
  showRareNotifs: true,
  accentColor: "#6ee7b7",

  musicVolume: 70,
  sfxVolume: 70,
  muted: false,

  hdMode: true,
  noAnimations: false,
});

const playerName = ref(getPlayerName());

// placeholder
function exportData() { }
function importData() { }
function backupNow() { }
</script>

<style scoped>
.settings-page {
  padding: 28px;
  border-radius: 14px;

  background: linear-gradient(145deg, #292929, #181818);
  border: 1px solid #6c6c6c44;
  backdrop-filter: blur(8px);

  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.45),
    inset 0 0 12px rgba(255, 255, 255, 0.04);

  animation: fadeIn 0.25s ease-out;
  color: white;
}

.settings-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 22px;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.25);
}

/* SECTION ----------------------------------------------------------- */
.section {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.section-title {
  font-size: 1.4rem;
  margin-bottom: 14px;
  color: #cfe4ff;
  text-shadow: 0 0 8px rgba(100, 150, 255, 0.4);
}

/* ROW --------------------------------------------------------------- */
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
  font-size: 1rem;
}

.setting-row input[type="range"] {
  width: 160px;
}

.osrs-btn {
  width: 100%;
  padding: 10px;
  margin-top: 10px;

  background: linear-gradient(145deg, #3e3e3e, #262626);
  border-radius: 10px;
  border: 1px solid #5a5a5a66;
  color: white;
  cursor: pointer;

  transition: 0.18s ease;
}

.osrs-btn:hover {
  filter: brightness(1.15);
  transform: translateY(-2px);
}

/* DANGER ZONE -------------------------------------------------------- */
.danger-btn {
  margin-top: 12px;
  width: 100%;
  padding: 12px;

  background: linear-gradient(145deg, #ff4d4d, #c03939);
  border: 1px solid #ff7f7f66;
  border-radius: 10px;

  color: white;
  font-weight: 700;

  box-shadow:
    0 4px 10px rgba(255, 50, 50, 0.25),
    0 0 10px rgba(255, 80, 80, 0.4);

  transition: 0.18s ease;
}

.danger-btn:hover {
  transform: translateY(-3px);
  filter: brightness(1.1);
}

/* NAME INPUT --------------------------------------------------- */

.name-row {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.name-editor {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* OSRS-style beveled dark input */
.name-input {
  flex: 1;
  padding: 10px 12px;

  background: linear-gradient(145deg, #2e2e2e, #1b1b1b);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;

  color: white;
  font-size: 1rem;
  letter-spacing: 0.4px;
  min-width: 75%;
  box-shadow:
    inset 0 0 6px rgba(255, 255, 255, 0.05),
    0 0 6px rgba(0, 0, 0, 0.4);

  transition: 0.15s ease;
}

.name-input:focus {
  outline: none;
  border-color: var(--accent, #6ee7b7);
  box-shadow:
    0 0 10px var(--accent, #6ee7b7),
    inset 0 0 8px rgba(255, 255, 255, 0.08);
}

/* Small OSRS button */
.osrs-btn.small {
  padding: 8px 14px;
  font-size: 0.9rem;
  border-radius: 8px;
}
</style>
