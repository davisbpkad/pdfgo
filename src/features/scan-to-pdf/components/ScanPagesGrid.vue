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
        📑 {{ t('tools.scanToPdf.actionBtn') }}
      </BaseButton>
    </div>
  </div>
</template>
