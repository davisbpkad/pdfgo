<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  availableLangs: { type: Array, default: () => [] },
  selectedLang: { type: String, default: 'ind' },
  pageMode: { type: String, default: 'all' },
  customRange: { type: String, default: '' },
  targetDpi: { type: Number, default: 300 },
  totalPages: { type: Number, default: 1 },
  isProcessing: { type: Boolean, default: false }
});

defineEmits([
  'update:selectedLang',
  'update:pageMode',
  'update:customRange',
  'update:targetDpi',
  'start'
]);
</script>

<template>
  <div class="border-2 border-ink bg-paper p-4 shadow-hard-sm space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Language Selection -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-ink block">{{ t('tools.ocr.docLangLabel') }}</label>
        <div class="space-y-1.5">
          <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="ocr-lang"
              value="ind"
              :checked="selectedLang === 'ind'"
              :disabled="!availableLangs.includes('ind')"
              class="w-4 h-4 border-2 border-ink accent-accent cursor-pointer disabled:opacity-40"
              @change="$emit('update:selectedLang', 'ind')"
            />
            <span :class="!availableLangs.includes('ind') ? 'text-ink/40' : ''">
              Bahasa Indonesia {{ !availableLangs.includes('ind') ? '(Belum ada)' : '' }}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="ocr-lang"
              value="eng"
              :checked="selectedLang === 'eng'"
              :disabled="!availableLangs.includes('eng')"
              class="w-4 h-4 border-2 border-ink accent-accent cursor-pointer disabled:opacity-40"
              @change="$emit('update:selectedLang', 'eng')"
            />
            <span :class="!availableLangs.includes('eng') ? 'text-ink/40' : ''">
              Bahasa Inggris {{ !availableLangs.includes('eng') ? '(Belum ada)' : '' }}
            </span>
          </label>

          <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="ocr-lang"
              value="ind+eng"
              :checked="selectedLang === 'ind+eng'"
              :disabled="!(availableLangs.includes('ind') && availableLangs.includes('eng'))"
              class="w-4 h-4 border-2 border-ink accent-accent cursor-pointer disabled:opacity-40"
              @change="$emit('update:selectedLang', 'ind+eng')"
            />
            <span :class="!(availableLangs.includes('ind') && availableLangs.includes('eng')) ? 'text-ink/40' : ''">
              Kombinasi (Indonesia + Inggris)
            </span>
          </label>
        </div>
      </div>

      <!-- Page Target -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-ink block">{{ t('tools.ocr.pageChoiceLabel') }}</label>
        <div class="space-y-1.5">
          <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="ocr-page-mode"
              value="all"
              :checked="pageMode === 'all'"
              class="w-4 h-4 border-2 border-ink accent-accent cursor-pointer"
              @change="$emit('update:pageMode', 'all')"
            />
            <span>{{ t('tools.ocr.pagesAll') }} ({{ totalPages }} {{ t('common.pageShort') }})</span>
          </label>

          <label class="flex items-center gap-2 text-xs font-bold text-ink cursor-pointer select-none">
            <input
              type="radio"
              name="ocr-page-mode"
              value="range"
              :checked="pageMode === 'range'"
              class="w-4 h-4 border-2 border-ink accent-accent cursor-pointer"
              @change="$emit('update:pageMode', 'range')"
            />
            <span>{{ t('tools.ocr.pagesRange') }}</span>
          </label>

          <input
            v-if="pageMode === 'range'"
            :value="customRange"
            type="text"
            :placeholder="t('common.rangePlaceholder')"
            class="w-full text-xs font-medium p-1.5 border-2 border-ink bg-paper shadow-hard-sm focus:outline-none"
            @input="$emit('update:customRange', $event.target.value)"
          />
        </div>
      </div>

      <!-- Resolution / DPI -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-ink block">{{ t('tools.ocr.resolutionLabel') }}</label>
        <select
          :value="targetDpi"
          class="w-full text-xs font-bold p-2 border-2 border-ink bg-paper shadow-hard-sm cursor-pointer focus:outline-none"
          @change="$emit('update:targetDpi', Number($event.target.value))"
        >
          <option :value="300">{{ t('tools.ocr.dpi300') }}</option>
          <option :value="150">150 DPI (Eksekusi Cepat)</option>
        </select>
      </div>
    </div>

    <div class="border-t-2 border-ink pt-3">
      <BaseButton
        variant="primary"
        class="w-full py-2.5 text-xs tracking-wider"
        :disabled="availableLangs.length === 0 || isProcessing"
        @click="$emit('start')"
      >🔍 {{ t('tools.ocr.actionStart') }}</BaseButton>
    </div>
  </div>
</template>
