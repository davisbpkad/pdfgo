<script setup>
import { ref, onMounted } from 'vue';
import { t } from '../../../app/providers/i18n.js';

const emit = defineEmits(['use-signature']);

const canvasRef = ref(null);
const inkColor = ref('#000000');
const inkWidth = 2.5;
let isDrawing = false;
let lastPoint = null;

const colors = [
  { id: '#000000', label: 'Hitam' },
  { id: '#1d4ed8', label: 'Biru' },
  { id: '#991b1b', label: 'Merah' }
];

onMounted(() => {
  setupCanvas();
});

function setupCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = inkColor.value;
  ctx.lineWidth = inkWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function setColor(c) {
  inkColor.value = c;
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    ctx.strokeStyle = c;
  }
}

function onPointerDown(e) {
  isDrawing = true;
  const rect = canvasRef.value.getBoundingClientRect();
  lastPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  canvasRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!isDrawing || !lastPoint) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const ctx = canvasRef.value.getContext('2d');

  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(current.x, current.y);
  ctx.stroke();

  lastPoint = current;
}

function onPointerUp(e) {
  isDrawing = false;
  lastPoint = null;
  try { canvasRef.value?.releasePointerCapture(e.pointerId); } catch (_) {}
}

function clear() {
  if (!canvasRef.value) return;
  const ctx = canvasRef.value.getContext('2d');
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
}

function apply() {
  if (!canvasRef.value) return;
  const dataUrl = canvasRef.value.toDataURL('image/png');
  emit('use-signature', dataUrl);
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-ink">{{ t('tools.sign.colorLabel') }}</span>
        <button
          v-for="c in colors"
          :key="c.id"
          type="button"
          class="w-6 h-6 rounded-full border-2 border-ink cursor-pointer transition-transform"
          :class="inkColor === c.id ? 'scale-115 ring-2 ring-accent' : ''"
          :style="{ backgroundColor: c.id }"
          @click="setColor(c.id)"
        />
      </div>

      <button
        type="button"
        class="text-xs font-bold px-2 py-1 border-2 border-ink bg-paper hover:bg-paper-dark shadow-hard-sm cursor-pointer"
        @click="clear"
      >
        {{ t('tools.sign.clearCanvas') }}
      </button>
    </div>

    <div class="border-3 border-ink bg-paper shadow-hard-sm p-1 touch-none">
      <canvas
        ref="canvasRef"
        width="340"
        height="140"
        class="w-full h-[140px] block cursor-crosshair bg-paper"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      />
    </div>

    <button
      type="button"
      class="w-full py-2 px-4 border-2 border-ink bg-accent text-ink font-bold text-xs uppercase tracking-wider shadow-hard-sm hover:shadow-hard transition-all cursor-pointer"
      @click="apply"
    >
      {{ t('tools.sign.useSignature') }}
    </button>
  </div>
</template>