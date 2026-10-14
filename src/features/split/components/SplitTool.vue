<script setup>
import { ref, onMounted } from 'vue';
import { loadPdfJsDocument, generateThumbnail } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { createZipArchive } from '../../../core/zip.js';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { parsePageRange } from '../logic/parsePageRange.js';
import { extractPages } from '../logic/extractPages.js';
import { splitEveryN } from '../logic/splitEveryN.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import SplitConfig from './SplitConfig.vue';

const activeFile = ref(null);
const activeThumbnail = ref('');
const totalPages = ref(0);
const splitMode = ref('range');
const rangeString = ref('1');
const nPages = ref(1);
const isProcessing = ref(false);
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
  try {
    const buffer = await file.arrayBuffer();
    const docProxy = await loadPdfJsDocument(buffer);
    totalPages.value = docProxy.numPages;
    activeThumbnail.value = await generateThumbnail(docProxy, 140);
    rangeString.value = totalPages.value > 1 ? `1-${Math.min(3, totalPages.value)}` : '1';
    nPages.value = 1;
  } catch (err) {
    showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
    activeFile.value = null;
  }
}

function resetFile() {
  activeFile.value = null;
  activeThumbnail.value = '';
  totalPages.value = 0;
}

async function handleProcess() {
  if (!activeFile.value || totalPages.value === 0) return;
  isProcessing.value = true;
  progressValue.value = 10;

  try {
    const buffer = await activeFile.value.arrayBuffer();
    if (splitMode.value === 'range') {
      const pageNumbers = parsePageRange(rangeString.value, totalPages.value);
      if (pageNumbers.length === 0) throw new Error(t('tools.split.invalidRange') || 'Pilihan halaman tidak valid');

      progressValue.value = 50;
      const resultBytes = await extractPages(buffer, pageNumbers);
      progressValue.value = 100;

      const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
      const rangeTag = rangeString.value.replace(/[^0-9a-zA-Z-]/g, '_');
      downloadFile(resultBytes, `${safeName}_hal_${rangeTag}.pdf`);
      showToast(t('tools.split.successPdf') || 'Halaman terpilih berhasil diekstrak.', 'success');
    } else {
      const n = Math.max(1, parseInt(nPages.value, 10) || 1);
      const chunks = await splitEveryN(buffer, n, '', (pct) => {
        progressValue.value = pct;
      });

      if (chunks.length === 1) {
        downloadFile(chunks[0].data, chunks[0].name);
      } else {
        const zipBlob = await createZipArchive(chunks);
        const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
        downloadFile(zipBlob, `${safeName}_split_ZIP.zip`, 'application/zip');
      }
      showToast(t('tools.split.successZip', { count: chunks.length }) || `Berhasil memisahkan ${chunks.length} berkas.`, 'success');
    }
  } catch (err) {
    showToast(err.message || 'Gagal memproses split', 'error');
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Tool -->
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        {{ t('tools.split.title') || 'Pisah PDF' }}
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        {{ t('tools.split.desc') || 'Ekstrak rentang halaman tertentu atau pisahkan dokumen PDF menjadi berkas-berkas terpisah.' }}
      </p>
    </div>

    <!-- DropZone if no file loaded -->
    <DropZone v-if="!activeFile" @files="handleIncomingFiles" />

    <!-- File Workspace if file loaded -->
    <div v-else class="space-y-6">
      <!-- File Summary Card -->
      <BaseCard class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <div class="w-14 h-18 bg-paper-dark border-2 border-ink flex items-center justify-center shrink-0 overflow-hidden shadow-hard-sm">
            <img v-if="activeThumbnail" :src="activeThumbnail" alt="Thumbnail" class="w-full h-full object-cover" />
            <span v-else class="text-xs font-black">PDF</span>
          </div>
          <div class="min-w-0">
            <h3 class="font-bold text-base text-ink truncate">{{ activeFile.name }}</h3>
            <p class="text-xs text-ink/70 font-medium">
              {{ totalPages }} halaman • {{ (activeFile.size / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>
        </div>

        <button
          type="button"
          class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer whitespace-nowrap"
          @click="resetFile"
        >
          Ganti Dokumen
        </button>
      </BaseCard>

      <!-- Split Configuration -->
      <SplitConfig
        v-model:mode="splitMode"
        v-model:range-string="rangeString"
        v-model:n-pages="nPages"
        :total-pages="totalPages"
      />

      <!-- Progress Bar -->
      <BaseProgressBar
        v-if="isProcessing"
        :progress="progressValue"
        label="Memisahkan halaman dokumen..."
      />

      <!-- Action Button -->
      <div class="flex justify-end pt-2">
        <BaseButton
          variant="primary"
          class="text-base py-3 px-8 w-full sm:w-auto"
          :disabled="isProcessing"
          :loading="isProcessing"
          @click="handleProcess"
        >
          Pisahkan sekarang
        </BaseButton>
      </div>
    </div>
  </div>
</template>
