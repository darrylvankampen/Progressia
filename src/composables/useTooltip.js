import { ref } from "vue";

const tooltip = ref({
  visible: false,
  item: null,
  x: 0,
  y: 0,
});

export function useTooltip() {
  function showTooltip(item, event) {
    tooltip.value = {
      visible: true,
      item,
      x: event.clientX + 15,
      y: event.clientY + 15,
    };
  }

  function hideTooltip() {
    tooltip.value.visible = false;
  }

  return { tooltip, showTooltip, hideTooltip };
}
