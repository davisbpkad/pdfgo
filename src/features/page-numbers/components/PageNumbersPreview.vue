<script setup>
import { ref, watch, onMounted } from 'vue';
import { renderPageToCanvas } from '../../../core/pdf.js';

const props = defineProps({
  pdfDocProxy: {
    type: Object,
    default: null
  },
  format: {
    type: String,
    default: 'Halaman {n} dari {total}'
  },
  position: {
    type: String,
    default: 'bottom-center'
  },
  startNumber: {
    type: Number,
    default: 1
  },
  margin: {
    type: Number,
    default: 25
  },
  fontSize: {
    type: Number,
    default: 10
  },
  colorHex: {
    type: String,
    default: '#475569'
  },
  skipFirstPage: {
    type: Boolean,
    default: false
  },
  totalPages: {
    type: Number,
    default: 1
  }
});

const canvasContainer = ref(null);

async function renderPreview() {
  if (!props.pdfDocProxy || !canvasContainer.value) return;

  try {
    const pageNum = (props.skipFirstPage && props.totalPages > 1) ? 2 : 1;
    const { canvas } = await renderPageToCanvas(props.pdfDocProxy, pageNum, 0.65);
    const ctx = canvas.getContext('2d');

    const effectiveTotal = (props.skipFirstPage && props.totalPages > 1)
      ? props.totalPages - 1
      : props.totalPages;

    const currentNumber = props.startNumber;
    const text = props.format
      .replace(/\{n\}/g, String(currentNumber))
      .replace(/\{total\}/g, String(effectiveTotal));

    ctx.save();
    ctx.font = `${props.fontSize * 0.65}px Atkinson Hyperlegible, sans-serif`;
    ctx.fillStyle = props.colorHex;

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = props.fontSize * 0.65;
    const scaledMargin = props.margin * 0.65;

    let x = scaledMargin;
    if (props.position.includes('center')) {
      x = (canvas.width - textW) / 2;
    } else if (props.position.includes('right')) {
      x = canvas.width - scaledMargin - textW;
    }

    let y = canvas.height - scaledMargin;
    if (props.position.startsWith('top')) {
      y = scaledMargin + textH;
    } else if (props.position.startsWith('middle')) {
      y = (canvas.height + textH) / 2;
    }

    ctx.fillText(text, x, y);
    ctx.restore();

    canvasContainer.value.innerHTML = '';
    canvas.className = 'max-w-full h-auto border-2 border-ink shadow-hard-sm mx-auto';
    canvasContainer.value.appendChild(canvas);
  } catch (e) {
    // Canvas preview render error ignored
  }
}

watch(() => [
  props.pdfDocProxy,
  props.format,
  props.position,
  props.startNumber,
  props.margin,
  props.fontSize,
  props.colorHex,
  props.skipFirstPage
], () => {
  renderPreview();
}, { deep: true });

onMounted(() => {
  renderPreview();
});
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-2">
    <div class="text-xs font-black uppercase tracking-wider text-ink flex items-center justify-between">
      <span>Pratinjau Langsung</span>
      <span class="text-ink/60 font-medium">
        {{ skipFirstPage && totalPages > 1 ? 'Halaman 2 (Cover Dilewati)' : 'Halaman 1' }}
      </span>
    </div>
    <div ref="canvasContainer" class="min-h-[280px] flex items-center justify-center bg-paper-dark p-2 border-2 border-ink/20 overflow-hidden">
      <span class="text-xs font-bold text-ink/40">Memuat pratinjau...</span>
    </div>
  </div>
</template>
