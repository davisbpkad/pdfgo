<script setup>
import { ref, computed } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';
import BaseCard from '../../../ui/BaseCard.vue';
import BaseInput from '../../../ui/BaseInput.vue';

const props = defineProps({
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['submit']);

const password = ref('');
const confirmPassword = ref('');
const permissions = ref({
  printing: true,
  copying: false,
  modifying: false,
  annotating: false
});

const isMismatch = computed(() => {
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value;
});

const canSubmit = computed(() => {
  return password.value.length > 0 && password.value === confirmPassword.value && !props.loading;
});

function handleSubmit() {
  if (!canSubmit.value) return;
  emit('submit', {
    password: password.value,
    permissions: { ...permissions.value }
  });
}
</script>

<template>
  <BaseCard class="p-5 space-y-5 border-2 border-ink bg-paper shadow-hard">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.protect.passwordLabel') }}</label>
        <BaseInput v-model="password" type="password" :placeholder="t('tools.protect.passwordPlaceholder')" />
      </div>
      <div class="space-y-1.5">
        <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.protect.confirmPasswordLabel') }}</label>
        <BaseInput v-model="confirmPassword" type="password" :placeholder="t('tools.protect.confirmPasswordPlaceholder')" />
        <p v-if="isMismatch" class="text-xs text-red-600 font-bold mt-1">{{ t('tools.protect.passwordMismatch') }}</p>
      </div>
    </div>

    <div class="space-y-2 pt-2 border-t-2 border-ink">
      <label class="block text-xs font-bold text-ink uppercase">{{ t('tools.protect.permissionsTitle') }}</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-ink">
        <label class="flex items-center gap-2 p-2 border-2 border-ink bg-paper-dark/30 rounded-xs cursor-pointer hover:bg-paper-dark">
          <input v-model="permissions.printing" type="checkbox" class="w-4 h-4 accent-ink cursor-pointer" />
          <span>{{ t('tools.protect.permPrinting') }}</span>
        </label>
        <label class="flex items-center gap-2 p-2 border-2 border-ink bg-paper-dark/30 rounded-xs cursor-pointer hover:bg-paper-dark">
          <input v-model="permissions.copying" type="checkbox" class="w-4 h-4 accent-ink cursor-pointer" />
          <span>{{ t('tools.protect.permCopying') }}</span>
        </label>
        <label class="flex items-center gap-2 p-2 border-2 border-ink bg-paper-dark/30 rounded-xs cursor-pointer hover:bg-paper-dark">
          <input v-model="permissions.modifying" type="checkbox" class="w-4 h-4 accent-ink cursor-pointer" />
          <span>{{ t('tools.protect.permModifying') }}</span>
        </label>
        <label class="flex items-center gap-2 p-2 border-2 border-ink bg-paper-dark/30 rounded-xs cursor-pointer hover:bg-paper-dark">
          <input v-model="permissions.annotating" type="checkbox" class="w-4 h-4 accent-ink cursor-pointer" />
          <span>{{ t('tools.protect.permAnnotating') }}</span>
        </label>
      </div>
    </div>

    <div class="flex items-center justify-between pt-2">
      <span class="text-xs text-ink/70 font-medium">AES-256 standard encryption</span>
      <BaseButton variant="primary" :disabled="!canSubmit" :loading="loading" class="px-6 py-2.5 font-black text-xs" @click="handleSubmit">
        🔒 {{ t('tools.protect.actionBtn') }}
      </BaseButton>
    </div>
  </BaseCard>
</template>
