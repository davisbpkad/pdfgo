<script setup>
import { ref, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { createZipArchive } from '../../../core/zip.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { parsePageRange } from '../../split/logic/parsePageRange.js';
import { convertPdfToImages } from '../logic/convertPdfToImages.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import PdfToImageSettings from './PdfToImageSettings.vue';

const activeFile = ref(null);
let pdfDocProxy = null;
const totalPages = ref(0);

const format = ref('png');
const dpiScale = ref(2.08);
const quality = ref(85);
const pageRangeChoice = ref('all');
const customRange = ref('1');

const isConverting = ref(false);
const progressValue = ref(0);
const progressStatusText = ref('');

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
    const buffer = await file.arrayBuffer();
    pdfDocProxy = await loadPdfJsDocument(buffer);
    totalPages.value = pdfDocProxy.numPages;
    customRange.value = `1-${Math.min(5, totalPages.value)}`;
  } catch (err) {
    showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
    resetFile();
  }
}

function resetFile() {
  activeFile.value = null;
  pdfDocProxy = null;
  totalPages.value = 0;
}

async function handleConvert() {
  if (!pdfDocProxy || !activeFile.value) return;

  let pageNumbers = [];
  if (pageRangeChoice.value === 'custom') {
    pageNumbers = parsePageRange(customRange.value, totalPages.value);
    if (pageNumbers.length === 0) {
      showToast('Rentang halaman tidak valid.', 'error');
      return;
    }
  }

  isConverting.value = true;
  progressValue.value = 5;
  progressStatusText.value = 'Mempersiapkan ekstraksi gambar...';

  try {
    const baseName = activeFile.value.name.replace(/\.pdf$/i, '');
    const images = await convertPdfToImages(
      pdfDocProxy,
      {
        format: format.value,
        scale: dpiScale.value,
        quality: quality.value / 100,
        pageNumbers,
        baseName
      },
      (pct, cur, total) => {
        progressValue.value = pct;
        progressStatusText.value = `Mengonversi halaman ${cur} dari ${total}...`;
      }
    );

    if (images.length === 1) {
      downloadFile(images[0].data, images[0].name, images[0].data.type);
    } else {
      const zipBlob = await createZipArchive(images);
      downloadFile(zipBlob, `${baseName}_gambar_ZIP.zip`, 'application/zip');
    }

    showToast(`Berhasil mengekstrak ${images.length} gambar!`, 'success');
  } catch (err) {
    showToast(err.message || 'Gagal mengonversi ke gambar', 'error');
  } finally {
    isConverting.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        PDF ke Gambar
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Ubah tiap halaman dokumen PDF menjadi berkas gambar PNG atau JPEG berkualitas tinggi.
      </p>
    </div>

    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <div v-else class="space-y-6">
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

      <PdfToImageSettings
        v-model:format="format"
        v-model:dpi-scale="dpiScale"
        v-model:quality="quality"
        v-model:page-range-choice="pageRangeChoice"
        v-model:custom-range="customRange"
        :total-pages="totalPages"
      />

      <BaseProgressBar
        v-if="isConverting"
        :progress="progressValue"
        :label="progressStatusText"
      />

      <div class="flex justify-end pt-2">
        <BaseButton
          variant="primary"
          class="text-base py-3 px-8 w-full sm:w-auto"
          :disabled="isConverting"
          :loading="isConverting"
          @click="handleConvert"
        >
          Ekstrak Gambar Sekarang
        </BaseButton>
      </div>
    </div>
  </div>
</template>
