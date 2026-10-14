<script setup>
defineProps({
  boxes: { type: Array, default: () => [] },
  selectedBoxId: { type: String, default: null },
  currentPage: { type: Number, default: 1 }
});

defineEmits(['select-box', 'remove-box']);
</script>

<template>
  <div class="space-y-2 border-2 border-ink bg-paper p-3 shadow-hard-sm">
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold text-ink uppercase tracking-wider">
        Kotak Sensor (Halaman {{ currentPage }}):
      </span>
      <span class="text-xs font-bold px-2 py-0.5 border border-ink bg-white">
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
        class="flex items-center justify-between p-1.5 border border-ink text-xs transition-colors cursor-pointer"
        :class="b.id === selectedBoxId ? 'bg-amber-200 border-2 font-bold shadow-hard-sm' : 'bg-white hover:bg-paper-dark'"
        @click="$emit('select-box', b.id)"
      >
        <div class="min-w-0 flex-1 flex items-center gap-1.5">
          <span class="w-4 h-4 rounded-none bg-black text-white text-[10px] flex items-center justify-center font-mono">
            {{ idx + 1 }}
          </span>
          <span class="truncate text-[11px] font-mono">
            X:{{ Math.round(b.x * 100) }}% Y:{{ Math.round(b.y * 100) }}% [{{ Math.round(b.width * 100) }}%×{{ Math.round(b.height * 100) }}%]
          </span>
        </div>

        <button
          type="button"
          class="min-h-[36px] min-w-[36px] px-2 text-xs font-bold border border-ink bg-red-100 hover:bg-red-200 text-red-800 cursor-pointer ml-2 flex items-center justify-center shadow-hard-sm"
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
