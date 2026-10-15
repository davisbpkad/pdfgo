<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { docxToHtml } from '../logic/docxToHtml.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import DocxPreviewCard from './DocxPreviewCard.vue';

const activeFile = ref(null);
const isProcessing = ref(false);
const convertedHtml = ref('');

onMounted(() => {
  const c = queueState.value?.items?.find((i) => /\.(docx|doc)$/i.test(i.name || ''));
  if (c?.file) loadDocument(c.file);
});

async function handleIncomingFiles(files) {
  const file = Array.from(files).find((f) => /\.(docx|doc)$/i.test(f.name || ''));
  if (file) loadDocument(file);
}

async function loadDocument(file) {
  resetState();
  activeFile.value = file;
  isProcessing.value = true;
  try {
    const buffer = await file.arrayBuffer();
    const { html } = await docxToHtml(buffer);
    convertedHtml.value = html;
    showToast(t('tools.wordToPdf.successToast'), 'success');
  } catch (err) {
    showToast(t('tools.wordToPdf.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function resetState() {
  activeFile.value = null;
  convertedHtml.value = '';
  isProcessing.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.wordToPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.wordToPdf.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" accept=".docx,.doc" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024).toFixed(1) }} KB</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">Ganti File</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="60" label="Membaca format DOCX dan mengonversi ke HTML..." />

      <DocxPreviewCard v-else-if="convertedHtml" :html="convertedHtml" @reset="resetState" />
    </div>
  </div>
</template>
