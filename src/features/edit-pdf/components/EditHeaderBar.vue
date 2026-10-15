<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  fileName: { type: String, default: '' },
  currentPage: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  isSaving: { type: Boolean, default: false }
});

defineEmits(['prev-page', 'next-page', 'save', 'change-file']);
</script>

<template>
  <BaseCard class="p-3 flex items-center justify-between border-2 border-ink bg-paper shadow-hard flex-wrap gap-2">
    <div class="flex items-center gap-2">
      <span class="font-bold text-xs uppercase truncate max-w-[200px]">{{ fileName }}</span>
      <span class="text-xs text-ink/70">Hal. {{ currentPage }} / {{ totalPages }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button type="button" class="text-xs font-bold px-2.5 py-1 border border-ink bg-paper hover:bg-paper-dark" @click="$emit('change-file')">
        Ganti
      </button>
      <BaseButton variant="secondary" :disabled="currentPage <= 1" class="text-xs px-2 py-1" @click="$emit('prev-page')">◀</BaseButton>
      <BaseButton variant="secondary" :disabled="currentPage >= totalPages" class="text-xs px-2 py-1" @click="$emit('next-page')">▶</BaseButton>
      <BaseButton variant="primary" :loading="isSaving" class="text-xs font-black px-4 py-1" @click="$emit('save')">
        💾 {{ t('tools.editPdf.saveBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
