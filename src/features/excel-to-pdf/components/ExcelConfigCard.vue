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
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed">
      ℹ️ {{ t('tools.excelToPdf.disclaimer') }}
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink">
      <span class="text-xs text-ink/70 font-medium">Format Dokumen PDF (A4)</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        📊 {{ t('tools.excelToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
