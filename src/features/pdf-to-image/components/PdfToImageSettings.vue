<script setup>
import BaseInput from '../../../ui/BaseInput.vue';
import { t } from '../../../app/providers/i18n.js';

defineProps({
  format: {
    type: String,
    default: 'png'
  },
  dpiScale: {
    type: Number,
    default: 2.08
  },
  quality: {
    type: Number,
    default: 85
  },
  pageRangeChoice: {
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
  'update:format',
  'update:dpiScale',
  'update:quality',
  'update:pageRangeChoice',
  'update:customRange'
]);
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-4 shadow-hard-sm">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Format -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase tracking-wider text-ink">
          {{ t('tools.pdfToImage.formatLabel') }}
        </label>
        <select
          :value="format"
          class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
          @change="emit('update:format', $event.target.value)"
        >
          <option value="png">{{ t('tools.pdfToImage.formatPng') }}</option>
          <option value="jpeg">{{ t('tools.pdfToImage.formatJpeg') }}</option>
        </select>
      </div>

      <!-- DPI Resolution -->
      <div class="space-y-1.5">
        <label class="block text-xs font-black uppercase tracking-wider text-ink">
          {{ t('tools.pdfToImage.dpiLabel') }}
        </label>
        <select
          :value="dpiScale"
          class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
          @change="emit('update:dpiScale', Number($event.target.value))"
        >
          <option :value="1.0">{{ t('tools.pdfToImage.dpiStandard') }}</option>
          <option :value="2.08">{{ t('tools.pdfToImage.dpiMedium') }}</option>
          <option :value="4.16">{{ t('tools.pdfToImage.dpiHigh') }}</option>
        </select>
      </div>
    </div>

    <!-- JPEG Quality (if JPEG selected) -->
    <div v-if="format === 'jpeg'" class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.pdfToImage.qualityLabel') }} ({{ quality }}%)
      </label>
      <input
        type="range"
        min="50"
        max="100"
        :value="quality"
        class="w-full accent-ink cursor-pointer"
        @input="emit('update:quality', Number($event.target.value))"
      />
    </div>

    <!-- Page Range Choice -->
    <div class="space-y-1.5">
      <label class="block text-xs font-black uppercase tracking-wider text-ink">
        {{ t('tools.pdfToImage.pagesLabel') }}
      </label>
      <select
        :value="pageRangeChoice"
        class="w-full px-3 py-2 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:pageRangeChoice', $event.target.value)"
      >
        <option value="all">{{ t('tools.pdfToImage.pagesAll') }} ({{ totalPages }} {{ t('tools.pdfToImage.pagesLabel') }})</option>
        <option value="custom">{{ t('tools.pdfToImage.pagesCustom') }}</option>
      </select>

      <div v-if="pageRangeChoice === 'custom'" class="pt-1">
        <BaseInput
          :model-value="customRange"
          :placeholder="t('tools.pdfToImage.rangePlaceholder')"
          @update:model-value="emit('update:customRange', $event)"
        />
      </div>
    </div>
  </div>
</template>
