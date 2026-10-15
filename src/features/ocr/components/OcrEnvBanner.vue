<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  issue: { type: Object, default: null },
  buildStamp: { type: String, default: 'unknown' }
});

const isCsp = computed(() => props.issue?.reason === 'csp');
const body = computed(() =>
  isCsp.value
    ? t('tools.ocr.envBodyCsp', { stamp: props.buildStamp })
    : t('tools.ocr.envBodyOther', { stamp: props.buildStamp })
);
</script>

<template>
  <div class="border-3 border-ink bg-danger/15 shadow-hard p-4 space-y-2" role="alert">
    <div class="flex items-center gap-2">
      <span aria-hidden="true">⛔</span>
      <h3 class="font-display font-black uppercase text-sm text-ink">{{ t('tools.ocr.envTitle') }}</h3>
    </div>
    <p class="text-xs font-medium text-ink/90">{{ body }}</p>
    <details class="text-[11px] text-ink/70">
      <summary class="cursor-pointer font-bold uppercase">{{ t('tools.ocr.envDetails') }}</summary>
      <p class="mt-1 break-words">{{ issue?.message || '-' }}</p>
    </details>
  </div>
</template>
