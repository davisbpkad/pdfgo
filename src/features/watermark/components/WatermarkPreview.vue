<script setup>
import { ref, watch, onMounted } from 'vue';
import { renderPageToCanvas } from '../../../core/pdf.js';

const props = defineProps({
  pdfDocProxy: {
    type: Object,
    default: null
  },
  text: {
    type: String,
    default: 'CONFIDENTIAL'
  },
  fontSize: {
    type: Number,
    default: 48
  },
  colorHex: {
    type: String,
    default: '#dc2626'
  },
  opacity: {
    type: Number,
    default: 25
  },
  position: {
    type: String,
    default: 'diagonal'
  }
});

const canvasContainer = ref(null);

async function renderPreview() {
  if (!props.pdfDocProxy || !canvasContainer.value) return;

  try {
    const { canvas } = await renderPageToCanvas(props.pdfDocProxy, 1, 0.65);
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.font = `bold ${props.fontSize * 0.65}px Atkinson Hyperlegible, sans-serif`;
    ctx.fillStyle = props.colorHex;
    ctx.globalAlpha = props.opacity / 100;

    const textMetrics = ctx.measureText(props.text);
    const textWidth = textMetrics.width;
    const textHeight = props.fontSize * 0.65;

    if (props.position === 'tiled') {
      const stepX = textWidth + 50;
      const stepY = textHeight + 60;
      for (let x = -canvas.width * 0.5; x < canvas.width * 1.5; x += stepX) {
        for (let y = -canvas.height * 0.5; y < canvas.height * 1.5; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((30 * Math.PI) / 180);
          ctx.fillText(props.text, 0, 0);
          ctx.restore();
        }
      }
    } else if (props.position === 'diagonal') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText(props.text, -textWidth / 2, textHeight / 3);
    } else {
      ctx.fillText(props.text, (canvas.width - textWidth) / 2, (canvas.height + textHeight) / 2);
    }
    ctx.restore();

    canvasContainer.value.innerHTML = '';
    canvas.className = 'max-w-full h-auto border-2 border-ink shadow-hard-sm mx-auto';
    canvasContainer.value.appendChild(canvas);
  } catch (e) {
    // Canvas preview render error ignored
  }
}

watch(() => [props.pdfDocProxy, props.text, props.fontSize, props.colorHex, props.opacity, props.position], () => {
  renderPreview();
}, { deep: true });

onMounted(() => {
  renderPreview();
});
</script>

<template>
  <div class="border-3 border-ink bg-paper p-4 space-y-2">
    <div class="text-xs font-black uppercase tracking-wider text-ink flex items-center justify-between">
      <span>Pratinjau Langsung (Halaman 1)</span>
      <span class="text-ink/60 font-medium">Auto Update</span>
    </div>
    <div ref="canvasContainer" class="min-h-[280px] flex items-center justify-center bg-paper-dark p-2 border-2 border-ink/20 overflow-hidden">
      <span class="text-xs font-bold text-ink/40">Memuat pratinjau...</span>
    </div>
  </div>
</template>
