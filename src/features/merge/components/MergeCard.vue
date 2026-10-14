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
  <div class="border-3 border-ink bg-paper p-3 md:p-4 shadow-hard-sm flex items-center justify-between gap-3">
    <!-- Thumbnail & Info -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Thumbnail -->
      <div class="w-12 h-16 shrink-0 border-2 border-ink bg-black/5 flex items-center justify-center overflow-hidden">
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
          <span :class="item.isEncrypted ? 'text-danger font-black' : 'text-accent font-bold'">
            {{ item.isEncrypted ? 'Terkunci Password' : `${item.pageCount} hal` }}
          </span>
        </div>

        <!-- Password input if locked -->
        <div v-if="item.isEncrypted" class="flex gap-2 pt-1">
          <input
            v-model="passwordInput"
            type="password"
            placeholder="Password PDF..."
            class="px-2 py-1 text-xs border-2 border-ink bg-paper w-36"
            @keydown.enter="submitUnlock"
          />
          <button
            type="button"
            class="px-2 py-1 text-xs font-bold bg-accent border-2 border-ink shadow-hard-sm hover:opacity-80 cursor-pointer"
            @click="submitUnlock"
          >
            Buka
          </button>
        </div>
      </div>
    </div>

    <!-- Actions (Reorder & Delete) -->
    <div class="flex items-center gap-1 shrink-0">
      <button
        type="button"
        class="border-2 border-ink p-1.5 text-xs font-bold hover:bg-accent disabled:opacity-30 cursor-pointer"
        :disabled="isFirst"
        title="Geser ke Atas"
        @click="$emit('move-up', index)"
      >
        ▲
      </button>
      <button
        type="button"
        class="border-2 border-ink p-1.5 text-xs font-bold hover:bg-accent disabled:opacity-30 cursor-pointer"
        :disabled="isLast"
        title="Geser ke Bawah"
        @click="$emit('move-down', index)"
      >
        ▼
      </button>
      <button
        type="button"
        class="border-2 border-ink p-1.5 text-xs font-bold text-danger hover:bg-danger hover:text-paper cursor-pointer ml-1"
        title="Hapus"
        @click="$emit('remove', index)"
      >
        &times;
      </button>
    </div>
  </div>
</template>
