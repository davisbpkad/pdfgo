<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  placement: {
    type: Object,
    required: true,
    default: () => ({ x: 0.1, y: 0.1, width: 0.25, height: 0.12 })
  },
  pageDimensionsPt: {
    type: Object,
    default: () => ({ width: 595.28, height: 841.89 })
  },
  signatureUrl: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['update:placement', 'center', 'reset-original-size']);

const MM_PER_PT = 25.4 / 72;

const pageDimensionsMm = computed(() => ({
  width: props.pageDimensionsPt.width * MM_PER_PT,
  height: props.pageDimensionsPt.height * MM_PER_PT
}));

const xMm = computed(() => {
  return Number((props.placement.x * pageDimensionsMm.value.width).toFixed(1));
});

const yMm = computed(() => {
  return Number((props.placement.y * pageDimensionsMm.value.height).toFixed(1));
});

const widthMm = computed(() => {
  return Number((props.placement.width * pageDimensionsMm.value.width).toFixed(1));
});

const heightMm = computed(() => {
  return Number((props.placement.height * pageDimensionsMm.value.height).toFixed(1));
});

function onXChange(val) {
  const mm = Math.max(0, Math.min(pageDimensionsMm.value.width - widthMm.value, Number(val) || 0));
  const normX = mm / pageDimensionsMm.value.width;
  emit('update:placement', { ...props.placement, x: Number(normX.toFixed(4)) });
}

function onYChange(val) {
  const mm = Math.max(0, Math.min(pageDimensionsMm.value.height - heightMm.value, Number(val) || 0));
  const normY = mm / pageDimensionsMm.value.height;
  emit('update:placement', { ...props.placement, y: Number(normY.toFixed(4)) });
}

function onWidthChange(val) {
  const mm = Math.max(10, Math.min(pageDimensionsMm.value.width - xMm.value, Number(val) || 10));
  const normW = mm / pageDimensionsMm.value.width;
  emit('update:placement', { ...props.placement, width: Number(normW.toFixed(4)) });
}

function onHeightChange(val) {
  const mm = Math.max(5, Math.min(pageDimensionsMm.value.height - yMm.value, Number(val) || 5));
  const normH = mm / pageDimensionsMm.value.height;
  emit('update:placement', { ...props.placement, height: Number(normH.toFixed(4)) });
}

function centerPlacement() {
  const normX = Math.max(0, (1 - props.placement.width) / 2);
  const normY = Math.max(0, (1 - props.placement.height) / 2);
  emit('update:placement', { ...props.placement, x: Number(normX.toFixed(4)), y: Number(normY.toFixed(4)) });
}

function resetOriginalSize() {
  // Standard signature size: 50mm width, 22mm height
  const stdWidthMm = 50;
  const stdHeightMm = 22;
  const normW = Math.min(0.8, stdWidthMm / pageDimensionsMm.value.width);
  const normH = Math.min(0.8, stdHeightMm / pageDimensionsMm.value.height);
  const normX = Math.max(0, Math.min(1 - normW, props.placement.x));
  const normY = Math.max(0, Math.min(1 - normH, props.placement.y));
  emit('update:placement', {
    x: Number(normX.toFixed(4)),
    y: Number(normY.toFixed(4)),
    width: Number(normW.toFixed(4)),
    height: Number(normH.toFixed(4))
  });
}
</script>

<template>
  <div class="border-2 border-ink bg-paper rounded-sm p-3 shadow-hard-sm space-y-3 select-none">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-ink uppercase tracking-wider">
        {{ t('tools.sign.precisionTitle') }}
      </span>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="px-2.5 py-1 text-[11px] font-bold border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
          :title="t('tools.sign.center')"
          @click="centerPlacement"
        >
          🎯 {{ t('tools.sign.center') }}
        </button>
        <button
          type="button"
          class="px-2.5 py-1 text-[11px] font-bold border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
          :title="t('tools.sign.resetOriginalSize')"
          @click="resetOriginalSize"
        >
          🔄 {{ t('tools.sign.resetOriginalSize') }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <!-- Posisi X -->
      <div class="space-y-1">
        <label class="text-[11px] font-bold text-ink/80 block">{{ t('tools.sign.posX') }}:</label>
        <input
          :value="xMm"
          type="number"
          step="0.5"
          min="0"
          :max="pageDimensionsMm.width"
          class="w-full text-xs font-mono font-bold p-1.5 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @change="onXChange($event.target.value)"
        />
      </div>

      <!-- Posisi Y -->
      <div class="space-y-1">
        <label class="text-[11px] font-bold text-ink/80 block">{{ t('tools.sign.posY') }}:</label>
        <input
          :value="yMm"
          type="number"
          step="0.5"
          min="0"
          :max="pageDimensionsMm.height"
          class="w-full text-xs font-mono font-bold p-1.5 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @change="onYChange($event.target.value)"
        />
      </div>

      <!-- Lebar -->
      <div class="space-y-1">
        <label class="text-[11px] font-bold text-ink/80 block">{{ t('tools.sign.widthMm') }}:</label>
        <input
          :value="widthMm"
          type="number"
          step="0.5"
          min="10"
          :max="pageDimensionsMm.width"
          class="w-full text-xs font-mono font-bold p-1.5 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @change="onWidthChange($event.target.value)"
        />
      </div>

      <!-- Tinggi -->
      <div class="space-y-1">
        <label class="text-[11px] font-bold text-ink/80 block">{{ t('tools.sign.heightMm') }}:</label>
        <input
          :value="heightMm"
          type="number"
          step="0.5"
          min="5"
          :max="pageDimensionsMm.height"
          class="w-full text-xs font-mono font-bold p-1.5 border border-ink bg-white dark:bg-neutral-800 rounded-sm shadow-hard-sm focus:outline-none focus:shadow-hard focus:-translate-y-0.5 transition-all duration-150"
          @change="onHeightChange($event.target.value)"
        />
      </div>
    </div>
  </div>
</template>