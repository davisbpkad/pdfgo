<script setup>
import { onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { queueState } from '../../../app/providers/queue.js';
import { useAiSummary } from '../logic/useAiSummary.js';
import DropZone from '../../../ui/DropZone.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseProgressBar from '../../../ui/BaseProgressBar.vue';
import PromptBuilderCard from './PromptBuilderCard.vue';
import AiResultCard from './AiResultCard.vue';

const {
  activeFile, isExtracting, progressVal, extractedText,
  selectedTask, targetLanguage, customInstruction, pastedAiResult, isExporting,
  loadDocument, handleCopyPrompt, handleExportFormat, resetState
} = useAiSummary();

onMounted(() => {
  const c = queueState.value?.items?.find((i) => i.name?.toLowerCase().endsWith('.pdf'));
  if (c?.file) loadDocument(c.file);
});

function handleIncomingFiles(files) {
  const pdf = Array.from(files).find((f) => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) loadDocument(pdf);
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="font-display font-black text-2xl md:text-3xl text-ink uppercase tracking-tight">{{ t('tools.aiSummary.title') }}</h1>
      <p class="text-sm text-ink/80 max-w-2xl font-medium">{{ t('tools.aiSummary.desc') }}</p>
    </div>

    <DropZone v-if="!activeFile" accept=".pdf" @files="handleIncomingFiles" />

    <div v-else class="space-y-4">
      <BaseCard class="p-4 flex items-center justify-between border-2 border-ink bg-paper shadow-hard">
        <div class="min-w-0">
          <h3 class="font-bold text-sm text-ink truncate">{{ activeFile.name }}</h3>
          <p class="text-xs text-ink/70">{{ (activeFile.size / 1024).toFixed(1) }} KB &bull; {{ extractedText.length }} karakter diekstrak</p>
        </div>
        <button type="button" class="text-xs font-bold px-3 py-1.5 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer" @click="resetState">Ganti File</button>
      </BaseCard>

      <BaseProgressBar v-if="isExtracting" :progress="progressVal" label="Mengekstrak teks dokumen untuk prompt AI..." />

      <template v-else>
        <PromptBuilderCard
          :file-name="activeFile.name"
          :extracted-text="extractedText"
          v-model:task="selectedTask"
          v-model:target-lang="targetLanguage"
          v-model:custom-instruction="customInstruction"
          @copy="handleCopyPrompt"
        />

        <AiResultCard
          v-model:result-text="pastedAiResult"
          :is-exporting="isExporting"
          @export-format="handleExportFormat"
          @reset="resetState"
        />
      </template>
    </div>
  </div>
</template>
