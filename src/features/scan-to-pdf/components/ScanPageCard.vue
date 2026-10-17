<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  page: { type: Object, required: true },
  index: { type: Number, required: true },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false }
});

defineEmits(['rotate', 'filter', 'move', 'crop', 'remove']);

const filterOptions = [
  { value: 'original', label: 'tools.scanToPdf.filterOriginal' },
  { value: 'grayscale', label: 'tools.scanToPdf.filterGrayscale' },
  { value: 'bw', label: 'tools.scanToPdf.filterBw' },
  { value: 'enhance', label: 'tools.scanToPdf.filterEnhance' }
];
</script>

<template>
  <BaseCard class="p-3 border-2 border-ink bg-paper shadow-hard space-y-2 flex flex-col justify-between">
    <!-- Header with index and delete -->
    <div class="flex items-center justify-between text-xs font-bold text-ink border-b-2 border-ink pb-1">
      <span class="bg-black text-white px-1.5 py-0.5 rounded-xs text-[10px]">#{{ index + 1 }}</span>
      <button type="button" class="text-ink hover:text-red-600 font-black cursor-pointer px-1" @click="$emit('remove', page.id)">✕</button>
    </div>

    <!-- Thumbnail with preview rotation & filter class -->
    <div class="w-full h-36 bg-paper-dark/50 border-2 border-ink flex items-center justify-center overflow-hidden rounded-xs relative">
      <img
        :src="page.url"
        class="max-h-full max-w-full object-contain transition-transform"
        :class="{
          'grayscale': page.filter === 'grayscale',
          'contrast-200 grayscale': page.filter === 'bw',
          'contrast-150': page.filter === 'enhance'
        }"
        :style="{ transform: `rotate(${page.rotation}deg)` }"
      />
    </div>

    <!-- Filter dropdown -->
    <select
      :value="page.filter"
      class="w-full text-xs font-bold p-1 border-2 border-ink bg-paper rounded-xs cursor-pointer focus:outline-none"
      @change="$emit('filter', page.id, $event.target.value)"
    >
      <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
        {{ t(opt.label) }}
      </option>
    </select>

    <!-- Page action buttons -->
    <div class="flex items-center justify-between gap-1 pt-1 border-t-2 border-ink">
      <div class="flex items-center gap-1">
        <button
          type="button"
          :disabled="isFirst"
          class="px-2 py-1 border-2 border-ink bg-paper disabled:opacity-30 text-xs font-bold hover:bg-paper-dark cursor-pointer disabled:cursor-not-allowed"
          @click="$emit('move', index, -1)"
        >←</button>
        <button
          type="button"
          :disabled="isLast"
          class="px-2 py-1 border-2 border-ink bg-paper disabled:opacity-30 text-xs font-bold hover:bg-paper-dark cursor-pointer disabled:cursor-not-allowed"
          @click="$emit('move', index, 1)"
        >→</button>
      </div>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="px-2 py-1 border-2 border-ink bg-paper text-xs font-bold hover:bg-paper-dark cursor-pointer"
          title="Putar 90°"
          @click="$emit('rotate', page.id)"
        >⟳</button>
        <button
          type="button"
          class="px-2 py-1 border-2 border-ink bg-paper text-xs font-bold hover:bg-paper-dark cursor-pointer"
          :title="t('tools.scanToPdf.cropPage')"
          @click="$emit('crop', page.id)"
        >✂</button>
      </div>
    </div>
  </BaseCard>
</template>
