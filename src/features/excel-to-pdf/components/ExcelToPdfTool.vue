<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { downloadFile } from '../../../core/download.js';
import { renderGridToPdf } from '../logic/renderGridToPdf.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ExcelConfigCard from './ExcelConfigCard.vue';
import ExcelResultCard from './ExcelResultCard.vue';

const activeFile = ref(null);
const isProcessing = ref(false);
const progressVal = ref(0);
const pdfResult = ref(null);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => /\.(xlsx|xls|csv)$/i.test(i.name || ''));
  if (c?.file) loadDocument(c.file);
});

async function handleIncomingFiles(files) {
  const file = Array.from(files).find((f) => /\.(xlsx|xls|csv)$/i.test(f.name || ''));
  if (file) loadDocument(file);
}

function loadDocument(file) {
  resetState();
  activeFile.value = file;
}

async function handleConvert({ orientation }) {
  if (!activeFile.value) return;
  isProcessing.value = true;
  progressVal.value = 15;
  try {
    const buffer = await activeFile.value.arrayBuffer();
    pdfResult.value = await renderGridToPdf(buffer, {
      fileName: activeFile.value.name,
      orientation,
      onProgress: (pct) => {
        progressVal.value = pct;
      }
    });
    showToast(t('tools.excelToPdf.successTitle'), 'success');
  } catch (err) {
    showToast(t('tools.excelToPdf.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!pdfResult.value || !activeFile.value) return;
  const safe = activeFile.value.name.replace(/\.(xlsx|xls|csv)$/i, '');
  downloadFile(pdfResult.value.pdfBytes, `${safe}.pdf`, 'application/pdf');
}

function resetState() {
  activeFile.value = null;
  pdfResult.value = null;
  isProcessing.value = false;
  progressVal.value = 0;
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.excelToPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.excelToPdf.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" accept=".xlsx,.xls,.csv" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024).toFixed(1) }} KB</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">{{ t('common.changeFile') }}</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="progressVal" :label="t('tools.excelToPdf.progress')" />

      <ExcelConfigCard v-if="!pdfResult" :loading="isProcessing" @submit="handleConvert" />

      <ExcelResultCard v-else :result="pdfResult" @reset="resetState" @download="handleDownload" />
    </div>
  </div>
</template>
