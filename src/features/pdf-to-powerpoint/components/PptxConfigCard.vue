<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['submit']);
const pageRange = ref('');
const quality = ref('normal');

function handleSubmit() {
  emit('submit', {
    pageSelection: pageRange.value.trim() || 'all',
    quality: quality.value
  });
}
</script>

<template>
  <BaseCard class="p-5 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="space-y-3">
      <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.pdfToPowerpoint.optionsTitle') }}</label>

      <!-- Page Selection -->
      <div class="space-y-1">
        <label class="block text-xs font-medium text-ink/80">{{ t('tools.pdfToPowerpoint.pageRangeLabel') }}</label>
        <input
          v-model="pageRange"
          type="text"
          :placeholder="t('tools.pdfToPowerpoint.pageRangePlaceholder')"
          class="w-full px-3 py-2 border-2 border-ink bg-paper-dark/20 text-xs font-bold text-ink focus:outline-hidden"
        />
      </div>

      <!-- Quality Options -->
      <div class="space-y-1">
        <label class="block text-xs font-medium text-ink/80">{{ t('tools.pdfToPowerpoint.qualityLabel') }}</label>
        <div class="grid grid-cols-3 gap-2">
          <label
            v-for="opt in [
              { id: 'draft', labelKey: 'tools.pdfToPowerpoint.qualityDraft' },
              { id: 'normal', labelKey: 'tools.pdfToPowerpoint.qualityNormal' },
              { id: 'high', labelKey: 'tools.pdfToPowerpoint.qualityHigh' }
            ]"
            :key="opt.id"
            :class="[
              'flex items-center justify-center p-2.5 border-2 border-ink text-xs font-bold cursor-pointer transition-colors text-center',
              quality === opt.id ? 'bg-primary text-ink shadow-hard-xs' : 'bg-paper-dark/30 hover:bg-paper-dark text-ink'
            ]"
          >
            <input v-model="quality" type="radio" name="pptx-quality" :value="opt.id" class="sr-only" />
            <span>{{ t(opt.labelKey) }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Honest disclaimer card -->
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed">
      ℹ️ {{ t('tools.pdfToPowerpoint.disclaimer') }}
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink">
      <span class="text-xs text-ink/70 font-medium">Format Microsoft PowerPoint (.pptx)</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        📊 {{ t('tools.pdfToPowerpoint.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
