<script setup>
import { ref } from 'vue';
import { t } from '../../../app/providers/i18n.js';
import BaseButton from '../../../ui/BaseButton.vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  isFirst: {
    type: Boolean,
    default: false
  },
  isLast: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['move-up', 'move-down', 'remove', 'unlock']);
const passwordInput = ref('');

function submitUnlock() {
  if (passwordInput.value) {
    emit('unlock', { index: props.index, password: passwordInput.value });
  }
}
</script>

<template>
  <div class="border-2 border-ink bg-paper rounded-sm p-3 md:p-4 shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-between gap-3">
    <!-- Thumbnail & Info -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Thumbnail -->
      <div class="w-12 h-16 shrink-0 border-2 border-ink rounded-sm bg-neutral-100 dark:bg-neutral-800 shadow-[1.5px_1.5px_0_0_#000000] flex items-center justify-center overflow-hidden">
        <img v-if="item.thumbnail" :src="item.thumbnail" alt="Thumb" class="w-full h-full object-cover" />
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>

      <!-- File Details -->
      <div class="min-w-0 flex-1 space-y-1">
        <div class="font-bold text-sm text-ink truncate" :title="item.name">
          {{ item.name }}
        </div>
        <div class="text-xs text-ink/70 flex items-center gap-2">
          <span>{{ (item.size / 1024 / 1024).toFixed(2) }} MB</span>
          <span>•</span>
          <span :class="item.isEncrypted ? 'text-danger font-black' : 'text-accent-strong font-bold'">
            {{ item.isEncrypted ? t('tools.merge.encryptedWarning') : t('tools.merge.pagesLabel', { count: item.pageCount }) }}
          </span>
        </div>

        <!-- Password input if locked -->
        <div v-if="item.isEncrypted" class="flex gap-2 pt-1">
          <input
            v-model="passwordInput"
            type="password"
            :placeholder="t('tools.merge.passwordPlaceholder')"
            class="px-2.5 py-1 text-xs border-2 border-ink bg-paper rounded-sm w-36 shadow-hard-sm focus:outline-none"
            @keydown.enter="submitUnlock"
          />
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-bold bg-accent text-black border-2 border-ink rounded-sm shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150"
            @click="submitUnlock"
          >
            {{ t('tools.merge.unlockBtn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Actions (Reorder & Delete) -->
    <div class="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        class="w-8 h-8 rounded-sm border-2 border-ink bg-paper flex items-center justify-center text-xs font-bold shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer transition-all duration-150"
        :disabled="isFirst"
        :title="t('tools.merge.moveUp')"
        @click="$emit('move-up', index)"
      >
        ▲
      </button>
      <button
        type="button"
        class="w-8 h-8 rounded-sm border-2 border-ink bg-paper flex items-center justify-center text-xs font-bold shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer transition-all duration-150"
        :disabled="isLast"
        :title="t('tools.merge.moveDown')"
        @click="$emit('move-down', index)"
      >
        ▼
      </button>
      <button
        type="button"
        class="w-8 h-8 rounded-sm border-2 border-ink bg-danger text-black flex items-center justify-center text-xs font-bold shadow-hard-sm hover:shadow-hard hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all duration-150 ml-0.5"
        :title="t('common.remove')"
        @click="$emit('remove', index)"
      >
        &times;
      </button>
    </div>
  </div>
</template>
