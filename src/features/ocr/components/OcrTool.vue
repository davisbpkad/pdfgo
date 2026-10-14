<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { ensureBuiltinModelsLoaded, getAvailableOcrLangs } from '../../../core/assets.js';
import { parsePageRange } from '../logic/parsePageRange.js';
import { runOcrPipeline } from '../logic/runOcrPipeline.js';
import { terminateOcrWorker } from '../logic/ocrWorkerManager.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import OcrModelStatusBar from './OcrModelStatusBar.vue';
import OcrConfigCard from './OcrConfigCard.vue';
import OcrResultsCard from './OcrResultsCard.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);

const availableLangs = ref([]);
const isFullVariant = typeof window !== 'undefined' && !!window.__OCR_FULL_ENG_GZ_BASE64__;
const selectedLang = ref('ind');
const pageMode = ref('all');
const customRange = ref('');
const targetDpi = ref(300);

const isProcessing = ref(false);
const progressValue = ref(0);
const progressLabel = ref('Memproses OCR...');
const cancelRef = ref({ value: false });

const lastOcrResults = ref(null);
let lastSearchablePdfBytes = null;

onMounted(async () => {
  await ensureBuiltinModelsLoaded();
  await refreshLangs();

  if (queueState.value?.items?.length) {
    const candidate = queueState.value.items.find(i => i.name?.toLowerCase().endsWith('.pdf'));
    if (candidate?.file) loadDocument(candidate.file);
  }
});

async function refreshLangs() {
  const langs = await getAvailableOcrLangs();
  availableLangs.value = langs;
  if (langs.includes('ind')) selectedLang.value = 'ind';
  else if (langs.includes('eng')) selectedLang.value = 'eng';
}

async function handleIncomingFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) await loadDocument(pdf);
}

async function loadDocument(file) {
  activeFile.value = file;
  lastOcrResults.value = null;
  lastSearchablePdfBytes = null;

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    const doc = await loadPdfJsDocument(buffer);
    pdfDocProxy.value = doc;
    totalPages.value = doc.numPages;
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
  lastOcrResults.value = null;
  lastSearchablePdfBytes = null;
}

function cancelOcr() {
  cancelRef.value.value = true;
  isProcessing.value = false;
  terminateOcrWorker();
  showToast('Proses OCR dibatalkan.', 'info');
}

async function handleStartOcr() {
  if (!activeBuffer || !pdfDocProxy.value) return;

  const targetPages = pageMode.value === 'all'
    ? Array.from({ length: totalPages.value }, (_, i) => i)
    : parsePageRange(customRange.value, totalPages.value);

  if (targetPages.length === 0) {
    showToast('Pilihan rentang halaman tidak valid.', 'error');
    return;
  }

  isProcessing.value = true;
  progressValue.value = 5;
  cancelRef.value.value = false;

  try {
    const safeBytes = new Uint8Array(activeBuffer.slice(0));
    const { textReport, searchablePdfBytes } = await runOcrPipeline(
      pdfDocProxy.value,
      targetPages,
      selectedLang.value,
      targetDpi.value,
      safeBytes,
      (current, total, pct) => {
        progressValue.value = pct;
        progressLabel.value = `Mengenali teks halaman ${current} dari ${total} (${pct}%)...`;
      },
      cancelRef.value
    );

    lastOcrResults.value = textReport;
    lastSearchablePdfBytes = searchablePdfBytes;
    showToast('Pengenalan teks selesai!', 'success');
  } catch (err) {
    if (!cancelRef.value.value) {
      showToast('Gagal memproses OCR: ' + (err.message || ''), 'error');
    }
  } finally {
    isProcessing.value = false;
  }
}

function handleDownloadPdf() {
  if (!lastSearchablePdfBytes || !activeFile.value) return;
  const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
  downloadFile(lastSearchablePdfBytes, `${safeName}_searchable.pdf`, 'application/pdf');
  showToast('PDF Searchable berhasil diunduh!', 'success');
}

function handleDownloadTxt() {
  if (!lastOcrResults.value?.fullText || !activeFile.value) return;
  const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
  const blob = new Blob([lastOcrResults.value.fullText], { type: 'text/plain;charset=utf-8' });
  downloadFile(blob, `${safeName}_ocr.txt`, 'text/plain');
  showToast('File teks berhasil diunduh!', 'success');
}

function handleCopyText() {
  if (!lastOcrResults.value?.fullText) return;
  navigator.clipboard.writeText(lastOcrResults.value.fullText).then(() => {
    showToast('Teks berhasil disalin ke clipboard!', 'success');
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Pengenalan Teks (OCR)
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Ubah dokumen hasil scan atau gambar menjadi PDF yang dapat dicari (Searchable PDF) serta ekspor teks murni secara 100% luring.
      </p>
    </div>

    <!-- OCR Model Status Header Bar -->
    <OcrModelStatusBar
      :available-langs="availableLangs"
      :is-full-variant="isFullVariant"
      @model-imported="refreshLangs"
    />

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

      <div v-if="isProcessing" class="space-y-2">
        <BaseProgressBar :progress="progressValue" :label="progressLabel" />
        <div class="flex justify-end">
          <button
            type="button"
            class="text-xs font-bold px-3 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
            @click="cancelOcr"
          >
            Batalkan Proses
          </button>
        </div>
      </div>

      <OcrConfigCard
        v-if="!isProcessing"
        v-model:selected-lang="selectedLang"
        v-model:page-mode="pageMode"
        v-model:custom-range="customRange"
        v-model:target-dpi="targetDpi"
        :available-langs="availableLangs"
        :total-pages="totalPages"
        :is-processing="isProcessing"
        @start="handleStartOcr"
      />

      <OcrResultsCard
        v-if="lastOcrResults"
        :results="lastOcrResults"
        :has-searchable-pdf="Boolean(lastSearchablePdfBytes)"
        @download-pdf="handleDownloadPdf"
        @download-txt="handleDownloadTxt"
        @copy-text="handleCopyText"
      />
    </div>
  </div>
</template>
