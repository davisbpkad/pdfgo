import { ref, computed, watch } from 'vue';
import { extractEditableText } from './extractEditableText.js';
import { applyText, countChanged, createTextEdit, resetAll } from './textEditInteractions.js';

/**
 * State holder for inline document-text editing (one entry per page, loaded lazily).
 * @param {import('vue').Ref<number>} currentPage 1-indexed
 * @param {import('vue').Ref<object|null>} pdfDocProxy
 */
export function useTextEdits(currentPage, pdfDocProxy) {
  const editsByPage = ref({});
  const history = ref([]);
  const isLoadingPage = ref(false);

  const currentEdits = computed(() => editsByPage.value[currentPage.value - 1] || []);
  const changedCount = computed(() => countChanged(editsByPage.value));

  async function loadPage(pageNum) {
    const pIdx = pageNum - 1;
    if (!pdfDocProxy.value || editsByPage.value[pIdx]) return;
    isLoadingPage.value = true;
    try {
      const lines = await extractEditableText(pdfDocProxy.value, pageNum);
      if (currentPage.value !== pageNum) return;
      editsByPage.value = {
        ...editsByPage.value,
        [pIdx]: lines.map(createTextEdit)
      };
    } catch (err) {
      console.warn('Gagal membaca teks halaman:', err);
    } finally {
      isLoadingPage.value = false;
    }
  }

  function setText(id, text) {
    const pIdx = currentPage.value - 1;
    const list = editsByPage.value[pIdx] || [];
    editsByPage.value = {
      ...editsByPage.value,
      [pIdx]: list.map((edit) => (edit.id === id ? applyText(edit, text) : edit))
    };
  }

  function snapshot() {
    history.value.push(JSON.parse(JSON.stringify(editsByPage.value)));
    if (history.value.length > 40) history.value.shift();
  }

  function undo() {
    if (history.value.length === 0) return;
    editsByPage.value = history.value.pop();
  }

  function reset() {
    snapshot();
    editsByPage.value = resetAll(editsByPage.value);
  }

  function clear() {
    editsByPage.value = {};
    history.value = [];
  }

  watch([currentPage, pdfDocProxy], () => loadPage(currentPage.value), { immediate: true });

  return {
    editsByPage,
    currentEdits,
    changedCount,
    isLoadingPage,
    canUndo: computed(() => history.value.length > 0),
    setText,
    snapshot,
    undo,
    reset,
    clear
  };
}
