<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import { showToast } from '../../../app/providers/toast.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

const props = defineProps({
  result: {
    type: Object,
    required: true
  }
});

defineEmits(['reset', 'download']);

const copied = ref(false);

async function copyMarkdown() {
  if (!props.result?.markdown) return;
  try {
    await navigator.clipboard.writeText(props.result.markdown);
    copied.value = true;
    showToast(t('tools.pdfToMarkdown.copied'), 'success');
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    showToast(t('tools.pdfToMarkdown.copyFailed'), 'error');
  }
}
</script>

<template>
  <BaseCard class="p-5 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="flex items-center justify-between border-b-2 border-ink pb-3 flex-wrap gap-2">
      <div>
        <h3 class="font-bold text-sm text-ink uppercase">{{ t('tools.pdfToMarkdown.previewTitle') }}</h3>
        <p class="text-xs text-ink/70">{{ result.pageCount }} {{ t('common.pages') }} • {{ result.markdown.length }} {{ t('common.characters') }}</p>
      </div>
      <BaseButton variant="secondary" class="text-xs font-bold" @click="copyMarkdown">
        {{ copied ? '✓ ' + t('tools.pdfToMarkdown.copiedBtn') : '📋 ' + t('tools.pdfToMarkdown.copyBtn') }}
      </BaseButton>
    </div>

    <!-- Preview snippet / text -->
    <div class="relative">
      <textarea
        readonly
        :value="result.markdown"
        class="w-full h-64 p-3 font-mono text-xs text-ink bg-paper-dark/40 border-2 border-ink rounded-xs focus:outline-none resize-y selection:bg-accent"
      />
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink gap-2 flex-wrap">
      <BaseButton variant="secondary" class="text-xs font-bold" @click="$emit('reset')">
        {{ t('tools.pdfToMarkdown.resetBtn') }}
      </BaseButton>
      <BaseButton variant="primary" class="text-xs font-black px-6" @click="$emit('download')">
        💾 {{ result.isZip ? t('tools.pdfToMarkdown.downloadZipBtn') : t('tools.pdfToMarkdown.downloadMdBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
