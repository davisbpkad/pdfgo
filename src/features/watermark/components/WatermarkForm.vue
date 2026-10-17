<script setup>
import BaseInput from '../../../ui/BaseInput.vue';
import { t } from '../../../app/providers/i18n.js';

defineProps({
  text: {
    type: String,
    default: 'CONFIDENTIAL'
  },
  fontSize: {
    type: Number,
    default: 48
  },
  colorHex: {
    type: String,
    default: '#dc2626'
  },
  opacity: {
    type: Number,
    default: 25
  },
  position: {
    type: String,
    default: 'diagonal'
  },
  pageFilter: {
    type: String,
    default: 'all'
  },
  customRange: {
    type: String,
    default: ''
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

const emit = defineEmits([
  'update:text',
  'update:fontSize',
  'update:colorHex',
  'update:opacity',
  'update:position',
  'update:pageFilter',
  'update:customRange'
]);

const presets = ['presetConfidential', 'presetDraft', 'presetSample'];
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-4 shadow-hard-sm">
    <!-- Watermark Text & Presets -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.watermark.textLabel') }}
      </label>
      <BaseInput
        :model-value="text"
        :placeholder="t('tools.watermark.textPlaceholder')"
        @update:model-value="emit('update:text', $event)"
      />
      <div class="flex flex-wrap gap-1.5 pt-1">
        <button
          v-for="preset in presets"
          :key="preset"
          type="button"
          class="text-2xs font-bold px-2 py-0.5 border border-ink bg-paper-dark hover:bg-accent transition-colors cursor-pointer"
          @click="emit('update:text', t('tools.watermark.' + preset))"
        >
          {{ t('tools.watermark.' + preset) }}
        </button>
      </div>
    </div>

    <!-- Layout & Position -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.watermark.posLabel') }}
      </label>
      <div class="grid grid-cols-3 gap-2">
        <button
          type="button"
          class="p-2 border-2 border-ink text-xs font-bold cursor-pointer transition-all text-center"
          :class="position === 'diagonal' ? 'bg-accent shadow-hard-sm text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
          @click="emit('update:position', 'diagonal')"
        >
          {{ t('tools.watermark.posDiagonal') }}
        </button>
        <button
          type="button"
          class="p-2 border-2 border-ink text-xs font-bold cursor-pointer transition-all text-center"
          :class="position === 'center' ? 'bg-accent shadow-hard-sm text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
          @click="emit('update:position', 'center')"
        >
          {{ t('tools.watermark.posCenter') }}
        </button>
        <button
          type="button"
          class="p-2 border-2 border-ink text-xs font-bold cursor-pointer transition-all text-center"
          :class="position === 'tiled' ? 'bg-accent shadow-hard-sm text-ink' : 'bg-paper text-ink/70 hover:bg-paper-dark'"
          @click="emit('update:position', 'tiled')"
        >
          {{ t('tools.watermark.posTiled') }}
        </button>
      </div>
    </div>

    <!-- Sliders: Size, Opacity, Color -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">
          {{ t('tools.watermark.sizeLabel') }} ({{ fontSize }}pt)
        </label>
        <input
          type="range"
          min="16"
          max="100"
          :value="fontSize"
          class="w-full accent-ink cursor-pointer"
          @input="emit('update:fontSize', Number($event.target.value))"
        />
      </div>

      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">
          {{ t('tools.watermark.opacityLabel', { pct: opacity }) }}
        </label>
        <input
          type="range"
          min="5"
          max="100"
          :value="opacity"
          class="w-full accent-ink cursor-pointer"
          @input="emit('update:opacity', Number($event.target.value))"
        />
      </div>

      <div class="space-y-1">
        <label class="block text-2xs font-black uppercase text-ink">{{ t('tools.watermark.colorLabel') }}</label>
        <input
          type="color"
          :value="colorHex"
          class="w-full h-8 border-2 border-ink cursor-pointer bg-paper p-0.5"
          @input="emit('update:colorHex', $event.target.value)"
        />
      </div>
    </div>

    <!-- Target Pages Filter -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.watermark.pagesLabel') }}
      </label>
      <select
        :value="pageFilter"
        class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:pageFilter', $event.target.value)"
      >
        <option value="all">{{ t('tools.watermark.pagesAll') }} ({{ totalPages }} {{ t('common.pages') }})</option>
        <option value="odd">{{ t('tools.watermark.pagesOdd') }}</option>
        <option value="even">{{ t('tools.watermark.pagesEven') }}</option>
        <option value="custom">{{ t('tools.watermark.pagesCustom') }}</option>
      </select>

      <div v-if="pageFilter === 'custom'" class="pt-1">
        <BaseInput
          :model-value="customRange"
          :placeholder="t('common.rangePlaceholder')"
          @update:model-value="emit('update:customRange', $event)"
        />
      </div>
    </div>
  </div>
</template>
