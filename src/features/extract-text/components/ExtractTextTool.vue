<script setup>
import { ref, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { activeToolId } from '../../../app/router.js';
import { extractTextContent } from '../logic/extractTextContent.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import ExtractStatsBar from './ExtractStatsBar.vue';
import ExtractScannedBanner from './ExtractScannedBanner.vue';

const activeFile = ref(null);
let pdfDocProxy = null;
const totalPages = ref(0);

const extractedData = ref(null);
const editableText = ref('');
const includeSeparators = ref(true);
const isExtracting = ref(false);
const progressValue = ref(0);

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
  isExtracting.value = true;
  progressValue.value = 10;
  extractedData.value = null;

  try {
    const buffer = await file.arrayBuffer();
    pdfDocProxy = await loadPdfJsDocument(buffer);
    totalPages.value = pdfDocProxy.numPages;

    const data = await extractTextContent(pdfDocProxy, includeSeparators.value, (pct) => {
      progressValue.value = pct;
    });

    extractedData.value = data;
    editableText.value = data.fullText;
  } catch (err) {
    showToast('Gagal mengekstrak teks: ' + (err.message || ''), 'error');
    resetFile();
  } finally {
    isExtracting.value = false;
  }
}

async function onSeparatorsChange(val) {
  includeSeparators.value = val;
  if (pdfDocProxy) {
    isExtracting.value = true;
    const data = await extractTextContent(pdfDocProxy, val);
    extractedData.value = data;
    editableText.value = data.fullText;
    isExtracting.value = false;
  }
}

function resetFile() {
  activeFile.value = null;
  pdfDocProxy = null;
  totalPages.value = 0;
  extractedData.value = null;
  editableText.value = '';
}

function handleCopy() {
  if (!editableText.value) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(editableText.value).then(() => {
      showToast('Teks berhasil disalin ke clipboard!', 'success');
    });
  }
}

function handleDownloadTxt() {
  if (!editableText.value || !activeFile.value) return;
  const blob = new Blob([editableText.value], { type: 'text/plain;charset=utf-8' });
  const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
  downloadFile(blob, `${safeName}_teks.txt`, 'text/plain');
  showToast('File teks berhasil diunduh!', 'success');
}

function openOcr() {
  activeToolId.value = 'ocr';
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Ekstrak Teks
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Ekstrak isi teks dari dokumen PDF secara instan ke format teks murni (.TXT) yang dapat disalin dan diedit.
      </p>
    </div>

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

      <BaseProgressBar v-if="isExtracting" :progress="progressValue" label="Mengekstrak teks dokumen..." />

      <template v-if="extractedData">
        <ExtractScannedBanner
          :is-scanned="extractedData.isScanned"
          @open-ocr="openOcr"
        />

        <ExtractStatsBar
          :word-count="extractedData.wordCount"
          :char-count="extractedData.charCount"
          :page-count="extractedData.pageTexts.length"
          :include-separators="includeSeparators"
          @update:include-separators="onSeparatorsChange"
        />

        <textarea
          v-model="editableText"
          rows="14"
          spellcheck="false"
          class="w-full p-4 border-3 border-ink bg-paper text-ink font-mono text-xs leading-relaxed focus:outline-none shadow-hard-sm"
          placeholder="Hasil ekstraksi teks akan muncul di sini..."
        />

        <div class="flex justify-end gap-3 pt-1">
          <BaseButton variant="secondary" class="text-xs py-2 px-4" @click="handleCopy">
            📋 Salin Teks
          </BaseButton>

          <BaseButton variant="primary" class="text-xs py-2 px-6" @click="handleDownloadTxt">
            💾 Unduh Berkas .TXT
          </BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>
