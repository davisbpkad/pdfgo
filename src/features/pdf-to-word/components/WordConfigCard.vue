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
    <div class="p-3 border-2 border-ink bg-paper-dark/60 text-xs text-ink/80 font-medium rounded-xs leading-relaxed">
      ℹ️ {{ t('tools.pdfToWord.disclaimer') }}
    </div>

    <div class="flex items-center justify-between pt-2 border-t-2 border-ink">
      <span class="text-xs text-ink/70 font-medium">Format Microsoft Word (.docx)</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        📝 {{ t('tools.pdfToWord.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
