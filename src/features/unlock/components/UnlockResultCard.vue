<script setup>
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';

defineProps({
  result: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['reset', 'download']);
</script>

<template>
  <BaseCard class="p-5 space-y-4 bg-accent/20">
    <div class="space-y-1">
      <h3 class="font-display font-black text-base text-ink uppercase">
        ✓ {{ t('tools.unlock.successTitle') }}
      </h3>
      <p class="text-xs text-ink/80 font-medium">{{ t('tools.unlock.successDesc') }} ({{ result.pageCount }} {{ t('common.pages') }})</p>
    </div>
    <div class="flex justify-end gap-3 pt-2">
      <BaseButton variant="secondary" class="text-xs py-2 px-4 shadow-hard-sm" @click="emit('reset')">
        {{ t('tools.unlock.workAnotherBtn') }}
      </BaseButton>
      <BaseButton variant="primary" class="text-xs py-2 px-6 shadow-hard-sm" @click="emit('download')">
        💾 {{ t('tools.unlock.downloadBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
