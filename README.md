# Progressia

Progressia is a modular, skill-based idle RPG built with **Vue**, featuring a highly flexible game engine powered by reactive state, configuration-driven skills, tools, modifiers, buffs, achievements, factions, and offline progression.

The entire game architecture is designed for extensibility and experimentation with incremental gameplay systems.

---

## 🚀 Features

### 🎮 Core Gameplay
- **Skill-based progression** (woodcutting, mining, etc.)
- **Action-driven loops** with dynamic timing, XP gain, and resource production  
- **Crits, double drops, rare drops, and action-based buffs**
- **Offline Progression**: simulate actions performed while the player was away  
- **Tools & Equipment** with stat multipliers and modifiers  
- **Resource-based gameplay**: gathering, crafting (optional), upgrades

### ⚙️ Game Engine Architecture
- **Fully reactive game state** using Vue
- **Modular JSON-driven skill system** (easy to extend / edit)
- **Dynamic action reconstruction** after reload
- **Modifier engine**: flat + percent + special modifiers  
- **Buff engine**: temporary and permanent buffs  
- **Loot tables** with weighted randomness  
- **Achievement engine** (expandable)

### 💾 Persistence
- Automatic saving via LocalStorage  
- Robust save-migration system  
- State merging between game versions  
- Offline timestamp tracking


---

## 🧩 How It Works (Short Overview)

### 🔄 Game Loop  
Progressia runs a global tick every **100ms**:
- Decreases `timeLeft` for the active skill  
- Executes `performSkillAction()` when an action completes  
- Grants XP, items, rare drops, and buffs  
- Saves the game state

### 🛠 Tool & Stat Modifiers  
Tools and buffs provide:
- `*_speed_percent`  
- `*_xp_percent`  
- `*_doubleChance`  
- `*_rareChance_percent`  

The modifier engine aggregates all sources into a centralized structure.

### 📦 Offline Processing  
When the player returns:
- Calculate time since last session  
- Simulate how many actions should have occurred  
- Award XP and resources accordingly  
- Return a summary for UI purposes

---

## 🧪 Development Setup

### Install dependencies  
```bash
npm install
```
### Run the game  
```bash
npm run dev
```

## Contributing
Contributions are welcome!
Feel free to open an Issue or Pull Request for:
- Bug reports
- Feature requests
- Code improvements
- Translation requests
- General feedback

## License
MIT License