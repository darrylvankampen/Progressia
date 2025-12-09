import { ref } from "vue";

/* CONTEXT MENU (jouw huidige systeem) */
const actionState = ref({
  visible: false,
  item: null,
  x: 0,
  y: 0,
});

/* INSPECT MODAL (nieuw systeem) */
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
  function openInspect(item) {
    inspectState.value = {
      visible: true,
      item,
    };
  }

  function closeInspect() {
    inspectState.value.visible = false;
    inspectState.value.item = null;
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
