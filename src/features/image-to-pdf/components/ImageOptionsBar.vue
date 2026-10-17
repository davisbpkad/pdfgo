<script setup>
import { t } from '../../../app/providers/i18n.js';

defineProps({
  pageSize: {
    type: String,
    default: 'A4'
  },
  orientation: {
    type: String,
    default: 'auto'
  },
  margin: {
    type: Number,
    default: 20
  },
  fitMode: {
    type: String,
    default: 'contain'
  }
});

const emit = defineEmits([
  'update:pageSize',
  'update:orientation',
  'update:margin',
  'update:fitMode'
]);
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border-3 border-ink bg-paper shadow-hard-sm">
    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">{{ t('tools.imageToPdf.pageSizeLabel') }}</label>
      <select
        :value="pageSize"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:pageSize', $event.target.value)"
      >
        <option value="A4">A4 (Standar)</option>
        <option value="LETTER">US Letter</option>
        <option value="FIT">{{ t('tools.imageToPdf.pageFit') }}</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">{{ t('tools.imageToPdf.orientationLabel') }}</label>
      <select
        :value="orientation"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:orientation', $event.target.value)"
      >
        <option value="auto">{{ t('tools.imageToPdf.orientAuto') }}</option>
        <option value="portrait">{{ t('tools.imageToPdf.orientPortrait') }}</option>
        <option value="landscape">{{ t('tools.imageToPdf.orientLandscape') }}</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">{{ t('tools.imageToPdf.marginLabel') }}</label>
      <select
        :value="margin"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:margin', Number($event.target.value))"
      >
        <option :value="0">{{ t('tools.imageToPdf.marginNone') }}</option>
        <option :value="15">{{ t('tools.imageToPdf.marginSmall') }}</option>
        <option :value="30">{{ t('tools.imageToPdf.marginNormal') }}</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">{{ t('tools.imageToPdf.fitModeLabel') }}</label>
      <select
        :value="fitMode"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:fitMode', $event.target.value)"
      >
        <option value="contain">{{ t('tools.imageToPdf.fitContain') }}</option>
        <option value="cover">{{ t('tools.imageToPdf.fitCover') }}</option>
      </select>
    </div>
  </div>
</template>
