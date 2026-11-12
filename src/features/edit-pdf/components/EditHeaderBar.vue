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
      <span class="text-xs text-ink/70">{{ t('common.pageShort') }}. {{ currentPage }} / {{ totalPages }}</span>
    </div>
    <div class="flex items-center gap-1.5">
      <button type="button" class="text-xs font-bold px-2.5 py-1 border border-ink bg-paper hover:bg-paper-dark" @click="$emit('change-file')">{{ t('common.change') }}</button>
      <BaseButton variant="secondary" :disabled="currentPage <= 1" class="text-xs px-2 py-1" @click="$emit('prev-page')">◀</BaseButton>
      <BaseButton variant="secondary" :disabled="currentPage >= totalPages" class="text-xs px-2 py-1" @click="$emit('next-page')">▶</BaseButton>
      <BaseButton variant="primary" :loading="isSaving" class="text-xs font-black px-4 py-1" @click="$emit('save')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ t('tools.editPdf.saveBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
