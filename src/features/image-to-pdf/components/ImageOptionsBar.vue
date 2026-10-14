<script setup>
defineProps({
  pageSize: {
    type: String,
    default: 'A4'
  },
  orientation: {
    type: String,
    default: 'auto'
  },
  margin: {
    type: Number,
    default: 20
  },
  fitMode: {
    type: String,
    default: 'contain'
  }
});

const emit = defineEmits([
  'update:pageSize',
  'update:orientation',
  'update:margin',
  'update:fitMode'
]);
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 border-3 border-ink bg-paper shadow-hard-sm">
    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">Ukuran Halaman</label>
      <select
        :value="pageSize"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:pageSize', $event.target.value)"
      >
        <option value="A4">A4 (Standar)</option>
        <option value="LETTER">US Letter</option>
        <option value="FIT">Sesuaikan Gambar</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">Orientasi</label>
      <select
        :value="orientation"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:orientation', $event.target.value)"
      >
        <option value="auto">Otomatis</option>
        <option value="portrait">Tegak (Portrait)</option>
        <option value="landscape">Mendatar (Landscape)</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">Margin</label>
      <select
        :value="margin"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:margin', Number($event.target.value))"
      >
        <option :value="0">Tanpa Margin (0)</option>
        <option :value="15">Kecil (15pt)</option>
        <option :value="30">Standar (30pt)</option>
      </select>
    </div>

    <div class="space-y-1">
      <label class="block text-2xs font-black uppercase text-ink">Skala Gambar</label>
      <select
        :value="fitMode"
        class="w-full px-2 py-1.5 border-2 border-ink bg-paper text-ink font-bold text-xs focus:outline-none"
        @change="emit('update:fitMode', $event.target.value)"
      >
        <option value="contain">Muat Utuh (Contain)</option>
        <option value="cover">Penuhi Halaman (Cover)</option>
      </select>
    </div>
  </div>
</template>
