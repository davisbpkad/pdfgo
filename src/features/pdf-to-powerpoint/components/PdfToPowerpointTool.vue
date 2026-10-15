<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { downloadFile } from '../../../core/download.js';
import { convertPdfToPptx } from '../logic/convertPdfToPptx.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import PptxConfigCard from './PptxConfigCard.vue';
import PptxResultCard from './PptxResultCard.vue';

const activeFile = ref(null);
const isProcessing = ref(false);
const progressVal = ref(0);
const pptxResult = ref(null);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find((f) => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) loadDocument(pdf);
}

function loadDocument(file) {
  resetState();
  activeFile.value = file;
}

async function handleConvert({ pageSelection, quality }) {
  if (!activeFile.value) return;
  isProcessing.value = true;
  progressVal.value = 10;
  try {
    const buffer = await activeFile.value.arrayBuffer();
    pptxResult.value = await convertPdfToPptx(buffer, {
      pageSelection,
      quality,
      onProgress: (pct) => {
        progressVal.value = pct;
      }
    });
    showToast(t('tools.pdfToPowerpoint.successTitle'), 'success');
  } catch (err) {
    showToast(t('tools.pdfToPowerpoint.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!pptxResult.value || !activeFile.value) return;
  const safe = activeFile.value.name.replace(/\.pdf$/i, '');
  downloadFile(
    pptxResult.value.pptxBytes,
    `${safe}.pptx`,
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  );
}

function resetState() {
  activeFile.value = null;
  pptxResult.value = null;
  isProcessing.value = false;
  progressVal.value = 0;
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.pdfToPowerpoint.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.pdfToPowerpoint.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">Ganti File</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="progressVal" label="Mengonversi halaman PDF menjadi slide presentasi..." />

      <PptxConfigCard v-if="!pptxResult" :loading="isProcessing" @submit="handleConvert" />

      <PptxResultCard v-else :result="pptxResult" @reset="resetState" @download="handleDownload" />
    </div>
  </div>
</template>
