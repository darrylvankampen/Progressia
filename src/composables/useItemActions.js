import { ref } from "vue";

const actionState = ref({
  visible: false,
  item: null,
  x: 0,
  y: 0,
});

const inspectState = ref({
  visible: false,
  item: null,
});

export function useItemActions() {

  // ---------- CONTEXT MENU ----------
  function showActions(item, event) {
    actionState.value = {
      visible: true,
      item,
      x: event.clientX + 10,
      y: event.clientY + 10,
    };
  }

  function hideActions() {
    actionState.value.visible = false;
  }

  // ---------- INSPECT MODAL ----------
  function openInspect(item, locked) {
    inspectState.value = {
      visible: true,
      locked,
      item,
    };
  }

  function closeInspect() {
    inspectState.value.visible = false;
    inspectState.value.item = null;
    inspectState.value.locked = false;
  }

  return {
    // context menu
    actionState,
    showActions,
    hideActions,

    // inspect modal
    inspectState,
    openInspect,
    closeInspect,
  };
}
