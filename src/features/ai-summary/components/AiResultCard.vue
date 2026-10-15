<script setup>
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  resultText: { type: String, default: '' },
  isExporting: { type: Boolean, default: false }
});

const emit = defineEmits(['update:resultText', 'export-format', 'reset']);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-5 shadow-hard rounded-sm space-y-4">
    <div class="space-y-1">
      <h3 class="font-display font-black text-base uppercase text-ink">
        {{ t('tools.aiSummary.step2Title') }}
      </h3>
      <p class="text-xs text-ink/75">
        {{ t('tools.aiSummary.step2Desc') }}
      </p>
    </div>

    <!-- Paste Textarea -->
    <textarea
      :value="resultText"
      rows="7"
      :placeholder="t('tools.aiSummary.pastePlaceholder')"
      class="w-full border-2 border-ink bg-white p-3 text-xs font-sans rounded-sm focus:outline-none focus:ring-2 focus:ring-accent"
      @input="emit('update:resultText', $event.target.value)"
    />

    <!-- Offline Privacy Notice -->
    <div class="border-2 border-ink bg-green-100 p-3 rounded-sm text-xs text-ink flex gap-2 items-start">
      <span class="font-bold">🛡️</span>
      <span>{{ t('tools.aiSummary.offlineNotice') }}</span>
    </div>

    <!-- Export Action Buttons -->
    <div class="flex flex-wrap items-center gap-2 pt-1">
      <button
        type="button"
        :disabled="!resultText.trim() || isExporting"
        class="flex-1 py-2.5 px-3 border-2 border-ink bg-accent font-display font-black text-xs uppercase rounded-sm shadow-hard-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        @click="emit('export-format', 'md')"
      >
        💾 {{ t('tools.aiSummary.exportMd') }}
      </button>

      <button
        type="button"
        :disabled="!resultText.trim() || isExporting"
        class="flex-1 py-2.5 px-3 border-2 border-ink bg-accent font-display font-black text-xs uppercase rounded-sm shadow-hard-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        @click="emit('export-format', 'txt')"
      >
        📄 {{ t('tools.aiSummary.exportTxt') }}
      </button>

      <button
        type="button"
        :disabled="!resultText.trim() || isExporting"
        class="flex-1 py-2.5 px-3 border-2 border-ink bg-accent font-display font-black text-xs uppercase rounded-sm shadow-hard-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        @click="emit('export-format', 'pdf')"
      >
        📕 {{ t('tools.aiSummary.exportPdf') }}
      </button>

      <button
        type="button"
        class="py-2.5 px-3 border-2 border-ink bg-paper-dark font-display font-bold text-xs uppercase rounded-sm shadow-hard-sm hover:bg-paper-dark/80 cursor-pointer"
        @click="emit('reset')"
      >
        {{ t('tools.aiSummary.resetBtn') }}
      </button>
    </div>
  </div>
</template>
