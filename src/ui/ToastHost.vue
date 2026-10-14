<script setup>
import { toasts, removeToast } from '../app/providers/toast.js';

const typeBg = {
  success: 'bg-accent text-black border-ink',
  error: 'bg-danger text-black border-ink',
  warning: 'bg-warning text-black border-ink',
  info: 'bg-accent-3 text-black border-ink'
};
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 select-none">
    <transition-group
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform translate-x-4 opacity-0 scale-95"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto border-2 rounded-sm p-3.5 shadow-hard font-bold text-xs md:text-sm flex items-center justify-between gap-3"
        :class="typeBg[toast.type] || typeBg.info"
        role="status"
        aria-live="polite"
      >
        <span>{{ toast.message }}</span>
        <button
          class="w-6 h-6 border border-ink bg-white/60 hover:bg-white text-black rounded-xs flex items-center justify-center font-black text-sm leading-none cursor-pointer shadow-[1px_1px_0_0_#000000] shrink-0"
          @click="removeToast(toast.id)"
          aria-label="Tutup notifikasi"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>
