<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

const props = defineProps({
  page: { type: Object, required: true }
});

const emit = defineEmits(['apply', 'close']);

const topCrop = ref(Math.round((props.page.cropBox?.y || 0) * 100));
const leftCrop = ref(Math.round((props.page.cropBox?.x || 0) * 100));
const rightCrop = ref(Math.round((1 - (props.page.cropBox?.x || 0) - (props.page.cropBox?.width || 1)) * 100));
const bottomCrop = ref(Math.round((1 - (props.page.cropBox?.y || 0) - (props.page.cropBox?.height || 1)) * 100));

function handleApply() {
  const x = leftCrop.value / 100;
  const y = topCrop.value / 100;
  const width = Math.max(0.1, 1 - (leftCrop.value + rightCrop.value) / 100);
  const height = Math.max(0.1, 1 - (topCrop.value + bottomCrop.value) / 100);
  emit('apply', { x, y, width, height });
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
    <div class="bg-paper border-2 border-ink shadow-hard max-w-md w-full p-5 space-y-4 rounded-xs">
      <div class="flex items-center justify-between border-b-2 border-ink pb-2">
        <h3 class="font-bold text-sm text-ink uppercase">{{ t('tools.scanToPdf.cropTitle') }}</h3>
        <button type="button" class="font-black text-ink hover:text-red-600 px-2 cursor-pointer" @click="$emit('close')">✕</button>
      </div>

      <!-- Crop preview -->
      <div class="relative w-full h-48 bg-paper-dark border-2 border-ink flex items-center justify-center overflow-hidden">
        <img :src="page.url" class="max-h-full max-w-full object-contain pointer-events-none" />
        <div
          class="absolute border-2 border-dashed border-red-500 bg-red-500/15 pointer-events-none transition-all"
          :style="{
            top: `${topCrop}%`,
            left: `${leftCrop}%`,
            right: `${rightCrop}%`,
            bottom: `${bottomCrop}%`
          }"
        />
      </div>

      <!-- 4 margin sliders -->
      <div class="grid grid-cols-2 gap-3 text-xs font-bold text-ink">
        <div>
          <label class="block text-[10px] uppercase mb-1">{{ t('tools.scanToPdf.cropTop') }} ({{ topCrop }}%)</label>
          <input v-model.number="topCrop" type="range" min="0" max="40" class="w-full accent-ink cursor-pointer" />
        </div>
        <div>
          <label class="block text-[10px] uppercase mb-1">{{ t('tools.scanToPdf.cropBottom') }} ({{ bottomCrop }}%)</label>
          <input v-model.number="bottomCrop" type="range" min="0" max="40" class="w-full accent-ink cursor-pointer" />
        </div>
        <div>
          <label class="block text-[10px] uppercase mb-1">{{ t('tools.scanToPdf.cropLeft') }} ({{ leftCrop }}%)</label>
          <input v-model.number="leftCrop" type="range" min="0" max="40" class="w-full accent-ink cursor-pointer" />
        </div>
        <div>
          <label class="block text-[10px] uppercase mb-1">{{ t('tools.scanToPdf.cropRight') }} ({{ rightCrop }}%)</label>
          <input v-model.number="rightCrop" type="range" min="0" max="40" class="w-full accent-ink cursor-pointer" />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t-2 border-ink">
        <BaseButton variant="secondary" class="text-xs font-bold" @click="$emit('close')">{{ t('tools.scanToPdf.cancelBtn') }}</BaseButton>
        <BaseButton variant="primary" class="text-xs font-black" @click="handleApply">{{ t('tools.scanToPdf.applyCropBtn') }}</BaseButton>
      </div>
    </div>
  </div>
</template>
