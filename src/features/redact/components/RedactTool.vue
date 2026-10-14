<script setup>
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { executeTrueRedaction } from '../logic/executeTrueRedaction.js';
import { findTextRedactionBoxes } from '../logic/findTextRedactionBoxes.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import RedactWarningBanner from './RedactWarningBanner.vue';
import RedactControls from './RedactControls.vue';
import RedactBoxList from './RedactBoxList.vue';
import RedactCanvas from './RedactCanvas.vue';
import RedactPreviewModal from './RedactPreviewModal.vue';
import PreviewViewport from '../../../ui/PreviewViewport.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);
const currentPage = ref(1);
const pageDimensionsPt = ref({ width: 595.28, height: 841.89 });

const boxesByPage = ref({});
const selectedBoxId = ref(null);
const searchTerm = ref('');
const sanitizeMetadata = ref(true);
const isProcessing = ref(false);
const progressValue = ref(0);
const showPreviewModal = ref(false);
const previewScale = ref(1.0);

const historyStack = ref([]);
const redoStack = ref([]);

const canUndo = computed(() => historyStack.value.length > 0);
const canRedo = computed(() => redoStack.value.length > 0);
const currentBoxes = computed(() => boxesByPage.value[currentPage.value - 1] || []);
const totalBoxCount = computed(() => {
  return Object.values(boxesByPage.value).reduce((acc, list) => acc + list.length, 0);
});

onMounted(() => {
  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
  }
  window.addEventListener('keydown', onGlobalKeyDown);
});

watch(() => [pdfDocProxy.value, currentPage.value], async () => {
  if (pdfDocProxy.value) {
    try {
      const rawDoc = unwrapPdfProxy(pdfDocProxy.value);
      const p = await rawDoc.getPage(currentPage.value);
      const vp = p.getViewport({ scale: 1.0 });
      pageDimensionsPt.value = { width: vp.width, height: vp.height };
    } catch (_) {}
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeyDown);
});

function onGlobalKeyDown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
}

function pushHistory() {
  historyStack.value.push(JSON.parse(JSON.stringify(boxesByPage.value)));
  if (historyStack.value.length > 30) historyStack.value.shift();
  redoStack.value = [];
}

function undo() {
  if (!canUndo.value) return;
  redoStack.value.push(JSON.parse(JSON.stringify(boxesByPage.value)));
  boxesByPage.value = historyStack.value.pop();
}

function redo() {
  if (!canRedo.value) return;
  historyStack.value.push(JSON.parse(JSON.stringify(boxesByPage.value)));
  boxesByPage.value = redoStack.value.pop();
}

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  activeFile.value = file;
  boxesByPage.value = {};
  historyStack.value = [];
  redoStack.value = [];
  selectedBoxId.value = null;
  currentPage.value = 1;

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    const doc = await loadPdfJsDocument(buffer);
    pdfDocProxy.value = doc;
    totalPages.value = doc.numPages;
    const page = await doc.getPage(1);
    const vp = page.getViewport({ scale: 1.0 });
    pageDimensionsPt.value = { width: vp.width, height: vp.height };
  } catch (err) {
    showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
    resetFile();
  }
}

function resetFile() {
  activeFile.value = null;
  activeBuffer = null;
  pdfDocProxy.value = null;
  totalPages.value = 0;
  currentPage.value = 1;
  boxesByPage.value = {};
  historyStack.value = [];
  redoStack.value = [];
  selectedBoxId.value = null;
}

function onAddBox(box) {
  pushHistory();
  const pageIdx = currentPage.value - 1;
  const list = boxesByPage.value[pageIdx] || [];
  const newBox = {
    ...box,
    id: 'rbox_' + Math.random().toString(36).substring(2, 9)
  };
  boxesByPage.value = {
    ...boxesByPage.value,
    [pageIdx]: [...list, newBox]
  };
  selectedBoxId.value = newBox.id;
}

function onUpdateBox(box) {
  const pageIdx = currentPage.value - 1;
  const list = boxesByPage.value[pageIdx] || [];
  const idx = list.findIndex(b => b.id === box.id);
  if (idx !== -1) {
    const updated = [...list];
    updated[idx] = { ...box };
    boxesByPage.value = {
      ...boxesByPage.value,
      [pageIdx]: updated
    };
  }
}

function onRemoveBox(id) {
  pushHistory();
  const pageIdx = currentPage.value - 1;
  const list = boxesByPage.value[pageIdx] || [];
  boxesByPage.value = {
    ...boxesByPage.value,
    [pageIdx]: list.filter(b => b.id !== id)
  };
  if (selectedBoxId.value === id) {
    selectedBoxId.value = null;
  }
}

