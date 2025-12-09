// src/composables/useNotification.js
import { ref } from "vue";

const notifications = ref([]);

export function useNotifications() {
  function pushNotification(key, payload, duration = 2500) {
    // payload = { message, type, icon, color, amount, item }
    const message =
      payload.message ??
      (payload.amount && payload.item
        ? `+${payload.amount} ${payload.item}`
        : payload.amount
          ? `+${payload.amount}`
          : payload.item
            ? payload.item
            : "");

    const existing = notifications.value.find((n) => n.key === key);

    if (existing) {
      existing.count++;
      existing.message = `${message} ×${existing.count}`;
      clearTimeout(existing.timeout);

      existing.timeout = setTimeout(() => removeNotification(existing.id), duration);
      return;
    }

    const id = crypto.randomUUID();

    const timeout = setTimeout(() => {
      removeNotification(id);
    }, duration);

    notifications.value.push({
      id,
      key,
      message,
      count: 1,
      icon: payload.icon,
      type: payload.type ?? "default",
      color: payload.color ?? null,
      duration,
      timeout,
      createdAt: Date.now(),
    });
  }

  function removeNotification(id) {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      clearTimeout(notifications.value[index].timeout);
      notifications.value.splice(index, 1);
    }
  }

  return { notifications, pushNotification };
}
