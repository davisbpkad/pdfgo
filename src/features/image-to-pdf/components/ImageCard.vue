<script setup>
defineProps({
  image: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['remove', 'drag-start', 'drop-image']);

function onDragStart(e, idx) {
  e.dataTransfer.effectAllowed = 'move';
  emit('drag-start', idx);
}

function onDrop(e, idx) {
  e.preventDefault();
  emit('drop-image', idx);
}
</script>

<template>
  <div
    class="border-3 border-ink bg-paper p-2 flex flex-col justify-between shadow-hard-sm hover:shadow-hard transition-all cursor-grab select-none"
    draggable="true"
    @dragstart="onDragStart($event, index)"
    @dragover.prevent
    @drop="onDrop($event, index)"
  >
    <div class="w-full h-32 bg-paper-dark border-2 border-ink/20 flex items-center justify-center overflow-hidden">
      <img
        :src="image.thumbUrl"
        :alt="image.name"
        class="max-h-full max-w-full object-contain"
      />
    </div>

    <div class="mt-2 space-y-1">
      <div class="text-xs font-bold text-ink truncate" :title="image.name">
        {{ image.name }}
      </div>
      <div class="flex items-center justify-between text-2xs text-ink/60 font-bold">
        <span>{{ (image.size / 1024).toFixed(0) }} KB</span>
        <button
          type="button"
          class="p-1 border border-ink bg-paper hover:bg-danger hover:text-white cursor-pointer transition-colors"
          title="Hapus gambar"
          @click="emit('remove', index)"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>
