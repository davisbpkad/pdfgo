<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { downloadFile } from '../../../core/download.js';
import { convertPdfToExcel } from '../logic/convertPdfToExcel.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ExcelExportConfigCard from './ExcelExportConfigCard.vue';
import ExcelExportResultCard from './ExcelExportResultCard.vue';

const activeFile = ref(null);
const isProcessing = ref(false);
const progressVal = ref(0);
const exportMode = ref('table');
const pageRange = ref('');
const excelResult = ref(null);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

function handleIncomingFiles(files) {
  const pdf = Array.from(files).find((f) => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) loadDocument(pdf);
}

function loadDocument(file) {
  resetState();
  activeFile.value = file;
}

async function handleConvert() {
  if (!activeFile.value) return;
  isProcessing.value = true;
  progressVal.value = 10;
  try {
    const buffer = await activeFile.value.arrayBuffer();
    excelResult.value = await convertPdfToExcel(buffer, {
      mode: exportMode.value,
      pageRange: pageRange.value,
      onProgress: (pct) => { progressVal.value = pct; }
    });
    showToast(t('pdfToExcel.successTitle'), 'success');
  } catch (err) {
    showToast(err.message || t('tools.pdfToExcel.exportFailed'), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!excelResult.value || !activeFile.value) return;
  const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  downloadFile(excelResult.value.xlsxBytes, `${safeName}.xlsx`, mime);
}

function resetState() {
  activeFile.value = null;
  excelResult.value = null;
  isProcessing.value = false;
  progressVal.value = 0;
  pageRange.value = '';
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('pdfToExcel.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('pdfToExcel.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" accept=".pdf" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024).toFixed(1) }} KB</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">{{ t('common.changeFile') }}</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="progressVal" :label="t('tools.pdfToExcel.progress')" />

      <ExcelExportConfigCard
        v-if="!excelResult"
        v-model:mode="exportMode"
        v-model:pageRange="pageRange"
        :is-processing="isProcessing"
        @convert="handleConvert"
      />

      <ExcelExportResultCard
        v-else
        :sheet-count="excelResult.sheetCount"
        :row-count="excelResult.rowCount"
        :file-name="activeFile.name.replace(/\.pdf$/i, '.xlsx')"
        @download="handleDownload"
        @reset="resetState"
      />
    </div>
  </div>
</template>
