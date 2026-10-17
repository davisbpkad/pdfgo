<script setup>
import { ref, computed, onMounted } from 'vue';
import { loadPdfJsDocument, renderPageToCanvas } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { t } from '../../../app/providers/i18n.js';
import { queueState } from '../../../app/providers/queue.js';
import { reorganizePdfPages } from '../logic/reorganizePdfPages.js';
import DropZone from '../../../ui/DropZone.vue';
import OrganizeToolbar from './OrganizeToolbar.vue';
import OrganizeCard from './OrganizeCard.vue';

const activeFile = ref(null);
let activeBuffer = null;
let pdfDocProxy = null;
const pages = ref([]);
const historyStack = ref([]);
const historyIndex = ref(-1);
const isSaving = ref(false);
let draggedIdx = null;

const selectedCount = computed(() => pages.value.filter(p => p.isSelected).length);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

onMounted(() => {
  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
  }
});

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  activeFile.value = file;
  try {
    activeBuffer = await file.arrayBuffer();
    pdfDocProxy = await loadPdfJsDocument(activeBuffer);
    const count = pdfDocProxy.numPages;

    const initialPages = [];
    for (let i = 0; i < count; i++) {
      initialPages.push({
        id: `p_${i}_${Math.random().toString(36).substring(2, 7)}`,
        originalIndex: i,
        rotation: 0,
        thumbUrl: '',
        isSelected: false
      });
    }

    pages.value = initialPages;
    historyStack.value = [JSON.parse(JSON.stringify(initialPages))];
    historyIndex.value = 0;

    loadThumbnails();
  } catch (err) {
    showToast(t('common.loadFailed') + (err.message || ''), 'error');
    resetFile();
  }
}

async function loadThumbnails() {
  if (!pdfDocProxy) return;
  for (let i = 0; i < pages.value.length; i++) {
    const p = pages.value[i];
    if (p.thumbUrl) continue;
    try {
      const { canvas } = await renderPageToCanvas(pdfDocProxy, p.originalIndex + 1, 0.35);
      p.thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
    } catch (e) {
      // Ignored non-critical thumbnail error
    }
  }
}

function pushHistory() {
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }
  historyStack.value.push(JSON.parse(JSON.stringify(pages.value)));
  historyIndex.value++;
}

function undo() {
  if (canUndo.value) {
    historyIndex.value--;
    pages.value = JSON.parse(JSON.stringify(historyStack.value[historyIndex.value]));
  }
}

function redo() {
  if (canRedo.value) {
    historyIndex.value++;
    pages.value = JSON.parse(JSON.stringify(historyStack.value[historyIndex.value]));
  }
}

function rotatePage(idx) {
  pages.value[idx].rotation = (pages.value[idx].rotation + 90) % 360;
  pushHistory();
}

function rotateAll() {
  pages.value.forEach(p => p.rotation = (p.rotation + 90) % 360);
  pushHistory();
}

function deletePage(idx) {
  if (pages.value.length <= 1) {
    showToast(t('tools.organize.minPagesError'), 'error');
    return;
  }
  pages.value.splice(idx, 1);
  pushHistory();
}

function deleteSelected() {
  const remaining = pages.value.filter(p => !p.isSelected);
  if (remaining.length === 0) {
    showToast(t('tools.organize.minPagesError'), 'error');
    return;
  }
  pages.value = remaining;
  pushHistory();
}

function toggleSelect(idx) {
  pages.value[idx].isSelected = !pages.value[idx].isSelected;
}

function selectAll() {
  const target = selectedCount.value !== pages.value.length;
  pages.value.forEach(p => p.isSelected = target);
}

function onDragStart(idx) {
  draggedIdx = idx;
}

function onDrop(targetIdx) {
  if (draggedIdx === null || draggedIdx === targetIdx) return;
  const [moved] = pages.value.splice(draggedIdx, 1);
  pages.value.splice(targetIdx, 0, moved);
  draggedIdx = null;
  pushHistory();
}

function resetFile() {
  activeFile.value = null;
  activeBuffer = null;
  pdfDocProxy = null;
  pages.value = [];
  historyStack.value = [];
  historyIndex.value = -1;
}

async function handleSave() {
  if (!activeBuffer || pages.value.length === 0) return;
  isSaving.value = true;
  try {
    const configs = pages.value.map(p => ({
      originalIndex: p.originalIndex,
      rotation: p.rotation
    }));
    const resultBytes = await reorganizePdfPages(activeBuffer, configs);
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_organized.pdf`);
    showToast(t('tools.organize.successSaved'), 'success');
  } catch (err) {
    showToast(err.message || t('tools.organize.saveFailed'), 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.organize.title') }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.organize.desc') }}
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <OrganizeToolbar
        :can-undo="canUndo"
        :can-redo="canRedo"
        :selected-count="selectedCount"
        :total-count="pages.length"
        :is-saving="isSaving"
        @undo="undo"
        @redo="redo"
        @rotate-all="rotateAll"
        @select-all="selectAll"
        @delete-selected="deleteSelected"
        @reset-file="resetFile"
        @save="handleSave"
      />

      <!-- Grid of Pages -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <OrganizeCard
          v-for="(page, idx) in pages"
          :key="page.id"
          :page="page"
          :index="idx"
          @rotate="rotatePage"
          @delete="deletePage"
          @toggle-select="toggleSelect"
          @drag-start="onDragStart"
          @drop-page="onDrop"
        />
      </div>
    </div>
  </div>
</template>
