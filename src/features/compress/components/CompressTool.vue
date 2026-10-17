<script setup>
import { ref, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { compressPdfDocument } from '../logic/compressPdfDocument.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import CompressPresets from './CompressPresets.vue';
import CompressScorecard from './CompressScorecard.vue';

const activeFile = ref(null);
let activeBuffer = null;
let pdfDocProxy = null;
const totalPages = ref(0);

const selectedPreset = ref('balanced');
const isCompressing = ref(false);
const progressValue = ref(0);
const progressStatusText = ref('');
const compressionResult = ref(null);

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
  compressionResult.value = null;
  try {
    activeBuffer = await file.arrayBuffer();
    pdfDocProxy = await loadPdfJsDocument(activeBuffer);
    totalPages.value = pdfDocProxy.numPages;
    // Publish the file only once it opened, so "Kompres Sekarang" cannot be
    // clicked (and silently ignored) while the document is still loading.
    activeFile.value = file;
  } catch (err) {
    showToast(t('common.loadFailed') + (err.message || ''), 'error');
    resetFile();
  }
}

function resetFile() {
  activeFile.value = null;
  activeBuffer = null;
  pdfDocProxy = null;
  totalPages.value = 0;
  compressionResult.value = null;
}

async function handleCompress() {
  if (!pdfDocProxy || !activeBuffer || !activeFile.value) return;

  isCompressing.value = true;
  progressValue.value = 5;
  progressStatusText.value = t('tools.compress.preparing');
  compressionResult.value = null;

  let dpiScale = 1.5;
  let quality = 0.70;

  if (selectedPreset.value === 'low') {
    dpiScale = 2.0;
    quality = 0.85;
  } else if (selectedPreset.value === 'high') {
    dpiScale = 1.0;
    quality = 0.50;
  }

  try {
    const result = await compressPdfDocument(
      activeBuffer,
      pdfDocProxy,
      { dpiScale, quality },
      (pct, cur, total) => {
        progressValue.value = pct;
        progressStatusText.value = t('tools.compress.compressingPage', { current: cur, total });
      }
    );

    compressionResult.value = result;
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(result.bytes, `${safeName}_compressed.pdf`);

    if (result.reductionRate > 0) {
      showToast(`t('tools.compress.successReduction', { pct: result.reductionRate })`, 'success');
    } else {
      showToast(t('tools.compress.alreadyOptimal'), 'info');
    }
  } catch (err) {
    showToast(err.message || t('tools.compress.failed'), 'error');
  } finally {
    isCompressing.value = false;
  }
}

function downloadAgain() {
  if (compressionResult.value?.bytes && activeFile.value) {
    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(compressionResult.value.bytes, `${safeName}_compressed.pdf`);
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.compress.title') }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.compress.desc') }}
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-6">
      <BaseCard class="p-3 flex items-center justify-between">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ t('common.pagesCount', { count: totalPages }) }} • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB</p>
        </div>
        <button
          type="button"
          class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
          @click="resetFile"
        >
          {{ t('common.changeFile') }}
        </button>
      </BaseCard>

      <CompressPresets v-model="selectedPreset" />

      <BaseProgressBar
        v-if="isCompressing"
        :progress="progressValue"
        :label="progressStatusText"
      />

      <CompressScorecard
        v-if="compressionResult"
        :result="compressionResult"
        @download-again="downloadAgain"
      />

      <div class="flex justify-end pt-2">
        <BaseButton
          variant="primary"
          class="text-base py-3 px-8 w-full sm:w-auto"
          :disabled="isCompressing"
          :loading="isCompressing"
          @click="handleCompress"
        >
          {{ t('tools.compress.actionCompress') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