function clearCurrentPage() {
  if (currentBoxes.value.length === 0) return;
  pushHistory();
  const pageIdx = currentPage.value - 1;
  boxesByPage.value = {
    ...boxesByPage.value,
    [pageIdx]: []
  };
  selectedBoxId.value = null;
  showToast('Kotak sensor di halaman ini dihapus.', 'info');
}

async function handleSearch() {
  if (!searchTerm.value.trim() || !pdfDocProxy.value) return;
  try {
    const foundBoxes = await findTextRedactionBoxes(
      pdfDocProxy.value,
      currentPage.value,
      searchTerm.value,
      previewScale.value
    );

    if (foundBoxes.length === 0) {
      showToast(`Kata "${searchTerm.value}" tidak ditemukan pada halaman ini.`, 'info');
      return;
    }

    pushHistory();
    const pageIdx = currentPage.value - 1;
    const list = boxesByPage.value[pageIdx] || [];
    boxesByPage.value = {
      ...boxesByPage.value,
      [pageIdx]: [...list, ...foundBoxes]
    };
    showToast(`${foundBoxes.length} kata cocok ditemukan dan ditandai!`, 'success');
  } catch (err) {
    showToast('Gagal mencari teks: ' + (err.message || ''), 'error');
  }
}

async function handleApply() {
  if (totalBoxCount.value === 0 || !activeBuffer || !activeFile.value) return;

  isProcessing.value = true;
  progressValue.value = 5;

  try {
    const safeBuffer = new Uint8Array(activeBuffer.slice(0));
    const resultBytes = await executeTrueRedaction(
      safeBuffer,
      pdfDocProxy.value,
      boxesByPage.value,
      previewScale.value,
      sanitizeMetadata.value,
      (pct) => { progressValue.value = pct; }
    );

    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_redacted.pdf`);
    showToast('Dokumen berhasil disensor permanen!', 'success');
  } catch (err) {
    showToast('Gagal menyensor dokumen: ' + (err.message || ''), 'error');
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Sensor Dokumen
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Sensor permanen teks dan objek rahasia melalui rasterisasi piksel serta bersihkan metadata dokumen.
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-3 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ totalPages }} halaman • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB</p>
        </div>
        <button
          type="button"
          class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
          @click="resetFile"
        >
          Ganti File
        </button>
      </BaseCard>

      <RedactWarningBanner />

      <BaseProgressBar v-if="isProcessing" :progress="progressValue" label="Menghancurkan piksel sensor..." />

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Panel: Controls & Box List -->
        <div class="lg:col-span-5 space-y-4">
          <RedactControls
            v-model:search-term="searchTerm"
            v-model:sanitize-metadata="sanitizeMetadata"
            :page-box-count="currentBoxes.length"
            :total-box-count="totalBoxCount"
            :is-processing="isProcessing"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @search="handleSearch"
            @undo="undo"
            @redo="redo"
            @inspect-preview="showPreviewModal = true"
            @clear-page="clearCurrentPage"
            @apply="handleApply"
          />

          <RedactBoxList
            :boxes="currentBoxes"
            :selected-box-id="selectedBoxId"
            :current-page="currentPage"
            @select-box="id => selectedBoxId = id"
            @remove-box="onRemoveBox"
          />
        </div>

        <!-- Right Panel: Canvas Viewport -->
        <div class="lg:col-span-7 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink">
              Halaman {{ currentPage }} dari {{ totalPages }}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                :disabled="currentPage <= 1"
                class="px-2 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
                @click="currentPage--"
              >
                ◀
              </button>
              <button
                type="button"
                :disabled="currentPage >= totalPages"
                class="px-2 py-1 text-xs font-bold border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm disabled:opacity-40 cursor-pointer"
                @click="currentPage++"
              >
                ▶
              </button>
            </div>
          </div>

          <PreviewViewport
            :page-width-pt="pageDimensionsPt.width"
            :page-height-pt="pageDimensionsPt.height"
            v-slot="{ effectiveScale }"
          >
            <RedactCanvas
              :pdf-doc-proxy="pdfDocProxy"
              :current-page="currentPage"
              :boxes="currentBoxes"
              :selected-box-id="selectedBoxId"
              :scale="effectiveScale"
              @add-box="onAddBox"
              @update-box="onUpdateBox"
              @remove-box="onRemoveBox"
              @select-box="id => selectedBoxId = id"
            />
          </PreviewViewport>
        </div>
      </div>
    </div>

    <!-- High-Resolution Inspection Preview Modal -->
    <RedactPreviewModal
      :show="showPreviewModal"
      :pdf-doc-proxy="pdfDocProxy"
      :boxes-by-page="boxesByPage"
      :current-page="currentPage"
      :total-pages="totalPages"
      @close="showPreviewModal = false"
      @update:current-page="p => currentPage = p"
    />
  </div>
</template>
