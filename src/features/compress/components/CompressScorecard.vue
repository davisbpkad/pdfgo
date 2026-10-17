<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  result: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['download-again']);

function formatMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
</script>

<template>
  <div class="border-3 border-ink bg-paper p-5 space-y-4 shadow-hard">
    <div class="flex items-center gap-2 font-display font-black text-lg text-ink uppercase">
      <span>✓</span>
      <span>{{ t('tools.compress.completed') }}</span>
    </div>

    <!-- Metrics Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-paper-dark border-2 border-ink text-center items-center">
      <div>
        <span class="block text-2xs font-black uppercase text-ink/60">{{ t('tools.compress.originalSize') }}</span>
        <span class="font-display font-bold text-base text-ink line-through decoration-danger">
          {{ formatMB(result.originalSize) }}
        </span>
      </div>

      <div>
        <span class="block text-2xs font-black uppercase text-ink/60">{{ t('tools.compress.compressedSize') }}</span>
        <span class="font-display font-black text-xl text-accent-2">
          {{ formatMB(result.compressedSize) }}
        </span>
      </div>

      <div>
        <span class="block text-2xs font-black uppercase text-ink/60">{{ t('tools.compress.reductionRate') }}</span>
        <span
          class="inline-block px-2 py-0.5 font-display font-black text-sm border-2 border-ink"
          :class="result.reductionRate > 0 ? 'bg-accent text-ink' : 'bg-paper-dark text-ink'"
        >
          {{ result.reductionRate > 0 ? `-${result.reductionRate}%` : '0%' }}
        </span>
      </div>
    </div>

    <!-- Notice if already optimal -->
    <div v-if="result.reductionRate <= 0" class="p-3 border-2 border-ink bg-accent/20 text-xs font-bold text-ink">
      ℹ️ {{ t('tools.compress.warnLarger') }}
    </div>

    <!-- Download again -->
    <div class="flex justify-end pt-1">
      <BaseButton variant="primary" class="text-xs py-2 px-4" @click="emit('download-again')">
        {{ t('tools.compress.downloadAgain') }}
      </BaseButton>
    </div>
  </div>
</template>
