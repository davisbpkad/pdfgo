<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { downloadFile } from '../../../core/download.js';
import { buildScannedPdf } from '../logic/buildScannedPdf.js';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ScanUploadBar from './ScanUploadBar.vue';
import ScanPagesGrid from './ScanPagesGrid.vue';
import ScanCropModal from './ScanCropModal.vue';
import ScanResultCard from './ScanResultCard.vue';

const pages = ref([]);
const activeCropPage = ref(null);
const isProcessing = ref(false);
const progressVal = ref(0);
const scanResult = ref(null);

function handleFiles(files) {
  for (const f of files) {
    if (f.type.startsWith('image/')) {
      pages.value.push({
        id: Math.random().toString(36).slice(2),
        file: f,
        url: URL.createObjectURL(f),
        rotation: 0,
        filter: 'enhance',
        cropBox: { x: 0, y: 0, width: 1, height: 1 }
      });
    }
  }
}

function rotatePage(id) {
  const p = pages.value.find((i) => i.id === id);
  if (p) p.rotation = (p.rotation + 90) % 360;
}

function movePage(index, dir) {
  const target = index + dir;
  if (target < 0 || target >= pages.value.length) return;
  const temp = pages.value[index];
  pages.value[index] = pages.value[target];
  pages.value[target] = temp;
}

function removePage(id) {
  const idx = pages.value.findIndex((i) => i.id === id);
  if (idx !== -1) {
    URL.revokeObjectURL(pages.value[idx].url);
    pages.value.splice(idx, 1);
  }
}

async function handleBuildPdf() {
  if (pages.value.length === 0) return;
  isProcessing.value = true;
  progressVal.value = 10;
  try {
    const pdfBytes = await buildScannedPdf(pages.value, (pct) => {
      progressVal.value = pct;
    });
    scanResult.value = { pdfBytes, pageCount: pages.value.length };
    showToast(t('tools.scanToPdf.successTitle'), 'success');
  } catch (err) {
    showToast(t('tools.scanToPdf.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!scanResult.value) return;
  downloadFile(scanResult.value.pdfBytes, 'dokumen-pindai.pdf', 'application/pdf');
}

function resetState() {
  pages.value.forEach((p) => URL.revokeObjectURL(p.url));
  pages.value = [];
  activeCropPage.value = null;
  scanResult.value = null;
  isProcessing.value = false;
  progressVal.value = 0;
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.scanToPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.scanToPdf.desc') }}</p>
    </div>

    <ScanUploadBar @files="handleFiles" />

    <BaseProgressBar v-if="isProcessing" :progress="progressVal" label="Memproses dan mengoptimalkan hasil pindai..." />

    <ScanPagesGrid
      v-if="pages.length > 0 && !scanResult"
      :pages="pages"
      :loading="isProcessing"
      @rotate="rotatePage"
      @filter="(id, f) => { const p = pages.find(i => i.id === id); if (p) p.filter = f; }"
      @move="movePage"
      @crop="(id) => { activeCropPage = pages.find(i => i.id === id); }"
      @remove="removePage"
      @build="handleBuildPdf"
    />

    <ScanResultCard v-else-if="scanResult" :result="scanResult" @reset="resetState" @download="handleDownload" />

    <ScanCropModal
      v-if="activeCropPage"
      :page="activeCropPage"
      @apply="(box) => { activeCropPage.cropBox = box; activeCropPage = null; }"
      @close="activeCropPage = null"
    />
  </div>
</template>
