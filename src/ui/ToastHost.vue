<script setup>
import { toasts, removeToast } from '../app/providers/toast.js';

const typeBg = {
  success: 'bg-accent-2 text-ink border-ink',
  error: 'bg-danger text-paper border-ink',
  warning: 'bg-accent text-ink border-ink',
  info: 'bg-accent-3 text-ink border-ink'
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
    <transition-group
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-4 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform opacity-100"
      leave-to-class="transform translate-x-4 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto border-3 p-3 shadow-hard font-bold text-sm flex items-center justify-between gap-3"
        :class="typeBg[toast.type] || typeBg.info"
        role="status"
        aria-live="polite"
      >
        <span>{{ toast.message }}</span>
        <button
          class="font-black text-lg leading-none hover:opacity-70 cursor-pointer p-1"
          @click="removeToast(toast.id)"
          aria-label="Tutup notifikasi"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>
