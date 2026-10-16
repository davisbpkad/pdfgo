<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

defineProps({
  changedCount: { type: Number, default: 0 }
});

defineEmits(['reset-text']);
</script>

<template>
  <div class="p-3 border-2 border-ink bg-paper shadow-hard space-y-2">
    <div v-if="changedCount > 0" class="flex items-center gap-2 flex-wrap">
      <span class="text-xs font-bold px-2 py-1 border-2 border-ink bg-accent-2">
        {{ t('tools.editPdf.textChanged', { count: changedCount }) }}
      </span>

      <BaseButton
        variant="danger"
        class="text-xs font-bold px-2.5 py-1.5"
        @click="$emit('reset-text')"
      >
        ↺ {{ t('tools.editPdf.textResetBtn') }}
      </BaseButton>
    </div>

    <p class="text-[11px] font-medium text-ink/80 border-l-4 border-accent pl-2">
      {{ t('tools.editPdf.textHint') }}
    </p>
  </div>
</template>
