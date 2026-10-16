<script setup>
import { ref, shallowRef, onMounted } from 'vue';
import { loadPdfJsDocument } from '../../../core/pdf.js';
import { downloadFile } from '../../../core/download.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { applyPageNumbers } from '../logic/applyPageNumbers.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import PageNumbersForm from './PageNumbersForm.vue';
import PageNumbersPreview from './PageNumbersPreview.vue';

const activeFile = ref(null);
let activeBuffer = null;
const pdfDocProxy = shallowRef(null);
const totalPages = ref(0);

const format = ref('Halaman {n} dari {total}');
const position = ref('bottom-center');
const startNumber = ref(1);
const margin = ref(25);
const fontSize = ref(10);
const colorHex = ref('#475569');
const skipFirstPage = ref(false);

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
  try {
    activeBuffer = await file.arrayBuffer();
    pdfDocProxy.value = await loadPdfJsDocument(activeBuffer);
    totalPages.value = pdfDocProxy.value.numPages;
    // Publish the file only once it opened, so the action button cannot be
    // clicked (and silently ignored) while the document is still loading.
    activeFile.value = file;
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
}

async function handleApply() {
  if (!activeBuffer || !activeFile.value) return;
  isProcessing.value = true;
  progressValue.value = 10;

  try {
    const resultBytes = await applyPageNumbers(activeBuffer, {
      format: format.value,
      position: position.value,
      startNumber: startNumber.value,
      margin: margin.value,
      fontSize: fontSize.value,
      colorHex: colorHex.value,
      skipFirstPage: skipFirstPage.value
    }, (pct) => {
      progressValue.value = pct;
    });

    const safeName = activeFile.value.name.replace(/\.pdf$/i, '');
    downloadFile(resultBytes, `${safeName}_numbered.pdf`);
    showToast('Nomor halaman berhasil diterapkan!', 'success');
  } catch (err) {
    showToast(err.message || 'Gagal menambahkan nomor halaman', 'error');
  } finally {
    isProcessing.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">
        Nomor Halaman
      </h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">
        Beri nomor halaman otomatis dengan format fleksibel, posisi 9 titik, dan opsi lewati sampul.
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PageNumbersForm
          v-model:format="format"
          v-model:position="position"
          v-model:start-number="startNumber"
          v-model:margin="margin"
          v-model:font-size="fontSize"
          v-model:color-hex="colorHex"
          v-model:skip-first-page="skipFirstPage"
        />

        <PageNumbersPreview
          :pdf-doc-proxy="pdfDocProxy"
          :format="format"
          :position="position"
          :start-number="startNumber"
          :margin="margin"
          :font-size="fontSize"
          :color-hex="colorHex"
          :skip-first-page="skipFirstPage"
          :total-pages="totalPages"
        />
      </div>

      <BaseProgressBar v-if="isProcessing" :progress="progressValue" label="Menambahkan nomor halaman..." />

      <div class="flex justify-end pt-2">
        <BaseButton
          variant="primary"
          class="text-base py-3 px-8 w-full sm:w-auto"
          :disabled="isProcessing"
          :loading="isProcessing"
          @click="handleApply"
        >
          Terapkan Nomor Halaman
        </BaseButton>
      </div>
    </div>
  </div>
</template>
