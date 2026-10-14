<script setup>
defineProps({
  wordCount: {
    type: Number,
    default: 0
  },
  charCount: {
    type: Number,
    default: 0
  },
  pageCount: {
    type: Number,
    default: 0
  },
  includeSeparators: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:includeSeparators']);
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3 p-3 border-3 border-ink bg-paper shadow-hard-sm">
    <div class="flex items-center gap-4 text-xs font-bold text-ink">
      <span><strong>{{ wordCount }}</strong> kata</span>
      <span>•</span>
      <span><strong>{{ charCount }}</strong> karakter</span>
      <span>•</span>
      <span><strong>{{ pageCount }}</strong> halaman</span>
    </div>

    <label class="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        :checked="includeSeparators"
        class="w-4 h-4 accent-ink cursor-pointer border-2 border-ink"
        @change="emit('update:includeSeparators', $event.target.checked)"
      />
      <span class="text-xs font-bold text-ink">Sertakan pembatas halaman</span>
    </label>
  </div>
</template>
