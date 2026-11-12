<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['submit']);
const includeImages = ref(false);

function handleSubmit() {
  emit('submit', { includeImages: includeImages.value });
}
</script>

<template>
  <BaseCard class="p-5 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="space-y-3">
      <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.pdfToWord.optionsTitle') }}</label>
      <label class="flex items-center gap-2.5 p-3 border-2 border-ink bg-paper-dark/30 rounded-xs cursor-pointer hover:bg-paper-dark transition-colors text-xs font-medium text-ink">
        <input v-model="includeImages" type="checkbox" class="w-4 h-4 accent-ink cursor-pointer" />
        <span>{{ t('tools.pdfToWord.includeImages') }}</span>
      </label>
    </div>

    <!-- Honest disclaimer card -->
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed flex items-start gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <span>{{ t('tools.pdfToWord.disclaimer') }}</span>
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink">
      <span class="text-xs text-ink/70 font-medium">Format Microsoft Word (.docx)</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        {{ t('tools.pdfToWord.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
