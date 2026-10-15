<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  result: { type: Object, required: true }
});

defineEmits(['reset', 'download']);
</script>

<template>
  <BaseCard class="p-5 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xs bg-accent-1 text-ink flex items-center justify-center font-black text-xl border-2 border-ink">
        ✓
      </div>
      <div>
        <h3 class="font-bold text-sm text-ink uppercase">{{ t('tools.scanToPdf.successTitle') }}</h3>
        <p class="text-xs text-ink/70">
          {{ t('tools.scanToPdf.successDetail', { pages: result.pageCount, size: (result.pdfBytes.length / 1024 / 1024).toFixed(2) + ' MB' }) }}
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t-2 border-ink gap-2 flex-wrap">
      <BaseButton variant="secondary" class="text-xs font-bold" @click="$emit('reset')">
        {{ t('tools.scanToPdf.resetBtn') }}
      </BaseButton>
      <BaseButton variant="primary" class="text-xs font-black px-6" @click="$emit('download')">
        💾 {{ t('tools.scanToPdf.downloadBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
