import { ref, computed } from 'vue';
import { createDefaultObject } from './objectInteractions.js';

export function useOverlayObjects(currentPage) {
  const objectsByPage = ref({});
  const selectedObjectId = ref(null);
  const history = ref([]);
  const redoHistory = ref([]);

  const currentObjects = computed(() => objectsByPage.value[currentPage.value - 1] || []);
  const selectedObject = computed(() => currentObjects.value.find((o) => o.id === selectedObjectId.value) || null);

  function pushHist() {
    history.value.push(JSON.parse(JSON.stringify(objectsByPage.value)));
    redoHistory.value = [];
  }

  function addObject(typeOrObj, extra = {}) {
    pushHist();
    const obj = typeof typeOrObj === 'string'
      ? createDefaultObject(typeOrObj, extra)
      : createDefaultObject(typeOrObj.type, typeOrObj);
    const pIdx = currentPage.value - 1;
    objectsByPage.value[pIdx] = [...(objectsByPage.value[pIdx] || []), obj];
    selectedObjectId.value = obj.id;
  }

  function updateObject(updated) {
    const pIdx = currentPage.value - 1;
    objectsByPage.value[pIdx] = (objectsByPage.value[pIdx] || []).map((o) => (o.id === updated.id ? updated : o));
  }

  function removeObject(id) {
    pushHist();
    const pIdx = currentPage.value - 1;
    objectsByPage.value[pIdx] = (objectsByPage.value[pIdx] || []).filter((o) => o.id !== id);
    if (selectedObjectId.value === id) selectedObjectId.value = null;
  }

  function undo() {
    if (!history.value.length) return;
    redoHistory.value.push(JSON.parse(JSON.stringify(objectsByPage.value)));
    objectsByPage.value = history.value.pop();
  }

  function redo() {
    if (!redoHistory.value.length) return;
    history.value.push(JSON.parse(JSON.stringify(objectsByPage.value)));
    objectsByPage.value = redoHistory.value.pop();
  }

  function reset() {
    objectsByPage.value = {};
    selectedObjectId.value = null;
    history.value = [];
    redoHistory.value = [];
  }

  return {
    objectsByPage,
    selectedObjectId,
    currentObjects,
    selectedObject,
    canUndo: computed(() => history.value.length > 0),
    canRedo: computed(() => redoHistory.value.length > 0),
    addObject,
    updateObject,
    removeObject,
    undo,
    redo,
    reset
  };
}
