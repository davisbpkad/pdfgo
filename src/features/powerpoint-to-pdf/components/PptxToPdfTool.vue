<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import { queueState } from '../../../app/providers/queue.js';
import { downloadFile } from '../../../core/download.js';
import { convertPptxToPdf } from '../logic/convertPptxToPdf.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import PptxToPdfResultCard from './PptxToPdfResultCard.vue';

const activeFile = ref(null);
const isProcessing = ref(false);
const progressVal = ref(0);
const pdfResult = ref(null);

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pptx'));
  if (c?.file) loadDocument(c.file);
});

async function handleIncomingFiles(files) {
  const pptx = Array.from(files).find((f) => f.name.toLowerCase().endsWith('.pptx'));
  if (pptx) loadDocument(pptx);
}

function loadDocument(file) {
  resetState();
  activeFile.value = file;
}

async function handleConvert() {
  if (!activeFile.value) return;
  isProcessing.value = true;
  progressVal.value = 15;
  try {
    const buffer = await activeFile.value.arrayBuffer();
    pdfResult.value = await convertPptxToPdf(buffer, {
      onProgress: (pct) => {
        progressVal.value = pct;
      }
    });
    showToast(t('tools.powerpointToPdf.successTitle'), 'success');
  } catch (err) {
    showToast(t('tools.powerpointToPdf.failed', { reason: err.message || '' }), 'error');
  } finally {
    isProcessing.value = false;
  }
}

function handleDownload() {
  if (!pdfResult.value || !activeFile.value) return;
  const safe = activeFile.value.name.replace(/\.pptx$/i, '');
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
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.powerpointToPdf.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.powerpointToPdf.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" accept=".pptx" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024).toFixed(1) }} KB</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">Ganti File</button>
      </BaseCard>

      <BaseProgressBar v-if="isProcessing" :progress="progressVal" label="Mengekstrak slide presentasi dan membuat halaman PDF..." />

      <div v-if="!pdfResult" class="space-y-4">
        <!-- Honest disclaimer card -->
        <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed">
          ℹ️ {{ t('tools.powerpointToPdf.disclaimer') }}
        </div>

        <div class="flex items-center justify-end pt-2">
          <BaseButton variant="primary" :loading="isProcessing" class="px-6 py-2.5 font-black text-xs" @click="handleConvert">
            📊 {{ t('tools.powerpointToPdf.actionBtn') }}
          </BaseButton>
        </div>
      </div>

      <PptxToPdfResultCard v-else :result="pdfResult" @reset="resetState" @download="handleDownload" />
    </div>
  </div>
</template>
