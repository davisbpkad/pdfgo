<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { useTextEdits } from '../logic/useTextEdits.js';
import { renderTextEditsToPdf } from '../logic/renderTextEditsToPdf.js';
import DropZone from '../../../ui/DropZone.vue';
import PreviewViewport from '../../../ui/PreviewViewport.vue';
import EditHeaderBar from './EditHeaderBar.vue';
import EditToolbar from './EditToolbar.vue';
import EditCanvas from './EditCanvas.vue';

const activeFile = ref(null);
let rawBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);
const currentPage = ref(1);
const isSaving = ref(false);

const {
  editsByPage, currentEdits, changedCount, setText, snapshot: snapshotText, reset: resetTextEdits, clear: clearTextEdits
} = useTextEdits(currentPage, pdfDocProxy);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

async function loadDocument(file) {
  try {
    const buffer = await file.arrayBuffer();
    const rawDoc = await loadPdfJsDocument(new Uint8Array(buffer));
    rawBuffer = buffer;
    pdfDocProxy.value = unwrapPdfProxy(rawDoc);
    totalPages.value = pdfDocProxy.value.numPages;
    currentPage.value = 1;
    activeFile.value = file;
    clearTextEdits();
  } catch (err) {
    // A file that is not a real PDF must not leave the tool in a half-loaded state.
    rawBuffer = null;
    pdfDocProxy.value = null;
    activeFile.value = null;
    showToast(t('tools.editPdf.openFailed', { reason: err.message || '' }), 'error');
  }
}

async function handleSave() {
  if (!rawBuffer) return;
  isSaving.value = true;
  try {
    const textResult = await renderTextEditsToPdf(rawBuffer, editsByPage.value);
    const safe = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(textResult.pdfBytes, `${safe}-edit.pdf`, 'application/pdf');
    showToast(t('tools.editPdf.successTitle'), 'success');
    if (textResult.skippedCount > 0) {
      showToast(t('tools.editPdf.skippedToast', { count: textResult.skippedCount }), 'error');
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

      <EditToolbar :changed-count="changedCount" @reset-text="resetTextEdits" />

      <PreviewViewport v-slot="{ effectiveScale }">
        <EditCanvas
          :pdf-doc-proxy="pdfDocProxy" :current-page="currentPage"
          :text-edits="currentEdits" :scale="effectiveScale"
          @update-text="setText" @start-edit="snapshotText"
        />
      </PreviewViewport>
    </div>
  </div>
</template>
