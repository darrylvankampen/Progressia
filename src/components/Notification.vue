<template>
  <div class="notification-container">
    <transition-group name="notify" tag="div" class="notification-stack">
      <div v-for="n in notifications" :key="n.id" class="notification" :data-type="n.type" :style="{
        '--accent': resolveColor(n)
      }">
        <div class="content">
          <img v-if="n.icon" :src="n.icon" alt="icon" class="icon-img" />
          <span class="message">{{ n.message }}</span>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useNotifications } from "../composables/useNotification";

const { notifications } = useNotifications();

// kleur bepalen op basis van type (xp, loot, rare, warning, success, etc.)
function resolveColor(n) {
  if (n.color) return n.color;

  switch (n.type) {
    case "xp": return "#4fd1c5";       // mint / teal
    case "resource": return "#7bd66f"; // groen
    case "gold": return "#f4d35e";     // goud
    case "rare": return "#d977ff";     // paars glowy
    case "error": return "#f56565";
    case "warning": return "#f6ad55";
    case "success": return "#68d391";
    default: return "#ffffff55";       // neutraal
  }
}
</script>


<style scoped>
.notification-container {
  position: fixed;
  top: 16px;
  right: calc(env(safe-area-inset-right) + 16px);
  z-index: 9999;
  pointer-events: none;
}

.notification-stack {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  pointer-events: none;
}

.notification {
  transform: translateX(-8px);
  /* <-- BELANGRIJK */
  width: fit-content;
  pointer-events: none;
  max-height: 40px;
}

/* Your visible bubble */
.content {
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(15, 15, 15, 0.55);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow:
    0 1px 4px rgba(0, 0, 0, 0.35),
    0 0 2px var(--accent);

  display: inline-flex;
  align-items: center;
  gap: 5px;

  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.15;
  color: #fff;
  pointer-events: auto;

  /* ❌ Verwijderd: min-width: 100%; */
  width: max-content;
  /* ⬅ Nieuw: bubble past zich aan content aan */
  max-width: 240px;
  /* ⬅ zodat hij niet groter dan je limit wordt */
  white-space: nowrap;
  /* ⬅ geen wrap */
}

/* SUPER SMALL ICON */
.icon-img {
  width: 16px;
  height: 16px;
  filter: drop-shadow(0 0 1px var(--accent));
}

/* Micro animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(4px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateY(-2px) scale(0.95);
  }
}

/* BEGIN: transition-group fixes */
.notify-enter-active,
.notify-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease, max-height 0.2s ease;
}

/* start-hoogte bij leave */
.notify-leave-from {
  max-height: 40px;
  /* ongeveer hoogte van één notificatie */
}

/* eind-hoogte bij leave (verdwijnt + geen ruimte meer) */
.notify-leave-to {
  opacity: 0;
  transform: translateY(-3px);
  max-height: 0;
}

/* EINDE: transition-group fixes */
</style>
