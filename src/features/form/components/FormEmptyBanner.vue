<script setup>
import { t } from '../../../app/providers/i18n.js';
import { activeToolId } from '../../../app/router.js';
import BaseButton from '../../../ui/BaseButton.vue';

function goToSign() {
  activeToolId.value = 'sign';
}
</script>

<template>
  <div class="border-3 border-ink bg-paper p-6 shadow-hard text-center space-y-3">
    <div class="w-12 h-12 mx-auto rounded-full border-2 border-ink bg-accent/20 flex items-center justify-center text-xl">
      📋
    </div>
    <h3 class="font-display font-black text-lg text-ink uppercase tracking-tight">{{ t('tools.form.emptyTitle') }}</h3>
    <p class="text-xs text-ink/80 max-w-md mx-auto leading-relaxed font-medium">{{ t('tools.form.emptyBody') }}</p>
    <div class="pt-2">
      <BaseButton variant="primary" class="text-xs py-2 px-6" @click="goToSign">{{ t('tools.form.openSign') }}</BaseButton>
    </div>
  </div>
</template>
