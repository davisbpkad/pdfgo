<script setup>
defineProps({
  modelValue: {
    type: String,
    default: 'balanced'
  }
});

const emit = defineEmits(['update:modelValue']);

const presets = [
  {
    id: 'low',
    title: 'Ringan',
    desc: 'Kualitas visual sangat tajam, cocok untuk dokumen cetak (DPI 144, Kualitas 85%).',
    badge: null
  },
  {
    id: 'balanced',
    title: 'Seimbang',
    desc: 'Rekomendasi terbaik antara keterbacaan teks dan efisiensi ukuran berkas.',
    badge: 'REKOMENDASI'
  },
  {
    id: 'high',
    title: 'Maksimal',
    desc: 'Kompresi agresif untuk ukuran paling kecil, ideal untuk unggah web dan email.',
    badge: null
  }
];
</script>

<template>
  <div class="space-y-2">
    <label class="block text-xs font-black uppercase tracking-wider text-ink">
      Pilih Tingkat Kompresi
    </label>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div
        v-for="p in presets"
        :key="p.id"
        class="border-3 border-ink p-4 flex flex-col justify-between cursor-pointer transition-all select-none"
        :class="modelValue === p.id ? 'bg-accent shadow-hard text-ink ring-2 ring-ink' : 'bg-paper text-ink/80 hover:bg-paper-dark shadow-hard-sm'"
        @click="emit('update:modelValue', p.id)"
      >
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <span class="font-display font-black text-base">{{ p.title }}</span>
            <span v-if="p.badge" class="text-2xs font-black bg-ink text-paper px-1.5 py-0.5 uppercase">
              {{ p.badge }}
            </span>
          </div>
          <p class="text-xs font-medium opacity-85 leading-relaxed">{{ p.desc }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
