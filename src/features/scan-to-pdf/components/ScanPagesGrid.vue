<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import ScanPageCard from './ScanPageCard.vue';

defineProps({
  pages: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

defineEmits(['rotate', 'filter', 'move', 'crop', 'remove', 'build']);
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <ScanPageCard
        v-for="(page, idx) in pages"
        :key="page.id"
        :page="page"
        :index="idx"
        :is-first="idx === 0"
        :is-last="idx === pages.length - 1"
        @rotate="$emit('rotate', $event)"
        @filter="(id, f) => $emit('filter', id, f)"
        @move="(i, d) => $emit('move', i, d)"
        @crop="$emit('crop', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>

    <div class="flex items-center justify-between pt-2">
      <span class="text-xs font-bold text-ink">{{ t('tools.scanToPdf.pagesReady', { count: pages.length }) }}</span>
      <BaseButton variant="primary" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="$emit('build')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        {{ t('tools.scanToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
