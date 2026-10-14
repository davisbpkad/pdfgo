<script setup>
import { ref } from 'vue';

const emit = defineEmits(['use-signature']);

const text = ref('');
const font = ref('Dancing Script');
const inkColor = ref('#000000');

const fonts = [
  { id: 'Dancing Script', label: 'Dancing Script (Cursive Halus)' },
  { id: 'Caveat', label: 'Caveat (Cursive Santai)' }
];

const colors = [
  { id: '#000000', label: 'Hitam' },
  { id: '#1d4ed8', label: 'Biru' },
  { id: '#991b1b', label: 'Merah' }
];

function apply() {
  if (!text.value.trim()) return;

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.font = `64px '${font.value}', cursive`;
  ctx.fillStyle = inkColor.value;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text.value.trim(), canvas.width / 2, canvas.height / 2);

  const dataUrl = canvas.toDataURL('image/png');
  emit('use-signature', dataUrl);
}
</script>

<template>
  <div class="space-y-3">
    <div class="space-y-1">
      <label class="text-xs font-bold text-ink uppercase tracking-wider block">Font Cursive:</label>
      <select
        v-model="font"
        class="w-full text-xs font-bold p-2 border-2 border-ink bg-paper shadow-hard-sm cursor-pointer focus:outline-none"
      >
        <option v-for="f in fonts" :key="f.id" :value="f.id">{{ f.label }}</option>
      </select>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-xs font-bold text-ink">Warna Tinta:</span>
      <button
        v-for="c in colors"
        :key="c.id"
        type="button"
        class="w-6 h-6 rounded-full border-2 border-ink cursor-pointer transition-transform"
        :class="inkColor === c.id ? 'scale-115 ring-2 ring-accent' : ''"
        :style="{ backgroundColor: c.id }"
        @click="inkColor = c.id"
      />
    </div>

    <div class="space-y-1">
      <label class="text-xs font-bold text-ink uppercase tracking-wider block">Teks / Nama Paraf:</label>
      <input
        v-model="text"
        type="text"
        placeholder="Ketik nama atau paraf..."
        class="w-full text-xs font-medium p-2 border-2 border-ink bg-paper shadow-hard-sm focus:outline-none"
        @keyup.enter="apply"
      />
    </div>

    <div
      class="border-3 border-ink bg-paper shadow-hard-sm p-4 text-center min-h-[100px] flex items-center justify-center text-3xl select-none overflow-hidden"
      :style="{ fontFamily: `'${font}', cursive`, color: inkColor }"
    >
      {{ text.trim() || 'Contoh Tanda Tangan' }}
    </div>

    <button
      type="button"
      :disabled="!text.trim()"
      class="w-full py-2 px-4 border-2 border-ink font-bold text-xs uppercase tracking-wider shadow-hard-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      :class="text.trim() ? 'bg-accent hover:shadow-hard text-ink' : 'bg-paper-dark text-ink/60'"
      @click="apply"
    >
      Gunakan Tanda Tangan Ini
    </button>
  </div>
</template>
