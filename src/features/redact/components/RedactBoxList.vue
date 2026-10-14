<script setup>
defineProps({
  boxes: { type: Array, default: () => [] },
  selectedBoxId: { type: String, default: null },
  currentPage: { type: Number, default: 1 }
});

defineEmits(['select-box', 'remove-box']);
</script>

<template>
  <div class="space-y-2 border-2 border-ink bg-paper rounded-sm p-3 shadow-hard-sm select-none">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-ink uppercase tracking-wider">
        Kotak Sensor (Halaman {{ currentPage }}):
      </span>
      <span class="text-xs font-bold px-2 py-0.5 border border-ink bg-paper-dark rounded-sm shadow-[1px_1px_0_0_#000000]">
        {{ boxes.length }} kotak
      </span>
    </div>

    <div v-if="boxes.length === 0" class="text-[11px] text-ink/70 italic py-2">
      Belum ada kotak sensor pada halaman ini. Tarik kursor di pratinjau untuk menandai.
    </div>

    <div v-else class="max-h-40 overflow-y-auto space-y-1.5 pr-1">
      <div
        v-for="(b, idx) in boxes"
        :key="b.id"
        class="flex items-center justify-between p-1.5 border border-ink rounded-sm text-xs transition-all duration-150 cursor-pointer"
        :class="b.id === selectedBoxId ? 'bg-warning text-black border-2 font-bold shadow-hard-sm -translate-y-0.5' : 'bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700'"
        @click="$emit('select-box', b.id)"
      >
        <div class="min-w-0 flex-1 flex items-center gap-1.5">
          <span class="w-4 h-4 rounded-xs bg-ink text-paper text-[10px] flex items-center justify-center font-mono">
            {{ idx + 1 }}
          </span>
          <span class="truncate text-[11px] font-mono">
            X:{{ Math.round(b.x * 100) }}% Y:{{ Math.round(b.y * 100) }}% [{{ Math.round(b.width * 100) }}%×{{ Math.round(b.height * 100) }}%]
          </span>
        </div>

        <button
          type="button"
          class="min-h-[32px] min-w-[32px] px-2 text-xs font-bold border border-ink bg-danger text-black hover:opacity-90 rounded-sm cursor-pointer ml-2 flex items-center justify-center shadow-hard-sm active:translate-y-0.5 transition-all duration-150"
          title="Hapus kotak ini"
          aria-label="Hapus kotak sensor"
          @click.stop="$emit('remove-box', b.id)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
