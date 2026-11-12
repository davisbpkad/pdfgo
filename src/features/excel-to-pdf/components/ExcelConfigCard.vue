<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['submit']);
const orientation = ref('landscape');

function handleSubmit() {
  emit('submit', { orientation: orientation.value });
}
</script>

<template>
  <BaseCard class="p-5 space-y-4 border-2 border-ink bg-paper shadow-hard">
    <div class="space-y-3">
      <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.excelToPdf.optionsTitle') }}</label>

      <!-- Orientation Options -->
      <div class="space-y-1">
        <label class="block text-xs font-medium text-ink/80">{{ t('tools.excelToPdf.orientationLabel') }}</label>
        <div class="grid grid-cols-2 gap-2">
          <label
            v-for="opt in [
              { id: 'landscape', labelKey: 'tools.excelToPdf.orientationLandscape' },
              { id: 'portrait', labelKey: 'tools.excelToPdf.orientationPortrait' }
            ]"
            :key="opt.id"
            :class="[
              'flex items-center justify-center p-2.5 border-2 border-ink text-xs font-bold cursor-pointer transition-colors text-center',
              orientation === opt.id ? 'bg-primary text-ink shadow-hard-xs' : 'bg-paper-dark/30 hover:bg-paper-dark text-ink'
            ]"
          >
            <input v-model="orientation" type="radio" name="excel-orientation" :value="opt.id" class="sr-only" />
            <span>{{ t(opt.labelKey) }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Honest disclaimer card -->
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed flex items-start gap-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <span>{{ t('tools.excelToPdf.disclaimer') }}</span>
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink">
      <span class="text-xs text-ink/70 font-medium">{{ t('tools.excelToPdf.formatA4') }}</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
        {{ t('tools.excelToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
