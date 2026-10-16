<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { useOverlayObjects } from '../logic/useOverlayObjects.js';
import { useTextEdits } from '../logic/useTextEdits.js';
import { renderOverlayToPdf } from '../logic/renderOverlayToPdf.js';
import { renderTextEditsToPdf } from '../logic/renderTextEditsToPdf.js';
import DropZone from '../../../ui/DropZone.vue';
import PreviewViewport from '../../../ui/PreviewViewport.vue';
import EditHeaderBar from './EditHeaderBar.vue';
import EditToolbar from './EditToolbar.vue';
import EditObjectList from './EditObjectList.vue';
import EditCanvas from './EditCanvas.vue';

const activeFile = ref(null);
let rawBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);
const currentPage = ref(1);
const isDrawMode = ref(false);
const isTextMode = ref(false);
const isSaving = ref(false);

const {
  objectsByPage, selectedObjectId, currentObjects, selectedObject,
  canUndo, canRedo, addObject, updateObject, removeObject, undo, redo, reset
} = useOverlayObjects(currentPage);

const {
  editsByPage, currentEdits, changedCount, setText, snapshot: snapshotText, reset: resetTextEdits, clear: clearTextEdits
} = useTextEdits(currentPage, pdfDocProxy);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

async function loadDocument(file) {
  activeFile.value = file;
  rawBuffer = await file.arrayBuffer();
  const rawDoc = await loadPdfJsDocument(new Uint8Array(rawBuffer));
  pdfDocProxy.value = unwrapPdfProxy(rawDoc);
  totalPages.value = pdfDocProxy.value.numPages;
  currentPage.value = 1;
  reset();
  clearTextEdits();
}

async function handleSave() {
  if (!rawBuffer) return;
  isSaving.value = true;
  try {
    const textResult = await renderTextEditsToPdf(rawBuffer, editsByPage.value);
    const { pdfBytes } = await renderOverlayToPdf(textResult.pdfBytes, objectsByPage.value);
    const safe = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(pdfBytes, `${safe}-edit.pdf`, 'application/pdf');
    showToast(t('tools.editPdf.successTitle'), 'success');
    if (textResult.skippedCount > 0) {
      showToast(`${textResult.skippedCount} edit dilewati: teks mengandung karakter yang tidak didukung font PDF.`, 'error');
    }
  } catch (err) {
    showToast(t('tools.editPdf.failed', { reason: err.message || '' }), 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.editPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.editPdf.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" @files="(f) => loadDocument(f[0])" />

    <div v-else class="space-y-4">
      <EditHeaderBar
        :file-name="activeFile.name" :current-page="currentPage" :total-pages="totalPages" :is-saving="isSaving"
        @prev-page="currentPage--" @next-page="currentPage++" @save="handleSave" @change-file="activeFile = null"
      />

      <EditToolbar
        :is-draw-mode="isDrawMode"
        :is-text-mode="isTextMode"
        :changed-count="changedCount"
        @add-object="addObject"
        @toggle-draw-mode="isDrawMode = !isDrawMode"
        @toggle-text-mode="isTextMode = !isTextMode"
        @reset-text="resetTextEdits"
        @upload-image="(url) => addObject('image', { dataUrl: url })"
      />

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        <div class="lg:col-span-3">
          <PreviewViewport v-slot="{ effectiveScale }">
            <EditCanvas
              :pdf-doc-proxy="pdfDocProxy" :current-page="currentPage" :objects="currentObjects"
              :text-edits="currentEdits"
              :selected-object-id="selectedObjectId" :scale="effectiveScale" :is-draw-mode="isDrawMode"
              :is-text-mode="isTextMode"
              @add-object="addObject" @update-object="updateObject" @remove-object="removeObject" @select-object="selectedObjectId = $event"
              @update-text="setText" @start-edit="snapshotText"
            />
          </PreviewViewport>
        </div>
        <div class="lg:col-span-1">
          <EditObjectList
            :objects="currentObjects" :selected-object="selectedObject" :can-undo="canUndo"
            :can-redo="canRedo" @update="updateObject" @remove="removeObject" @undo="undo" @redo="redo"
          />
        </div>
      </div>
    </div>
  </div>
</template>
