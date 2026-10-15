<script setup>
import { computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';

const props = defineProps({
  issue: { type: Object, default: null },
  buildStamp: { type: String, default: 'unknown' }
});

const params = computed(() => ({
  stamp: props.buildStamp,
  origin: props.issue?.servedFrom || 'unknown',
  policy: props.issue?.enforcedPolicy || '-'
}));

const titleKey = computed(() => ({
  'host-csp': 'tools.ocr.envTitleHostCsp',
  'stale-file': 'tools.ocr.envTitleStaleFile',
  'worker-csp': 'tools.ocr.envTitleBrowser'
}[props.issue?.reason] || 'tools.ocr.envTitleBrowser'));

const bodyKey = computed(() => ({
  'host-csp': 'tools.ocr.envBodyHostCsp',
  'stale-file': 'tools.ocr.envBodyStaleFile',
  'worker-csp': 'tools.ocr.envBodyBrowser'
}[props.issue?.reason] || 'tools.ocr.envBodyBrowser'));
</script>

<template>
  <div class="border-3 border-ink bg-danger/15 shadow-hard p-4 space-y-2" role="alert">
    <div class="flex items-center gap-2">
      <span aria-hidden="true">⛔</span>
      <h3 class="font-display font-black uppercase text-sm text-ink">{{ t(titleKey) }}</h3>
    </div>

    <p class="text-xs font-medium text-ink/90">{{ t(bodyKey, params) }}</p>

    <div class="text-[11px] font-mono bg-paper border-2 border-ink p-2 space-y-0.5">
      <div><strong>{{ t('tools.ocr.envServedFrom') }}:</strong> {{ params.origin }}</div>
      <div><strong>{{ t('tools.ocr.envBuildStamp') }}:</strong> {{ params.stamp }}</div>
      <div><strong>{{ t('tools.ocr.envPolicyLabel') }}:</strong> <span class="break-all">{{ params.policy }}</span></div>
    </div>

    <details class="text-[11px] text-ink/70">
      <summary class="cursor-pointer font-bold uppercase">{{ t('tools.ocr.envDetails') }}</summary>
      <p class="mt-1 break-words">{{ issue?.message || '-' }}</p>
    </details>
  </div>
</template>
