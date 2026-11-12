<script setup>
import { t } from '../../../app/providers/i18n.js';
</script>

<template>
  <div class="border-2 border-ink bg-amber-300 text-ink p-3 shadow-hard-sm flex items-center gap-3">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    <div class="text-xs font-bold leading-relaxed">
      <span class="uppercase tracking-wider">{{ t('tools.redact.warningTitle') }}</span>
      {{ t('tools.redact.warningPermanent') }}
      {{ t('tools.redact.warningExtra') }}
    </div>
  </div>
</template>
