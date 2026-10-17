<script setup>
import { t } from '../../../app/providers/i18n.js';
</script>

<template>
  <div class="border-2 border-ink bg-amber-300 text-ink p-3 shadow-hard-sm flex items-center gap-3">
    <span class="text-lg">⚠️</span>
    <div class="text-xs font-bold leading-relaxed">
      <span class="uppercase tracking-wider">{{ t('tools.redact.warningTitle') }}</span>
      {{ t('tools.redact.warningPermanent') }}
      {{ t('tools.redact.warningExtra') }}
    </div>
  </div>
</template>
